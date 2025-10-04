"""URL routing for the core Django app's API endpoints."""

from django.urls import path, include
from rest_framework_simplejwt.views import TokenBlacklistView
from .views import send_report_email
from .views import GeneratePresignedUrlView,generate_document_pdf
from django.conf.urls.static import static
from django.conf import settings
from .views import current_user

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
    ItemStock,
    FreightViewSet,
    ImportBillViewSet,
    DutyViewSet,
    GstViewSet,
    NonGstViewSet,
    BillorderViewSet
)
from .views import DealViewSet


router = DefaultRouter()


router.register(
    r"inventory-management",
    InventoryManagementViewSet,
    basename="inventorymanagement",
)
router.register(r'gsts', GstViewSet, basename='gst')
router.register(r'nongsts', NonGstViewSet, basename='nongst')
router.register(r'freights', FreightViewSet, basename='freight')
router.register(r'importbills',ImportBillViewSet,basename='importbill')
router.register(r'duties',DutyViewSet,basename='duty')
router.register(r'billorders',BillorderViewSet,basename='billorders')
router.register(r'deals', DealViewSet)
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
    path("items/low_stock/", ItemStock.as_view(), name='low_stock_items'),
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
    path("auth/me/", current_user, name="current_user"),
    path("auth/logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path('api/send-report-email/', send_report_email, name='send_report_email'),
    path("generate-presigned-url/", GeneratePresignedUrlView.as_view(), name="generate-presigned-url"),
    path('api/generate-pdf/', generate_document_pdf, name='generate_pdf'),
]
