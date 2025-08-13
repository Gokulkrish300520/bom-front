from rest_framework import serializers
from .models import Customer, Invoice

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'company_name', 'address', 'phone', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

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