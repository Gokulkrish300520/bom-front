"""Signal handlers and cache invalidation logic for the core Django app."""

from datetime import date, timedelta
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import (
    Invoice,
    Bill,
    Payment,
    BillItem,
    InvoiceItem,
    Item,
    DraftInvoiceItem,
    QuoteItem,
    DraftInvoice,
    DraftQuote,
    DraftQuoteItem
)
from .purchase_models import PaymentTransaction,GstItem,NonGst,Duty,ImportBill,ImportBillItem,Billorder,DutyItem,NonGstItem,GstItem,DutyItem,BillorderItem
from decimal import Decimal
from django.db.models import Sum
ZERO = Decimal("0.00")

def adjust_item_stock(item, delta):
    if item.track_inventory:
        item.current_stock = (item.current_stock or 0) + delta
        item.save(update_fields=["current_stock"])


# --- BILL ITEM SIGNALS ---


@receiver(post_save, sender=BillItem)
def billitem_post_save(sender, instance, created, **kwargs):
    if not instance.item.track_inventory:
        return
    # On create, add quantity. On update, adjust by difference.
    if created:
        adjust_item_stock(instance.item, instance.quantity)
    else:
        try:
            BillItem.objects.get(pk=instance.pk)
        except BillItem.DoesNotExist:
            return
        # If item changed, revert old, add new
        if (
            hasattr(instance, "_old_item_id")
            and instance._old_item_id != instance.item_id
        ):
            old_item = Item.objects.get(pk=instance._old_item_id)
            adjust_item_stock(old_item, -getattr(instance, "_old_quantity", 0))
            adjust_item_stock(instance.item, instance.quantity)
        else:
            delta = instance.quantity - \
                (getattr(instance, "_old_quantity", 0) or 0)
            adjust_item_stock(instance.item, delta)


@receiver(post_delete, sender=BillItem)
def billitem_post_delete(sender, instance, **kwargs):
    if instance.item.track_inventory:
        adjust_item_stock(instance.item, -instance.quantity)


# --- INVOICE ITEM SIGNALS ---


@receiver(post_save, sender=InvoiceItem)
def invoiceitem_post_save(sender, instance, created, **kwargs):
    if not instance.item.track_inventory:
        return
    # On create, subtract quantity. On update, adjust by difference.
    if created:
        adjust_item_stock(instance.item, -instance.quantity)
    else:
        try:
            InvoiceItem.objects.get(pk=instance.pk)
        except InvoiceItem.DoesNotExist:
            return
        # If item changed, revert old, subtract new
        if (
            hasattr(instance, "_old_item_id")
            and instance._old_item_id != instance.item_id
        ):
            old_item = Item.objects.get(pk=instance._old_item_id)
            adjust_item_stock(old_item, getattr(instance, "_old_quantity", 0))
            adjust_item_stock(instance.item, -instance.quantity)
        else:
            delta = (getattr(instance, "_old_quantity", 0) or 0) - \
                instance.quantity
            adjust_item_stock(instance.item, delta)


@receiver(post_delete, sender=InvoiceItem)
def invoiceitem_post_delete(sender, instance, **kwargs):
    if instance.item.track_inventory:
        adjust_item_stock(instance.item, instance.quantity)


def get_periods_for_date(dt):
    """
    Return all report periods (This Month, This Year, Today, Yesterday,
    Last Month, Last Year) that could include this date.
    Args:
        dt (date): The date to check.
    Returns:
        list: List of tuples describing periods that include the date.
    """
    periods = []
    today = date.today()
    if dt.year == today.year and dt.month == today.month:
        periods.append(("This Month", dt.year, dt.month))
    if dt.year == today.year:
        periods.append(("This Year", dt.year, None))
    if dt == today:
        periods.append(("Today", dt.year, dt.month, dt.day))
    if dt == today - timedelta(days=1):
        periods.append(("Yesterday", dt.year, dt.month, dt.day))
    last_month = today.replace(day=1) - timedelta(days=1)
    if dt.year == last_month.year and dt.month == last_month.month:
        periods.append(("Last Month", dt.year, dt.month))
    if dt.year == today.year - 1:
        periods.append(("Last Year", dt.year, None))
    return periods


def invalidate_report_cache_for_date(dt):  # pylint: disable=unused-argument
    """
    Invalidate all report cache keys that could include this date.
    For simplicity, clears all 'report:*' keys (could be optimized).
    If using a cache backend that supports it,
    uses cache.delete_pattern('report:*').
    Otherwise, clears the whole cache (safe if only used for reports).
    Args:
        dt (date): The date for which to invalidate cache.
    """
    try:
        cache.delete_pattern("report:*")
    except AttributeError:
        cache.clear()


@receiver(post_save, sender=Invoice)
@receiver(post_delete, sender=Invoice)
def invalidate_invoice_cache(sender, instance, **kwargs):
    """
    Signal handler to invalidate report cache when an Invoice is saved or
    deleted.
    """
    if instance.invoice_date:
        invalidate_report_cache_for_date(instance.invoice_date)


@receiver(post_save, sender=Bill)
@receiver(post_delete, sender=Bill)
def invalidate_bill_cache(sender, instance, **kwargs):
    """
    Signal handler to invalidate report cache when a Bill is saved or deleted.
    """
    if instance.bill_date:
        invalidate_report_cache_for_date(instance.bill_date)


@receiver(post_save, sender=Payment)
@receiver(post_delete, sender=Payment)
def invalidate_payment_cache(sender, instance, **kwargs):
    """
    Signal handler to invalidate report cache when a Payment is saved or
    deleted.
    """
    if instance.date:
        invalidate_report_cache_for_date(instance.date)


# --- CUSTOMER & VENDOR BALANCE SIGNALS ---


def recalc_vendor_balance(vendor):
    total = vendor.opening_balance
    # Sum all unpaid and partial bills
    bills = vendor.bills.exclude(status="PAID")
    total += sum(b.total_amount for b in bills)
    vendor.current_balance = total
    vendor.save(update_fields=["current_balance"])


def recalc_customer_balance(customer):
    total = customer.opening_balance
    # Sum all unpaid and partial invoices
    invoices = customer.invoices.exclude(status="PAID")
    total += sum(i.total_amount for i in invoices)
    customer.current_balance = total
    customer.save(update_fields=["current_balance"])


@receiver(post_save, sender=Bill)
@receiver(post_delete, sender=Bill)
def update_vendor_balance(sender, instance, **kwargs):
    recalc_vendor_balance(instance.vendor)


@receiver(post_save, sender=Invoice)
@receiver(post_delete, sender=Invoice)
def update_customer_balance(sender, instance, **kwargs):
    recalc_customer_balance(instance.customer)

    
@receiver([post_save, post_delete], sender=DutyItem)
def update_duty_total(sender, instance, **kwargs):
    duty = instance.duty
    totals = duty.duty_items.aggregate(
        total_price_sum=Sum("total_price"),
        total_duty_sum=Sum("total_duty"),
    )
    duty.total_amount = (totals.get("total_price_sum") or ZERO) + (totals.get("total_duty_sum") or ZERO)
    duty.save(update_fields=["total_amount"])
    # Update payment status safely
    total_paid = duty.transactions.aggregate(total=Sum("amount"))["total"] or ZERO
    if total_paid >= duty.total_amount:
        duty.payment_status = "Paid"
    elif total_paid > 0:
        duty.payment_status = "Paid Partially"
    else:
        duty.payment_status = "Unpaid"
    duty.save(update_fields=["payment_status"])


# ----------------------
# GST AND GSTITEM SIGNALS
# ----------------------
@receiver([post_save, post_delete], sender=GstItem)
def update_gst_total(sender, instance, **kwargs):
    gst = instance.gst
    gst.total_amount = gst.items.aggregate(total=Sum("total_price"))["total"] or ZERO
    gst.save(update_fields=["total_amount"])
    # Update payment status
    total_paid = gst.transactions.aggregate(total=Sum("amount"))["total"] or ZERO
    gst.payment_status = (
        "Paid" if total_paid >= gst.total_amount else
        "Paid Partially" if total_paid > 0 else
        "Unpaid"
    )
    gst.save(update_fields=["payment_status"])


# ----------------------
# NONGST AND NONGSTITEM SIGNALS
# ----------------------
@receiver([post_save, post_delete], sender=NonGstItem)
def update_nongst_total(sender, instance, **kwargs):
    nongst = instance.nongst
    nongst.total_amount = nongst.items.aggregate(total=Sum("total_price"))["total"] or ZERO
    nongst.save(update_fields=["total_amount"])
    total_paid = nongst.transactions.aggregate(total=Sum("amount"))["total"] or ZERO
    nongst.payment_status = (
        "Paid" if total_paid >= nongst.total_amount else
        "Paid Partially" if total_paid > 0 else
        "Unpaid"
    )
    nongst.save(update_fields=["payment_status"])


# ----------------------
# IMPORTBILL AND IMPORTBILLITEM SIGNALS
# ----------------------
@receiver([post_save, post_delete], sender=ImportBillItem)
def update_importbill_total(sender, instance, **kwargs):
    bill = instance.bill
    bill.total_amount = bill.bill_items.aggregate(total=Sum("total_price"))["total"] or ZERO
    bill.save(update_fields=["total_amount"])
    total_paid = bill.transactions.aggregate(total=Sum("amount"))["total"] or ZERO
    bill.payment_status = (
        "Paid" if total_paid >= bill.total_amount else
        "Paid Partially" if total_paid > 0 else
        "Unpaid"
    )
    bill.save(update_fields=["payment_status","total_amount"])


@receiver(post_delete, sender=PaymentTransaction)
def update_importbill_after_transaction_delete(sender, instance, **kwargs):
    """
    Automatically update ImportBill when a PaymentTransaction is deleted.
    """
    related_obj = instance.content_object
    if isinstance(related_obj, ImportBill):
        related_obj.update_status()


# ----------------------
# BILLORDER AND BILLORDERITEM SIGNALS
# ----------------------
@receiver([post_save, post_delete], sender=BillorderItem)
def update_billorder_total(sender, instance, **kwargs):
    bill = instance.bill_order

    # Update payment status
    total_paid = bill.transactions.aggregate(total=Sum("amount"))["total"] or ZERO
    if total_paid >= bill.total_amount:
        bill.payment_status = "Paid"
    elif total_paid > 0:
        bill.payment_status = "Paid Partially"
    else:
        bill.payment_status = "Unpaid"
    bill.save(update_fields=["payment_status"])


# ----------------------
# PAYMENTTRANSACTION SIGNAL
# ----------------------
@receiver(post_save, sender=PaymentTransaction)
def update_related_payment_status(sender, instance, **kwargs):
    obj = instance.content_object
    if hasattr(obj, "update_status"):
        obj.update_status()

@receiver(post_delete, sender=PaymentTransaction)
def update_related_status_after_delete(sender, instance, **kwargs):
    related = instance.content_object
    if related and hasattr(related, "update_status"):
        related.update_status()

@receiver([post_save, post_delete], sender=InvoiceItem)
def update_invoice_totals_on_item_change(sender, instance, **kwargs):
    if instance.invoice:
        instance.invoice.update_totals(save=True)

# --- DRAFT INVOICE TOTALS UPDATE ---
@receiver([post_save, post_delete], sender=DraftInvoiceItem)
def update_draftinvoice_totals_on_item_change(sender, instance, **kwargs):
    if instance.draft_invoice:
        instance.draft_invoice.update_totals(save=True)

# --- DRAFT INVOICE TOTALS UPDATE ---
@receiver([post_save, post_delete], sender=QuoteItem)
def update_quote_totals_on_item_change(sender, instance, **kwargs):
    quote = instance.quote
    if quote and not getattr(quote, "_updating_totals", False):
        quote._updating_totals = True
        quote.update_totals(save=True)
        quote._updating_totals = False


@receiver([post_save, post_delete], sender=DraftQuoteItem)
def update_draftquote_totals_on_item_change(sender, instance, **kwargs):
    draft_quote = instance.draft_quote
    if draft_quote and not getattr(draft_quote, "_updating_totals", False):
        draft_quote._updating_totals = True
        draft_quote.update_totals(save=True)
        draft_quote._updating_totals = False
        
# --- DRAFT QUOTE TOTALS UPDATE ---
