from django.db import models
from django.conf import settings
from .models import Vendor,Deal

class Freight(models.Model):
    vendor = models.ForeignKey(
        Vendor, related_name="freight_charges",on_delete=models.CASCADE,
        help_text="Vendor associated with the freight charge"
    )
    deal = models.ForeignKey(Deal, related_name="freight_charges", on_delete=models.CASCADE)
    currency = models.CharField(
        max_length=10, default="INR",
        help_text="Currency of the amount"
    )
    item_name = models.CharField(
        max_length=100, help_text="Name of the item being shipped"
    )
    description = models.TextField(
        null=True, blank=True,
        help_text="Description of the item"
    )
    item_specification = models.TextField(
        null=True, blank=True,
        help_text="Specifications of the item"
    )
    brand = models.CharField(
        max_length=50, null=True, blank=True,
        help_text="Brand of the item")
    hsn_code = models.CharField(
        max_length=20, null=True, blank=True,
        help_text="HSN code of the item"
    )
    quantity = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Quantity of the item"
    )
    unit_price_usd = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Unit price of the item"
    )
    unit_price_inr = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Unit price in INR")
    total_price_usd = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total price in USD"
    )
    total_price_inr = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total price in INR")
    date=models.DateField(
        help_text="Date of the freight charge"
    )
    sf_number = models.CharField(
        max_length=50, null=True, blank=True,
        help_text="Salesforce number associated with the freight charge"
    )
    weight = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Weight of the item"
    )
    freight_type = models.CharField(
        max_length=20, null=True, blank=True,
        help_text="Type of freight (e.g., air, sea, land)"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, help_text="User who created the record"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Freight Charge of {self.amount} for {self.vendor.name if self.vendor else 'Unknown Vendor'}"
