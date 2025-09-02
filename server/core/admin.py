from django.contrib import admin
from core.models import DailySummary
from core.background_tasks import preaggregate_daily_summaries

@admin.register(DailySummary)
class DailySummaryAdmin(admin.ModelAdmin):
    list_display = ("date", "invoices_total", "bills_total", "payments_total", "created_at", "updated_at")
    actions = ["run_preaggregation"]

    def run_preaggregation(self, request, queryset):
        preaggregate_daily_summaries()
        self.message_user(request, "Pre-aggregation task has been scheduled.")
    run_preaggregation.short_description = "Run daily pre-aggregation now"
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
