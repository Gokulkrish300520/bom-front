
"""Background aggregation tasks for daily summaries in the core app."""
# pylint: disable=no-member
from datetime import date, timedelta
from django.db.models import Sum
from background_task import background
from core.models import Invoice, Bill, Payment, DailySummary

@background(schedule=60)
def preaggregate_daily_summaries():
    """Aggregate daily totals for invoices, bills, and payments, and update DailySummary."""
    min_date = min([
        Invoice.objects.order_by('invoice_date').first().invoice_date
        if Invoice.objects.exists() else date.today(),  # pylint: disable=no-member
        Bill.objects.order_by('bill_date').first().bill_date
        if Bill.objects.exists() else date.today(),  # pylint: disable=no-member
        Payment.objects.order_by('date').first().date
        if Payment.objects.exists() else date.today(),  # pylint: disable=no-member
    ])  # pylint: disable=no-member
    max_date = date.today()
    current = min_date
    while current <= max_date:
        invoices_total = Invoice.objects.filter(invoice_date=current).aggregate(
            total=Sum('total_amount'))['total'] or 0  # pylint: disable=no-member
        bills_total = Bill.objects.filter(bill_date=current).aggregate(
            total=Sum('total_amount'))['total'] or 0  # pylint: disable=no-member
        payments_total = Payment.objects.filter(date=current).aggregate(
            total=Sum('amount'))['total'] or 0  # pylint: disable=no-member
        DailySummary.objects.update_or_create(  # pylint: disable=no-member
            date=current,
            defaults={
                'invoices_total': invoices_total,
                'bills_total': bills_total,
                'payments_total': payments_total,
            }
        )  # pylint: disable=no-member
        current += timedelta(days=1)
