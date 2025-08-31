from django.contrib import admin
from .models import (
    Customer,
    CustomerDocument,
    ContactPerson,
    Quote,
    QuoteItem,
    ProformaInvoice,
    ProformaInvoiceItem,
    Invoice,
    InvoiceItem,
    DeliveryChallanItem,
)
from .models import Bill, BillItem

admin.site.register(DeliveryChallanItem)
admin.site.register(Invoice)
admin.site.register(InvoiceItem)

admin.site.register(Customer)
admin.site.register(CustomerDocument)
admin.site.register(ContactPerson)
admin.site.register(Quote)
admin.site.register(QuoteItem)
admin.site.register(ProformaInvoice)
admin.site.register(ProformaInvoiceItem)
admin.site.register(Bill)
admin.site.register(BillItem)
