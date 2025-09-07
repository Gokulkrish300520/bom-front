"""Serializers for core Django models."""

from rest_framework import serializers
from .models import (
    Bill, BillItem, ContactPerson, Customer, CustomerDocument, DeliveryChallan,
    DeliveryChallanItem, Invoice, InvoiceItem, Item, Payment, ProformaInvoice,
    ProformaInvoiceItem, Quote, QuoteItem, Vendor
)

class CustomerDocumentSerializer(serializers.ModelSerializer):
    """Serializer for CustomerDocument model, handles file upload and metadata."""
    def validate_file(self, value):
        """Validate that the uploaded file is under the maximum allowed size."""
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 10MB.")
        return value
    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for CustomerDocumentSerializer."""
        model = CustomerDocument
        fields = ["id", "file", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]



class ContactPersonSerializer(serializers.ModelSerializer):

    """Serializer for ContactPerson model."""
    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for ContactPersonSerializer."""
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
    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for ItemSerializer."""
        model = Item
        fields = ["id", "name", "description", "price", "sku", "created_at"]
        read_only_fields = ["id", "created_at"]


class VendorSerializer(serializers.ModelSerializer):

    """Serializer for Vendor model."""
    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for VendorSerializer."""
        model = Vendor
        fields = [
            "id", "name", "email", "company_name", "address", "phone", "created_at"
        ]
        read_only_fields = ["id", "created_at"]



class BillItemSerializer(serializers.ModelSerializer):
    """Serializer for BillItem model, includes item details."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Item.objects.all(), source="item", write_only=True  # pylint: disable=no-member
    )

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for BillItemSerializer."""
        model = BillItem
        fields = [
            "id", "bill", "item", "item_id", "description", "quantity", "rate", "amount"
        ]
    read_only_fields = ["id", "item", "amount"]



class BillSerializer(serializers.ModelSerializer):
    """Serializer for Bill model, includes vendor and item details."""

    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Vendor.objects.all(), source="vendor", write_only=True  # pylint: disable=no-member
    )
    item_details = BillItemSerializer(many=True, read_only=True, source="billitem_set")

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for BillSerializer."""
        model = Bill
        fields = [
            "id", "vendor", "vendor_id", "bill_number", "bill_date", "due_date",
            "item_details", "total_amount", "status", "notes", "created_at"
        ]
    read_only_fields = ["id", "created_at", "vendor", "item_details"]



class DeliveryChallanItemSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryChallanItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Item.objects.all(), source="item", write_only=True  # pylint: disable=no-member
    )

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for DeliveryChallanItemSerializer."""
        model = DeliveryChallanItem
        fields = [
            "id", "item", "item_id", "quantity", "rate", "amount"
        ]
    read_only_fields = ["id", "item", "amount"]



class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for InvoiceItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Item.objects.all(), source="item", write_only=True  # pylint: disable=no-member
    )

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for InvoiceItemSerializer."""
        model = InvoiceItem
        fields = [
            "id", "item", "item_id", "quantity", "rate", "amount"
        ]
    read_only_fields = ["id", "item", "amount"]


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for Customer model, includes documents and contact persons.
    """

    documents = CustomerDocumentSerializer(many=True, read_only=True)
    contact_persons = ContactPersonSerializer(many=True, required=False)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for CustomerSerializer."""
        model = Customer
        fields = [
            "id", "customer_type", "salutation", "first_name", "last_name", "company_name",
            "display_name", "email", "work_phone", "mobile", "pan", "currency",
            "opening_balance", "payment_terms", "documents", "billing_attention",
            "billing_country", "billing_street1", "billing_street2", "billing_city",
            "billing_state", "billing_pin_code", "billing_phone", "billing_fax",
            "shipping_attention", "shipping_country", "shipping_street1", "shipping_street2",
            "shipping_city", "shipping_state", "shipping_pin_code", "shipping_phone",
            "shipping_fax", "contact_persons", "custom_fields", "tags", "remarks",
            "created_at"
        ]
    read_only_fields = ["id", "created_at", "documents"]

    def create(self, validated_data):
        contact_persons_data = validated_data.pop("contact_persons", [])
        customer = super().create(validated_data)
        for cp_data in contact_persons_data:
            ContactPerson.objects.create(customer=customer, **cp_data)  # pylint: disable=no-member
        return customer

    def update(self, instance, validated_data):
        contact_persons_data = validated_data.pop("contact_persons", None)
        instance = super().update(instance, validated_data)
        if contact_persons_data is not None:
            # Remove existing contact persons
            instance.contact_persons.all().delete()
            # Add new contact persons
            for cp_data in contact_persons_data:
                ContactPerson.objects.create(
                    customer=instance,
                    **cp_data
                )  # pylint: disable=no-member
        return instance



class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model, includes customer, files, and item details."""
    invoice_file_ids = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),  # pylint: disable=no-member
        source="invoice_files",
        many=True,
        required=False,
        write_only=True,
    )
    invoice_files = CustomerDocumentSerializer(many=True, read_only=True)
    attached_file_ids = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),  # pylint: disable=no-member
        source="files",
        many=True,
        required=False,
        write_only=True,
    )
    attached_files = CustomerDocumentSerializer(many=True, read_only=True, source="files")

    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
    queryset=Customer.objects.all(),
    source="customer",
    write_only=True  # pylint: disable=no-member
    )
    item_details = InvoiceItemSerializer(many=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for InvoiceSerializer."""
        model = Invoice
        fields = [
            "id", "customer", "customer_id", "invoice_number", "order_number",
            "invoice_date", "item_details", "customer_notes", "terms_and_conditions",
            "total_amount", "attached_files", "attached_file_ids", "invoice_files",
            "invoice_file_ids", "created_at"
        ]
    read_only_fields = ["id", "created_at", "customer", "attached_files", "invoice_files"]

    def create(self, validated_data):
        item_details_data = validated_data.pop("item_details", [])
        invoice_files = validated_data.pop("invoice_files", [])
        attached_files = validated_data.pop("files", [])
        invoice = super().create(validated_data)
        if invoice_files:
            invoice.invoice_files.set(invoice_files)
        if attached_files:
            invoice.files.set(attached_files)
        for item_data in item_details_data:
            if "amount" not in item_data:
                item_data["amount"] = item_data.get("quantity", 0) * item_data.get("rate", 0)
            InvoiceItem.objects.create(invoice=invoice, **item_data)  # pylint: disable=no-member
        return invoice

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop("item_details", None)
        invoice_files = validated_data.pop("invoice_files", None)
        attached_files = validated_data.pop("files", None)
        invoice = super().update(instance, validated_data)
        if invoice_files is not None:
            invoice.invoice_files.set(invoice_files)
        if attached_files is not None:
            invoice.files.set(attached_files)
        if item_details_data is not None:
            invoice.item_details.all().delete()
            for item_data in item_details_data:
                if "amount" not in item_data:
                    item_data["amount"] = item_data.get("quantity", 0) * item_data.get("rate", 0)
                InvoiceItem.objects.create(
                    invoice=invoice,
                    **item_data
                )  # pylint: disable=no-member
        return invoice



class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model, includes invoice details."""

    invoice = serializers.SerializerMethodField()
    invoice_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Invoice.objects.all(),  # pylint: disable=no-member
        source="invoice",
        write_only=True,
    )

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for PaymentSerializer."""
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
    read_only_fields = ["id", "created_at"]

    def get_invoice(self, obj: Payment) -> dict:
        """Returns serialized invoice data for the payment."""
        # Avoid circular import by importing at runtime with a different name
        from .serializers import InvoiceSerializer as _InvoiceSerializer
        return _InvoiceSerializer(obj.invoice).data if obj.invoice else None



class QuoteItemSerializer(serializers.ModelSerializer):
    """Serializer for QuoteItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Item.objects.all(), source="item", write_only=True  # pylint: disable=no-member
    )


    # pylint: disable=no-member, import-outside-toplevel, import-self, redefined-outer-name
    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for QuoteItemSerializer."""
        model = QuoteItem
        fields = [
            "id", "item", "item_id", "quantity", "rate", "amount"
        ]
    read_only_fields = ["id", "item", "amount"]



class QuoteSerializer(serializers.ModelSerializer):
    """Serializer for Quote model, includes customer and item details."""

    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Customer.objects.all(),  # pylint: disable=no-member
        source="customer",
        write_only=True,
    )
    item_details = QuoteItemSerializer(many=True)
    quote_file_ids = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),  # pylint: disable=no-member
        source="quote_files",
        many=True,
        write_only=True,
        required=False,
    )
    quote_files = CustomerDocumentSerializer(many=True, read_only=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for QuoteSerializer."""
        model = Quote
        fields = [
            "id", "customer", "customer_id", "quote_number", "reference_number",
            "quote_date", "expiry_date", "salesperson", "project_name", "subject",
            "item_details", "customer_notes", "terms_and_conditions", "subtotal",
            "discount", "tax_type", "tax_percentage", "adjustment", "total_amount",
            "status", "quote_file_ids", "quote_files", "created_at"
        ]
    read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        item_details_data = validated_data.pop("item_details", [])
        # Accept both 'quote_files' and 'quote_file_ids' for robustness
        quote_files = validated_data.pop("quote_files", None)
        if quote_files is None:
            quote_files = validated_data.pop("quote_file_ids", [])
        quote = super().create(validated_data)
        if quote_files:
            quote.quote_files.set(quote_files)
        for item_data in item_details_data:
            if "amount" not in item_data:
                item_data["amount"] = item_data.get("quantity", 0) * item_data.get("rate", 0)
            QuoteItem.objects.create(quote=quote, **item_data)  # pylint: disable=no-member
        return quote

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop("item_details", None)
        quote_files = validated_data.pop("quote_files", None)
        quote = super().update(instance, validated_data)
        if quote_files is not None:
            quote.quote_files.set(quote_files)
        if item_details_data is not None:
            quote.item_details.all().delete()
            for item_data in item_details_data:
                if "amount" not in item_data:
                    item_data["amount"] = item_data.get("quantity", 0) * item_data.get("rate", 0)
                QuoteItem.objects.create(quote=quote, **item_data)  # pylint: disable=no-member
        return quote



class ProformaInvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for ProformaInvoiceItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Item.objects.all(), source="item", write_only=True  # pylint: disable=no-member
    )

    # ...existing code...
    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for ProformaInvoiceItemSerializer."""
        model = ProformaInvoiceItem
        fields = [
            "id", "item", "item_id", "quantity", "rate", "amount"
        ]
    read_only_fields = ["id", "item", "amount"]



class ProformaInvoiceSerializer(serializers.ModelSerializer):
    """Serializer for ProformaInvoice model, includes customer, files, and item details."""
    proforma_invoice_file_ids = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),  # pylint: disable=no-member
        source="proforma_invoice_files",
        many=True,
        write_only=True,
        required=False,
    )
    proforma_invoice_files = CustomerDocumentSerializer(many=True, read_only=True)
    """Serializer for ProformaInvoice model, includes customer and item details."""

    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Customer.objects.all(),  # pylint: disable=no-member
        source="customer",
        write_only=True,
    )
    item_details = ProformaInvoiceItemSerializer(many=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for ProformaInvoiceSerializer."""
        model = ProformaInvoice
        fields = [
            "id", "customer", "customer_id", "invoice_number", "reference_number",
            "invoice_date", "expiry_date", "salesperson", "project_name", "subject",
            "item_details", "customer_notes", "terms_and_conditions", "subtotal",
            "discount", "tax_type", "tax_percentage", "adjustment", "total_amount",
            "status", "proforma_invoice_file_ids", "proforma_invoice_files", "created_at"
        ]
    read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        item_details_data = validated_data.pop("item_details", [])
        # Accept both 'proforma_invoice_files' and 'proforma_invoice_file_ids' for robustness
        proforma_invoice_files = validated_data.pop("proforma_invoice_files", None)
        if proforma_invoice_files is None:
            proforma_invoice_files = validated_data.pop("proforma_invoice_file_ids", [])
        proforma = super().create(validated_data)
        if proforma_invoice_files:
            proforma.proforma_invoice_files.set(proforma_invoice_files)
        for item_data in item_details_data:
            if "amount" not in item_data:
                item_data["amount"] = item_data.get("quantity", 0) * item_data.get("rate", 0)
            ProformaInvoiceItem.objects.create(
                proforma_invoice=proforma,
                **item_data
            )  # pylint: disable=no-member
        return proforma

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop("item_details", None)
        proforma_invoice_files = validated_data.pop("proforma_invoice_files", None)
        proforma = super().update(instance, validated_data)
        if proforma_invoice_files is not None:
            proforma.proforma_invoice_files.set(proforma_invoice_files)
        if item_details_data is not None:
            proforma.item_details.all().delete()
            for item_data in item_details_data:
                if "amount" not in item_data:
                    item_data["amount"] = item_data.get("quantity", 0) * item_data.get("rate", 0)
                ProformaInvoiceItem.objects.create(
                    proforma_invoice=proforma,
                    **item_data
                )  # pylint: disable=no-member
        return proforma



class DeliveryChallanSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryChallan model, includes customer, files, and item details."""
    delivery_challan_file_ids = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),  # pylint: disable=no-member
        source="delivery_challan_files",
        many=True,
        write_only=True,
        required=False,
    )
    delivery_challan_files = CustomerDocumentSerializer(many=True, read_only=True)
    # No need for a separate read method; PrimaryKeyRelatedField will handle both read and write
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Customer.objects.all(),  # pylint: disable=no-member
        source="customer",
        write_only=True,
    )
    item_details = DeliveryChallanItemSerializer(many=True)

    """Serializer for DeliveryChallan model."""
    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for DeliveryChallanSerializer."""
        model = DeliveryChallan
        fields = [
            "id", "customer", "customer_id", "challan_number", "reference_number",
            "date", "challan_type", "item_details", "delivery_challan_file_ids",
            "delivery_challan_files", "total_amount", "created_at"
        ]
    read_only_fields = ["id", "created_at", "customer", "delivery_challan_files"]

    def create(self, validated_data):
        item_details_data = validated_data.pop("item_details", [])
        # Accept both 'delivery_challan_files' and 'delivery_challan_file_ids' for robustness
        delivery_challan_files = validated_data.pop("delivery_challan_files", None)
        if delivery_challan_files is None:
            delivery_challan_files = validated_data.pop("delivery_challan_file_ids", [])
        challan = super().create(validated_data)
        if delivery_challan_files:
            challan.delivery_challan_files.set(delivery_challan_files)
        for item_data in item_details_data:
            if "amount" not in item_data:
                item_data["amount"] = item_data.get("quantity", 0) * item_data.get("rate", 0)
            DeliveryChallanItem.objects.create(delivery_challan=challan, **item_data)
        return challan

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop("item_details", None)
        delivery_challan_files = validated_data.pop("delivery_challan_files", None)
        challan = super().update(instance, validated_data)
        if delivery_challan_files is not None:
            challan.delivery_challan_files.set(delivery_challan_files)
        if item_details_data is not None:
            challan.item_details.all().delete()
            for item_data in item_details_data:
                if "amount" not in item_data:
                    item_data["amount"] = item_data.get("quantity", 0) * item_data.get("rate", 0)
                DeliveryChallanItem.objects.create(delivery_challan=challan, **item_data)
        return challan


class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    """Serializer for InventoryAdjustment model."""
