from rest_framework import serializers
from .models import Customer, Invoice, Vendor, Item, Payment, Quote, ProformaInvoice, DeliveryChallan, InventoryAdjustment

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'company_name', 'address', 'phone', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


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


# Quote serializer
class QuoteSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source='customer', write_only=True
    )

    class Meta:
        model = Quote
        fields = [
            'id', 'customer', 'customer_id', 'quote_number', 'date', 'valid_until',
            'amount', 'status', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'customer']


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