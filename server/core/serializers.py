from rest_framework import serializers
from .models import (
    Customer,
    Invoice,
    Vendor,
    Item,
    Payment,
    Quote,
    ProformaInvoice,
    DeliveryChallan,
    CustomerDocument,
    ContactPerson,
    QuoteItem,
    ProformaInvoiceItem,
    InvoiceItem,
    DeliveryChallanItem,
    Bill,
    BillItem,
)


class CustomerDocumentSerializer(serializers.ModelSerializer):

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 10MB.")
        return value
    """
    Serializer for CustomerDocument model, handles file upload and metadata.
    """

    class Meta:
        model = CustomerDocument
        fields = ["id", "file", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class ContactPersonSerializer(serializers.ModelSerializer):
    """Serializer for ContactPerson model."""

    class Meta:
        model = ContactPerson
        fields = [
            "id",
            "salutation",
            "first_name",
            "last_name",
            "email",
            "work_phone",
            "mobile",
        ]
        read_only_fields = ["id"]


class ItemSerializer(serializers.ModelSerializer):
    """Serializer for Item model."""

    class Meta:
        model = Item
        fields = ["id", "name", "description", "price", "sku", "created_at"]
        read_only_fields = ["id", "created_at"]


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor model."""

    class Meta:
        model = Vendor
        fields = [
            "id",
            "name",
            "email",
            "company_name",
            "address",
            "phone",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BillItemSerializer(serializers.ModelSerializer):
    """Serializer for BillItem model, includes item details."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(),
        source="item",
        write_only=True,
    )

    class Meta:
        model = BillItem
        fields = [
            "id",
            "bill",
            "item",
            "item_id",
            "description",
            "quantity",
            "rate",
            "amount",
        ]
        read_only_fields = ["id", "bill", "item", "amount"]


class BillSerializer(serializers.ModelSerializer):
    """Serializer for Bill model, includes vendor and item details."""

    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(),
        source="vendor",
        write_only=True,
    )
    item_details = BillItemSerializer(
        many=True,
        read_only=True,
        source="billitem_set",
    )

    class Meta:
        model = Bill
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "bill_number",
            "bill_date",
            "due_date",
            "item_details",
            "total_amount",
            "status",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "vendor", "item_details"]


class DeliveryChallanItemSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryChallanItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(),
        source="item",
        write_only=True,
    )

    class Meta:
        model = DeliveryChallanItem
        fields = ["id", "item", "item_id", "quantity", "rate", "amount"]
        read_only_fields = ["id", "item", "amount"]


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for InvoiceItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(),
        source="item",
        write_only=True,
    )

    class Meta:
        model = InvoiceItem
        fields = ["id", "item", "item_id", "quantity", "rate", "amount"]
        read_only_fields = ["id", "item", "amount"]


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for Customer model, includes documents and contact persons.
    """

    documents = CustomerDocumentSerializer(many=True, read_only=True)
    contact_persons = ContactPersonSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "customer_type",
            "salutation",
            "first_name",
            "last_name",
            "company_name",
            "display_name",
            "email",
            "work_phone",
            "mobile",
            "pan",
            "currency",
            "opening_balance",
            "payment_terms",
            "documents",
            "billing_attention",
            "billing_country",
            "billing_street1",
            "billing_street2",
            "billing_city",
            "billing_state",
            "billing_pin_code",
            "billing_phone",
            "billing_fax",
            "shipping_attention",
            "shipping_country",
            "shipping_street1",
            "shipping_street2",
            "shipping_city",
            "shipping_state",
            "shipping_pin_code",
            "shipping_phone",
            "shipping_fax",
            "contact_persons",
            "custom_fields",
            "tags",
            "remarks",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "documents", "contact_persons"]


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model, includes customer, items, and files."""

    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True,
    )
    item_details = InvoiceItemSerializer(many=True, read_only=True)
    files = CustomerDocumentSerializer(many=True, read_only=True)
    file_ids = serializers.PrimaryKeyRelatedField(
        queryset=CustomerDocument.objects.all(),
        source="files",
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = Invoice
        fields = [
            "id",
            "customer",
            "customer_id",
            "invoice_number",
            "order_number",
            "invoice_date",
            "item_details",
            "customer_notes",
            "terms_and_conditions",
            "total_amount",
            "files",
            "file_ids",
            "created_at",
        ]
        read_only_fields = [
            "id", "created_at", "customer", "item_details", "files"
        ]


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model, includes invoice details."""

    invoice = serializers.SerializerMethodField(read_only=True)
    invoice_id = serializers.PrimaryKeyRelatedField(
        queryset=Invoice.objects.all(),
        source="invoice",
        write_only=True,
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "invoice",
            "invoice_id",
            "amount",
            "date",
            "method",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "invoice"]

    def get_invoice(self, obj: Payment) -> dict:
        """Returns serialized invoice data for the payment."""
        from .serializers import InvoiceSerializer

        return InvoiceSerializer(obj.invoice).data if obj.invoice else None


class QuoteItemSerializer(serializers.ModelSerializer):
    """Serializer for QuoteItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(),
        source="item",
        write_only=True,
    )

    class Meta:
        model = QuoteItem
        fields = ["id", "item", "item_id", "quantity", "rate", "amount"]
        read_only_fields = ["id", "item", "amount"]


class QuoteSerializer(serializers.ModelSerializer):
    """Serializer for Quote model, includes customer and item details."""

    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True,
    )
    item_details = QuoteItemSerializer(many=True, read_only=True)

    class Meta:
        model = Quote
        fields = [
            "id",
            "customer",
            "customer_id",
            "quote_number",
            "reference_number",
            "quote_date",
            "expiry_date",
            "salesperson",
            "project_name",
            "subject",
            "item_details",
            "customer_notes",
            "terms_and_conditions",
            "subtotal",
            "discount",
            "tax_type",
            "tax_percentage",
            "adjustment",
            "total_amount",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "customer", "item_details"]


class ProformaInvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for ProformaInvoiceItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(),
        source="item",
        write_only=True,
    )

    class Meta:
        model = ProformaInvoiceItem
        fields = ["id", "item", "item_id", "quantity", "rate", "amount"]
        read_only_fields = ["id", "item", "amount"]


class ProformaInvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for ProformaInvoice model, includes customer and item details.
    """

    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True,
    )
    item_details = ProformaInvoiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = ProformaInvoice
        fields = [
            "id",
            "customer",
            "customer_id",
            "invoice_number",
            "reference_number",
            "invoice_date",
            "expiry_date",
            "salesperson",
            "project_name",
            "subject",
            "item_details",
            "customer_notes",
            "terms_and_conditions",
            "subtotal",
            "discount",
            "tax_type",
            "tax_percentage",
            "adjustment",
            "total_amount",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "customer", "item_details"]


class DeliveryChallanSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True,
    )
    item_details = DeliveryChallanItemSerializer(many=True, read_only=True)

    class Meta:
        model = DeliveryChallan
        fields = [
            "id",
            "customer",
            "customer_id",
            "challan_number",
            "reference_number",
            "date",
            "challan_type",
            "item_details",
            "total_amount",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "customer", "item_details"]


class InventoryAdjustmentSerializer(serializers.ModelSerializer):

    pass
