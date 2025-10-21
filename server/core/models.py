"""Django models for the core business logic and data structures."""

from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from datetime import date, timedelta
from django.utils import timezone
from django.db import transaction
from decimal import Decimal


class DailySummary(models.Model):
    """Model representing a daily summary of invoices, bills, and payments."""

    date = models.DateField(db_index=True, unique=True)
    invoices_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    bills_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    payments_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Summary for {self.date}"


class BillItem(models.Model):
    def save(self, *args, **kwargs):
        if self.pk:
            old = BillItem.objects.get(pk=self.pk)
            self._old_quantity = old.quantity
            self._old_item_id = old.item_id
        else:
            self._old_quantity = None
            self._old_item_id = None
        super().save(*args, **kwargs)

    """Model representing an item entry in a Bill."""
    # ...existing code...

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
            f"{self.item.name} x {self.quantity} "  # pylint: disable=no-member
            f"for Bill "
            f"{self.bill.bill_number}"  # pylint: disable=no-member
        )

class Customer(models.Model):
    def save(self, *args, **kwargs):
        if self._state.adding and (
            self.current_balance is None or self.current_balance == 0
        ):
            self.current_balance = self.opening_balance
        super().save(*args, **kwargs)

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
    current_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        editable=False,
        help_text=(
            "Current outstanding balance for this customer. "
            "Updated automatically."
        ),
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
        return str(self.display_name)


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
        if self.file.size > 10 * 1024 * 1024:  # pylint: disable=no-member
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
        Customer,
        related_name="contact_persons",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    vendor = models.ForeignKey(
        "Vendor",
        related_name="contact_persons",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
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

class Deal(models.Model):
    deal_no = models.CharField(max_length=10, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="deals")
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.deal_no
    
class Bill(models.Model):
    """Model representing a Bill issued by a Vendor."""

    # ...existing code...

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
    
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="bills")
    
    bill_date = models.DateField(db_index=True)
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
    balance_due = models.DecimalField(
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
        return (
            f"Bill {self.bill_number} - {self.vendor.display_name}"
        )  # pylint: disable=no-member

class Vendor(models.Model):
    def save(self, *args, **kwargs):
        if self._state.adding and (
            self.current_balance is None or self.current_balance == 0
        ):
            self.current_balance = self.opening_balance
        super().save(*args, **kwargs)

    """Represents a vendor supplying goods or services."""

    VENDOR_TYPE_CHOICES = [
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

    vendor_type = models.CharField(
        max_length=20, choices=VENDOR_TYPE_CHOICES, default="business"
    )
    salutation = models.CharField(
        max_length=5, choices=SALUTATION_CHOICES, blank=True, null=True
    )
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    display_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    work_phone = models.CharField(max_length=50, blank=True)
    mobile = models.CharField(max_length=50, blank=True)
    pan = models.CharField(max_length=20, blank=True)
    currency = models.CharField(
        max_length=3, choices=CURRENCY_CHOICES, default="INR")
    opening_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    current_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        editable=False,
        help_text=(
            "Current outstanding balance for this vendor. "
            "Updated automatically."
        ),
    )
    payment_terms = models.CharField(
        max_length=20, choices=PAYMENT_TERMS_CHOICES, default="due_on_receipt"
    )
    billing_attention = models.CharField(max_length=255, blank=True)
    billing_country = models.CharField(max_length=100, blank=True)
    billing_street1 = models.CharField(max_length=255, blank=True)
    billing_street2 = models.CharField(max_length=255, blank=True)
    billing_city = models.CharField(max_length=100, blank=True)
    billing_state = models.CharField(max_length=100, blank=True)
    billing_pin_code = models.CharField(max_length=20, blank=True)
    billing_phone = models.CharField(max_length=50, blank=True)
    billing_fax = models.CharField(max_length=50, blank=True)
    shipping_attention = models.CharField(max_length=255, blank=True)
    shipping_country = models.CharField(max_length=100, blank=True)
    shipping_street1 = models.CharField(max_length=255, blank=True)
    shipping_street2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    shipping_state = models.CharField(max_length=100, blank=True)
    shipping_pin_code = models.CharField(max_length=20, blank=True)
    shipping_phone = models.CharField(max_length=50, blank=True)
    shipping_fax = models.CharField(max_length=50, blank=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """String representation of Vendor."""
        return str(self.display_name)


class Item(models.Model):
    """Represents an item that can be billed, quoted, or invoiced."""

    UNIT_CHOICES = [
        ("Nos", "Nos"),
        ("Kgs", "Kgs"),
        ("Litres", "Litres"),
    ]

    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default="Nos")
    hsn_code = models.CharField(max_length=20, unique=True)
    item_no = models.CharField(max_length=20, null=True, blank=True)

    # Sales Information
    manage_sales_info = models.BooleanField(default=False)
    sales_selling_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    sales_account = models.CharField(
        max_length=100, default="Sales", blank=True)
    sales_description = models.TextField(blank=True)

    # Purchase Information
    manage_purchase_info = models.BooleanField(default=False)
    purchase_cost_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    purchase_account = models.CharField(
        max_length=100, default="Cost of Goods Sold", blank=True
    )
    purchase_description = models.TextField(blank=True)
    preferred_vendor = models.ForeignKey(
        "Vendor", null=True, blank=True, on_delete=models.SET_NULL
    )

    # Inventory Tracking
    track_inventory = models.BooleanField(default=False)
    # inventory_account = models.CharField(max_length=100, blank=True)
    # inventory_valuation_method = models.CharField(max_length=50, blank=True)
    opening_stock = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    opening_stock_rate_per_unit = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    reorder_point = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    current_stock = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)

    # Legacy fields removed: description, price, sku
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        errors = {}
        if self.manage_sales_info:
            if self.sales_selling_price is None:
                errors["sales_selling_price"] = (
                    "This field is required when managing sales info."
                )
            if not self.sales_account:
                errors["sales_account"] = (
                    "This field is required when managing sales info."
                )
        if self.manage_purchase_info:
            if self.purchase_cost_price is None:
                errors["purchase_cost_price"] = (
                    "This field is required when managing purchase info."
                )
            if not self.purchase_account:
                errors["purchase_account"] = (
                    "This field is required when managing purchase info."
                )
        if self.track_inventory:
            if not self.inventory_account:
                errors["inventory_account"] = (
                    "This field is required when tracking inventory."
                )
            if not self.inventory_valuation_method:
                errors["inventory_valuation_method"] = (
                    "This field is required when tracking inventory."
                )
            if self.opening_stock is None:
                errors["opening_stock"] = (
                    "This field is required when tracking inventory."
                )
            if self.opening_stock_rate_per_unit is None:
                errors["opening_stock_rate_per_unit"] = (
                    "This field is required when tracking inventory."
                )
            if self.reorder_point is None:
                errors["reorder_point"] = (
                    "This field is required when tracking inventory."
                )
        if errors:
            raise ValidationError(errors)

    def __str__(self) -> str:
        """String representation of Item."""
        return str(self.name)


class Payment(models.Model):
    """Represents a payment made against an invoice."""

    invoice = models.ForeignKey(
        "Invoice", related_name="payments", on_delete=models.CASCADE
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(db_index=True)
    method = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """String representation of Payment."""
        return (
            f"Payment {self.amount} for Invoice "
            f"{self.invoice.invoice_number}"  # pylint: disable=no-member
        )  # pylint: disable=no-member

###############################################################################

####################### Item Base Abstract Class ##############################
class DocumentItemBase(models.Model):
    """Abstract base class for document item models."""

    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for DocumentItemBase (abstract base class)."""

        abstract = True
        
#################### QUOTE and its draft MODELS ##############################

class Quote(models.Model):
    """Represents a sales quote sent to a customer."""

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
    place_of_supply = models.CharField(max_length=50, blank=True)
    quote_date = models.DateField()
    due_date = models.DateField()
    salesperson = models.CharField(max_length=100, blank=True)
    project_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    customer_notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    subtotal_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, help_text="Discount percentage"
    )
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Discount amount"
    )
    tax_percentage = models.CharField(
        max_length=3, choices=TAX_PERCENTAGE_CHOICES, default="0"
    )
    gst_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    adjustment_amount = models.DecimalField(
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
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="quotes")
    quote_files = models.ManyToManyField(
        "CustomerDocument",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def calculate_total(self):
        subtotal = sum(item.quantity * item.rate for item in self.item_details.all())
        discount_amount = (subtotal * self.discount_percentage / 100) if self.discount_percentage else 0
        subtotal_after_discount = subtotal - discount_amount
        gst = (subtotal_after_discount * Decimal(self.tax_percentage) / 100) if self.tax_percentage else 0
        total = subtotal_after_discount + gst + self.adjustment_amount
        
        return subtotal, discount_amount, gst, total
    
    def update_totals(self, save=True):
        self.subtotal_amount, self.discount_amount, self.gst_amount, self.total_amount = self.calculate_total()
        if save:
            super().save(update_fields=["subtotal_amount", "discount_amount", "gst_amount", "total_amount"])
    
    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        if hasattr(self, 'item_details') and self.item_details.exists():
            self.update_totals(save=False)
        

    def __str__(self):
        return (
            f"Quote {self.quote_number} - {self.customer.display_name}"
        )  # pylint: disable=no-member

class QuoteItem(DocumentItemBase):
    """Model representing an item entry in a Quote."""

    quote = models.ForeignKey(
        Quote,
        related_name="item_details",
        on_delete=models.CASCADE,
    )
    quote_item_number = models.PositiveIntegerField()

    class Meta:
        unique_together = ("quote", "quote_item_number")

    def __str__(self):
        return (
            f"[{self.quote_item_number}] {self.item.name} x {self.quantity} "
            f"for Quote {self.quote.quote_number}"
        )  # pylint: disable=no-member

class DraftQuote(models.Model):

    TAX_PERCENTAGE_CHOICES = [
        ("0", "0%"),
        ("5", "5%"),
        ("12", "12%"),
        ("18", "18%"),
        ("28", "28%"),
    ]
    customer = models.ForeignKey(
        Customer, related_name="draft_quotes", on_delete=models.CASCADE
    )
    quote_number = models.CharField(max_length=50, unique=True,null=True,blank=True)
    place_of_supply = models.CharField(max_length=50, null=True,blank=True)
    quote_date = models.DateField(null=True,blank=True)
    due_date = models.DateField(null=True,blank=True)
    salesperson = models.CharField(max_length=100, null=True,blank=True)
    project_name = models.CharField(max_length=255, null=True,blank=True)
    subject = models.CharField(max_length=255, null=True,blank=True)
    customer_notes = models.TextField(null=True,blank=True)
    terms_and_conditions = models.TextField(null=True,blank=True)
    subtotal_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, help_text="Discount percentage"
    )
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Discount amount"
    )
    tax_percentage = models.CharField(
        max_length=3, choices=TAX_PERCENTAGE_CHOICES, default="0"
    )
    gst_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    adjustment_amount = models.DecimalField(
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
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="draft_quotes")
    quote_files = models.ManyToManyField(
        "CustomerDocument",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_total(self):
        subtotal = sum(item.quantity * item.rate for item in self.item_details.all())
        discount_amount = (subtotal * self.discount_percentage / 100) if self.discount_percentage else 0
        subtotal_after_discount = subtotal - discount_amount
        gst = (subtotal_after_discount * Decimal(self.tax_percentage) / 100) if self.tax_percentage else 0
        total = subtotal_after_discount + gst + self.adjustment_amount
        
        return subtotal, discount_amount, gst, total
    
    def update_totals(self, save=True):
        self.subtotal_amount, self.discount_amount, self.gst_amount, self.total_amount = self.calculate_total()
        if save:
            super().save(update_fields=["subtotal_amount", "discount_amount", "gst_amount", "total_amount"])
    
    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        if hasattr(self, 'item_details') and self.item_details.exists():
            self.update_totals(save=False)
    
    def validate_for_publish(self):
        errors = {}
        if not self.customer:
            errors['customer'] = "Customer is required."
        if not self.quote_date:
            errors['quote_date'] = "Invoice date is required."
        if not self.due_date:
            errors['due_date'] = "Due date is required."
        if not self.quote_number:
            errors['quote_number'] = "Quote number is required."
        if self.item_details.count() == 0:
            errors['item_details'] = "At least one Quote item is required."
        if self.discount_percentage < 0:
            errors['discount_percentage'] = "Discount cannot be negative."
        if self.discount_percentage > 100:
            errors['discount_percentage'] = "Discount cannot exceed 100%."

        if errors:
            raise ValidationError(errors)

    
    def publish(self):
        self.validate_for_publish()
        
        with transaction.atomic():
            if not self.quote_number:
                raise ValidationError("Quote number is required before publishing.")

            existing_quote= Quote.objects.filter(quote_number=self.quote_number).first()

            if existing_quote and existing_quote.pk != getattr(self, 'final_quote_id', None):
            # If you want to prevent duplicates:
                raise ValidationError(f"Quote number {self.quote_number} already exists.")
            
            # Create or update the final Invoice instance
            quote, created = Quote.objects.update_or_create(
                quote_number=self.quote_number,
                defaults={
                    'customer': self.customer,
                    'place_of_supply': self.place_of_supply,
                    'deal': self.deal,
                    'quote_date': self.quote_date,
                    'due_date': self.due_date,
                    'subtotal_amount': self.subtotal_amount,
                    'discount_percentage': self.discount_percentage,
                    'discount_amount': self.discount_amount,  # new field
                    'gst_amount': self.gst_amount,
                    'adjustment_amount': self.adjustment_amount,
                    'total_amount': self.total_amount,
                    'customer_notes': self.customer_notes,
                    'terms_and_conditions': self.terms_and_conditions,
                    'status': 'sent',  # Set to appropriate non-draft status
                },
            )
            quote.save()

            # Clear existing InvoiceItems if updating
            quote.item_details.all().delete()

            # Copy draft invoice items into final InvoiceItems
            for draft_item in self.item_details.all():
                QuoteItem.objects.create(
                    quote=quote,
                    item=draft_item.item,
                    quantity=draft_item.quantity,
                    rate=draft_item.rate,
                    amount=draft_item.amount,
                    quote_item_number=draft_item.quote_item_number,
                )

            # Copy files
            quote.quote_files.set(self.quote_files.all())
            quote.save()

            # Delete draft and its items
            self.delete()
        
        transaction.on_commit(lambda: quote.refresh_from_db())

        return quote

        

    def __str__(self):
        return (
            f"Quote {self.quote_number} - {self.customer.display_name}"
        )  # pylint: disable=no-memb

class DraftQuoteItem(DocumentItemBase):
    """Model representing an item entry in a Quote."""

    draft_quote = models.ForeignKey(
        DraftQuote,
        related_name="item_details",
        on_delete=models.CASCADE,
    )
    quote_item_number = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ("draft_quote", "quote_item_number")
    
    def save(self, *args, **kwargs):
        # Automatically calculate amount
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"[{self.quote_item_number}] {self.item.name} x {self.quantity} "
            f"for Quote {self.draft_quote.quote_number}"
        )  # pylint: disable=no-member
        

##########################################################################

#######.#################### Proforma Invoice Models ###########################

class ProformaInvoice(models.Model):
    """Model representing a Proforma Invoice."""

    proforma_invoice_files = models.ManyToManyField(
        "CustomerDocument",
        blank=True,
    )
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
    place_of_supply = models.CharField(max_length=50, blank=True)
    invoice_date = models.DateField()
    expiry_date = models.DateField()
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="proforma_invoices")
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
        return (
            f"Proforma {self.invoice_number} - {self.customer.display_name}"
        )  # pylint: disable=no-member


class ProformaInvoiceItem(DocumentItemBase):
    """Model representing an item entry in a Proforma Invoice."""

    proforma_invoice = models.ForeignKey(
        ProformaInvoice,  # pylint: disable=no-member
        related_name="item_details",
        on_delete=models.CASCADE,
    )
    proforma_invoice_item_number = models.PositiveIntegerField(
        null=True, blank=True)

    class Meta:
        unique_together = ("proforma_invoice", "proforma_invoice_item_number")

    def __str__(self):
        return (
            f"[{self.proforma_invoice_item_number}] "
            f"{self.item.name} x {self.quantity} "
            f"for Proforma {self.proforma_invoice.invoice_number}"
        )  # pylint: disable=no-member


class DeliveryChallanItem(DocumentItemBase):
    """Model representing an item entry in a Delivery Challan."""

    delivery_challan = models.ForeignKey(
        "DeliveryChallan",  # pylint: disable=no-member
        related_name="item_details",
        on_delete=models.CASCADE,
    )
    delivery_challan_item_number = models.PositiveIntegerField(
        null=True, blank=True)

    class Meta:
        unique_together = ("delivery_challan", "delivery_challan_item_number")

    def __str__(self):
        return (
            f"[{self.delivery_challan_item_number}] "
            f"{self.item.name} x {self.quantity} "
            f"for Challan {self.delivery_challan.challan_number}"
        )  # pylint: disable=no-member


class DeliveryChallan(models.Model):
    """Model representing a Delivery Challan document."""

    delivery_challan_files = models.ManyToManyField(
        "CustomerDocument",
        related_name="deliverychallans_programmatic",
        blank=True,
    )
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
    place_of_supply = models.CharField(max_length=50, blank=True)
    date = models.DateField()
    challan_type = models.CharField(
        max_length=20,
        choices=CHALLAN_TYPE_CHOICES,
        default="others",
    )
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="delivery_challans")
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("issued", "Issued"),
        ("dispatched", "Dispatched"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("returned", "Returned"),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"Challan {self.challan_number} - "  # pylint: disable=no-member
            f"{self.customer.display_name}"  # pylint: disable=no-member
        )

###############    INVOICE MODELS BELOW            ###############

class InvoiceItem(DocumentItemBase):
    def save(self, *args, **kwargs):
        if self.pk:
            old = InvoiceItem.objects.get(pk=self.pk)
            self._old_quantity = old.quantity
            self._old_item_id = old.item_id
        else:
            self._old_quantity = None
            self._old_item_id = None
        
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)

    """Model representing an item entry in an Invoice."""
    invoice = models.ForeignKey(
        "Invoice",
        related_name="item_details",
        on_delete=models.CASCADE,
    )
    invoice_item_number = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ("invoice", "invoice_item_number")

    def __str__(self):
        return (
            f"[{self.invoice_item_number}] {self.item.name} x {self.quantity} "
            f"for Invoice {self.invoice.invoice_number}"
        )  # pylint: disable=no-member


class Invoice(models.Model):
    
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("UNPAID", "Unpaid"),
        ("PAID", "Paid"),
        ("PARTIAL", "Partial"),
        ("CANCELLED", "Cancelled"),
        ("SENT", "Sent")
    ]
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default="DRAFT", db_index=True
    )
    """Model representing a sales Invoice."""
    invoice_files = models.ManyToManyField(
        "CustomerDocument",
        related_name="invoices_programmatic",
        blank=True,
    )
    customer = models.ForeignKey(
        Customer,
        related_name="invoices",
        on_delete=models.CASCADE,
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    place_of_supply = models.CharField(max_length=50, blank=True)
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="invoices")
    invoice_date = models.DateField(db_index=True)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    customer_notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    subtotal_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(
    max_digits=5, decimal_places=2, default=0, help_text="Discount percentage"
)
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Discount amount"
    )
    gst_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    adjustment_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    files = models.ManyToManyField(
        "CustomerDocument",
        related_name="invoices_ui",
        blank=True,
    )
    invoice_files = models.ManyToManyField(
        "CustomerDocument",
        related_name="invoices_programmatic",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    TAX_PERCENTAGE = 18
    
    def calculate_totals(self):
        """Calculate subtotal, GST, and total dynamically from items."""
        subtotal = sum(item.quantity * item.rate for item in self.item_details.all())
        
        # Apply discount
        discount_amount = (subtotal * self.discount_percentage / 100) if self.discount_percentage else 0
        subtotal_after_discount = subtotal - discount_amount

        # GST
        gst = subtotal_after_discount * (self.TAX_PERCENTAGE / 100)

        # Total
        total = subtotal_after_discount + gst + self.adjustment_amount

        return subtotal, discount_amount, gst, total
    
    def update_totals(self, save=True):
        self.subtotal_amount, self.discount_amount, self.gst_amount, self.total_amount = self.calculate_totals()
        if save:
            super().save(update_fields=["subtotal_amount", "discount_amount", "gst_amount", "total_amount"])
    
    def save(self, *args, **kwargs):

        # Step 1: Save first so the object has a primary key
        super().save(*args, **kwargs)

        # Step 2: Recalculate totals if there are items
        if hasattr(self, 'item_details') and self.item_details.exists():
            self.update_totals(save=False)  # Now safe to save because PK exists
            

    def __str__(self):
        return (
            f"Invoice {self.invoice_number} - "  # pylint: disable=no-member
            f"{self.customer.display_name}"  # pylint: disable=no-member
        )


#draft workflow models
class DraftInvoice(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("UNPAID", "Unpaid"),
        ("PAID", "Paid"),
        ("PARTIAL", "Partial"),
        ("CANCELLED", "Cancelled"),
        ("SENT", "Sent")
    ]
    
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default="DRAFT", db_index=True
    )
    customer = models.ForeignKey("Customer", on_delete=models.CASCADE, null=True, blank=True)
    invoice_number = models.CharField(max_length=50, blank=True, null=True)
    place_of_supply = models.CharField(max_length=50, blank=True)
    deal = models.ForeignKey("Deal", on_delete=models.CASCADE, null=True, blank=True)
    invoice_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    subtotal_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, help_text="Discount percentage"
    )
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Discount amount"
    )
    gst_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    adjustment_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    customer_notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    files = models.ManyToManyField("CustomerDocument", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    TAX_PERCENTAGE = 18  # or store per invoice if needed

    def calculate_totals(self):
        """Calculate subtotal, GST, and total dynamically from items."""
        subtotal = sum(item.quantity * item.rate for item in self.item_details.all())
        
        discount_amount = (subtotal * self.discount_percentage / 100) if self.discount_percentage else Decimal(0)
        subtotal_after_discount = subtotal - discount_amount

        # GST
        gst = subtotal_after_discount * (Decimal(self.TAX_PERCENTAGE) / Decimal(100))

        # Total
        total = subtotal_after_discount + gst + self.adjustment_amount

        return subtotal, discount_amount, gst, total
    
    def update_totals(self, save=True):
        self.subtotal_amount, self.discount_amount, self.gst_amount, self.total_amount = self.calculate_totals()
        if save:
            super().save(update_fields=["subtotal_amount", "discount_amount", "gst_amount", "total_amount"])


    def save(self, *args, **kwargs):

        # Step 1: Save first to ensure a primary key exists
        super().save(*args, **kwargs)

        # Step 2: Recalculate totals if there are item_details
        if hasattr(self, 'item_details') and self.item_details.exists():
            self.update_totals(save=True)

    
    def validate_for_publish(self):
        errors = {}
        if not self.customer:
            errors['customer'] = "Customer is required."
        if not self.invoice_date:
            errors['invoice_date'] = "Invoice date is required."
        if not self.due_date:
            errors['due_date'] = "Due date is required."
        if not self.invoice_number:
            errors['invoice_number'] = "Invoice number is required."
        if self.item_details.count() == 0:
            errors['item_details'] = "At least one invoice item is required."
        if self.discount_percentage < 0:
            errors['discount_percentage'] = "Discount cannot be negative."
        if self.discount_percentage > 100:
            errors['discount_percentage'] = "Discount cannot exceed 100%."

        if errors:
            raise ValidationError(errors)

    
    def publish(self):
        self.validate_for_publish()
        
        with transaction.atomic():
            if not self.invoice_number:
                raise ValidationError("Invoice number is required before publishing.")

            existing_invoice = Invoice.objects.filter(invoice_number=self.invoice_number).first()

            if existing_invoice and existing_invoice.pk != getattr(self, 'final_invoice_id', None):
            # If you want to prevent duplicates:
                raise ValidationError(f"Invoice number {self.invoice_number} already exists.")
            
            # Create or update the final Invoice instance
            invoice, created = Invoice.objects.update_or_create(
                invoice_number=self.invoice_number,
                defaults={
                    'customer': self.customer,
                    'place_of_supply': self.place_of_supply,
                    'deal': self.deal,
                    'invoice_date': self.invoice_date,
                    'due_date': self.due_date,
                    'subtotal_amount': self.subtotal_amount,
                    'discount_percentage': self.discount_percentage,
                    'discount_amount': self.discount_amount,  # new field
                    'gst_amount': self.gst_amount,
                    'total_amount': self.total_amount,
                    'customer_notes': self.customer_notes,
                    'terms_and_conditions': self.terms_and_conditions,
                    'status': 'UNPAID',  # Set to appropriate non-draft status
                },
            )
            invoice.save()

            # Clear existing InvoiceItems if updating
            invoice.item_details.all().delete()

            # Copy draft invoice items into final InvoiceItems
            for draft_item in self.item_details.all():
                InvoiceItem.objects.create(
                    invoice=invoice,
                    item=draft_item.item,
                    quantity=draft_item.quantity,
                    rate=draft_item.rate,
                    amount=draft_item.amount,
                    invoice_item_number=draft_item.invoice_item_number,
                )

            # Copy files
            invoice.files.set(self.files.all())
            invoice.save()

            # Delete draft and its items
            self.delete()
        
        transaction.on_commit(lambda: invoice.refresh_from_db())

        return invoice

class DraftInvoiceItem(DocumentItemBase):
    draft_invoice = models.ForeignKey(DraftInvoice, related_name='item_details', on_delete=models.CASCADE)
    invoice_item_number = models.PositiveIntegerField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Automatically calculate amount
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)
        
        


#######################################################################


# Register banking signals
try:
    import server.core.banking.signals  # noqa: F401
except ImportError:
    pass

