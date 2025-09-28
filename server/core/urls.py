"""URL routing for the core Django app's API endpoints."""

from django.urls import path, include
from rest_framework_simplejwt.views import TokenBlacklistView
from .views import send_report_email
from .views import GeneratePresignedUrlView,generate_document_pdf
from django.conf.urls.static import static
from django.conf import settings

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
    BillViewSet,
    CustomerDocumentViewSet,
    ProfitAndLossReportView,
    BalanceSheetReportView,
    InventoryManagementViewSet,
)


router = DefaultRouter()

router.register(
    r"inventory-management",
    InventoryManagementViewSet,
    basename="inventorymanagement",
)
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
router.register(r"files", CustomerDocumentViewSet, basename="file")

urlpatterns = [
    path("", include(router.urls)),
    path("banking/", include("server.core.banking.urls")),
    path(
        "reports/profit-and-loss/",
        ProfitAndLossReportView.as_view(),
        name="profit-and-loss-report",
    ),
    path(
        "reports/balance-sheet/",
        BalanceSheetReportView.as_view(),
        name="balance-sheet-report",
    ),
    path("auth/logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path('api/send-report-email/', send_report_email, name='send_report_email'),
    path("generate-presigned-url/", GeneratePresignedUrlView.as_view(), name="generate-presigned-url"),
    path('api/generate-pdf/', generate_document_pdf, name='generate_pdf'),
]
