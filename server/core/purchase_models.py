from django.db import models
from django.conf import settings
from .models import Vendor,Deal

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
    
    assessable_value = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Assessable value for this duty")
    
    igst = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="IGSt amount for this duty"
    )
    social_welfare = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Social Welfare Surcharge amount"
    )
    cess = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Cess amount"
    )
    duty = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Primary duty amount"
    )
    addl_duty = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Additional duty amount"
    )
    total = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total amount including all duties and taxes"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, help_text="User who created the record"
    )
    created_at = models.DateTimeField(auto_now_add=True)

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
    
