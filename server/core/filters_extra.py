from .models import Invoice, ProformaInvoice, DeliveryChallan
import django_filters
from .models import Bill

# Bill filter for vendor_id


class BillFilter(django_filters.FilterSet):
    vendor_id = django_filters.NumberFilter(field_name="vendor_id")
    start_date = django_filters.DateFilter(field_name="bill_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="bill_date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="item_details__deal_no", lookup_expr='exact')
    company_name = django_filters.CharFilter(field_name="vendor__display_name", lookup_expr='icontains')
    status = django_filters.ChoiceFilter(field_name="status", choices=Bill.STATUS_CHOICES)

    class Meta:
        model = Bill
        fields = ["vendor_id", "start_date", "end_date", "deal_no", "company_name", "status"]


class InvoiceFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="customer_id")
    start_date = django_filters.DateFilter(field_name="invoice_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="invoice_date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="item_details__deal_no", lookup_expr='exact')
    company_name = django_filters.CharFilter(field_name="customer__display_name", lookup_expr='icontains')
    status = django_filters.ChoiceFilter(field_name="status", choices=Invoice.STATUS_CHOICES)

    class Meta:
        model = Invoice
        fields = ["customer_id", "start_date", "end_date", "deal_no", "company_name", "status"]


class ProformaInvoiceFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="customer_id")
    start_date = django_filters.DateFilter(field_name="invoice_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="invoice_date", lookup_expr='lte')
    company_name = django_filters.CharFilter(field_name="customer__display_name", lookup_expr='icontains')
    status = django_filters.ChoiceFilter(field_name="status", choices=ProformaInvoice._meta.get_field('status').choices)

    class Meta:
        model = ProformaInvoice
        fields = ["customer_id", "start_date", "end_date", "company_name", "status"]


class DeliveryChallanFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="customer_id")
    start_date = django_filters.DateFilter(field_name="date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="date", lookup_expr='lte')
    company_name = django_filters.CharFilter(field_name="customer__display_name", lookup_expr='icontains')
    status = django_filters.ChoiceFilter(field_name="status", choices=DeliveryChallan.STATUS_CHOICES)

    class Meta:
        model = DeliveryChallan
        fields = ["customer_id", "start_date", "end_date", "company_name", "status"]