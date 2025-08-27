from django.db import models
from django.core.exceptions import ValidationError

# Create your models here.


from django.core.validators import FileExtensionValidator

class Customer(models.Model):
    CUSTOMER_TYPE_CHOICES = [
        ('business', 'Business'),
        ('individual', 'Individual'),
    ]
    SALUTATION_CHOICES = [
        ('dr', 'Dr'),
        ('mr', 'Mr'),
        ('ms', 'Ms'),
        ('mrs', 'Mrs'),
    ]
    CURRENCY_CHOICES = [
        ('AED', 'AED'), ('AUD', 'AUD'), ('BND', 'BND'), ('CAD', 'CAD'),
        ('CNY', 'CNY'), ('EUR', 'EUR'), ('GBP', 'GBP'), ('INR', 'INR'),
        ('JPY', 'JPY'), ('SAR', 'SAR'), ('USD', 'USD'), ('ZAR', 'ZAR'),
    ]
    PAYMENT_TERMS_CHOICES = [
        ('due_on_receipt', 'Due on Receipt'),
        ('net_7', 'Net 7'),
        ('net_15', 'Net 15'),
        ('net_30', 'Net 30'),
        ('net_45', 'Net 45'),
    ]

    customer_type = models.CharField(max_length=20, choices=CUSTOMER_TYPE_CHOICES, default='business')
    salutation = models.CharField(max_length=5, choices=SALUTATION_CHOICES, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    display_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    work_phone = models.CharField(max_length=50, blank=True)
    mobile = models.CharField(max_length=50, blank=True)
    pan = models.CharField(max_length=20, blank=True)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='INR')
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_terms = models.CharField(max_length=20, choices=PAYMENT_TERMS_CHOICES, default='due_on_receipt')
    documents = models.ManyToManyField('CustomerDocument', blank=True)
    # Billing address
    billing_attention = models.CharField(max_length=255, blank=True)
    billing_country = models.CharField(max_length=100, blank=True)
    billing_street1 = models.CharField(max_length=255, blank=True)
    billing_street2 = models.CharField(max_length=255, blank=True)
    billing_city = models.CharField(max_length=100, blank=True)
    billing_state = models.CharField(max_length=100, blank=True)
    billing_pin_code = models.CharField(max_length=20, blank=True)
    billing_phone = models.CharField(max_length=50, blank=True)
    billing_fax = models.CharField(max_length=50, blank=True)
    # Shipping address
    shipping_attention = models.CharField(max_length=255, blank=True)
    shipping_country = models.CharField(max_length=100, blank=True)
    shipping_street1 = models.CharField(max_length=255, blank=True)
    shipping_street2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    shipping_state = models.CharField(max_length=100, blank=True)
    shipping_pin_code = models.CharField(max_length=20, blank=True)
    shipping_phone = models.CharField(max_length=50, blank=True)
    shipping_fax = models.CharField(max_length=50, blank=True)
    # Custom fields as key-value pairs (JSON)
    custom_fields = models.JSONField(default=dict, blank=True)
    # Tags as array of strings
    tags = models.JSONField(default=list, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.display_name


class CustomerDocument(models.Model):
    file = models.FileField(
        upload_to='customer_documents/',
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'])
        ]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.file.size > 10 * 1024 * 1024:
            raise ValidationError("File size must be under 10MB.")


class ContactPerson(models.Model):
    SALUTATION_CHOICES = [
        ('dr', 'Dr'),
        ('mr', 'Mr'),
        ('ms', 'Ms'),
        ('mrs', 'Mrs'),
    ]
    customer = models.ForeignKey(Customer, related_name='contact_persons', on_delete=models.CASCADE)
    salutation = models.CharField(max_length=5, choices=SALUTATION_CHOICES, blank=True, null=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    work_phone = models.CharField(max_length=50, blank=True)
    mobile = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"


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
    TAX_TYPE_CHOICES = [
        ('TDS', 'TDS'),
        ('TCS', 'TCS'),
    ]
    TAX_PERCENTAGE_CHOICES = [
        ('0', '0%'),
        ('5', '5%'),
        ('12', '12%'),
        ('18', '18%'),
        ('28', '28%'),
    ]
    customer = models.ForeignKey(Customer, related_name='quotes', on_delete=models.CASCADE)
    quote_number = models.CharField(max_length=50, unique=True)
    reference_number = models.CharField(max_length=50, blank=True)
    quote_date = models.DateField()
    expiry_date = models.DateField()
    salesperson = models.CharField(max_length=100, blank=True)
    project_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    customer_notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # percentage
    tax_type = models.CharField(max_length=3, choices=TAX_TYPE_CHOICES, default='TDS')
    tax_percentage = models.CharField(max_length=3, choices=TAX_PERCENTAGE_CHOICES, default='0')
    adjustment = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ], default='draft')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quote {self.quote_number} - {self.customer.display_name}"


# QuoteItem model
class QuoteItem(models.Model):
    quote = models.ForeignKey(Quote, related_name='item_details', on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.item.name} x {self.quantity} for Quote {self.quote.quote_number}"


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
