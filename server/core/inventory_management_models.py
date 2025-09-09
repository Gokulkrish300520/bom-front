from django.db import models

class InventoryManagement(models.Model):
    UNIT_CHOICES = [
        ("Nos", "Nos"),
        ("Kgs", "Kgs"),
        ("Litres", "Litres"),
    ]
    TYPE_CHOICES = [
        ("Goods", "Goods"),
        ("Service", "Service"),
    ]
    TAX_CHOICES = [
        ("18%", "18%"),
        ("12%", "12%"),
        ("5%", "5%"),
        ("0%", "0%"),
    ]
    item_name = models.CharField(max_length=255)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    hsn_code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    tax = models.CharField(max_length=4, choices=TAX_CHOICES)

class InventoryItemDetail(models.Model):
    inventory = models.ForeignKey(InventoryManagement, related_name="item_details", on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    adjustment = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
