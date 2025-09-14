"""Background aggregation tasks for daily summaries in the core app."""

# pylint: disable=no-member
from datetime import date, timedelta
from django.db.models import Sum

from background_task import background
from server.core.models import Invoice, Bill, Payment, DailySummary


def _preaggregate_daily_summaries(
    Invoice_=Invoice, Bill_=Bill, Payment_=Payment, DailySummary_=DailySummary
):
    """
    Aggregate daily totals for invoices, bills, payments
    and update DailySummary.
    """
    invoice_date = (
        Invoice_.objects.order_by("invoice_date").first().invoice_date
        if Invoice_.objects.exists()
        else date.today()
    )
    bill_date = (
        Bill_.objects.order_by("bill_date").first().bill_date
        if Bill_.objects.exists()
        else date.today()
    )
    payment_date = (
        Payment_.objects.order_by("date").first().date
        if Payment_.objects.exists()
        else date.today()
    )
    min_date = min([invoice_date, bill_date, payment_date])
    max_date = date.today()
    current = min_date
    while current <= max_date:
        invoices_total = (
            Invoice_.objects.filter(invoice_date=current).aggregate(
                total=Sum("total_amount")
            )["total"]
            or 0
        )
        bills_total = (
            Bill_.objects.filter(bill_date=current)
            .aggregate(total=Sum("total_amount"))["total"]
            or 0
        )
        payments_total = (
            Payment_.objects.filter(date=current).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        DailySummary_.objects.update_or_create(
            date=current,
            defaults={
                "invoices_total": invoices_total,
                "bills_total": bills_total,
                "payments_total": payments_total,
            },
        )
        current += timedelta(days=1)


@background(schedule=60)
def preaggregate_daily_summaries():
    _preaggregate_daily_summaries()
