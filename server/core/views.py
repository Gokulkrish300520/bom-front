from .serializers import (
    BillSerializer,
    CustomerDocumentSerializer,
    CustomerSerializer,
    DeliveryChallanSerializer,
    InvoiceSerializer,
    ItemSerializer,
    PaymentSerializer,
    ProformaInvoiceSerializer,
    QuoteSerializer,
    VendorSerializer,
    DealSerializer,
    FreightSerializer,
    ImportBillSerializer,
    DutySerializer,
    GstSerializer,
    NonGstSerializer,
    BillorderSerializer,
    PaymentTransactionSerializer,
    PendingTransactionSerializer
)
from .filters_extra import (
    InvoiceFilter,
    ProformaInvoiceFilter,
    DeliveryChallanFilter,
    BillFilter,
    DealFilter,
    FreightFilter,
    VendorFilter,
    ImportBillFilter,
    DutyFilter,
    GstFilter,
    NonGstFilter,
    BillorderFilter,
    TransactionFilter
)
from .filters import QuoteFilter
from .models import (
    Bill,
    Customer,
    CustomerDocument,
    DeliveryChallan,
    Invoice,
    Item,
    Payment,
    ProformaInvoice,
    Quote,
    Vendor,
    Deal,
)
from .purchase_models import Freight,ImportBill,Duty,Gst,NonGst,Billorder,PaymentTransaction
from django.db.models import F
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, status
from django.db.models import Sum, Q
import calendar
from datetime import date, timedelta
from .inventory_management_models import InventoryManagement
from .serializers import InventoryManagementSerializer
import io
import json
import xlsxwriter
from django.core.mail import EmailMessage
from django.http import JsonResponse
from django.contrib.auth.models import User
from .serializers import ProfitLossSerializer
from .utils import calculate_profit_and_loss
from django.shortcuts import get_object_or_404

class PaymentTransactionViewSet(viewsets.ModelViewSet):
    queryset = PaymentTransaction.objects.all().order_by('-paid_on')
    serializer_class = PaymentTransactionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionFilter
    ordering_fields = ['paid_on', 'amount']
    ordering = ['-paid_on']

class PendingTransactionsList(generics.ListAPIView):
    serializer_class = PendingTransactionSerializer

    def get_queryset(self):
        # use the optimized pending manager
        return PaymentTransaction.objects.pending().select_related(
            'content_type', 'created_by'
        )
        
class NewProfitAndLossReportView(APIView):
    def get(self, request):
        deal_id = request.query_params.get('deal_id')
        customer_id = request.query_params.get('customer_id')

        deal = get_object_or_404(Deal, id=deal_id) if deal_id else None
        customer = get_object_or_404(Customer, id=customer_id) if customer_id else None

        data = calculate_profit_and_loss(deal=deal, customer=customer)

        serializer = ProfitLossSerializer(data=data)
        if serializer.is_valid():
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    role = "Admin" if user.is_superuser else "Staff" if user.is_staff else "User"
    return Response({
        "id": user.id,
        "username": user.username,
        "full_name": f"{user.first_name} {user.last_name}".strip(),
        "email": user.email,
        "role": role,
    })


# ...existing code...
class GstViewSet(viewsets.ModelViewSet):
    queryset = Gst.objects.all().order_by('-date', '-created_at')
    serializer_class = GstSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = GstFilter

    ordering_fields = ['date', 'total_amount', 'created_at']
    ordering = ['-date']

class NonGstViewSet(viewsets.ModelViewSet):
    queryset = NonGst.objects.all().order_by('-date', '-created_at')
    serializer_class = NonGstSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = NonGstFilter

    ordering_fields = ['date', 'total_amount', 'created_at']
    ordering = ['-date']

class FreightViewSet(viewsets.ModelViewSet):
    queryset = Freight.objects.all().order_by('-date', '-created_at')
    serializer_class = FreightSerializer
    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True  # ✅ allow partial update
        return super().update(request, *args, **kwargs)

    filter_backends = [DjangoFilterBackend]
    filterset_class = FreightFilter

    ordering_fields = ['date', 'total_amount', 'created_at']
    ordering = ['-date']
    
class ImportBillViewSet(viewsets.ModelViewSet):
    queryset = ImportBill.objects.all().order_by('-date', '-created_at')
    serializer_class = ImportBillSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = ImportBillFilter

    ordering_fields = ['date', 'total_amount', 'created_at']
    ordering = ['-date']
    
class DutyViewSet(viewsets.ModelViewSet):
    queryset = Duty.objects.all().order_by('-date', '-created_at')
    serializer_class = DutySerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = DutyFilter

    ordering_fields = ['date', 'total_amount', 'created_at']
    ordering = ['-date']

class BillorderViewSet(viewsets.ModelViewSet):

    queryset = Billorder.objects.all().order_by('-bill_date', '-created_at')
    serializer_class = BillorderSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = BillorderFilter
    ordering_fields = ['bill_date', 'total_amount', 'created_at']
    ordering = ['-bill_date']

    def get_queryset(self):
        return super().get_queryset().distinct()


class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.all().order_by('id')
    serializer_class = DealSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Optional: filter deals by customer via query param
    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer_id')
        if customer_id is not None:
            queryset = queryset.filter(customer__id=customer_id)
        return queryset
class InventoryManagementViewSet(viewsets.ModelViewSet):
    queryset = InventoryManagement.objects.all()
    serializer_class = InventoryManagementSerializer
    permission_classes = [permissions.IsAuthenticated]

class BalanceSheetReportView(APIView):
    """View for generating balance sheet reports."""

    permission_classes = [IsAuthenticated]

    def get(
        self, request
    ):  # pylint: disable=too-many-arguments,too-many-positional-arguments
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
        total_liabilities_and_equities = (
            liabilities["total_liabilities"] + equities
        )

        return Response(
            {
                "assets": assets,
                "liabilities_and_equities": {
                    "liabilities": {
                        "current_liabilities": float(
                            liabilities["current_liabilities"]
                        ),
                        "long_term_liabilities": float(
                            liabilities["long_term_liabilities"]
                        ),
                        "other_liabilities": float(
                            liabilities["other_liabilities"]
                        ),
                        "total_liabilities": float(
                            liabilities["total_liabilities"]
                        ),
                    },
                    "equities": float(equities),
                    "total_liabilities_and_equities": float(
                        total_liabilities_and_equities
                    ),
                },
                "time": time_param,
                "basis": basis,
                "start_date": str(start_date),
                "end_date": str(end_date),
            }
        )

    def _get_date_range(self, time_param, today):
        if time_param == "Today":
            return today, today
        if time_param == "Yesterday":
            yest = today - timedelta(days=1)
            return yest, yest
        if time_param == "This Month":
            return today.replace(day=1), today
        return None, None

    def _filter_by_basis(
        self, qs, date_field, basis, start_date, end_date
    ):  # pylint: disable=too-many-arguments,too-many-positional-arguments
        if basis in ("Accrual", "Cash"):
            return qs.filter(
                **{
                    f"{date_field}__gte": start_date,
                    f"{date_field}__lte": end_date,
                }
            )
        return qs.none()

    def _calculate_assets(self, basis, start_date, end_date):
        cash_inflows = (
            self._filter_by_basis(
                Payment.objects.all(), "date", basis, start_date, end_date
            ).aggregate(  # pylint: disable=no-member
                total=Sum("amount")
            )[
                "total"
            ]
            or 0
        )
        invoices = self._filter_by_basis(
            Invoice.objects.all(),
            "invoice_date",
            basis,
            start_date,
            end_date,
        )  # pylint: disable=no-member
        total_invoiced = invoices.aggregate(
            total=Sum("total_amount"))["total"] or 0
        payments = self._filter_by_basis(
            Payment.objects.all(),
            "date",
            basis,
            start_date,
            end_date,
        )  # pylint: disable=no-member
        total_paid = payments.aggregate(total=Sum("amount"))["total"] or 0
        accounts_receivable = max(total_invoiced - total_paid, 0)
        other_current_assets = 0
        total_current_assets = (
            cash_inflows + accounts_receivable + other_current_assets
        )
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
        total_billed = bills.aggregate(total=Sum("total_amount"))["total"] or 0
        accounts_payable = total_billed
        current_liabilities = accounts_payable
        long_term_liabilities = 0
        other_liabilities = 0
        total_liabilities = (
            current_liabilities + long_term_liabilities + other_liabilities
        )
        return {
            "current_liabilities": current_liabilities,
            "long_term_liabilities": long_term_liabilities,
            "other_liabilities": other_liabilities,
            "total_liabilities": total_liabilities,
        }


class CustomerDocumentViewSet(
    viewsets.ModelViewSet
):  # pylint: disable=too-many-ancestors

    """
    ViewSet for uploading, retrieving, and updating customer
    documents (files).
    """

    queryset = CustomerDocument.objects.all().order_by(
        "-uploaded_at"
    )  # pylint: disable=no-member,too-many-ancestors
    serializer_class = CustomerDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    # No filterset_class for CustomerDocumentViewSet
    parser_classes = [MultiPartParser, FormParser]

    def retrieve(self, request, *args, **kwargs) -> Response:
        """
        Return file metadata as JSON if ?meta=1, else stream file content.
        """
        from django.http import FileResponse

        instance = self.get_object()
        if request.query_params.get("meta") == "1":
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        file_handle = instance.file.open("rb")
        response = FileResponse(file_handle, as_attachment=False)
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
            instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class BillViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Bills."""

    queryset = (
        Bill.objects.select_related(
            "vendor"
        )  # pylint: disable=no-member,too-many-ancestors
        .prefetch_related("item_details")
        .order_by("-created_at")
    )
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = BillFilter
    
class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.all()
    serializer_class = DealSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = DealFilter


class CustomerViewSet(
    viewsets.ModelViewSet
):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Customers."""

    queryset = Customer.objects.prefetch_related(
        "documents", "contact_persons"
    ).order_by(  # pylint: disable=no-member,too-many-ancestors
        "-created_at"
    )
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]


class InvoiceViewSet(
    viewsets.ModelViewSet
):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Invoices."""

    queryset = (
        Invoice.objects.select_related(
            "customer"
        )  # pylint: disable=no-member,too-many-ancestors
        .prefetch_related("item_details", "files")
        .order_by("-created_at")
    )
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = InvoiceFilter


class VendorViewSet(
    viewsets.ModelViewSet
):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Vendors."""

    queryset = Vendor.objects.all().order_by(
        "-created_at"
    )  # pylint: disable=no-member,too-many-ancestors
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = VendorFilter


class ItemViewSet(viewsets.ModelViewSet):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Items."""

    queryset = Item.objects.all().order_by(
        "-created_at"
    )  # pylint: disable=no-member,too-many-ancestors
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
class ItemStock(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        low_stock_items = Item.objects.annotate(
            stock_diff=F('opening_stock') + F('current_stock')
        ).filter(stock_diff__lt=F('reorder_point'))

        print(f"Low stock items count: {low_stock_items.count()}")
        for item in low_stock_items:
            print(f"Item: {item.name}, Stock diff: {item.stock_diff}")

        serializer = ItemSerializer(low_stock_items, many=True)
        return Response(serializer.data)



class PaymentViewSet(
    viewsets.ModelViewSet
):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Payments."""

    queryset = Payment.objects.select_related("invoice").order_by(
        "-created_at"
    )  # pylint: disable=no-member,too-many-ancestors
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


class QuoteViewSet(
    viewsets.ModelViewSet
):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Quotes."""

    queryset = (
        Quote.objects.select_related("customer")
        .prefetch_related("item_details", "quote_files")
        .order_by("-created_at")
    )
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = QuoteFilter


class ProformaInvoiceViewSet(
    viewsets.ModelViewSet
):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Proforma Invoices."""

    queryset = (
        ProformaInvoice.objects.select_related(
            "customer"
        )  # pylint: disable=no-member,too-many-ancestors
        .prefetch_related("item_details", "proforma_invoice_files")
        .order_by("-created_at")
    )
    serializer_class = ProformaInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProformaInvoiceFilter


class DeliveryChallanViewSet(
    viewsets.ModelViewSet
):  # pylint: disable=too-many-ancestors
    """ViewSet for managing Delivery Challans."""

    queryset = (
        DeliveryChallan.objects.select_related(
            "customer"
        )  # pylint: disable=no-member,too-many-ancestors
        .prefetch_related("delivery_challan_files")
        .order_by("-created_at")
    )
    serializer_class = DeliveryChallanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = DeliveryChallanFilter


class ProfitAndLossReportView(APIView):
    """
    View for generating Profit and Loss reports for a given period
    and basis.
    """

    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
    ):
        # pylint: disable=too-many-arguments
        # pylint: disable=too-many-positional-arguments
        # pylint: disable=too-many-locals
        # Docstring temporarily removed to debug persistent E501 error.
        today = date.today()
        time_param = request.query_params.get(
            "time", "This Month"
        )
        basis = request.query_params.get(
            "basis", "Accrual"
        )
        compare_with = request.query_params.get(
            "compare_with", "None"
        )
        customer_id = request.query_params.get(
            "customer_id"
        )
        vendor_id = request.query_params.get(
            "vendor_id"
        )
        start_date, end_date = self._get_range(
            time_param, today
        )
        if not start_date or not end_date:
            return Response(
                {"error": "Invalid time parameter."}, status=400
            )
        compare_start, compare_end = (None, None)
        if compare_with and compare_with != "None":
            compare_start, compare_end = self._get_range(
                compare_with, today
            )
        summary_only = (
            request.query_params.get(
                "summary_only", "false"
            ).lower() == "true"
        )
        main_data = self._get_report(
            start_date,
            end_date,
            summary_only=summary_only,
            customer_id=customer_id,
            vendor_id=vendor_id,
        )
        compare_data = None
        if compare_start and compare_end:
            compare_data = self._get_report(
                compare_start,
                compare_end,
                summary_only=summary_only,
                customer_id=customer_id,
                vendor_id=vendor_id,
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
            start = today.replace(year=today.year - 1, month=1, day=1)
            end = today.replace(
                year=today.year - 1,
                month=12,
                day=calendar.monthrange(today.year - 1, 12)[1],
            )
        else:
            return None, None
        return start, end

    def _get_report(
        self,
        start_date,
        end_date,
        summary_only=False,
        customer_id=None,
        vendor_id=None
    ):  # pylint: disable=too-many-locals
        invoice_filter = Q(
            invoice_date__gte=start_date,
            invoice_date__lte=end_date
        )
        if customer_id:
            invoice_filter &= Q(customer_id=customer_id)
        invoices = Invoice.objects.filter(
            invoice_filter)  # pylint: disable=no-member
        operating_income = invoices.aggregate(
            total=Sum("total_amount"))["total"] or 0

        bill_filter = Q(bill_date__gte=start_date, bill_date__lte=end_date)
        if vendor_id:
            bill_filter &= Q(vendor_id=vendor_id)
        bills = Bill.objects.filter(bill_filter)  # pylint: disable=no-member
        cost_of_goods_sold = (
            bills.aggregate(total=Sum("total_amount"))["total"] or 0
        )

        gross_profit = operating_income - cost_of_goods_sold
        operating_expense = 0
        operating_profit = gross_profit - operating_expense
        non_operating_income = 0
        non_operating_expense = 0
        net_profit_loss = (
            operating_profit + non_operating_income - non_operating_expense
        )
        payments_total = (
            Payment.objects.filter(
                date__gte=start_date, date__lte=end_date
            ).aggregate(  # pylint: disable=no-member
                total=Sum("amount")
            )["total"]
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
                    "vendor": bill.vendor.display_name,
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

    try:
        # Generate Excel file in memory
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet("Report")

        # Get headers from first row of Account
        headers = list(report_data["Account"][0].keys())
        for col, header in enumerate(headers):
            worksheet.write(0, col, header)

        # Write each row
        for row, item in enumerate(report_data["Account"], start=1):
            for col, header in enumerate(headers):
                worksheet.write(row, col, item.get(header, ""))

        workbook.close()
        output.seek(0)

        # Create email with attachment
        email = EmailMessage(
            subject,
            "Please find attached your Profit and Loss report.",
            to=[recipient],
        )
        email.attach("profit_and_loss_report.xlsx", output.read(), "application/vnd.ms-excel")
        email.send()

        return JsonResponse({"message": "Email sent successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
import boto3
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import boto3

class GeneratePresignedUrlView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_name = request.data.get("file_name")
        file_type = request.data.get("file_type")

        if not file_name or not file_type:
            return Response({"error": "file_name and file_type required"}, status=400)

        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )

        presigned_post = s3_client.generate_presigned_post(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=file_name,
            Fields={"Content-Type": file_type},
            Conditions=[{"Content-Type": file_type}],
            ExpiresIn=3600,
        )

        return Response({"url": presigned_post["url"], "fields": presigned_post["fields"]})
    

from django.template.loader import render_to_string
from django.http import HttpResponse, HttpResponseBadRequest
from weasyprint import HTML
from rest_framework.views import APIView
import json
@permission_classes([IsAuthenticated])
class GenerateDocumentPdfView(APIView):
    def post(self, request):
        try:
            data = request.data
            doc_type = data.get('document_type', '').lower()
            doc_data = data.get('document_data', {})

            if doc_type not in ['quote', 'invoice', 'proforma', 'delivery_challan']:
                return HttpResponseBadRequest("Invalid document type.")

            context = {
                'document_type': doc_type,
                'document_number_label': {
                    'quote': 'Quote #',
                    'invoice': 'Invoice #',
                    'proforma': 'Proforma Invoice #',
                    'delivery_challan': 'Challan #'
                }.get(doc_type, 'Document #'),
                'document_date_label': {
                    'quote': 'Quote Date',
                    'invoice': 'Invoice Date',
                    'proforma': 'Proforma Date',
                    'delivery_challan': 'Challan Date'
                }.get(doc_type, 'Date'),

                # Map your actual data fields here
                'document_number': doc_data.get('document_number', ''),
                'document_date': doc_data.get('document_date', ''),
                'billing_info': doc_data.get('billing_info', {}),
                'shipping_info': doc_data.get('shipping_info', {}),
                'place_of_supply': doc_data.get('place_of_supply', ''),
                'items': doc_data.get('items', []),
                'totals': doc_data.get('totals', {}),
                'total_in_words': doc_data.get('total_in_words', ''),
                'notes': doc_data.get('notes', []),
                'bank_details': doc_data.get('bank_details', {}),
            }

            html_string = render_to_string('pdf/pdf_template.html', context)

            pdf_file = HTML(string=html_string).write_pdf()

            response = HttpResponse(pdf_file, content_type='application/pdf')
            filename = f"{doc_type}_{context['document_number'] or 'document'}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return HttpResponseBadRequest(f"Error generating PDF: {e}")
