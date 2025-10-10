from django.db import models
from django.conf import settings
from .models import Vendor,Deal
from decimal import Decimal
from django.db.models import Sum


class Gst(models.Model):
    payment_choices =[("Low","low"),("High","high")]
    payment_status_choices = [("Paid","paid"),("Unpaid","unpaid"),("Paid Partially","paid partially")]
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash")]
    
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
    paid_by = models.CharField(max_length = 20 ,choices=paid_by_choices,default="Petty Cash")
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

class NonGst(models.Model):
    payment_choices =[("Low","low"),("High","high")]
    payment_status_choices = [("Paid","paid"),("Unpaid","unpaid"),("Paid Partially","paid partially")]
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash")]
    
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
    paid_by = models.CharField(max_length = 20 ,choices=paid_by_choices,default="Petty Cash")
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
        self.total_price = (self.quantity or 0) * (self.unit_price or 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item_name} ({self.sf_number or 'No SF'})"
    
class ImportBill(models.Model):
    payment_choices =[("Low","low"),("High","high")]
    payment_status_choices = [("Paid","paid"),("Unpaid","unpaid"),("Paid Partially","paid partially")]
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash")]
    
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
    paid_by = models.CharField(max_length = 20 ,choices=paid_by_choices,default="Petty Cash")
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total amount of all items "
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, help_text="User who created the record"
    )
    created_at = models.DateTimeField(auto_now_add=True)

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
    
class Duty(models.Model):
    payment_choices =[("Low","low"),("High","high")]
    payment_status_choices = [("Paid","paid"),("Unpaid","unpaid"),("Paid Partially","paid partially")]
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash")]
        
    vendor = models.ForeignKey(
        Vendor, related_name="duty",on_delete=models.CASCADE,
        help_text="Vendor associated with the duty"
    )
    deal = models.ForeignKey(Deal, related_name="duty", on_delete=models.CASCADE)
    
    currency = models.CharField(
        max_length=10, default="INR",
        help_text="Currency of the amount"
    )
    
    date=models.DateField(
        help_text="Date of the freight charge"
    )
    
    airway_bill=models.CharField( 
        max_length=20, null=True, blank=True,
        help_text="airway bill number of the duty")
    
    payment_request = models.CharField(max_length=20,choices=payment_choices,default="Low")
    payment_reference_no = models.CharField(max_length= 30,null=True,blank=True)
    payment_status = models.CharField(max_length=20,choices=payment_status_choices,default="Unpaid")
    paid_by = models.CharField(max_length = 20 ,choices=paid_by_choices,default="Petty Cash")
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total amount including all duties and taxes"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, help_text="User who created the record"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Duty for {self.vendor.display_name} ({self.deal.deal_no})"
    
    def update_total_amount(self):
        """Recalculate total amount from all related DutyItems."""
        totals = self.duty_items.aggregate(
            total_price_sum=models.Sum("total_price"),
            total_duty_sum=models.Sum("total_duty"),)
        
        total_price = totals["total_price_sum"] or Decimal("0.00")
        total_duty = totals["total_duty_sum"] or Decimal("0.00")
        self.total_amount = total_price + total_duty
        self.save(update_fields=["total_amount"])

class DutyItem(models.Model):
    duty = models.ForeignKey(Duty,related_name="duty_items",on_delete=models.CASCADE)
    
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
        help_text="Unit price")
    total_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total price"
    )
    
    
    assessable_value = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Assessable value for this item"
    )
    igst = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="IGST amount for this item"
    )
    social_welfare = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Social welfare surcharge for this item"
    )
    cess = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Cess amount for this item"
    )
    duty_amount= models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Primary duty amount for this item"
    )
    addl_duty = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Additional duty for this item"
    )

    total_duty = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total duty (sum of all duties/taxes)"
    )

    def save(self, *args, **kwargs):
        
        zero = Decimal("0.00")
        # Auto-calculate total_duty and total_price
        self.total_price = (self.quantity or 0) * (self.unit_price or 0)
        self.total_duty = (
            (self.assessable_value or 0)
            + (self.igst or 0)
            + (self.social_welfare or 0)
            + (self.cess or 0)
            + (self.duty_amount or 0)
            + (self.addl_duty or 0)
        )
        super().save(*args, **kwargs)
        
        self.duty.update_total_amount()

    def delete(self, *args, **kwargs):
        """Ensure parent Duty total updates on deletion."""
        super().delete(*args, **kwargs)
        self.duty.update_total_amount()

    def __str__(self):
        return f"{self.item_name} - Total Duty: {self.total_duty}"

class Billorder(models.Model):
    paid_by_choices = [("SBI","sbi"),("IOB","iob"),("ICICI","icici"),("Petty Cash","petty cash")]
    STATUS_CHOICES = [("PAID", "Paid"), ("UNPAID", "Unpaid"), ("PARTIAL", "Partial")]
    TAX_TYPE_CHOICES = [("TDS", "TDS"), ("TCS", "TCS")]
    TAX_PERCENTAGE_CHOICES = [("0","0%"),("5","5%"),("12","12%"),("18","18%"),("28","28%")]

    vendor = models.ForeignKey(Vendor, related_name="billorders", on_delete=models.CASCADE)
    deal = models.ForeignKey(Deal, related_name="billorders", on_delete=models.CASCADE)
    bill_number = models.CharField(max_length=50, unique=True)
    payment_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="UnPaid")
    bill_date = models.DateField(db_index=True)
    due_date = models.DateField()
    notes = models.TextField(blank=True)
    tax_type = models.CharField(max_length=3, choices=TAX_TYPE_CHOICES, default="TDS")
    tax_percentage = models.CharField(max_length=3, choices=TAX_PERCENTAGE_CHOICES, default="0")
    adjustments = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_by = models.CharField(max_length=12, choices=paid_by_choices, default="UNPAID")
    payment_reference_no = models.CharField(max_length=30, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"Bill {self.bill_number} - {self.vendor}"

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
            self.payment_status = "PAID"
        elif self.paid_amount > 0:
            self.payment_status = "PARTIAL"
        else:
            self.payment_status = "UNPAID"
        self.save(update_fields=["payment_status"])

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
        self.total_price = (self.quantity or 0) * (self.unit_price or 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item_name} ({self.quantity} x {self.unit_price})"

class PaymentTransaction(models.Model):
    bill_order = models.ForeignKey(Billorder, related_name="transactions", on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_by = models.CharField(max_length=12, choices=Billorder.paid_by_choices)
    payment_reference_no = models.CharField(max_length=30, null=True, blank=True)
    paid_on = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.bill_order.update_status()
        self.bill_order.payment_reference_no = self.payment_reference_no or ""
        self.bill_order.paid_by = self.paid_by
        self.bill_order.save(update_fields=["payment_status", "payment_reference_no", "paid_by"])