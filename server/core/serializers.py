from rest_framework import serializers
from .models import Customer, Invoice, Vendor, Item, Payment, Quote, ProformaInvoice, DeliveryChallan, InventoryAdjustment, CustomerDocument, ContactPerson, QuoteItem


# CustomerDocument serializer
class CustomerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerDocument
        fields = ['id', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

# ContactPerson serializer
class ContactPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactPerson
        fields = [
            'id', 'salutation', 'first_name', 'last_name', 'email', 'work_phone', 'mobile'
        ]
        read_only_fields = ['id']

class CustomerSerializer(serializers.ModelSerializer):
    documents = CustomerDocumentSerializer(many=True, read_only=True)
    contact_persons = ContactPersonSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'customer_type', 'salutation', 'first_name', 'last_name', 'company_name',
            'display_name', 'email', 'work_phone', 'mobile', 'pan', 'currency', 'opening_balance',
            'payment_terms', 'documents',
            'billing_attention', 'billing_country', 'billing_street1', 'billing_street2',
            'billing_city', 'billing_state', 'billing_pin_code', 'billing_phone', 'billing_fax',
            'shipping_attention', 'shipping_country', 'shipping_street1', 'shipping_street2',
            'shipping_city', 'shipping_state', 'shipping_pin_code', 'shipping_phone', 'shipping_fax',
            'contact_persons', 'custom_fields', 'tags', 'remarks', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'documents', 'contact_persons']


# Vendor serializer
class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            'id', 'name', 'email', 'company_name', 'address', 'phone', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# Item serializer
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = [
            'id', 'name', 'description', 'price', 'sku', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']



# Payment serializer
class PaymentSerializer(serializers.ModelSerializer):
    invoice = serializers.SerializerMethodField(read_only=True)
    invoice_id = serializers.PrimaryKeyRelatedField(
        queryset=Invoice.objects.all(), source='invoice', write_only=True
    )

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'invoice_id', 'amount', 'date', 'method', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'invoice']

    def get_invoice(self, obj):
        from .serializers import InvoiceSerializer
        return InvoiceSerializer(obj.invoice).data if obj.invoice else None



# QuoteItem serializer
class QuoteItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source='item', write_only=True
    )

    class Meta:
        model = QuoteItem
        fields = ['id', 'item', 'item_id', 'quantity', 'rate', 'amount']
        read_only_fields = ['id', 'item', 'amount']

# Quote serializer
class QuoteSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source='customer', write_only=True
    )
    item_details = QuoteItemSerializer(many=True, read_only=True)

    class Meta:
        model = Quote
        fields = [
            'id', 'customer', 'customer_id', 'quote_number', 'reference_number', 'quote_date', 'expiry_date',
            'salesperson', 'project_name', 'subject', 'item_details', 'customer_notes', 'terms_and_conditions',
            'subtotal', 'discount', 'tax_type', 'tax_percentage', 'adjustment', 'total_amount',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'customer', 'item_details']


# ProformaInvoice serializer
class ProformaInvoiceSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source='customer', write_only=True
    )

    class Meta:
        model = ProformaInvoice
        fields = [
            'id', 'customer', 'customer_id', 'proforma_number', 'date', 'due_date',
            'amount', 'status', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'customer']


# DeliveryChallan serializer
class DeliveryChallanSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source='customer', write_only=True
    )

    class Meta:
        model = DeliveryChallan
        fields = [
            'id', 'customer', 'customer_id', 'challan_number', 'date', 'delivery_date',
            'status', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'customer']


# InventoryAdjustment serializer
class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source='item', write_only=True
    )

    class Meta:
        model = InventoryAdjustment
        fields = [
            'id', 'item', 'item_id', 'adjustment_number', 'date', 'quantity', 'reason', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'item']

class InvoiceSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source='customer', write_only=True
    )

    class Meta:
        model = Invoice
        fields = [
            'id', 'customer', 'customer_id', 'invoice_number', 'date', 'due_date',
            'amount', 'status', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'customer']