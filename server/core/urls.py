from django.urls import path, include

from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet,
    InvoiceViewSet,
    VendorViewSet,
    ItemViewSet,
    PaymentViewSet,
    QuoteViewSet,
    ProformaInvoiceViewSet,
    DeliveryChallanViewSet,
    InventoryAdjustmentViewSet,
    BillViewSet,
    CustomerDocumentViewSet,
)


router = DefaultRouter()
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"vendors", VendorViewSet, basename="vendor")
router.register(r"items", ItemViewSet, basename="item")
router.register(r"bills", BillViewSet, basename="bill")
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(r"quotes", QuoteViewSet, basename="quote")
router.register(
    r"proformainvoices",
    ProformaInvoiceViewSet,
    basename="proformainvoice",
)
router.register(
    r"deliverychallans",
    DeliveryChallanViewSet,
    basename="deliverychallan",
)
router.register(
    r"inventoryadjustments",
    InventoryAdjustmentViewSet,
    basename="inventoryadjustment",
)
router.register(r"files", CustomerDocumentViewSet, basename="file")

urlpatterns = [
    path("", include(router.urls)),
]
