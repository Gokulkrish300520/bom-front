from django.db import models
from django.conf import settings
from .models import Vendor,Deal
from decimal import Decimal,ROUND_HALF_UP
from django.db.models import Q
from django.db.models import Sum
from django.contrib.contenttypes.fields import GenericForeignKey,GenericRelation
from django.contrib.contenttypes.models import ContentType

class PaymentTransactionQuerySet(models.QuerySet):
    def pending(self):
        return self.filter(
            Q(gst_transactions__payment_status__in=['Unpaid', 'Paid Partially']) |
            Q(nongst_transactions__payment_status__in=['Unpaid', 'Paid Partially']) |
            Q(duty_transactions__payment_status__in=['Unpaid', 'Paid Partially']) |
            Q(billorder_transactions__payment_status__in=['Unpaid', 'Paid Partially']) |
            Q(importbill_transactions__payment_status__in=['Unpaid', 'Paid Partially'])
        )

class PaymentTransaction(models.Model):
    PAID_BY_CHOICES = [
        ("SBI", "SBI"),
        ("IOB", "IOB"),
        ("ICICI", "ICICI"),
        ("Petty Cash", "Petty Cash"),
    ]

    # Generic relation to any "payable" model (Billorder, Duty, Gst, NonGst, ImportBill, ...)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    objects = PaymentTransactionQuerySet.as_manager()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_by = models.CharField(max_length=20, choices=PAID_BY_CHOICES)
    payment_reference_no = models.CharField(max_length=64, null=True, blank=True)
    paid_on = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-paid_on"]

    def __str__(self):
        return f"{self.paid_by} - ₹{self.amount} -> {self.content_object}"

    def save(self, *args, **kwargs):
        skip_related_update = kwargs.pop("skip_related_update", False)
        super().save(*args, **kwargs)
        
        if not skip_related_update:
            related = self.content_object
            try:
                if hasattr(related, 'update_status'):
                    related.update_status()
            except Exception:
                pass
        
class Gst(models.Model):
    payment_choices =[("Low","low"),("High","high")]
    payment_status_choices = [("Paid","paid"),("Unpaid","unpaid"),("Paid Partially","paid partially")]
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash"),("None", "none")]
    
    transactions = GenericRelation('PaymentTransaction', related_query_name='gst_transactions')
    vendor = models.ForeignKey(
        Vendor, related_name="gst_bills",on_delete=models.CASCADE,
        help_text="Vendor associated with the gst"
    )
    currency = models.CharField(
        max_length=10, default="INR",
        help_text="Currency of the amount"
    )
    deal = models.ForeignKey(Deal, related_name="gst_bills", on_delete=models.CASCADE)
    date = models.DateField(help_text="Date of gst")
    
    payment_request = models.CharField(max_length=20,choices=payment_choices,default="Low")
    payment_reference_no = models.CharField(max_length= 30,null=True,blank=True)
    payment_status = models.CharField(max_length=20,choices=payment_status_choices,default="Unpaid")
    paid_by = models.CharField(max_length = 20 ,choices=paid_by_choices,default="None")
    
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total amount of all items "
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, help_text="User who created the record"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.vendor} - {self.date} - {self.total_amount}"
    
    @property
    def paid_amount(self):
        return self.transactions.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

    @property
    def amount_to_pay(self):
        return max(self.total_amount - self.paid_amount, Decimal("0.00"))
    
    def update_status(self):
        
        total_paid = self.transactions.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        last_tx = self.transactions.order_by('-paid_on').first()
        
        if total_paid >= self.total_amount:
            self.payment_status = "Paid"
        elif total_paid > 0:
            self.payment_status = "Paid Partially"
        else:
            self.payment_status = "Unpaid"
            
        if last_tx:
            self.payment_reference_no = last_tx.payment_reference_no
            self.paid_by = last_tx.paid_by
        else:
            self.paid_by = "None"
            self.payment_reference_no = None

        self.save(update_fields=["payment_status", "payment_reference_no", "paid_by"])


class GstItem(models.Model):
    gst = models.ForeignKey(Gst,related_name="items",on_delete=models.CASCADE)
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
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Unit price of the item"
    )
    total_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total price"
    )
    
    def save(self, *args, **kwargs):
        self.total_price = (self.quantity or Decimal("0.00")) * (self.unit_price or Decimal("0.00"))
        super().save(*args, **kwargs)

class NonGst(models.Model):
    payment_choices =[("Low","low"),("High","high")]
    payment_status_choices = [("Paid","paid"),("Unpaid","unpaid"),("Paid Partially","paid partially")]
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash"),("None", "none")]
    
    transactions = GenericRelation('PaymentTransaction', related_query_name='nongst_transactions')
    vendor = models.ForeignKey(
        Vendor, related_name="nongst_bills",on_delete=models.CASCADE,
        help_text="Vendor associated with the gst"
    )
    currency = models.CharField(
        max_length=10, default="INR",
        help_text="Currency of the amount"
    )
    deal = models.ForeignKey(Deal, related_name="nongst_bills", on_delete=models.CASCADE)
    date = models.DateField(help_text="Date of nongst")
    payment_request = models.CharField(max_length=20,choices=payment_choices,default="Low")
    payment_reference_no = models.CharField(max_length= 30,null=True,blank=True)
    payment_status = models.CharField(max_length=20,choices=payment_status_choices,default="Unpaid")
    paid_by = models.CharField(max_length = 20 ,choices=paid_by_choices,default="None")
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total amount of all items "
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, help_text="User who created the record"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.vendor} - {self.date} - {self.total_amount}"
    
    @property
    def paid_amount(self):
        return self.transactions.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

    @property
    def amount_to_pay(self):
        return max(self.total_amount - self.paid_amount, Decimal("0.00"))
    
    def update_status(self):
        total_paid = self.transactions.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        if total_paid >= self.total_amount:
            self.payment_status = "Paid"
        elif total_paid > 0:
            self.payment_status = "Paid Partially"
        else:
            self.payment_status = "Unpaid"
        
        last_tx = self.transactions.order_by('-paid_on').first()
        if last_tx:
            self.paid_by = last_tx.paid_by
            self.payment_reference_no = last_tx.payment_reference_no
        else:
            self.paid_by = "None"
            self.payment_reference_no = None
        self.save(update_fields=["payment_status","paid_by", "payment_reference_no"])


class NonGstItem(models.Model):
    nongst = models.ForeignKey(NonGst,related_name="items",on_delete=models.CASCADE)
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
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Unit price of the item"
    )
    total_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total price"
    )
    
    def save(self, *args, **kwargs):
        self.total_price = (self.quantity or Decimal("0.00")) * (self.unit_price or Decimal("0.00"))
        super().save(*args, **kwargs)
    
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
    date=models.DateField(
        help_text="Date of the freight charge"
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total price")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, help_text="User who created the record"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Freight Charge for {self.vendor.display_name if self.vendor else 'Unknown Vendor'}"

    
class FreightItem(models.Model):
    freight = models.ForeignKey(Freight, related_name="items", on_delete=models.CASCADE)
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
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,null=True,blank = True,
        help_text="Unit price")
    total_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,null=True,blank = True,
        help_text="Total price"
    )
    
    def save(self, *args, **kwargs):
        # Automatically calculate total price
        self.total_price = (self.quantity or Decimal("0.00")) * (self.unit_price or Decimal("0.00"))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item_name} ({self.sf_number or 'No SF'})"
    
class ImportBill(models.Model):
    payment_choices =[("Low","low"),("High","high")]
    payment_status_choices = [("Paid","paid"),("Unpaid","unpaid"),("Paid Partially","paid partially")]
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash"),("None", "none")]
    transactions = GenericRelation('PaymentTransaction', related_query_name='importbill_transactions')
    vendor = models.ForeignKey(
        Vendor, related_name="import_bills",on_delete=models.CASCADE,
        help_text="Vendor associated with the import bills"
    )
    currency = models.CharField(
        max_length=10, default="INR",
        help_text="Currency of the amount"
    )
    deal = models.ForeignKey(Deal, related_name="import_bills", on_delete=models.CASCADE)
    date = models.DateField(help_text="Date of import bill for invoice")
    payment_request = models.CharField(max_length=20,choices=payment_choices,default="Low")
    payment_reference_no = models.CharField(max_length= 30,null=True,blank=True)
    payment_status = models.CharField(max_length=20,choices=payment_status_choices,default="Unpaid")
    paid_by = models.CharField(max_length = 20 ,choices=paid_by_choices,default="None")
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total amount of all items "
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, help_text="User who created the record"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"ImportBill for {self.vendor.display_name} ({self.deal.deal_no})"
    
    @property
    def paid_amount(self):
        return self.transactions.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

    @property
    def amount_to_pay(self):
        return max(self.total_amount - self.paid_amount, Decimal("0.00"))
    
    def update_status(self):
        paid_total = self.transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        if paid_total >= self.total_amount:
            self.payment_status = 'Paid'
        elif paid_total > 0:
            self.payment_status = 'Paid Partially'
        else:
            self.payment_status = 'Unpaid'

        last_tx = self.transactions.order_by('-paid_on').first()
        if last_tx:
            self.paid_by = last_tx.paid_by
            self.payment_reference_no = last_tx.payment_reference_no
        else:
            self.paid_by = "None"
            self.payment_reference_no = None

        self.save(update_fields=["payment_status", "paid_by", "payment_reference_no"])

class ImportBillItem(models.Model):
    bill = models.ForeignKey(ImportBill,related_name="bill_items",on_delete=models.CASCADE)
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
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Unit price of the item"
    )
    total_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total price"
    )
    
    def save(self, *args, **kwargs):
        self.total_price = (self.quantity or Decimal("0.00")) * (self.unit_price or Decimal("0.00"))
        super().save(*args, **kwargs)
    

ZERO = Decimal("0.00")

class Duty(models.Model):
    payment_choices =[("Low","low"),("High","high")]
    payment_status_choices = [("Paid","paid"),("Unpaid","unpaid"),("Paid Partially","paid partially")]
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash"),("None", "none")]

    transactions = GenericRelation('PaymentTransaction', related_query_name='duty_transactions')
    vendor = models.ForeignKey(Vendor, related_name="duty", on_delete=models.CASCADE)
    deal = models.ForeignKey(Deal, related_name="duty", on_delete=models.CASCADE)
    currency = models.CharField(max_length=10, default="INR")
    date = models.DateField()
    airway_bill = models.CharField(max_length=20, null=True, blank=True)

    payment_request = models.CharField(max_length=20, choices=payment_choices, default="Low")
    payment_reference_no = models.CharField(max_length=30, null=True, blank=True)
    payment_status = models.CharField(max_length=20, choices=payment_status_choices, default="Unpaid")
    paid_by = models.CharField(max_length=20, choices=paid_by_choices, default="None")

    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Duty for {self.vendor.display_name} ({self.deal.deal_no})"

    @property
    def paid_amount(self):
        return self.transactions.aggregate(total=Sum("amount"))["total"] or ZERO

    @property
    def amount_to_pay(self):
        return max(self.total_amount - self.paid_amount, ZERO)

    def update_total_amount(self):
        totals = self.duty_items.aggregate(
            total_price_sum=Sum("total_price"),
            total_duty_sum=Sum("total_duty"),
        )
        self.total_amount = (totals.get("total_price_sum") or ZERO) + (totals.get("total_duty_sum") or ZERO)
        self.save(update_fields=["total_amount"])

    def update_status(self):
        """Update payment status and last paid_by automatically based on transactions."""
        total_paid = self.paid_amount

        # Payment status logic
        if total_paid >= self.total_amount and self.total_amount > 0:
            self.payment_status = "Paid"
        elif total_paid > 0:
            self.payment_status = "Paid Partially"
        else:
            self.payment_status = "Unpaid"

        # Update last payment details
        last_tx = self.transactions.order_by("-paid_on").first()
        if last_tx:
            self.paid_by = last_tx.paid_by
            self.payment_reference_no = last_tx.payment_reference_no
        else:
            self.paid_by = "None"
            self.payment_reference_no = None

        self.save(update_fields=["payment_status", "paid_by", "payment_reference_no"])


class DutyItem(models.Model):
    duty = models.ForeignKey(Duty, related_name="duty_items", on_delete=models.CASCADE)
    item_name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    item_specification = models.TextField(null=True, blank=True)
    brand = models.CharField(max_length=50, null=True, blank=True)
    hsn_code = models.CharField(max_length=20, null=True, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)

    assessable_value = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    igst = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    social_welfare = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    cess = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    duty_amount = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    addl_duty = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    total_duty = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    

    def save(self, *args, **kwargs):
        self.total_price = (self.quantity * self.unit_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.total_duty = (
            self.assessable_value+self.igst + self.social_welfare + self.cess + self.duty_amount + self.addl_duty
        ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        super().save(*args, **kwargs)

class Billorder(models.Model):
    payment_choices =[("Low","low"),("High","high")]
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash"),("None", "none")]
    STATUS_CHOICES = [("Paid", "Paid"), ("Unpaid", "Unpaid"), ("Paid Partially", "Paid Partially")]
    TAX_TYPE_CHOICES = [("TDS", "TDS"), ("TCS", "TCS")]
    TAX_PERCENTAGE_CHOICES = [("0","0%"),("5","5%"),("12","12%"),("18","18%"),("28","28%")]
    
    transactions = GenericRelation('PaymentTransaction', related_query_name='billorder_transactions')
    vendor = models.ForeignKey(Vendor, related_name="billorders", on_delete=models.CASCADE)
    deal = models.ForeignKey(Deal, related_name="billorders", on_delete=models.CASCADE)
    bill_number = models.CharField(max_length=50, unique=True)
    payment_status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="Unpaid")
    bill_date = models.DateField(db_index=True)
    due_date = models.DateField()
    notes = models.TextField(blank=True)
    tax_type = models.CharField(max_length=3, choices=TAX_TYPE_CHOICES, default="TDS")
    payment_request = models.CharField(max_length=20, choices=payment_choices, default="Low")
    tax_percentage = models.CharField(max_length=3, choices=TAX_PERCENTAGE_CHOICES, default="0")
    adjustments = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_by = models.CharField(max_length=12, choices=paid_by_choices, default="None")
    payment_reference_no = models.CharField(max_length=30, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"Bill{self.bill_number} - {self.vendor}"

    @property
    def subtotal(self):
        return self.billorder_items.aggregate(total=Sum("total_price"))["total"] or Decimal("0.00")

    @property
    def tax_amount(self):
        pct = Decimal(self.tax_percentage or 0)
        return self.subtotal * pct / Decimal(100)

    @property
    def total_amount(self):
        if self.tax_type == "TCS":
            return self.subtotal + self.tax_amount + self.adjustments
        elif self.tax_type == "TDS":
            return self.subtotal - self.tax_amount + self.adjustments
        return self.subtotal + self.adjustments

    @property
    def paid_amount(self):
        return self.transactions.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

    @property
    def amount_to_pay(self):
        return max(self.total_amount - self.paid_amount, Decimal("0.00"))

    def update_status(self):
        if self.paid_amount >= self.total_amount:
            self.payment_status = "Paid"
        elif self.paid_amount > 0:
            self.payment_status = "Paid Partially"
        else:
            self.payment_status = "Unpaid"
        
        # Update last payment details
        last_tx = self.transactions.order_by("-paid_on").first()
        if last_tx:
            self.paid_by = last_tx.paid_by
            self.payment_reference_no = last_tx.payment_reference_no
        else:
            self.paid_by = "None"
            self.payment_reference_no = None

        self.save(update_fields=["payment_status", "paid_by", "payment_reference_no"])

class BillorderItem(models.Model):
    bill_order = models.ForeignKey(Billorder, related_name="billorder_items", on_delete=models.CASCADE)
    item_name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    item_specification = models.TextField(null=True, blank=True)
    brand = models.CharField(max_length=50, null=True, blank=True)
    hsn_code = models.CharField(max_length=20, null=True, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.total_price = (self.quantity or Decimal("0.00")) * (self.unit_price or Decimal("0.00"))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item_name} ({self.quantity} x {self.unit_price})"
