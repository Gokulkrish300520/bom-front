from django.db.models import Sum, Q
from .models import Invoice
from .purchase_models import Billorder, Freight, Duty, Gst, NonGst, ImportBill
from decimal import Decimal

def calculate_profit_and_loss(deal=None, customer=None):
    filters = Q()
    if deal:
        filters &= Q(deal=deal)
    if customer:
        filters &= Q(deal__customer=customer)

    # Aggregate Revenue: sum of all invoice total amounts
    revenue = Invoice.objects.filter(filters).aggregate(total=Sum('total_amount'))['total'] or 0

    # Aggregate Expenses from various purchase models
    billorders_qs = Billorder.objects.filter(filters)
    billorders = sum((b.total_amount for b in billorders_qs), Decimal("0.00"))
    freights = Freight.objects.filter(filters).aggregate(total=Sum('total_amount'))['total'] or 0
    duties = Duty.objects.filter(filters).aggregate(total=Sum('total_amount'))['total'] or 0
    gst = Gst.objects.filter(filters).aggregate(total=Sum('total_amount'))['total'] or 0
    nongst = NonGst.objects.filter(filters).aggregate(total=Sum('total_amount'))['total'] or 0
    importbills = ImportBill.objects.filter(filters).aggregate(total=Sum('total_amount'))['total'] or 0

    total_expenses = (
        billorders + freights + duties + gst + nongst + importbills
    )

    profit_or_loss = revenue - total_expenses

    return {
        'revenue': revenue,
        'expenses': total_expenses,
        'profit_or_loss': profit_or_loss,
        'details': {
            'billorders': billorders,
            'freights': freights,
            'duties': duties,
            'gst': gst,
            'nongst': nongst,
            'importbills': importbills,
        }
    }
