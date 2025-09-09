
"""Signal handlers and cache invalidation logic for the core Django app."""
from datetime import date, timedelta
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Invoice, Bill, Payment, BillItem, InvoiceItem, Item
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
            old = BillItem.objects.get(pk=instance.pk)
        except BillItem.DoesNotExist:
            return
        # If item changed, revert old, add new
        if hasattr(instance, '_old_item_id') and instance._old_item_id != instance.item_id:
            old_item = Item.objects.get(pk=instance._old_item_id)
            adjust_item_stock(old_item, -getattr(instance, '_old_quantity', 0))
            adjust_item_stock(instance.item, instance.quantity)
        else:
            delta = instance.quantity - (getattr(instance, '_old_quantity', 0) or 0)
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
            old = InvoiceItem.objects.get(pk=instance.pk)
        except InvoiceItem.DoesNotExist:
            return
        # If item changed, revert old, subtract new
        if hasattr(instance, '_old_item_id') and instance._old_item_id != instance.item_id:
            old_item = Item.objects.get(pk=instance._old_item_id)
            adjust_item_stock(old_item, getattr(instance, '_old_quantity', 0))
            adjust_item_stock(instance.item, -instance.quantity)
        else:
            delta = (getattr(instance, '_old_quantity', 0) or 0) - instance.quantity
            adjust_item_stock(instance.item, delta)

@receiver(post_delete, sender=InvoiceItem)
def invoiceitem_post_delete(sender, instance, **kwargs):
    if instance.item.track_inventory:
        adjust_item_stock(instance.item, instance.quantity)

def get_periods_for_date(dt):
    """
    Return all report periods (This Month, This Year, Today, Yesterday, Last Month, Last Year)
    that could include this date.
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
    If using a cache backend that supports it, uses cache.delete_pattern('report:*').
    Otherwise, clears the whole cache (safe if only used for reports).
    Args:
        dt (date): The date for which to invalidate cache.
    """
    try:
        cache.delete_pattern('report:*')
    except AttributeError:
        cache.clear()

@receiver(post_save, sender=Invoice)
@receiver(post_delete, sender=Invoice)
def invalidate_invoice_cache(sender, instance, **kwargs):
    """
    Signal handler to invalidate report cache when an Invoice is saved or deleted.
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
    Signal handler to invalidate report cache when a Payment is saved or deleted.
    """
    if instance.date:
        invalidate_report_cache_for_date(instance.date)
