from django.core.management.base import BaseCommand
from core.models import Invoice, Bill, Payment, DailySummary
from django.db.models import Sum
from datetime import date, timedelta

class Command(BaseCommand):
    help = "Pre-aggregate daily totals for invoices, bills, and payments."

    def handle(self, *args, **options):
        min_date = min([
            Invoice.objects.order_by('invoice_date').first().invoice_date if Invoice.objects.exists() else date.today(),
            Bill.objects.order_by('bill_date').first().bill_date if Bill.objects.exists() else date.today(),
            Payment.objects.order_by('date').first().date if Payment.objects.exists() else date.today(),
        ])
        max_date = date.today()
        current = min_date
        while current <= max_date:
            invoices_total = Invoice.objects.filter(invoice_date=current).aggregate(total=Sum('total_amount'))['total'] or 0
            bills_total = Bill.objects.filter(bill_date=current).aggregate(total=Sum('total_amount'))['total'] or 0
            payments_total = Payment.objects.filter(date=current).aggregate(total=Sum('amount'))['total'] or 0
            obj, created = DailySummary.objects.update_or_create(
                date=current,
                defaults={
                    'invoices_total': invoices_total,
                    'bills_total': bills_total,
                    'payments_total': payments_total,
                }
            )
            self.stdout.write(f"Aggregated {current}: invoices={invoices_total}, bills={bills_total}, payments={payments_total}")
            current += timedelta(days=1)
