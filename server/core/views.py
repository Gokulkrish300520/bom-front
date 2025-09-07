
# pylint: disable=no-member, import-outside-toplevel, import-self, redefined-outer-name
"""Views for core Django REST API endpoints."""

# Standard library imports
from datetime import date, timedelta
import calendar

# Third-party imports
from django.db.models import Sum, Q
from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

# Local imports
from .models import (
    Bill,
    Customer,
    CustomerDocument,
    DeliveryChallan,
    InventoryAdjustment,
    Invoice,
    Item,
    Payment,
    ProformaInvoice,
    Quote,
    Vendor,
)
from .serializers import (
    BillSerializer,
    CustomerDocumentSerializer,
    CustomerSerializer,
    DeliveryChallanSerializer,
    InventoryAdjustmentSerializer,
    InvoiceSerializer,
    ItemSerializer,
    PaymentSerializer,
    ProformaInvoiceSerializer,
    QuoteSerializer,
    VendorSerializer,
)
class BalanceSheetReportView(APIView):
    """View for generating balance sheet reports."""
    permission_classes = [IsAuthenticated]

    def get(self, request):  # pylint: disable=too-many-arguments,too-many-positional-arguments
        """
        Returns a Balance Sheet report for the given time and basis.
        Query params: time (Today|Yesterday|This Month), basis (Accrual|Cash)
        """
        time_param = request.query_params.get("time", "Today")
        basis = request.query_params.get("basis", "Accrual")
        today = date.today()
        start_date, end_date = self._get_date_range(time_param, today)
        if start_date is None or end_date is None:
            return Response({"error": "Invalid time parameter."}, status=400)

        assets = self._calculate_assets(basis, start_date, end_date)
        liabilities = self._calculate_liabilities(basis, start_date, end_date)
        equities = 0
        total_liabilities_and_equities = liabilities["total_liabilities"] + equities

        return Response({
            "assets": assets,
            "liabilities_and_equities": {
                "liabilities": {
                    "current_liabilities": float(liabilities["current_liabilities"]),
                    "long_term_liabilities": float(liabilities["long_term_liabilities"]),
                    "other_liabilities": float(liabilities["other_liabilities"]),
                    "total_liabilities": float(liabilities["total_liabilities"]),
                },
                "equities": float(equities),
                "total_liabilities_and_equities": float(total_liabilities_and_equities),
            },
            "time": time_param,
            "basis": basis,
            "start_date": str(start_date),
            "end_date": str(end_date),
        })

    def _get_date_range(self, time_param, today):
        if time_param == "Today":
            return today, today
        if time_param == "Yesterday":
            yest = today - timedelta(days=1)
            return yest, yest
        if time_param == "This Month":
            return today.replace(day=1), today
        return None, None

    def _filter_by_basis(self, qs, date_field, basis, start_date, end_date):  # pylint: disable=too-many-arguments,too-many-positional-arguments
        if basis in ("Accrual", "Cash"):
            return qs.filter(
                **{f"{date_field}__gte": start_date, f"{date_field}__lte": end_date}
            )
        return qs.none()

    def _calculate_assets(self, basis, start_date, end_date):
        cash_inflows = (
            self._filter_by_basis(Payment.objects.all(), "date", basis, start_date, end_date)  # pylint: disable=no-member
            .aggregate(total=Sum("amount"))["total"]
            or 0
        )
        invoices = self._filter_by_basis(
            Invoice.objects.all(),
            "invoice_date",
            basis,
            start_date,
            end_date,
        )  # pylint: disable=no-member
        total_invoiced = invoices.aggregate(total=Sum("total_amount"))['total'] or 0
        payments = self._filter_by_basis(
            Payment.objects.all(),
            "date",
            basis,
            start_date,
            end_date,
        )  # pylint: disable=no-member
        total_paid = payments.aggregate(total=Sum("amount"))['total'] or 0
        accounts_receivable = max(total_invoiced - total_paid, 0)
        other_current_assets = 0
        total_current_assets = cash_inflows + accounts_receivable + other_current_assets
        other_assets = 0
        fixed_assets = 0
        total_assets = total_current_assets + other_assets + fixed_assets
        return {
            "current_assets": {
                "cash": float(cash_inflows),
                "bank": float(cash_inflows),
                "accounts_receivable": float(accounts_receivable),
                "other_current_assets": float(other_current_assets),
                "total_current_assets": float(total_current_assets),
            },
            "other_assets": float(other_assets),
            "fixed_assets": float(fixed_assets),
            "total_assets": float(total_assets),
        }

    def _calculate_liabilities(self, basis, start_date, end_date):
        bills = self._filter_by_basis(
            Bill.objects.all(),
            "bill_date",
            basis,
            start_date,
            end_date,
        )  # pylint: disable=no-member
        total_billed = bills.aggregate(total=Sum("total_amount"))['total'] or 0
        accounts_payable = total_billed
        current_liabilities = accounts_payable
        long_term_liabilities = 0
        other_liabilities = 0
        total_liabilities = current_liabilities + long_term_liabilities + other_liabilities
        return {
            "current_liabilities": current_liabilities,
            "long_term_liabilities": long_term_liabilities,
            "other_liabilities": other_liabilities,
            "total_liabilities": total_liabilities,
        }


class CustomerDocumentViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for uploading, retrieving, and updating customer documents (files)."""
    queryset = CustomerDocument.objects.all().order_by("-uploaded_at")  # pylint: disable=no-member,too-many-ancestors
    serializer_class = CustomerDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]


    def retrieve(self, request, *args, **kwargs) -> Response:
        """Return file metadata as JSON if ?meta=1, else stream file content."""
        instance = self.get_object()
        if request.query_params.get("meta") == "1":
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
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
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class BillViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Bills."""
    queryset = (
    Bill.objects.select_related("vendor")  # pylint: disable=no-member,too-many-ancestors
        .prefetch_related("billitem_set")
        .order_by("-created_at")
    )
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]


class CustomerViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Customers."""
    queryset = (
    Customer.objects.prefetch_related("documents", "contact_persons")  # pylint: disable=no-member,too-many-ancestors
        .order_by("-created_at")
    )
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]


class InvoiceViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Invoices."""
    queryset = (
    Invoice.objects.select_related("customer")  # pylint: disable=no-member,too-many-ancestors
        .prefetch_related("item_details", "files")
        .order_by("-created_at")
    )
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class VendorViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Vendors."""
    queryset = Vendor.objects.all().order_by("-created_at")  # pylint: disable=no-member,too-many-ancestors
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


class ItemViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Items."""
    queryset = Item.objects.all().order_by("-created_at")  # pylint: disable=no-member,too-many-ancestors
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaymentViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Payments."""
    queryset = Payment.objects.select_related("invoice").order_by("-created_at")  # pylint: disable=no-member,too-many-ancestors
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


class QuoteViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Quotes."""
    queryset = (
    Quote.objects.select_related("customer")  # pylint: disable=no-member,too-many-ancestors
        .prefetch_related("item_details", "quote_files")
        .order_by("-created_at")
    )
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProformaInvoiceViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Proforma Invoices."""
    queryset = (
    ProformaInvoice.objects.select_related("customer")  # pylint: disable=no-member,too-many-ancestors
        .prefetch_related("item_details", "proforma_invoice_files")
        .order_by("-created_at")
    )
    serializer_class = ProformaInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class DeliveryChallanViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Delivery Challans."""
    queryset = (
    DeliveryChallan.objects.select_related("customer")  # pylint: disable=no-member,too-many-ancestors
        .prefetch_related("delivery_challan_files")
        .order_by("-created_at")
    )
    serializer_class = DeliveryChallanSerializer
    permission_classes = [permissions.IsAuthenticated]


class InventoryAdjustmentViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Inventory Adjustments."""
    queryset = InventoryAdjustment.objects.all().order_by("-created_at")  # pylint: disable=no-member,too-many-ancestors
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]


    #
class ProfitAndLossReportView(APIView):
    """View for generating Profit and Loss reports for a given period and basis."""
    permission_classes = [IsAuthenticated]

    def get(self, request):  # pylint: disable=too-many-arguments,too-many-positional-arguments,too-many-locals
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

        start_date, end_date = self._get_range(time_param, today)
        if not start_date or not end_date:
            return Response({"error": "Invalid time parameter."}, status=400)

        compare_start, compare_end = (None, None)
        if compare_with and compare_with != "None":
            compare_start, compare_end = self._get_range(compare_with, today)

        summary_only = request.query_params.get("summary_only", "false").lower() == "true"
        main_data = self._get_report(
            start_date,
            end_date,
            summary_only=summary_only,
            customer_id=customer_id,
        )
        compare_data = None
        if compare_start and compare_end:
            compare_data = self._get_report(
                compare_start,
                compare_end,
                summary_only=summary_only,
                customer_id=customer_id,
            )

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

    def _get_range(self, period, today):
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
            end = today.replace(
                year=today.year-1,
                month=12,
                day=calendar.monthrange(today.year-1, 12)[1],
            )
        else:
            return None, None
        return start, end

    def _get_report(self, start_date, end_date, summary_only=False, customer_id=None):  # pylint: disable=too-many-locals
        invoice_filter = Q(invoice_date__gte=start_date, invoice_date__lte=end_date)
        if customer_id:
            invoice_filter &= Q(customer_id=customer_id)
        invoices = Invoice.objects.filter(invoice_filter)  # pylint: disable=no-member
        operating_income = invoices.aggregate(total=Sum("total_amount"))['total'] or 0

        bill_filter = Q(bill_date__gte=start_date, bill_date__lte=end_date)
        bills = Bill.objects.filter(bill_filter)  # pylint: disable=no-member
        cost_of_goods_sold = bills.aggregate(total=Sum("total_amount"))['total'] or 0

        gross_profit = operating_income - cost_of_goods_sold
        operating_expense = 0
        operating_profit = gross_profit - operating_expense
        non_operating_income = 0
        non_operating_expense = 0
        net_profit_loss = operating_profit + non_operating_income - non_operating_expense
        payments_total = (
            Payment.objects.filter(date__gte=start_date, date__lte=end_date)  # pylint: disable=no-member
            .aggregate(total=Sum("amount"))["total"]
            or 0
        )

        invoice_breakdown = None
        bill_breakdown = None
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
        
from rest_framework.decorators import api_view, permission_classes
from django.core.mail import EmailMessage
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_report_email(request):
    """
    Expects JSON body with:
    - recipient_email: string
    - subject: string (optional)
    - report_data: JSON (summary + invoice + bill breakdowns)
    """
    
    recipient = request.data.get('recipient_email')
    subject = request.data.get('subject', 'Profit and Loss Report')
    report_data = request.data.get('report_data')

    if not recipient or not report_data:
        return Response({'error': 'recipient_email and report_data are required'}, status=400)

    body = f"Profit and Loss Report\n\n{json.dumps(report_data, indent=2)}"

    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=None,
        to=[recipient],
    )

    try:
        email.send()
        return Response({'message': 'Email sent successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)