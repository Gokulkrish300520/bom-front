from .models import (
    Bill,
    BillItem,
    ContactPerson,
    Customer,
    CustomerDocument,
    DeliveryChallan,
    DeliveryChallanItem,
    Invoice,
    InvoiceItem,
    Item,
    Payment,
    ProformaInvoice,
    ProformaInvoiceItem,
    Quote,
    QuoteItem,
    Vendor,
)
from rest_framework import serializers
from .inventory_management_models import (
    InventoryManagement,
    InventoryItemDetail,
)


class InventoryItemDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItemDetail
        fields = [
            "id",
            "description",
            "quantity",
            "adjustment",
            "amount",
        ]


class InventoryManagementSerializer(serializers.ModelSerializer):
    item_details = InventoryItemDetailSerializer(many=True, required=False)

    class Meta:
        model = InventoryManagement
        fields = [
            "id",
            "item_name",
            "unit",
            "type",
            "hsn_code",
            "description",
            "selling_price",
            "purchase_price",
            "tax",
            "item_details",
        ]

    def create(self, validated_data):
        item_details_data = validated_data.pop("item_details", [])
        inventory = InventoryManagement.objects.create(**validated_data)
        for detail_data in item_details_data:
            InventoryItemDetail.objects.create(
                inventory=inventory, **detail_data)
        return inventory

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop("item_details", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if item_details_data is not None:
            instance.item_details.all().delete()
            for detail_data in item_details_data:
                InventoryItemDetail.objects.create(
                    inventory=instance, **detail_data)
        return instance


"""Serializers for core Django models."""


class CustomerDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomerDocument model, handles file upload and metadata.
    """

    def validate_file(self, value):
        """
        Validate that the uploaded file is under the maximum allowed size.
        """
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                "File size must be under 10MB."
            )
        return value

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for CustomerDocumentSerializer."""

        model = CustomerDocument
        fields = ["id", "file", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class ContactPersonSerializer(serializers.ModelSerializer):
    """Serializer for ContactPerson model."""

    id = serializers.IntegerField(required=False)

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
        fields = [
            "id",
            "name",
            "unit",
            "hsn_code",
            "manage_sales_info",
            "sales_selling_price",
            "sales_account",
            "sales_description",
            "manage_purchase_info",
            "purchase_cost_price",
            "purchase_account",
            "purchase_description",
            "preferred_vendor",
            "track_inventory",
            "inventory_account",
            "inventory_valuation_method",
            "opening_stock",
            "opening_stock_rate_per_unit",
            "reorder_point",
            "created_at",
        ]

    def validate(self, data):
        errors = {}
        if data.get("manage_sales_info"):
            if data.get("sales_selling_price") is None:
                errors["sales_selling_price"] = (
                    "This field is required when managing sales info."
                )
            if not data.get("sales_account"):
                errors["sales_account"] = (
                    "This field is required when managing sales info."
                )
        if data.get("manage_purchase_info"):
            if data.get("purchase_cost_price") is None:
                errors["purchase_cost_price"] = (
                    "This field is required when managing purchase info."
                )
            if not data.get("purchase_account"):
                errors["purchase_account"] = (
                    "This field is required when managing purchase info."
                )
        if data.get("track_inventory"):
            if not data.get("inventory_account"):
                errors["inventory_account"] = (
                    "This field is required when tracking inventory."
                )
            if not data.get("inventory_valuation_method"):
                errors["inventory_valuation_method"] = (
                    "This field is required when tracking inventory."
                )
            if data.get("opening_stock") is None:
                errors["opening_stock"] = (
                    "This field is required when tracking inventory."
                )
            if data.get("opening_stock_rate_per_unit") is None:
                errors["opening_stock_rate_per_unit"] = (
                    "This field is required when tracking inventory."
                )
            if data.get("reorder_point") is None:
                errors["reorder_point"] = (
                    "This field is required when tracking inventory."
                )
        if errors:
            raise serializers.ValidationError(errors)
        return data


class VendorSerializer(serializers.ModelSerializer):

    contact_persons = ContactPersonSerializer(many=True, required=False)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for VendorSerializer."""

        model = Vendor
        fields = [
            "id",
            "vendor_type",
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
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        contact_persons_data = validated_data.pop("contact_persons", [])
        vendor = super().create(validated_data)
        for cp_data in contact_persons_data:
            ContactPerson.objects.create(vendor=vendor, **cp_data)
        return vendor

    def update(self, instance, validated_data):
        contact_persons_data = validated_data.pop("contact_persons", None)
        instance = super().update(instance, validated_data)
        if contact_persons_data is not None:
            existing_cps = {
                cp.id: cp
                for cp in getattr(instance, "contact_persons", []).all()
            }
            new_cp_ids = [
                cp.get("id")
                for cp in contact_persons_data
                if cp.get("id")
            ]
            # Delete removed contact persons
            for cp_id, cp in existing_cps.items():
                if cp_id not in new_cp_ids:
                    cp.delete()
            # Update or create
            for cp_data in contact_persons_data:
                cp_id = cp_data.get("id")
                if cp_id and cp_id in existing_cps:
                    for attr, value in cp_data.items():
                        setattr(existing_cps[cp_id], attr, value)
                    existing_cps[cp_id].save()
                else:
                    ContactPerson.objects.create(
                        vendor=instance,
                        **{k: v for k, v in cp_data.items() if k != "id"}
                    )
        return instance


class BillItemSerializer(serializers.ModelSerializer):
    """Serializer for BillItem model, includes item details."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Item.objects.all(),
        source="item",
        write_only=True,  # pylint: disable=no-member
    )

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for BillItemSerializer."""

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

    read_only_fields = ["id", "item", "amount"]


class BillSerializer(serializers.ModelSerializer):
    """Serializer for Bill model, includes vendor and item details."""

    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=Vendor.objects.all(),
        source="vendor",
        write_only=True,
    )
    item_details = BillItemSerializer(
        many=True, read_only=True, source="billitem_set")

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for BillSerializer."""

        model = Bill
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "bill_number",
            "bill_date",
            "due_date",
            "reference_number",
            "item_details",
            "tax",
            "total_amount",
            "balance_due",
            "subtotal",
            "status",
            "notes",
            "created_at",
        ]

    read_only_fields = ["id", "created_at", "vendor"]


class DeliveryChallanItemSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryChallanItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Item.objects.all(),
        source="item",
        write_only=True,  # pylint: disable=no-member
    )
    hsn_code = serializers.CharField(source="item.hsn_code", read_only=True)
    delivery_challan_item_number = serializers.IntegerField(read_only=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for DeliveryChallanItemSerializer."""

        model = DeliveryChallanItem
        fields = [
            "id",
            "item",
            "item_id",
            "hsn_code",
            "quantity",
            "rate",
            "amount",
            "delivery_challan_item_number",
        ]

    read_only_fields = ["id", "item", "amount", "delivery_challan_item_number","hsn_code"]


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for InvoiceItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Item.objects.all(),
        source="item",
        write_only=True,  # pylint: disable=no-member
    )

    invoice_item_number = serializers.IntegerField(read_only=True)
    hsn_code = serializers.CharField(source="item.hsn_code", read_only=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for InvoiceItemSerializer."""

        model = InvoiceItem
        fields = [
            "id",
            "item",
            "item_id",
            "hsn_code",
            "quantity",
            "rate",
            "amount",
            "invoice_item_number",
        ]

    read_only_fields = ["id", "item", "amount", "invoice_item_number", "hsn_code"]


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

    read_only_fields = ["id", "created_at", "documents"]

    def create(self, validated_data):
        contact_persons_data = validated_data.pop("contact_persons", [])
        customer = super().create(validated_data)
        for cp_data in contact_persons_data:
            ContactPerson.objects.create(
                customer=customer, **cp_data
            )  # pylint: disable=no-member
        return customer

    def update(self, instance, validated_data):
        contact_persons_data = validated_data.pop("contact_persons", None)
        instance = super().update(instance, validated_data)
        if contact_persons_data is not None:
            existing_cps = {cp.id: cp for cp in instance.contact_persons.all()}
            sent_ids = set()
            for cp_data in contact_persons_data:
                cp_id = cp_data.get("id")
                if cp_id and cp_id in existing_cps:
                    # Update existing
                    cp = existing_cps[cp_id]
                    for attr, value in cp_data.items():
                        if attr != "id":
                            setattr(cp, attr, value)
                    cp.save()
                    sent_ids.add(cp_id)
                else:
                    # Create new
                    ContactPerson.objects.create(
                        customer=instance,
                        **{k: v for k, v in cp_data.items() if k != "id"}
                    )
            # Only delete contact persons that are not in sent_ids
            # and were not just created
            for cp_id, cp in existing_cps.items():
                if cp_id not in sent_ids:
                    cp.delete()
            # Refresh instance to get updated related objects
            instance.refresh_from_db()
        return instance


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice model, includes customer, files, and item details.
    """

    invoice_file_ids = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),
        # long line split for E501
        source="invoice_files",
        many=True,
        required=False,
        write_only=True,
    )
    invoice_files = CustomerDocumentSerializer(
        many=True,
        read_only=True
    )
    attached_file_ids = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),
        # long line split for E501
        source="files",
        many=True,
        required=False,
        write_only=True,
    )
    attached_files = CustomerDocumentSerializer(
        many=True,
        read_only=True,
        source="files"
    )

    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True,
    )
    item_details = InvoiceItemSerializer(many=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for InvoiceSerializer."""

        model = Invoice
        fields = [
            "id",
            "customer",
            "customer_id",
            "invoice_number",
            "order_number",
            "invoice_date",
            "due_date",
            "status",
            "item_details",
            "customer_notes",
            "terms_and_conditions",
            "subtotal_amount",
            "gst_amount",
            "total_amount",
            "attached_files",
            "attached_file_ids",
            "invoice_files",
            "invoice_file_ids",
            "created_at",
        ]

    read_only_fields = [
        "id",
        "created_at",
        "customer",
        "attached_files",
        "invoice_files",
    ]

    def create(self, validated_data):
        item_details_data = validated_data.pop("item_details", [])
        invoice_files = validated_data.pop("invoice_files", [])
        attached_files = validated_data.pop("files", [])
        invoice = super().create(validated_data)
        if invoice_files:
            invoice.invoice_files.set(invoice_files)
        if attached_files:
            invoice.files.set(attached_files)
        for idx, item_data in enumerate(item_details_data, 1):
            if "amount" not in item_data:
                item_data["amount"] = (
                    item_data.get("quantity", 0) * item_data.get("rate", 0)
                )
            InvoiceItem.objects.create(
                invoice=invoice, invoice_item_number=idx, **item_data
            )  # pylint: disable=no-member
        invoice.refresh_from_db()
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
                    item_data["amount"] = (
                        item_data.get("quantity", 0) * item_data.get("rate", 0)
                    )
                InvoiceItem.objects.create(
                    invoice=invoice, **item_data
                )  # pylint: disable=no-member
        return invoice


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model, includes invoice details."""

    invoice = serializers.SerializerMethodField()
    invoice_id = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=Invoice.objects.all(),
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
    hsn_code = serializers.CharField(source="item.hsn_code", read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source="item"
    )
    quote_item_number = serializers.IntegerField(read_only=True)

    class Meta:
        model = QuoteItem
        fields = ["quote_item_number", "item_id","hsn_code", "quantity", "rate", "amount"]
        read_only_fields = ["quote_item_number", "amount","hsn_code"]


class QuoteSerializer(serializers.ModelSerializer):
    """Serializer for Quote model, includes customer and item details."""

    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True,
    )
    item_details = QuoteItemSerializer(many=True)
    quote_file_ids = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),
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
            "quote_file_ids",
            "quote_files",
            "created_at",
        ]

    read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        item_details_data = validated_data.pop("item_details", [])
        quote_files = validated_data.pop("quote_files", None)
        if quote_files is None:
            quote_files = validated_data.pop("quote_file_ids", [])
        quote = super().create(validated_data)
        if quote_files:
            quote.quote_files.set(quote_files)
        for idx, item_data in enumerate(item_details_data, start=1):
            if "amount" not in item_data:
                item_data["amount"] = (
                    item_data.get("quantity", 0) * item_data.get("rate", 0)
                )
            QuoteItem.objects.create(
                quote=quote, quote_item_number=idx, **item_data)
        return quote

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop("item_details", None)
        quote_files = validated_data.pop("quote_files", None)
        quote = super().update(instance, validated_data)
        if quote_files is not None:
            quote.quote_files.set(quote_files)
        if item_details_data is not None:
            quote.item_details.all().delete()
            for idx, item_data in enumerate(item_details_data, start=1):
                if "amount" not in item_data:
                    item_data["amount"] = (
                        item_data.get("quantity", 0) * item_data.get("rate", 0)
                    )
                QuoteItem.objects.create(
                    quote=quote, quote_item_number=idx, **item_data
                )
        return quote


class ProformaInvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for ProformaInvoiceItem model."""

    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(  # pylint: disable=no-member
        queryset=Item.objects.all(),
        source="item",
        write_only=True,  # pylint: disable=no-member
    )
    hsn_code = serializers.CharField(source="item.hsn_code", read_only=True)
    # ...existing code...
    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for ProformaInvoiceItemSerializer."""

        model = ProformaInvoiceItem
        fields = ["id", "item", "item_id", "hsn_code","quantity", "rate", "amount"]

    read_only_fields = ["id", "item", "amount","hsn_code"]


class ProformaInvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for ProformaInvoice model, includes customer,
    files, and item details.
    """

    proforma_invoice_file_ids = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),
        source="proforma_invoice_files",
        many=True,
        write_only=True,
        required=False,
    )
    proforma_invoice_files = CustomerDocumentSerializer(
        many=True,
        read_only=True
    )
    """
    Serializer for ProformaInvoice model, includes customer
    and item details.
    """

    customer = CustomerSerializer(
        read_only=True
    )
    customer_id = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True,
    )
    item_details = ProformaInvoiceItemSerializer(many=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for ProformaInvoiceSerializer."""

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
            "proforma_invoice_file_ids",
            "proforma_invoice_files",
            "created_at",
        ]

    read_only_fields = [
        "id",
        "created_at"
    ]

    def create(self, validated_data):
        item_details_data = validated_data.pop(
            "item_details",
            []
        )
    # Accept both 'proforma_invoice_files' and
    # 'proforma_invoice_file_ids' for robustness
        proforma_invoice_files = validated_data.pop(
            "proforma_invoice_files",
            None
        )
        if proforma_invoice_files is None:
            proforma_invoice_files = validated_data.pop(
                "proforma_invoice_file_ids", [])
        proforma = super().create(validated_data)
        if proforma_invoice_files:
            proforma.proforma_invoice_files.set(proforma_invoice_files)
        for item_data in item_details_data:
            if "amount" not in item_data:
                item_data["amount"] = (
                    item_data.get("quantity", 0) * item_data.get("rate", 0)
                )
            ProformaInvoiceItem.objects.create(
                proforma_invoice=proforma, **item_data
            )  # pylint: disable=no-member
        return proforma

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop("item_details", None)
        proforma_invoice_files = validated_data.pop(
            "proforma_invoice_files", None)
        proforma = super().update(instance, validated_data)
        if proforma_invoice_files is not None:
            proforma.proforma_invoice_files.set(proforma_invoice_files)
        if item_details_data is not None:
            proforma.item_details.all().delete()
            for item_data in item_details_data:
                if "amount" not in item_data:
                    item_data["amount"] = (
                        item_data.get("quantity", 0) * item_data.get("rate", 0)
                    )
                ProformaInvoiceItem.objects.create(
                    proforma_invoice=proforma, **item_data
                )  # pylint: disable=no-member
        return proforma


class DeliveryChallanSerializer(serializers.ModelSerializer):
    """
    Serializer for DeliveryChallan model, includes customer,
    files, and item details.
    """

    delivery_challan_file_ids = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=CustomerDocument.objects.all(),
        source="delivery_challan_files",
        many=True,
        write_only=True,
        required=False,
    )
    delivery_challan_files = CustomerDocumentSerializer(
        many=True,
        read_only=True
    )
    # No need for a separate read method;
    # PrimaryKeyRelatedField will handle both read and write
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        # pylint: disable=no-member
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True,
    )
    item_details = DeliveryChallanItemSerializer(many=True)
    status = serializers.ChoiceField(
        choices=[
            ("draft", "Draft"),
            ("issued", "Issued"),
            ("dispatched", "Dispatched"),
            ("delivered", "Delivered"),
            ("cancelled", "Cancelled"),
            ("returned", "Returned"),
        ],
        required=False,
        default="draft",
    )

    """Serializer for DeliveryChallan model."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for DeliveryChallanSerializer."""

        model = DeliveryChallan
        fields = [
            "id",
            "customer",
            "customer_id",
            "challan_number",
            "reference_number",
            "date",
            "challan_type",
            "status",
            "item_details",
            "delivery_challan_file_ids",
            "delivery_challan_files",
            "total_amount",
            "created_at",
        ]

    read_only_fields = ["id", "created_at",
                        "customer", "delivery_challan_files"]

    def create(self, validated_data):
        item_details_data = validated_data.pop(
            "item_details",
            []
        )
    # Accept both 'delivery_challan_files' and
    # 'delivery_challan_file_ids' for robustness
        delivery_challan_files = validated_data.pop(
            "delivery_challan_files", None)
        if delivery_challan_files is None:
            delivery_challan_files = validated_data.pop(
                "delivery_challan_file_ids", [])
        challan = super().create(validated_data)
        if delivery_challan_files:
            challan.delivery_challan_files.set(delivery_challan_files)
        for idx, item_data in enumerate(item_details_data, 1):
            if "amount" not in item_data:
                item_data["amount"] = (
                    item_data.get("quantity", 0) * item_data.get("rate", 0)
                )
            DeliveryChallanItem.objects.create(
                delivery_challan=challan,
                delivery_challan_item_number=idx,
                **item_data
            )
        return challan

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop("item_details", None)
        delivery_challan_files = validated_data.pop(
            "delivery_challan_files", None)
        challan = super().update(instance, validated_data)
        if delivery_challan_files is not None:
            challan.delivery_challan_files.set(delivery_challan_files)
        if item_details_data is not None:
            challan.item_details.all().delete()
            for item_data in item_details_data:
                if "amount" not in item_data:
                    item_data["amount"] = (
                        item_data.get("quantity", 0)
                        * item_data.get("rate", 0)
                    )
                DeliveryChallanItem.objects.create(
                    delivery_challan=challan, **item_data
                )
        challan.refresh_from_db()
        return challan


class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    """Serializer for InventoryAdjustment model."""
