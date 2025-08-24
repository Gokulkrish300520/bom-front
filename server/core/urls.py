from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, InvoiceViewSet, VendorViewSet, ItemViewSet, PaymentViewSet, QuoteViewSet, ProformaInvoiceViewSet, DeliveryChallanViewSet, InventoryAdjustmentViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'quotes', QuoteViewSet, basename='quote')
router.register(r'proforma-invoices', ProformaInvoiceViewSet, basename='proformainvoice')
router.register(r'delivery-challans', DeliveryChallanViewSet, basename='deliverychallan')
router.register(r'inventory-adjustments', InventoryAdjustmentViewSet, basename='inventoryadjustment')

urlpatterns = [
    path('', include(router.urls)),
]