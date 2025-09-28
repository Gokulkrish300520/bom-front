from django.db import models
from django.conf import settings

class InventoryManagement(models.Model):
    adjusted_item = models.ForeignKey(
        "Item",
        related_name="inventory_adjustments",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        help_text="The item for restocking"
    )
    added_restocked_quantity = models.DecimalField(
        max_digits=12, decimal_places=2,default=0,
        help_text="Quantity added to the opening stock"
    )
    old_selling_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Previous selling price before adjustment"
    )
    updated_selling_price = models.DecimalField(
        max_digits=12, decimal_places=2,default=0,
        help_text="New selling price after adjustment"
    )
    old_purchase_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Previous purchase price before adjustment"
    )
    updated_purchase_price = models.DecimalField(
        max_digits=12, decimal_places=2,default=0,
        help_text="New purchase price after adjustment"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, help_text="User who made the adjustment"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.pk:  # On creation only
            item = self.adjusted_item
            item.opening_stock = (item.opening_stock or 0) + self.added_restocked_quantity
            item.sales_selling_price = self.updated_selling_price
            item.purchase_cost_price = self.updated_purchase_price
            item.save(update_fields=['opening_stock', 'sales_selling_price', 'purchase_cost_price'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Adjusted {self.added_restocked_quantity} units of {self.adjusted_item.name} by {self.created_by}"
