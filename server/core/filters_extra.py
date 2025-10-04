from .models import Invoice, ProformaInvoice, DeliveryChallan,Deal
import django_filters
from .models import Bill,Vendor
from .purchase_models import Freight,ImportBill,Duty,Gst,NonGst,Billorder

# Bill filter for vendor_id
class GstFilter(django_filters.FilterSet):
    vendor_id = django_filters.NumberFilter(field_name="vendor_id")
    vendor_name = django_filters.CharFilter(field_name="vendor__display_name", lookup_expr='icontains')
    start_date = django_filters.DateFilter(field_name="date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    item_name = django_filters.CharFilter(field_name="items__item_name", lookup_expr='icontains')

    class Meta:
        model = Gst
        fields = ["vendor_id", "start_date", "end_date","deal_no","item_name"]

class NonGstFilter(django_filters.FilterSet):
    vendor_id = django_filters.NumberFilter(field_name="vendor_id")
    vendor_name = django_filters.CharFilter(field_name="vendor__display_name", lookup_expr='icontains')
    start_date = django_filters.DateFilter(field_name="date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    item_name = django_filters.CharFilter(field_name="items__item_name", lookup_expr='icontains')

    class Meta:
        model = NonGst
        fields = ["vendor_id", "start_date", "end_date","deal_no","item_name"]

class FreightFilter(django_filters.FilterSet):
    vendor_id = django_filters.NumberFilter(field_name="vendor_id")
    vendor_name = django_filters.CharFilter(field_name="vendor__display_name", lookup_expr='icontains')
    start_date = django_filters.DateFilter(field_name="date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    item_name = django_filters.CharFilter(field_name="items__item_name", lookup_expr='icontains')

    class Meta:
        model = Freight
        fields = ["vendor_id", "start_date", "end_date","deal_no","item_name"]

class ImportBillFilter(django_filters.FilterSet):
    vendor_id = django_filters.NumberFilter(field_name="vendor_id")
    vendor_name = django_filters.CharFilter(field_name="vendor__display_name", lookup_expr='icontains')
    start_date = django_filters.DateFilter(field_name="date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    item_name = django_filters.CharFilter(field_name="bill_items__item_name", lookup_expr='icontains')

    class Meta:
        model = ImportBill
        fields = ["vendor_id", "start_date", "end_date","deal_no","item_name"]

class DutyFilter(django_filters.FilterSet):
    vendor_id = django_filters.NumberFilter(field_name="vendor_id")
    vendor_name = django_filters.CharFilter(field_name="vendor__display_name", lookup_expr='icontains')
    start_date = django_filters.DateFilter(field_name="date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    item_name = django_filters.CharFilter(field_name="duty_items__item_name", lookup_expr='icontains')

    class Meta:
        model = Duty
        fields = ["vendor_id", "start_date", "end_date","deal_no","item_name"]

class BillorderFilter(django_filters.FilterSet):
    vendor_id = django_filters.NumberFilter(field_name="vendor_id")
    vendor_name = django_filters.CharFilter(field_name="vendor__display_name", lookup_expr='icontains')
    start_date = django_filters.DateFilter(field_name="bill_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="bill_date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    item_name = django_filters.CharFilter(field_name="billorder_items__item_name", lookup_expr='icontains')

    class Meta:
        model = Billorder
        fields = ["vendor_id", "start_date", "end_date","deal_no","item_name"]


class DealFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="customer_id")
    start_date = django_filters.DateFilter(field_name="start_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="end_date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal_no", lookup_expr='icontains')
    company_name = django_filters.CharFilter(field_name="customer__company_name", lookup_expr='icontains')

    class Meta:
        model = Deal
        fields = ["customer_id", "start_date", "end_date","deal_no","company_name"]
class BillFilter(django_filters.FilterSet):
    vendor_id = django_filters.NumberFilter(field_name="vendor_id")
    start_date = django_filters.DateFilter(field_name="bill_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="bill_date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    company_name = django_filters.CharFilter(field_name="vendor__company_name", lookup_expr='icontains')
    status = django_filters.ChoiceFilter(field_name="status", choices=Bill.STATUS_CHOICES)

    class Meta:
        model = Bill
        fields = ["vendor_id", "start_date", "end_date", "deal_no", "company_name", "status"]


class InvoiceFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="deal__customer_id")
    start_date = django_filters.DateFilter(field_name="invoice_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="invoice_date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    company_name = django_filters.CharFilter(field_name="customer__company_name", lookup_expr='icontains')
    status = django_filters.ChoiceFilter(field_name="status", choices=Invoice.STATUS_CHOICES)

    class Meta:
        model = Invoice
        fields = ["customer_id", "start_date", "end_date", "deal_no", "company_name", "status"]


class ProformaInvoiceFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="deal__customer_id")
    start_date = django_filters.DateFilter(field_name="invoice_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="invoice_date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    company_name = django_filters.CharFilter(field_name="customer__company_name", lookup_expr='icontains')
    status = django_filters.ChoiceFilter(field_name="status", choices=ProformaInvoice._meta.get_field('status').choices)

    class Meta:
        model = ProformaInvoice
        fields = ["customer_id", "start_date", "end_date","deal_no","company_name", "status"]


class DeliveryChallanFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="deal__customer_id")
    start_date = django_filters.DateFilter(field_name="date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal__deal_no", lookup_expr='icontains')
    company_name = django_filters.CharFilter(field_name="customer__company_name", lookup_expr='icontains')
    status = django_filters.ChoiceFilter(field_name="status", choices=DeliveryChallan.STATUS_CHOICES)

    class Meta:
        model = DeliveryChallan
        fields = ["customer_id", "start_date", "end_date","deal_no", "company_name", "status"]
        
class VendorFilter(django_filters.FilterSet):
    company_name = django_filters.CharFilter(field_name="company_name", lookup_expr='icontains')
    display_name = django_filters.CharFilter(field_name="first_name", lookup_expr='icontains')

    class Meta:
        model = Vendor
        fields = ["company_name", "display_name"]