from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Invoice, Bill, Payment
import hashlib
import json
from datetime import date, timedelta

def get_periods_for_date(dt):
    """Return all report periods (This Month, This Year, Today, Yesterday, Last Month, Last Year) that could include this date."""
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
    # Last Month
    last_month = today.replace(day=1) - timedelta(days=1)
    if dt.year == last_month.year and dt.month == last_month.month:
        periods.append(("Last Month", dt.year, dt.month))
    # Last Year
    if dt.year == today.year - 1:
        periods.append(("Last Year", dt.year, None))
    return periods

def invalidate_report_cache_for_date(dt):
    # Invalidate all cache keys that could include this date
    # For simplicity, clear all report: keys (could be optimized)
    # If using a cache backend that supports it, use cache.delete_pattern('report:*')
    # Otherwise, just clear the whole cache (safe if only used for reports)
    try:
        cache.delete_pattern('report:*')
    except Exception:
        cache.clear()

@receiver(post_save, sender=Invoice)
@receiver(post_delete, sender=Invoice)
def invalidate_invoice_cache(sender, instance, **kwargs):
    if instance.invoice_date:
        invalidate_report_cache_for_date(instance.invoice_date)

@receiver(post_save, sender=Bill)
@receiver(post_delete, sender=Bill)
def invalidate_bill_cache(sender, instance, **kwargs):
    if instance.bill_date:
        invalidate_report_cache_for_date(instance.bill_date)

@receiver(post_save, sender=Payment)
@receiver(post_delete, sender=Payment)
def invalidate_payment_cache(sender, instance, **kwargs):
    if instance.date:
        invalidate_report_cache_for_date(instance.date)