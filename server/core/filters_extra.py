from .models import Invoice, ProformaInvoice, DeliveryChallan
import django_filters
from .models import Bill

# Bill filter for vendor_id


class BillFilter(django_filters.FilterSet):
    vendor_id = django_filters.NumberFilter(field_name="vendor_id")

    class Meta:
        model = Bill
        fields = ["vendor_id"]


class InvoiceFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="customer_id")

    class Meta:
        model = Invoice
        fields = ["customer_id"]


class ProformaInvoiceFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="customer_id")

    class Meta:
        model = ProformaInvoice
        fields = ["customer_id"]


class DeliveryChallanFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="customer_id")

    class Meta:
        model = DeliveryChallan
        fields = ["customer_id"]
