from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import (
    CustomerDocument, Customer, Invoice, Vendor, Item, Payment, Quote,
    ProformaInvoice, DeliveryChallan, InventoryAdjustment, Bill,
)
from .serializers import (
    CustomerDocumentSerializer, CustomerSerializer, InvoiceSerializer,
    VendorSerializer, ItemSerializer, PaymentSerializer, QuoteSerializer,
    ProformaInvoiceSerializer, DeliveryChallanSerializer,
    InventoryAdjustmentSerializer, BillSerializer,
)


class CustomerDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for uploading, retrieving,
    and updating customer documents (files)."""
    queryset = CustomerDocument.objects.all().order_by(
        "-uploaded_at"
    )
    serializer_class = CustomerDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def retrieve(self, request, *args, **kwargs) -> Response:
        """Return file as response for GET /api/files/<id>/"""
        # Return file as response for GET /api/files/<id>/
        instance = self.get_object()
        file_handle = instance.file.open("rb")
        response = Response(
            file_handle.read(), content_type="application/octet-stream"
        )
        response["Content-Disposition"] = (
            f'inline; filename="{instance.file.name.split("/")[-1]}"'
        )
        return response

    def create(self, request, *args, **kwargs) -> Response:
        """Handle file upload."""
        # Handle file upload
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs) -> Response:
        """Handle file update (replace file)."""
        # Handle file update (replace file)
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class BillViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Bills."""
    queryset = Bill.objects.all().order_by("-created_at")
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Customers."""

    queryset = Customer.objects.all().order_by("-created_at")
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Invoices."""

    queryset = Invoice.objects.all().order_by("-created_at")
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class VendorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Vendors."""

    queryset = Vendor.objects.all().order_by("-created_at")
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


class ItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Items."""

    queryset = Item.objects.all().order_by("-created_at")
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Payments."""

    queryset = Payment.objects.all().order_by("-created_at")
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


class QuoteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Quotes."""

    queryset = Quote.objects.all().order_by("-created_at")
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProformaInvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Proforma Invoices."""

    queryset = ProformaInvoice.objects.all().order_by("-created_at")
    serializer_class = ProformaInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class DeliveryChallanViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Delivery Challans."""

    queryset = DeliveryChallan.objects.all().order_by("-created_at")
    serializer_class = DeliveryChallanSerializer
    permission_classes = [permissions.IsAuthenticated]


class InventoryAdjustmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Inventory Adjustments."""

    queryset = InventoryAdjustment.objects.all().order_by("-created_at")
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]
