from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator


class BillItem(models.Model):
    """
    Represents an item entry in a Bill, including quantity, rate, and tax.
    """

    bill = models.ForeignKey(
        "Bill",
        related_name="item_details",
        on_delete=models.CASCADE,
    )
    item = models.ForeignKey(
        "Item",
        on_delete=models.CASCADE,
    )
    quantity = models.PositiveIntegerField()
    rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    tax_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    def __str__(self) -> str:
        """String representation of BillItem."""
        return (
            f"{self.item.name} x {self.quantity} for Bill "
            f"{self.bill.bill_number}"
        )


class Bill(models.Model):
    """Represents a Bill issued by a Vendor, with status and related items."""

    STATUS_CHOICES = [
        ("PAID", "Paid"),
        ("UNPAID", "Unpaid"),
        ("PARTIAL", "Partial"),
        ("DRAFT", "Draft"),
    ]
    vendor = models.ForeignKey(
        "Vendor",
        related_name="bills",
        on_delete=models.CASCADE,
    )
    bill_number = models.CharField(
        max_length=50,
        unique=True,
    )
    reference_number = models.CharField(
        max_length=50,
        blank=True,
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="DRAFT",
    )
    bill_date = models.DateField()
    due_date = models.DateField()
    notes = models.TextField(
        blank=True,
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    tax = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    files = models.ManyToManyField(
        "CustomerDocument",
        blank=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self) -> str:
        """String representation of Bill."""
        return f"Bill {self.bill_number} - {self.vendor.name}"


class Customer(models.Model):
    """Represents a customer, including contact and billing information."""

    CUSTOMER_TYPE_CHOICES = [
        ("business", "Business"),
        ("individual", "Individual"),
    ]
    SALUTATION_CHOICES = [
        ("dr", "Dr"),
        ("mr", "Mr"),
        ("ms", "Ms"),
        ("mrs", "Mrs"),
    ]
    CURRENCY_CHOICES = [
        ("AED", "AED"),
        ("AUD", "AUD"),
        ("BND", "BND"),
        ("CAD", "CAD"),
        ("CNY", "CNY"),
        ("EUR", "EUR"),
        ("GBP", "GBP"),
        ("INR", "INR"),
        ("JPY", "JPY"),
        ("SAR", "SAR"),
        ("USD", "USD"),
        ("ZAR", "ZAR"),
    ]
    PAYMENT_TERMS_CHOICES = [
        ("due_on_receipt", "Due on Receipt"),
        ("net_7", "Net 7"),
        ("net_15", "Net 15"),
        ("net_30", "Net 30"),
        ("net_45", "Net 45"),
    ]

    customer_type = models.CharField(
        max_length=20, choices=CUSTOMER_TYPE_CHOICES, default="business"
    )
    salutation = models.CharField(
        max_length=5, choices=SALUTATION_CHOICES, blank=True, null=True
    )
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    display_name = models.CharField(
        max_length=255,
    )
    email = models.EmailField(
        unique=True,
    )
    work_phone = models.CharField(
        max_length=50,
        blank=True,
    )
    mobile = models.CharField(
        max_length=50,
        blank=True,
    )
    pan = models.CharField(
        max_length=20,
        blank=True,
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default="INR",
    )
    opening_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    payment_terms = models.CharField(
        max_length=20,
        choices=PAYMENT_TERMS_CHOICES,
        default="due_on_receipt",
    )
    documents = models.ManyToManyField(
        "CustomerDocument",
        blank=True,
    )
    billing_attention = models.CharField(
        max_length=255,
        blank=True,
    )
    billing_country = models.CharField(
        max_length=100,
        blank=True,
    )
    billing_street1 = models.CharField(
        max_length=255,
        blank=True,
    )
    billing_street2 = models.CharField(
        max_length=255,
        blank=True,
    )
    billing_city = models.CharField(
        max_length=100,
        blank=True,
    )
    billing_state = models.CharField(
        max_length=100,
        blank=True,
    )
    billing_pin_code = models.CharField(
        max_length=20,
        blank=True,
    )
    billing_phone = models.CharField(
        max_length=50,
        blank=True,
    )
    billing_fax = models.CharField(
        max_length=50,
        blank=True,
    )
    shipping_attention = models.CharField(
        max_length=255,
        blank=True,
    )
    shipping_country = models.CharField(
        max_length=100,
        blank=True,
    )
    shipping_street1 = models.CharField(
        max_length=255,
        blank=True,
    )
    shipping_street2 = models.CharField(
        max_length=255,
        blank=True,
    )
    shipping_city = models.CharField(
        max_length=100,
        blank=True,
    )
    shipping_state = models.CharField(
        max_length=100,
        blank=True,
    )
    shipping_pin_code = models.CharField(
        max_length=20,
        blank=True,
    )
    shipping_phone = models.CharField(
        max_length=50,
        blank=True,
    )
    shipping_fax = models.CharField(
        max_length=50,
        blank=True,
    )
    custom_fields = models.JSONField(
        default=dict,
        blank=True,
    )
    tags = models.JSONField(
        default=list,
        blank=True,
    )
    remarks = models.TextField(
        blank=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self) -> str:
        """String representation of Customer."""
        return self.display_name


class CustomerDocument(models.Model):
    """Stores uploaded files associated with customers or bills."""

    file = models.FileField(
        upload_to="customer_documents/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=[
                    "pdf",
                    "jpg",
                    "jpeg",
                    "png",
                    "doc",
                    "docx",
                    "xls",
                    "xlsx",
                ]
            )
        ],
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def clean(self) -> None:
        """Validates file size for CustomerDocument."""
        if self.file.size > 10 * 1024 * 1024:
            raise ValidationError("File size must be under 10MB.")


class ContactPerson(models.Model):
    """Represents a contact person for a customer."""

    SALUTATION_CHOICES = [
        ("dr", "Dr"),
        ("mr", "Mr"),
        ("ms", "Ms"),
        ("mrs", "Mrs"),
    ]
    customer = models.ForeignKey(
        Customer, related_name="contact_persons", on_delete=models.CASCADE
    )
    salutation = models.CharField(
        max_length=5, choices=SALUTATION_CHOICES, blank=True, null=True
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    work_phone = models.CharField(max_length=50, blank=True)
    mobile = models.CharField(max_length=50, blank=True)

    def __str__(self) -> str:
        """String representation of ContactPerson."""
        return f"{self.first_name} {self.last_name} ({self.email})"


class Vendor(models.Model):
    """Represents a vendor supplying goods or services."""

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    company_name = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """String representation of Vendor."""
        return self.name


class Item(models.Model):
    """Represents an item that can be billed, quoted, or invoiced."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sku = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """String representation of Item."""
        return self.name


class Payment(models.Model):
    """Represents a payment made against an invoice."""

    invoice = models.ForeignKey(
        "Invoice", related_name="payments", on_delete=models.CASCADE
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    method = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """String representation of Payment."""
        return (
            f"Payment {self.amount} for Invoice "
            f"{self.invoice.invoice_number}"
        )


class Quote(models.Model):
    """Represents a sales quote sent to a customer."""

    TAX_TYPE_CHOICES = [
        ("TDS", "TDS"),
        ("TCS", "TCS"),
    ]
    TAX_PERCENTAGE_CHOICES = [
        ("0", "0%"),
        ("5", "5%"),
        ("12", "12%"),
        ("18", "18%"),
        ("28", "28%"),
    ]
    customer = models.ForeignKey(
        Customer, related_name="quotes", on_delete=models.CASCADE
    )
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
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_type = models.CharField(
        max_length=3,
        choices=TAX_TYPE_CHOICES,
        default="TDS",
    )
    tax_percentage = models.CharField(
        max_length=3, choices=TAX_PERCENTAGE_CHOICES, default="0"
    )
    adjustment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ("draft", "Draft"),
            ("sent", "Sent"),
            ("accepted", "Accepted"),
            ("rejected", "Rejected"),
            ("expired", "Expired"),
        ],
        default="draft",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quote {self.quote_number} - {self.customer.display_name}"


class DocumentItemBase(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        abstract = True


class QuoteItem(DocumentItemBase):
    quote = models.ForeignKey(
        Quote,
        related_name="item_details",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return (
            f"{self.item.name} x {self.quantity} for Quote "
            f"{self.quote.quote_number}"
        )


class ProformaInvoice(models.Model):
    TAX_TYPE_CHOICES = [
        ("TDS", "TDS"),
        ("TCS", "TCS"),
    ]
    TAX_PERCENTAGE_CHOICES = [
        ("0", "0%"),
        ("5", "5%"),
        ("12", "12%"),
        ("18", "18%"),
        ("28", "28%"),
    ]
    customer = models.ForeignKey(
        Customer, related_name="proforma_invoices", on_delete=models.CASCADE
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    reference_number = models.CharField(max_length=50, blank=True)
    invoice_date = models.DateField()
    expiry_date = models.DateField()
    salesperson = models.CharField(max_length=100, blank=True)
    project_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    customer_notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_type = models.CharField(
        max_length=3,
        choices=TAX_TYPE_CHOICES,
        default="TDS",
    )
    tax_percentage = models.CharField(
        max_length=3, choices=TAX_PERCENTAGE_CHOICES, default="0"
    )
    adjustment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ("draft", "Draft"),
            ("sent", "Sent"),
            ("accepted", "Accepted"),
            ("cancelled", "Cancelled"),
        ],
        default="draft",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Proforma {self.invoice_number} - {self.customer.display_name}"


class ProformaInvoiceItem(DocumentItemBase):
    proforma_invoice = models.ForeignKey(
        ProformaInvoice,
        related_name="item_details",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return (
            f"{self.item.name} x {self.quantity} for Proforma "
            f"{self.proforma_invoice.invoice_number}"
        )


class DeliveryChallanItem(DocumentItemBase):
    delivery_challan = models.ForeignKey(
        "DeliveryChallan",
        related_name="item_details",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return (
            f"{self.item.name} x {self.quantity} for Challan "
            f"{self.delivery_challan.challan_number}"
        )


class DeliveryChallan(models.Model):
    CHALLAN_TYPE_CHOICES = [
        ("liquid_gas", "Supply of Liquid Gas"),
        ("job_work", "Job work"),
        ("approval", "Supply on Approval"),
        ("others", "Others"),
    ]
    customer = models.ForeignKey(
        Customer, related_name="delivery_challans", on_delete=models.CASCADE
    )
    challan_number = models.CharField(max_length=50, unique=True)
    reference_number = models.CharField(max_length=50, blank=True)
    date = models.DateField()
    challan_type = models.CharField(
        max_length=20,
        choices=CHALLAN_TYPE_CHOICES,
        default="others",
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2,
                                       default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"Challan {self.challan_number} - "
            f"{self.customer.display_name}"
        )


class InventoryAdjustment(models.Model):
    item = models.ForeignKey(
        Item, related_name="inventory_adjustments", on_delete=models.CASCADE
    )
    adjustment_number = models.CharField(max_length=50, unique=True)
    date = models.DateField()
    quantity = models.IntegerField()
    reason = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"Adjustment {self.adjustment_number} - "
            f"{self.item.name}"
        )


class InvoiceItem(DocumentItemBase):
    invoice = models.ForeignKey(
        "Invoice",
        related_name="item_details",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return (
            f"{self.item.name} x {self.quantity} for Invoice "
            f"{self.invoice.invoice_number}"
        )


class Invoice(models.Model):
    customer = models.ForeignKey(
        Customer,
        related_name="invoices",
        on_delete=models.CASCADE,
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    order_number = models.CharField(max_length=50, blank=True)
    invoice_date = models.DateField()
    customer_notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    files = models.ManyToManyField(
        "CustomerDocument",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"Invoice {self.invoice_number} - "
            f"{self.customer.display_name}"
        )
