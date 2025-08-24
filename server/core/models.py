from django.db import models

# Create your models here.

class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    company_name = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# Vendor model
class Vendor(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    company_name = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# Item/Product model
class Item(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sku = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# Payment model
class Payment(models.Model):
    invoice = models.ForeignKey('Invoice', related_name='payments', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    method = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.amount} for Invoice {self.invoice.invoice_number}"


# Quote model
class Quote(models.Model):
    customer = models.ForeignKey(Customer, related_name='quotes', on_delete=models.CASCADE)
    quote_number = models.CharField(max_length=50, unique=True)
    date = models.DateField()
    valid_until = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ], default='draft')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quote {self.quote_number} - {self.customer.name}"


# Proforma Invoice model
class ProformaInvoice(models.Model):
    customer = models.ForeignKey(Customer, related_name='proforma_invoices', on_delete=models.CASCADE)
    proforma_number = models.CharField(max_length=50, unique=True)
    date = models.DateField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('cancelled', 'Cancelled'),
    ], default='draft')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Proforma {self.proforma_number} - {self.customer.name}"


# Delivery Challan model
class DeliveryChallan(models.Model):
    customer = models.ForeignKey(Customer, related_name='delivery_challans', on_delete=models.CASCADE)
    challan_number = models.CharField(max_length=50, unique=True)
    date = models.DateField()
    delivery_date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ], default='draft')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Challan {self.challan_number} - {self.customer.name}"


# Inventory Adjustment model
class InventoryAdjustment(models.Model):
    item = models.ForeignKey(Item, related_name='inventory_adjustments', on_delete=models.CASCADE)
    adjustment_number = models.CharField(max_length=50, unique=True)
    date = models.DateField()
    quantity = models.IntegerField()
    reason = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Adjustment {self.adjustment_number} - {self.item.name}"

class Invoice(models.Model):
    customer = models.ForeignKey(Customer, related_name='invoices', on_delete=models.CASCADE)
    invoice_number = models.CharField(max_length=50, unique=True)
    date = models.DateField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ], default='draft')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer.name}"
