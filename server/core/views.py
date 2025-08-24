from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Customer, Invoice, Vendor, Item, Payment, Quote, ProformaInvoice, DeliveryChallan, InventoryAdjustment
from .serializers import CustomerSerializer, InvoiceSerializer, VendorSerializer, ItemSerializer, PaymentSerializer, QuoteSerializer, ProformaInvoiceSerializer, DeliveryChallanSerializer, InventoryAdjustmentSerializer

# Create your views here.

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


# Vendor ViewSet
class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all().order_by('-created_at')
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


# Item ViewSet
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by('-created_at')
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]


# Payment ViewSet
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


# Quote ViewSet
class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all().order_by('-created_at')
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]


# ProformaInvoice ViewSet
class ProformaInvoiceViewSet(viewsets.ModelViewSet):
    queryset = ProformaInvoice.objects.all().order_by('-created_at')
    serializer_class = ProformaInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


# DeliveryChallan ViewSet
class DeliveryChallanViewSet(viewsets.ModelViewSet):
    queryset = DeliveryChallan.objects.all().order_by('-created_at')
    serializer_class = DeliveryChallanSerializer
    permission_classes = [permissions.IsAuthenticated]


# InventoryAdjustment ViewSet
class InventoryAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = InventoryAdjustment.objects.all().order_by('-created_at')
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]
