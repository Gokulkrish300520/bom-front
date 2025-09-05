from datetime import date, timedelta
from django.core.cache import cache
import calendar
from django.db.models import Sum, Q
from django.utils.timezone import now

from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

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

class BalanceSheetReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Returns a Balance Sheet report for the given time and basis.
        Query params: time (Today|Yesterday|This Month), basis (Accrual|Cash)
        """
        time_param = request.query_params.get("time", "Today")
        basis = request.query_params.get("basis", "Accrual")

        # Date range logic
        today = date.today()
        if time_param == "Today":
            start_date = end_date = today
        elif time_param == "Yesterday":
            start_date = end_date = today - timedelta(days=1)
        elif time_param == "This Month":
            start_date = today.replace(day=1)
            end_date = today
        else:
            return Response({"error": "Invalid time parameter."}, status=400)

        # Helper: filter by date field depending on basis
        def filter_by_basis(qs, date_field):
            if basis == "Accrual":
                return qs.filter(**{f"{date_field}__gte": start_date, f"{date_field}__lte": end_date})
            elif basis == "Cash":
                # For cash, use payment date for inflows, bill date for outflows
                return qs.filter(**{f"{date_field}__gte": start_date, f"{date_field}__lte": end_date})
            else:
                return qs.none()

        # Current Assets
        # Cash/Bank: Payments received (inflows)
        cash_inflows = filter_by_basis(Payment.objects.all(), "date").aggregate(total=Sum("amount"))['total'] or 0
        # Accounts Receivable: Unpaid invoice amounts
        invoices = filter_by_basis(Invoice.objects.all(), "invoice_date")
        total_invoiced = invoices.aggregate(total=Sum("total_amount"))['total'] or 0
        payments = filter_by_basis(Payment.objects.all(), "date")
        total_paid = payments.aggregate(total=Sum("amount"))['total'] or 0
        accounts_receivable = max(total_invoiced - total_paid, 0)
        # Other current assets: Not tracked, set to 0
        other_current_assets = 0
        total_current_assets = cash_inflows + accounts_receivable + other_current_assets

        # Other Assets, Fixed Assets: Not tracked, set to 0
        other_assets = 0
        fixed_assets = 0
        total_assets = total_current_assets + other_assets + fixed_assets

        # Liabilities
        # Accounts Payable: Unpaid bills
        bills = filter_by_basis(Bill.objects.all(), "bill_date")
        total_billed = bills.aggregate(total=Sum("total_amount"))['total'] or 0
        # No bill payments tracked, so all bills are payable
        accounts_payable = total_billed
        # Current Liabilities, Long term liabilities, Other liabilities: Not tracked, set to 0
        current_liabilities = accounts_payable
        long_term_liabilities = 0
        other_liabilities = 0
        total_liabilities = current_liabilities + long_term_liabilities + other_liabilities

        # Equities: Not tracked, set to 0
        equities = 0
        total_liabilities_and_equities = total_liabilities + equities

        return Response({
            "assets": {
                "current_assets": {
                    "cash": float(cash_inflows),
                    "bank": float(cash_inflows),  # No split, treat as same
                    "accounts_receivable": float(accounts_receivable),
                    "other_current_assets": float(other_current_assets),
                    "total_current_assets": float(total_current_assets),
                },
                "other_assets": float(other_assets),
                "fixed_assets": float(fixed_assets),
                "total_assets": float(total_assets),
            },
            "liabilities_and_equities": {
                "liabilities": {
                    "current_liabilities": float(current_liabilities),
                    "long_term_liabilities": float(long_term_liabilities),
                    "other_liabilities": float(other_liabilities),
                    "total_liabilities": float(total_liabilities),
                },
                "equities": float(equities),
                "total_liabilities_and_equities": float(total_liabilities_and_equities),
            },
            "time": time_param,
            "basis": basis,
            "start_date": str(start_date),
            "end_date": str(end_date),
        })
from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from rest_framework.decorators import api_view, permission_classes
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
    )  # No related fields to optimize
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
    queryset = Bill.objects.select_related("vendor").prefetch_related("billitem_set").order_by("-created_at")
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Customers."""

    queryset = Customer.objects.prefetch_related("documents", "contact_persons").order_by("-created_at")
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Invoices."""

    queryset = Invoice.objects.select_related("customer").prefetch_related("item_details", "files").order_by("-created_at")
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class VendorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Vendors."""

    queryset = Vendor.objects.all().order_by("-created_at")  # No related fields to optimize
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


class ItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Items."""

    queryset = Item.objects.all().order_by("-created_at")  # No related fields to optimize
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Payments."""

    queryset = Payment.objects.select_related("invoice").order_by("-created_at")
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


class QuoteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Quotes."""

    queryset = Quote.objects.select_related("customer").prefetch_related("item_details", "quote_files").order_by("-created_at")
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProformaInvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Proforma Invoices."""

    queryset = ProformaInvoice.objects.select_related("customer").prefetch_related("item_details", "proforma_invoice_files").order_by("-created_at")
    serializer_class = ProformaInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class DeliveryChallanViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Delivery Challans."""

    queryset = DeliveryChallan.objects.select_related("customer").prefetch_related("delivery_challan_files").order_by("-created_at")
    serializer_class = DeliveryChallanSerializer
    permission_classes = [permissions.IsAuthenticated]


class InventoryAdjustmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Inventory Adjustments."""

    queryset = InventoryAdjustment.objects.all().order_by("-created_at")  # No related fields to optimize
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]


# Profit and Loss Report API
class ProfitAndLossReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Returns a Profit and Loss report for the given period, basis, and comparison.
        Query params:
          - time: "This Month", "Last Month", "This Year" (default: This Month)
        """
        today = date.today()
        time_param = request.query_params.get("time", "This Month")
        basis = request.query_params.get("basis", "Accrual")
        compare_with = request.query_params.get("compare_with", "None")
        customer_id = request.query_params.get("customer_id")

        def get_range(period, today):
            if period == "This Month":
                start = today.replace(day=1)
                end = today
            elif period == "Last Month":
                first = today.replace(day=1) - timedelta(days=1)
                start = first.replace(day=1)
                end = first
            elif period == "This Year":
                start = today.replace(month=1, day=1)
                end = today
            elif period == "Last Year":
                start = today.replace(year=today.year-1, month=1, day=1)
                end = today.replace(year=today.year-1, month=12, day=calendar.monthrange(today.year-1, 12)[1])
            else:
                return None, None
            return start, end

        start_date, end_date = get_range(time_param, today)
        if not start_date or not end_date:
            return Response({"error": "Invalid time parameter."}, status=400)

        compare_data = None
        if compare_with and compare_with != "None":
            compare_start, compare_end = get_range(compare_with, today)
        else:
            compare_start = compare_end = None

        def get_report(start_date, end_date, summary_only=False, customer_id=None):
            invoice_filter = Q(invoice_date__gte=start_date, invoice_date__lte=end_date)
            if customer_id:
                invoice_filter &= Q(customer_id=customer_id)
            invoices = Invoice.objects.filter(invoice_filter)
            operating_income = invoices.aggregate(total=Sum("total_amount"))['total'] or 0

            bill_filter = Q(bill_date__gte=start_date, bill_date__lte=end_date)
            bills = Bill.objects.filter(bill_filter)
            cost_of_goods_sold = bills.aggregate(total=Sum("total_amount"))['total'] or 0

            gross_profit = operating_income - cost_of_goods_sold
            operating_expense = 0
            operating_profit = gross_profit - operating_expense
            non_operating_income = 0
            non_operating_expense = 0
            net_profit_loss = operating_profit + non_operating_income - non_operating_expense
            payments_total = Payment.objects.filter(date__gte=start_date, date__lte=end_date).aggregate(total=Sum("amount"))['total'] or 0

            if not summary_only:
                invoice_breakdown = [
                    {
                        "id": inv.id,
                        "invoice_number": inv.invoice_number,
                        "date": inv.invoice_date,
                        "customer": inv.customer.display_name,
                        "total_amount": float(inv.total_amount),
                    }
                    for inv in invoices
                ]
                bill_breakdown = [
                    {
                        "id": bill.id,
                        "bill_number": bill.bill_number,
                        "date": bill.bill_date,
                        "vendor": bill.vendor.name,
                        "total_amount": float(bill.total_amount),
                    }
                    for bill in bills
                ]
            else:
                invoice_breakdown = None
                bill_breakdown = None

            return {
                "operating_income": float(operating_income),
                "cost_of_goods_sold": float(cost_of_goods_sold),
                "gross_profit": float(gross_profit),
                "operating_expense": float(operating_expense),
                "operating_profit": float(operating_profit),
                "non_operating_income": float(non_operating_income),
                "non_operating_expense": float(non_operating_expense),
                "net_profit_loss": float(net_profit_loss),
                "payments_received": float(payments_total),
                "invoice_breakdown": invoice_breakdown,
                "bill_breakdown": bill_breakdown,
            }

        summary_only = request.query_params.get("summary_only", "false").lower() == "true"
        main_data = get_report(start_date, end_date, summary_only=summary_only, customer_id=customer_id)
        if compare_start and compare_end:
            compare_data = get_report(compare_start, compare_end, summary_only=summary_only, customer_id=customer_id)

        response = {
            "period": time_param,
            "basis": basis,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "report": main_data,
        }
        if compare_data:
            response["compare_with"] = compare_with
            response["compare_report"] = compare_data
        return Response(response)
