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
    Deal,
    DraftInvoice,
    DraftInvoiceItem,
    DraftQuote,
    DraftQuoteItem,
    BankDetail
)
from django.db.models import Sum,Q
from django.db import models
from decimal import Decimal,ROUND_HALF_UP
from rest_framework import serializers
from .inventory_management_models import (
    InventoryManagement
)
from .purchase_models import (
    Freight,FreightItem,ImportBill,ImportBillItem,Duty,DutyItem,Gst,GstItem,NonGst,NonGstItem,Billorder,BillorderItem,PaymentTransaction
)
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

class BankDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetail
        fields = ["id", "name", "account_number", "bank_name", "ifsc", "swift", "is_active","created_at"]
class PaymentTransactionSerializer(serializers.ModelSerializer):
    content_object_type = serializers.SerializerMethodField(read_only=True)
    vendor_name = serializers.SerializerMethodField(read_only=True)
    content_type = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.all(), write_only=True, required=False
    )
    object_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = PaymentTransaction
        fields = ["id", "vendor_name","amount", "paid_by", "payment_reference_no", "paid_on",
                "content_type", "object_id", "content_object_type"]
        read_only_fields = ["paid_on", "content_object_type","vendor_name"]

    def get_content_object_type(self, obj):
        return obj.content_type.model if obj.content_type else None
    
    def get_vendor_name(self, obj):
        try:
            return obj.content_object.vendor.display_name
        except AttributeError:
            return None

    def create(self, validated_data):
        parent = self.context.get('parent_instance')
        if parent:
            validated_data.setdefault(
                'content_type_id', ContentType.objects.get_for_model(parent).pk
            )
            validated_data.setdefault('object_id', parent.id)
        return super().create(validated_data)

    
    def update(self, instance, validated_data):
        # Update the transaction fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

class PendingTransactionSerializer(PaymentTransactionSerializer):
    amount_to_pay = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta(PaymentTransactionSerializer.Meta):
        fields = PaymentTransactionSerializer.Meta.fields + ["amount_to_pay", "total_amount"]

    def get_amount_to_pay(self, obj):
        if obj.content_object:
            return getattr(obj.content_object, "amount_to_pay", None)
        return None

    def get_total_amount(self, obj):
        if obj.content_object:
            return getattr(obj.content_object, "total_amount", None)
        return None


class ProfitLossSerializer(serializers.Serializer):
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    profit_or_loss = serializers.DecimalField(max_digits=12, decimal_places=2)
    details = serializers.DictField(
        child=serializers.DecimalField(max_digits=12, decimal_places=2)
    )


class InventoryManagementSerializer(serializers.ModelSerializer):
    adjusted_item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    adjusted_item_name = serializers.CharField(source='adjusted_item.name', read_only=True)
    created_by = serializers.ReadOnlyField(source="created_by.username")  #adjust as needed

    class Meta:
        model = InventoryManagement
        fields = [
            "id",
            "adjusted_item",
            "adjusted_item_name",
            "added_restocked_quantity",
            "old_selling_price",
            "updated_selling_price",
            "old_purchase_price",
            "updated_purchase_price",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["old_selling_price", "old_purchase_price", "created_by", "created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Dynamically set queryset for adjusted_item to avoid circular imports
        self.fields['adjusted_item'].queryset = InventoryManagement._meta.get_field('adjusted_item').related_model.objects.all()

    def validate_added_restocked_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Restocked quantity must be positive.")
        return value

    def create(self, validated_data):
        item = validated_data['adjusted_item']
        # Set old prices from item before saving adjustment for audit trail
        validated_data['old_selling_price'] = item.sales_selling_price
        validated_data['old_purchase_price'] = item.purchase_cost_price
        user = self.context['request'].user if 'request' in self.context else None
        if user and not user.is_anonymous:
            validated_data['created_by'] = user
        return super().create(validated_data)



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
            "item_no",
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
            "opening_stock",
            "current_stock",
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


class GstItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = GstItem
        exclude = ["gst"]

    def create(self, validated_data):
        # Calculate total_price automatically
        validated_data['total_price'] = validated_data.get('quantity', 0) * validated_data.get('unit_price', 0)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Update total_price automatically
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.unit_price = validated_data.get('unit_price', instance.unit_price)
        instance.total_price = instance.quantity * instance.unit_price
        return super().update(instance, validated_data)


class GstSerializer(serializers.ModelSerializer):
    items = GstItemSerializer(many=True, required=False)
    
    transactions = PaymentTransactionSerializer(many=True, required=False)
    
    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(),
        source='vendor',
        write_only=True
    )
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(
        queryset=Deal.objects.all(), source='deal', write_only=True
    )
    created_by = serializers.ReadOnlyField(source="created_by.username")
    date = serializers.DateField(required=False)

    class Meta:
        model = Gst
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "deal_no",
            "deal_id",
            "date",
            "currency",
            "payment_request",
            "payment_reference_no",
            "payment_status",
            "paid_by",
            "total_amount",
            "paid_amount",
            "amount_to_pay",
            "items",
            "transactions",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "vendor", "deal_no", "created_by", "created_at", "total_amount", "paid_amount", "amount_to_pay"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        transactions_data = validated_data.pop("transactions", [])
        user = self.context['request'].user if 'request' in self.context else None
        
        if 'paid_by' not in validated_data or not validated_data['paid_by']:
            validated_data['paid_by'] = "None"
        
        gst = Gst.objects.create(created_by=user, **validated_data)

        total_amount = 0
        for item_data in items_data:
            item_data['total_price'] = item_data.get('quantity', 0) * item_data.get('unit_price', 0)
            GstItem.objects.create(gst=gst, **item_data)
            total_amount += item_data['total_price']

        gst.total_amount = total_amount
        gst.save()
        
        # Create transactions
        for tx_data in transactions_data:
            serializer = PaymentTransactionSerializer(
                data=tx_data,
                context={'parent_instance': gst}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
        gst.update_status()
            
        return gst

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        transactions_data = validated_data.pop("transactions", None)
        
        # Update top-level fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if not instance.paid_by:  # ensure paid_by never null
            instance.paid_by = "None"
        instance.save()

        if items_data is not None:
            existing_items = {item.id: item for item in instance.items.all()}
            sent_item_ids = []

            for item_data in items_data:
                item_id = item_data.get("id", None)
                item_data['total_price'] = item_data.get('quantity', 0) * item_data.get('unit_price', 0)

                if item_id and item_id in existing_items:
                    item = existing_items[item_id]
                    for attr, value in item_data.items():
                        setattr(item, attr, value)
                    item.save()
                    sent_item_ids.append(item_id)
                else:  # new item
                    new_item = GstItem.objects.create(gst=instance, **item_data)
                    sent_item_ids.append(new_item.id)

            # Delete missing items
            for item_id, item in existing_items.items():
                if item_id not in sent_item_ids:
                    item.delete()

            instance.total_amount = sum(item.total_price for item in instance.items.all())
            instance.save()

        # Update transactions
        # --- Transactions Update (create/update/delete) ---
        if transactions_data is not None:
            existing_txs = {tx.id: tx for tx in instance.transactions.all()}
            sent_tx_ids = []

            for tx_data in transactions_data:
                tx_id = tx_data.get("id")
                if tx_id and tx_id in existing_txs:
                    tx = existing_txs[tx_id]
                    for attr, val in tx_data.items():
                        setattr(tx, attr, val)
                    tx.save()
                    sent_tx_ids.append(tx_id)
                else:
                    serializer = PaymentTransactionSerializer(
                        data=tx_data,
                        context={'parent_instance': instance}
                    )
                    serializer.is_valid(raise_exception=True)
                    tx = serializer.save()
                    sent_tx_ids.append(tx.id)


            instance.update_status()
                
        return instance


# ---------------------- NonGst Serializers ----------------------

class NonGstItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = NonGstItem
        exclude = ["nongst"]

    def create(self, validated_data):
        validated_data['total_price'] = validated_data.get('quantity', 0) * validated_data.get('unit_price', 0)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.unit_price = validated_data.get('unit_price', instance.unit_price)
        instance.total_price = instance.quantity * instance.unit_price
        return super().update(instance, validated_data)


class NonGstSerializer(serializers.ModelSerializer):
    items = NonGstItemSerializer(many=True, required=False)
    transactions = PaymentTransactionSerializer(many=True, required=False)
    
    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(),
        source='vendor',
        write_only=True
    )
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(
        queryset=Deal.objects.all(),
        source='deal',
        write_only=True
    )
    created_by = serializers.ReadOnlyField(source="created_by.username")
    date = serializers.DateField(required=False)

    class Meta:
        model = NonGst
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "deal_no",
            "deal_id",
            "date",
            "currency",
            "payment_request",
            "payment_reference_no",
            "payment_status",
            "paid_by",
            "total_amount",
            "paid_amount",
            "amount_to_pay",
            "items",
            "transactions",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "vendor", "deal_no", "created_by", "created_at", "total_amount","paid_amount","amount_to_pay"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        transactions_data = validated_data.pop("transactions", [])
        user = self.context['request'].user if 'request' in self.context else None
        
        if 'paid_by' not in validated_data or not validated_data['paid_by']:
            validated_data['paid_by'] = "None"
        
        bill = NonGst.objects.create(created_by=user, **validated_data)

        total_amount = 0
        for item_data in items_data:
            item_data['total_price'] = item_data.get('quantity', 0) * item_data.get('unit_price', 0)
            NonGstItem.objects.create(nongst=bill, **item_data)
            total_amount += item_data['total_price']

        bill.total_amount = total_amount
        bill.save()
        
        for tx_data in transactions_data:
            
            serializer = PaymentTransactionSerializer(
                data=tx_data,
                context={'parent_instance': bill}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

        # Update payment status after all transactions
        bill.update_status()
        return bill

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        transactions_data = validated_data.pop("transactions", None)


        # Update top-level fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if not instance.paid_by:
            instance.paid_by = "None"
        instance.save()

        if items_data is not None:
            existing_items = {item.id: item for item in instance.items.all()}
            sent_item_ids = []

            for item_data in items_data:
                item_id = item_data.get("id", None)
                item_data['total_price'] = item_data.get('quantity', 0) * item_data.get('unit_price', 0)

                if item_id and item_id in existing_items:
                    item = existing_items[item_id]
                    for attr, value in item_data.items():
                        setattr(item, attr, value)
                    item.save()
                    sent_item_ids.append(item_id)
                else:  # new item
                    new_item = NonGstItem.objects.create(nongst=instance, **item_data)
                    sent_item_ids.append(new_item.id)

            # Delete missing items
            for item_id, item in existing_items.items():
                if item_id not in sent_item_ids:
                    item.delete()

            instance.total_amount = sum(item.total_price for item in instance.items.all())
            instance.save()

        if transactions_data is not None:
            existing_txs = {tx.id: tx for tx in instance.transactions.all()}
            sent_tx_ids = []

            for tx_data in transactions_data:
                tx_id = tx_data.get("id")
                if tx_id and tx_id in existing_txs:
                    tx = existing_txs[tx_id]
                    for attr, val in tx_data.items():
                        setattr(tx, attr, val)
                    tx.save()
                    sent_tx_ids.append(tx_id)
                else:
                    serializer = PaymentTransactionSerializer(
                        data=tx_data,
                        context={'parent_instance': instance}
                    )
                    serializer.is_valid(raise_exception=True)
                    tx = serializer.save()
                    sent_tx_ids.append(tx.id)


            instance.update_status()
        return instance

from rest_framework import serializers
from django.db import transaction

class FreightItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)  # for updates

    class Meta:
        model = FreightItem
        exclude = ['freight']
        read_only_fields = ['total_price']

    def create(self, validated_data):
        validated_data['total_price'] = (validated_data.get('quantity') or 0) * (validated_data.get('unit_price') or 0)
        return FreightItem(**validated_data)  # don't save yet; save in bulk later

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.total_price = (instance.quantity or 0) * (instance.unit_price or 0)
        return instance


class FreightSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Freight.objects.model.vendor.field.related_model.objects.all(),
        source='vendor',
        write_only=True
    )
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(
        queryset=Freight.objects.model.deal.field.related_model.objects.all(),
        source='deal',
        write_only=True
    )
    items = FreightItemSerializer(many=True)
    created_by = serializers.ReadOnlyField(source="created_by.username")

    class Meta:
        model = Freight
        fields = [
            "id", "vendor", "vendor_id", "deal_no", "deal_id",
            "date", "currency", "items", "total_amount",
            "created_by", "created_at"
        ]
        read_only_fields = ["id", "vendor", "deal_no", "created_by", "created_at"]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user if 'request' in self.context else None

        with transaction.atomic():
            freight = Freight.objects.create(created_by=user, **validated_data)

            items = []
            total_amount = 0
            for item_data in items_data:
                item = FreightItem(
                    freight=freight,
                    total_price=(item_data.get('quantity') or 0) * (item_data.get('unit_price') or 0),
                    **item_data
                )
                total_amount += item.total_price
                items.append(item)

            FreightItem.objects.bulk_create(items)
            freight.total_amount = total_amount
            freight.save()

        return freight

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        # Update freight fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            existing_items = {item.id: item for item in instance.items.all()}
            sent_item_ids = []
            items_to_create = []
            items_to_update = []

            for item_data in items_data:
                item_id = item_data.get("id", None)
                item_data['total_price'] = (item_data.get('quantity') or 0) * (item_data.get('unit_price') or 0)

                if item_id:  # update existing
                    item_id = int(item_id)
                    if item_id in existing_items:
                        item = existing_items[item_id]
                        for attr, value in item_data.items():
                            setattr(item, attr, value)
                        items_to_update.append(item)
                        sent_item_ids.append(item_id)
                    else:
                        raise serializers.ValidationError({"items": f"Invalid item id {item_id}"})
                else:  # create new
                    new_item = FreightItem(freight=instance, **item_data)
                    items_to_create.append(new_item)

            # Bulk operations
            if items_to_update:
                FreightItem.objects.bulk_update(
                    items_to_update,
                    fields=[
                        'sf_number', 'weight', 'freight_type', 'item_name', 'description',
                        'item_specification', 'brand', 'hsn_code', 'quantity', 'unit_price', 'total_price'
                    ]
                )

            if items_to_create:
                FreightItem.objects.bulk_create(items_to_create)
                sent_item_ids.extend([item.id for item in items_to_create])  # update list

            # Delete missing items
            for item_id, item in existing_items.items():
                if item_id not in sent_item_ids:
                    item.delete()

            # Recalculate total_amount
            instance.total_amount = sum(item.total_price or 0 for item in instance.items.all())
            instance.save()

        return instance

class ImportBillItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = ImportBillItem
        exclude = ["bill"]

    def create(self, validated_data):
        validated_data['total_price'] = validated_data.get('quantity', 0) * validated_data.get('unit_price', 0)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.unit_price = validated_data.get('unit_price', instance.unit_price)
        instance.total_price = instance.quantity * instance.unit_price
        return super().update(instance, validated_data)


class ImportBillSerializer(serializers.ModelSerializer):
    bill_items = ImportBillItemSerializer(many=True, required=False)
    transactions = PaymentTransactionSerializer(many=True, required=False)

    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(),
        source="vendor",
        write_only=True
    )
    deal_no = serializers.CharField(source="deal.deal_no", read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(
        queryset=Deal.objects.all(),
        source="deal",
        write_only=True
    )
    created_by = serializers.ReadOnlyField(source="created_by.username")
    date = serializers.DateField(required=False)

    class Meta:
        model = ImportBill
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "deal_no",
            "deal_id",
            "date",
            "currency",
            "payment_request",
            "payment_reference_no",
            "payment_status",
            "paid_by",
            "total_amount",
            "paid_amount",
            "amount_to_pay",
            "bill_items",
            "transactions",
            "created_by",
            "created_at",
        ]
        read_only_fields = [
            "id", "vendor", "deal_no", "created_by", "created_at", "total_amount",
            "paid_amount", "amount_to_pay"
        ]

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("bill_items", [])
        transactions_data = validated_data.pop("transactions", [])
        user = self.context.get("request").user if "request" in self.context else None

        bill = ImportBill.objects.create(created_by=user, **validated_data)

        total_amount = 0
        for item_data in items_data:
            item_data['total_price'] = item_data.get('quantity', 0) * item_data.get('unit_price', 0)
            ImportBillItem.objects.create(bill=bill, **item_data)
            total_amount += item_data['total_price']

        bill.total_amount = total_amount
        bill.save()

        # Create transactions
        for tx_data in transactions_data:
            serializer = PaymentTransactionSerializer(
                data=tx_data,
                context={'parent_instance': bill}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

        # Update paid_by, payment_reference_no, and payment_status
        last_tx = bill.transactions.order_by('-paid_on').first()
        if last_tx:
            bill.paid_by = last_tx.paid_by
            bill.payment_reference_no = last_tx.payment_reference_no
        bill.update_status()
        return bill

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("bill_items", None)
        transactions_data = validated_data.pop("transactions", None)

        # Update top-level fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle bill items
        if items_data is not None:
            existing_items = {item.id: item for item in instance.bill_items.all()}
            sent_item_ids = []

            for item_data in items_data:
                item_id = item_data.get("id", None)
                item_data['total_price'] = item_data.get('quantity', 0) * item_data.get('unit_price', 0)

                if item_id and item_id in existing_items:
                    item = existing_items[item_id]
                    for attr, value in item_data.items():
                        setattr(item, attr, value)
                    item.save()
                    sent_item_ids.append(item_id)
                else:
                    new_item = ImportBillItem.objects.create(bill=instance, **item_data)
                    sent_item_ids.append(new_item.id)

            # Delete missing items
            for item_id, item in existing_items.items():
                if item_id not in sent_item_ids:
                    item.delete()

            instance.total_amount = sum(item.total_price for item in instance.bill_items.all())
            instance.save()

        # Handle transactions
        if transactions_data is not None:
            for tx_data in transactions_data:
                serializer = PaymentTransactionSerializer(
                    data=tx_data,
                    context={'parent_instance': instance}
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()

            last_tx = instance.transactions.order_by('-paid_on').first()
            if last_tx:
                instance.paid_by = last_tx.paid_by
                instance.payment_reference_no = last_tx.payment_reference_no
            else:
            # ✅ Reset to safe nulls if no transaction exists
                instance.paid_by = None
                instance.payment_reference_no = None
            
            instance.update_status()
        else:
        # ✅ Even if transactions_data wasn't provided, re-check after possible deletions
            last_tx = instance.transactions.order_by('-paid_on').first()
            if last_tx:
                instance.paid_by = last_tx.paid_by
                instance.payment_reference_no = last_tx.payment_reference_no
            else:
                instance.paid_by = None
                instance.payment_reference_no = None

            instance.update_status()

        return instance

class DutyItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = DutyItem
        exclude = ["duty"]
        extra_kwargs = {"duty": {"required": False}}

    def _to_decimal(self, value):
        try:
            return Decimal(str(value or 0))
        except (InvalidOperation, TypeError):
            return Decimal(0)

    def validate(self, attrs):
        # Compute total_price
        quantity = self._to_decimal(attrs.get("quantity"))
        unit_price = self._to_decimal(attrs.get("unit_price"))
        total_price = quantity * unit_price
        attrs["total_price"] = total_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Compute total_duty
        numeric_fields = [
            "assessable_value",
            "igst",
            "social_welfare",
            "cess",
            "duty_amount",
            "addl_duty",
        ]
        total_duty = sum(self._to_decimal(attrs.get(f)) for f in numeric_fields)
        attrs["total_duty"] = total_duty.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return attrs

# ---------- Duty Serializer ----------
class DutySerializer(serializers.ModelSerializer):
    duty_items = DutyItemSerializer(many=True, required=False)
    transactions = PaymentTransactionSerializer(many=True, required=False)
    vendor = serializers.StringRelatedField(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(), source="vendor", write_only=True
    )
    deal_no = serializers.CharField(source="deal.deal_no", read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(
        queryset=Deal.objects.all(), source="deal", write_only=True
    )
    created_by = serializers.ReadOnlyField(source="created_by.username")

    class Meta:
        model = Duty
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "deal_no",
            "deal_id",
            "currency",
            "date",
            "airway_bill",
            "payment_request",
            "payment_reference_no",
            "payment_status",
            "paid_by",
            "total_amount",
            "paid_amount",
            "amount_to_pay",
            "duty_items",
            "transactions",
            "created_by",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "vendor",
            "deal_no",
            "total_amount",
            "created_by",
            "created_at",
        ]

    # ---------- Helper ----------
    def _to_decimal(self, value):
        try:
            return Decimal(str(value or 0))
        except (InvalidOperation, TypeError):
            return Decimal(0)

    def _update_payment_status(self, instance):
        total = self._to_decimal(instance.total_amount)
        paid_request = self._to_decimal(instance.payment_request)

        if paid_request >= total and total > 0:
            instance.payment_status = "PAID"
        elif paid_request > 0:
            instance.payment_status = "PARTIAL"
        else:
            instance.payment_status = "UNPAID"

    # ---------- CREATE ----------
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("duty_items", [])
        transactions_data = validated_data.pop("transactions", [])
        user = self.context.get("request").user

        duty = Duty.objects.create(created_by=user, **validated_data)

        total_amount = Decimal("0.00")
        for item_data in items_data:
            serializer = DutyItemSerializer(data=item_data)
            serializer.is_valid(raise_exception=True)
            item = DutyItem.objects.create(duty=duty, **serializer.validated_data)
            total_amount += item.total_price + item.total_duty

        duty.total_amount = total_amount
        duty.save()

        # Transactions
        for tx_data in transactions_data:
            serializer = PaymentTransactionSerializer(
                data=tx_data, context={"parent_instance": duty}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

        duty.update_status()
        return duty

    # ---------- UPDATE ----------
    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("duty_items", None)
        transactions_data = validated_data.pop("transactions", None)

        # Update top-level fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update duty_items
        if items_data is not None:
            existing_items = {item.id: item for item in instance.duty_items.all()}
            sent_ids = []

            for item_data in items_data:
                item_id = item_data.get("id")
                serializer = DutyItemSerializer(data=item_data)
                serializer.is_valid(raise_exception=True)
                validated_item = serializer.validated_data

                if item_id and item_id in existing_items:
                    item = existing_items[item_id]
                    for key, val in validated_item.items():
                        setattr(item, key, val)
                    item.save()
                    sent_ids.append(item_id)
                else:
                    item = DutyItem.objects.create(duty=instance, **validated_item)
                    sent_ids.append(item.id)

            # Delete removed items
            for item_id, item in existing_items.items():
                if item_id not in sent_ids:
                    item.delete()

        # Update transactions
        
            # Handle transactions
        if transactions_data is not None:
            existing_transactions = {tx.id: tx for tx in instance.transactions.all()}

            for tx_data in transactions_data:
                tx_id = tx_data.get("id")

                if tx_id and tx_id in existing_transactions:
                    # ✅ Update existing transaction
                    tx_instance = existing_transactions[tx_id]
                    tx_serializer = PaymentTransactionSerializer(
                        tx_instance, data=tx_data, partial=True
                    )
                    tx_serializer.is_valid(raise_exception=True)
                    tx_serializer.save()
                else:
                    # 🆕 Create a new transaction
                    tx_serializer = PaymentTransactionSerializer(
                        data=tx_data, context={"parent_instance": instance}
                    )
                    tx_serializer.is_valid(raise_exception=True)
                    tx_serializer.save()

            # 🔁 Refresh status and payment info after any update
            last_tx = instance.transactions.order_by("-paid_on").first()
            if last_tx:
                instance.paid_by = last_tx.paid_by
                instance.payment_reference_no = last_tx.payment_reference_no
            else:
                instance.paid_by = "None"
                instance.payment_reference_no = None

            instance.update_status()

        else:
            # If transactions not provided — still recheck payment info
            last_tx = instance.transactions.order_by("-paid_on").first()
            if last_tx:
                instance.paid_by = last_tx.paid_by
                instance.payment_reference_no = last_tx.payment_reference_no
            else:
                instance.paid_by = "None"
                instance.payment_reference_no = None

            instance.update_status()

        # Recalculate total_amount
        totals = instance.duty_items.aggregate(
            total_price_sum=models.Sum("total_price"),
            total_duty_sum=models.Sum("total_duty"),
        )
        instance.total_amount = self._to_decimal(totals.get("total_price_sum")) + self._to_decimal(totals.get("total_duty_sum"))

        # Update payment status
        instance.update_status()
        instance.update_total_amount()
        return instance


from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from decimal import Decimal, InvalidOperation

class BillorderItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = BillorderItem
        fields = [
            "id", "item_name", "description", "item_specification",
            "brand", "hsn_code", "quantity", "unit_price", "total_price"
        ]
        read_only_fields = ["total_price"]
    
    def create(self, validated_data):
        validated_data['total_price'] = validated_data.get('quantity', 0) * validated_data.get('unit_price', 0)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.unit_price = validated_data.get('unit_price', instance.unit_price)
        instance.total_price = instance.quantity * instance.unit_price
        return super().update(instance, validated_data)


class BillorderSerializer(serializers.ModelSerializer):
    billorder_items = BillorderItemSerializer(many=True)
    
    transactions = PaymentTransactionSerializer(many=True, required=False)
    
    vendor = serializers.StringRelatedField(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(), source="vendor", write_only=True
    )
    deal_no = serializers.CharField(source="deal.deal_no", read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(
        queryset=Deal.objects.all(), source="deal", write_only=True
    )
    created_by = serializers.ReadOnlyField(source="created_by.username")

    class Meta:
        model = Billorder
        fields = [
            "id", "vendor", "vendor_id", "deal_no", "deal_id",
            "bill_number","payment_request", "payment_status", "paid_by", "payment_reference_no",
            "bill_date", "due_date", "notes", "tax_type", "tax_percentage",
            "adjustments", "subtotal", "total_amount", "paid_amount",
            "amount_to_pay", "created_at", "created_by",
            "billorder_items", "transactions"
        ]
        read_only_fields = [
            "created_at", "created_by", "vendor", "deal_no",
            "subtotal", "total_amount", "paid_amount", "amount_to_pay"
        ]

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("billorder_items", [])
        transactions_data = validated_data.pop("transactions", [])
        user = self.context.get("request").user if self.context.get("request") else None
        bill_order = Billorder.objects.create(created_by=user, **validated_data)

        for item_data in items_data:
            BillorderItem.objects.create(bill_order=bill_order, **item_data)
        
        for tx_data in transactions_data:
            serializer = PaymentTransactionSerializer(
                data=tx_data,
                context={'parent_instance': bill_order}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

        bill_order.update_status()
        return bill_order
    
    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("billorder_items", None)
        transactions_data = validated_data.pop("transactions", [])
        # Update bill order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update bill order items
        if items_data is not None:
            existing_items = {item.id: item for item in instance.billorder_items.all()}
            sent_ids = []

            for item_data in items_data:
                item_data['total_price'] = item_data.get('quantity', 0) * item_data.get('unit_price', 0)
                item_id = item_data.get("id")
                if item_id and item_id in existing_items:
                    item = existing_items[item_id]
                    for k, v in item_data.items():
                        setattr(item, k, v)
                    item.save()
                    sent_ids.append(item_id)
                else:
                    new_item = BillorderItem.objects.create(bill_order=instance, **item_data)
                    sent_ids.append(new_item.id)

            # Delete removed items
            for item_id, item in existing_items.items():
                if item_id not in sent_ids:
                    item.delete()
                    
        if transactions_data:
            existing_txs = {tx.id: tx for tx in instance.transactions.all()}

            for tx_data in transactions_data:
                tx_id = tx_data.get('id')
                if tx_id and tx_id in existing_txs:
                    tx_instance = existing_txs[tx_id]
                    serializer = PaymentTransactionSerializer(
                        instance=tx_instance,
                        data=tx_data,
                        partial=True,
                        context={'parent_instance': instance}
                    )
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                elif not tx_id:
                    # Create only if no ID provided
                    tx_data['content_type_id'] = ContentType.objects.get_for_model(instance).pk
                    tx_data['object_id'] = instance.id
                    serializer = PaymentTransactionSerializer(
                        data=tx_data,
                        context={'parent_instance': instance}
                    )
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    
        instance.update_status()
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
        many=True, write_only=True, source="billitem_set")
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(queryset=Deal.objects.all(), source='deal', write_only=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for BillSerializer."""

        model = Bill
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "bill_number",
            "bill_date",
            "deal_no",
            "deal_id",
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
    amount = serializers.ReadOnlyField()

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
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(queryset=Deal.objects.all(), source='deal', write_only=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for InvoiceSerializer."""

        model = Invoice
        fields = [
            "id",
            "customer",
            "customer_id",
            "invoice_number",
            "place_of_supply",
            "deal_no",
            "deal_id",
            "invoice_date",
            "due_date",
            "status",
            "item_details",
            "customer_notes",
            "terms_and_conditions",
            "subtotal_amount",
            "discount_percentage",
            "discount_amount",
            "gst_amount",
            "adjustment_amount",
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
        "subtotal_amount",
        "discount_amount",
        "gst_amount",
        "total_amount",
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
            InvoiceItem.objects.create(
                invoice=invoice, invoice_item_number=idx, **item_data
            )  # pylint: disable=no-member
            
        invoice.update_totals()
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
            for idx, item_data in enumerate(item_details_data, 1):
                
                InvoiceItem.objects.create(
                    invoice=invoice,
                    invoice_item_number=idx,
                    **item_data
                )
        invoice.update_totals()

        return invoice

class DraftInvoiceItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)  #
    class Meta:
        model = DraftInvoiceItem
        fields = [
            'id',
            'item',
            'quantity',
            'rate',
            'amount',
            'invoice_item_number',
        ]
        read_only_fields = ["id", "amount"]

class DraftInvoiceSerializer(serializers.ModelSerializer):
    item_details = DraftInvoiceItemSerializer(many=True)
    files = serializers.PrimaryKeyRelatedField(many=True, queryset=CustomerDocument.objects.all(), required=False)
    
    customer_name = serializers.CharField(source='customer.display_name', read_only=True)
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)

    class Meta:
        model = DraftInvoice
        fields = [
            'id',
            'status',
            'customer',
            'customer_name',
            'invoice_number',
            'place_of_supply',
            'deal',
            'deal_no',
            'invoice_date',
            'due_date',
            'subtotal_amount',
            'discount_percentage',
            'discount_amount',
            'gst_amount',
            'adjustment_amount',
            'total_amount',
            'customer_notes',
            'terms_and_conditions',
            'files',
            'item_details',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at','customer_name','discount_amount', 'deal_no']

    def create(self, validated_data):
        item_details_data = validated_data.pop('item_details', [])
        files_data = validated_data.pop('files', [])
        draft_invoice = DraftInvoice.objects.create(**validated_data)
        draft_invoice.files.set(files_data)
        for idx, item_data in enumerate(item_details_data, 1):
            DraftInvoiceItem.objects.create(draft_invoice=draft_invoice, invoice_item_number=idx, **item_data)
        draft_invoice.update_totals()
        return draft_invoice
    
    def validate_invoice_number(self, value):
        """
        Ensure invoice_number is unique across both Invoice and DraftInvoice tables.
        """
        if value:  # only validate if provided
            from .models import Invoice, DraftInvoice

            # Check in Invoice model (finalized invoices)
            if Invoice.objects.filter(invoice_number=value).exists():
                raise serializers.ValidationError(f"Invoice number '{value}' already exists in published invoices.")

            # Check in DraftInvoice model (other drafts)
            if DraftInvoice.objects.filter(invoice_number=value).exclude(id=self.instance.id if self.instance else None).exists():
                raise serializers.ValidationError(f"Invoice number '{value}' already exists in draft invoices.")

        return value


    def update(self, instance, validated_data):
        item_details_data = validated_data.pop('item_details', [])
        files_data = validated_data.pop('files', [])

        # Update fields on DraftInvoice instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update files M2M
        instance.files.set(files_data)

        # Map existing items by their id for quick lookup
        existing_items = {item.id: item for item in instance.item_details.all()}
        incoming_ids = [item_data.get('id') for item_data in item_details_data if item_data.get('id')]

        # Delete items not present in incoming data
        for existing_id in existing_items:
            if existing_id not in incoming_ids:
                existing_items[existing_id].delete()

        # Update existing items or create new items
        for idx, item_data in enumerate(item_details_data, 1):
            item_id = item_data.get('id', None)
            if item_id and item_id in existing_items:
                # Update existing item
                item_instance = existing_items[item_id]
                for attr, value in item_data.items():
                    setattr(item_instance, attr, value)
                item_instance.invoice_item_number = idx
                item_instance.save()
            else:
                # Create new item without id
                DraftInvoiceItem.objects.create(draft_invoice=instance, invoice_item_number=idx, **item_data)
                
        instance.update_totals()
        return instance

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

################################################################################

############################ Quote Serializers #################################
class QuoteItemSerializer(serializers.ModelSerializer):
    """Serializer for QuoteItem model - Flat structure without nested item."""
    
    # Write-only field for selecting inventory item
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), 
        source="item", 
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Computed fields - always populated for both inventory and manual items
    item_name = serializers.SerializerMethodField()
    hsn_code = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    quote_item_number = serializers.IntegerField(read_only=True)

    class Meta:
        model = QuoteItem
        fields = [
            "id",
            "item_id",                     # Just ID for reference
            "is_manual_item",
            "manual_item_name",
            "manual_item_description",
            "manual_hsn_code",
            "item_name",                   # Always computed
            "hsn_code",                    # Always computed
            "description",                 # Always computed                   
            "quantity",
            "rate",
            "amount",
            "quote_item_number",
        ]
        read_only_fields = ["id", "amount", "item_name", "hsn_code", "description", "unit"]
    
    def get_item_name(self, obj):
        """Get name from manual entry or inventory item"""
        return obj.get_item_name()
    
    def get_hsn_code(self, obj):
        """Get HSN from manual entry or inventory item"""
        return obj.get_hsn_code()
    
    def get_description(self, obj):
        """Get description from manual entry or inventory item"""
        return obj.get_description()

    def validate(self, data):
        # For updates, check instance values if not in data
        is_manual = data.get('is_manual_item', self.instance.is_manual_item if self.instance else False)
        item = data.get('item', self.instance.item if self.instance else None)
        manual_name = data.get('manual_item_name', self.instance.manual_item_name if self.instance else None)
        
        if is_manual:
            if not manual_name:
                raise serializers.ValidationError({
                    'manual_item_name': 'This field is required for manual items.'
                })
            if item:
                raise serializers.ValidationError({
                    'item_id': 'Cannot provide both inventory item and manual entry.'
                })
        else:
            if not item:
                raise serializers.ValidationError({
                    'item_id': 'This field is required for inventory items.'
                })
        
        # Ensure quantity and rate are non-negative
        if data.get("quantity", 0) < 0:
            raise serializers.ValidationError("Quantity cannot be negative")
        if data.get("rate", 0) < 0:
            raise serializers.ValidationError("Rate cannot be negative")
        
        return data



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
    
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(queryset=Deal.objects.all(), source='deal', write_only=True)
    
    bank_detail_id = serializers.PrimaryKeyRelatedField(
        queryset=BankDetail.objects.all(),
        source="bank_details",
        write_only=True,
        required=False
    )
    bank_details = BankDetailSerializer(read_only=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for QuoteSerializer."""

        model = Quote
        fields = [
            "id",
            "customer",
            "customer_id",
            "quote_number",
            "deal_no",
            "deal_id",
            "place_of_supply",
            "quote_date",
            "due_date",
            "salesperson",
            "project_name",
            "subject",
            "item_details",
            "customer_notes",
            "terms_and_conditions",
            "subtotal_amount",
            "discount_percentage",
            "discount_amount",
            "tax_percentage",
            "gst_amount",
            "adjustment_amount",
            "total_amount",
            "bank_detail_id",  # write
            "bank_details",     # read
            "status",
            "quote_file_ids",
            "quote_files",
            "created_at",
        ]
    
    read_only_fields = ["id", "created_at", "subtotal_amount", "discount_amount", "gst_amount","total_amount"]

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
            
        quote.update_totals(save=True)
        return quote

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop("item_details", None)
        quote_files = validated_data.pop("quote_files", None)
        
        # Update main Quote fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update quote files if provided
        if quote_files is not None:
            instance.quote_files.set(quote_files)

        if item_details_data is not None:
            # Map existing items by id
            existing_items = {item.id: item for item in instance.item_details.all()}
            incoming_ids = [item_data.get('id') for item_data in item_details_data if item_data.get('id')]

            # Delete removed items
            for existing_id in existing_items:
                if existing_id not in incoming_ids:
                    existing_items[existing_id].delete()

            # Update or create items
            for idx, item_data in enumerate(item_details_data, start=1):
                item_id = item_data.get('id', None)
                if item_id and item_id in existing_items:
                    item_instance = existing_items[item_id]
                    for attr, value in item_data.items():
                        setattr(item_instance, attr, value)
                    item_instance.quote_item_number = idx
                    # Recalculate amount if not provided
                    if "amount" not in item_data:
                        item_instance.amount = item_instance.quantity * item_instance.rate
                    item_instance.save()
                else:
                    # New item
                    if "amount" not in item_data:
                        item_data["amount"] = item_data.get("quantity", 0) * item_data.get("rate", 0)
                    QuoteItem.objects.create(
                        quote=instance,
                        quote_item_number=idx,
                        **item_data
                    )

        instance.update_totals(save=True)
        return instance


class DraftQuoteItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)  # for updating existing items
    hsn_code = serializers.CharField(source='item.hsn_code', read_only=True)
    
    class Meta:
        model = DraftQuoteItem
        fields = [
            'id',
            'item',
            'hsn_code',
            'quantity',
            'rate',
            'amount',
            'quote_item_number',
        ]
        read_only_fields = ["id", "amount", "hsn_code"]

    def validate(self, data):
        if data.get("quantity", 0) < 0:
            raise serializers.ValidationError("Quantity cannot be negative")
        if data.get("rate", 0) < 0:
            raise serializers.ValidationError("Rate cannot be negative")
        return data


class DraftQuoteSerializer(serializers.ModelSerializer):
    item_details = DraftQuoteItemSerializer(many=True)
    quote_files = serializers.PrimaryKeyRelatedField(
        many=True, queryset=CustomerDocument.objects.all(), required=False
    )
    customer_name = serializers.CharField(source='customer.display_name', read_only=True)
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)

    class Meta:
        model = DraftQuote
        fields = [
            'id',
            'status',
            'customer',
            'customer_name',
            'quote_number',
            'place_of_supply',
            'deal',
            'deal_no',
            'quote_date',
            'due_date',
            'salesperson',
            'project_name',
            'subject',
            'item_details',
            'customer_notes',
            'terms_and_conditions',
            'subtotal_amount',
            'discount_percentage',
            'discount_amount',
            'tax_percentage',
            'gst_amount',
            'adjustment_amount',
            'total_amount',
            'quote_files',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'customer_name', 'deal_no',
                            'subtotal_amount', 'discount_amount', 'gst_amount', 'total_amount']

    def create(self, validated_data):
        item_details_data = validated_data.pop('item_details', [])
        quote_files_data = validated_data.pop('quote_files', [])
        draft_quote = DraftQuote.objects.create(**validated_data)
        draft_quote.quote_files.set(quote_files_data)
        for idx, item_data in enumerate(item_details_data, start=1):
            DraftQuoteItem.objects.create(draft_quote=draft_quote, quote_item_number=idx, **item_data)
        draft_quote.update_totals()
        return draft_quote
    
    def validate_quote_number(self, value):
        """
        Ensure invoice_number is unique across both Invoice and DraftInvoice tables.
        """
        if value:  # only validate if provided
            from .models import Quote, DraftQuote

            # Check in Invoice model (finalized invoices)
            if Quote.objects.filter(quote_number=value).exists():
                raise serializers.ValidationError(f"Quote number '{value}' already exists in published quotes.")

            # Check in DraftInvoice model (other drafts)
            if DraftQuote.objects.filter(quote_number=value).exclude(id=self.instance.id if self.instance else None).exists():
                raise serializers.ValidationError(f"quote number '{value}' already exists in draft quotes.")

        return value

    def update(self, instance, validated_data):
        item_details_data = validated_data.pop('item_details', [])
        quote_files_data = validated_data.pop('quote_files', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.quote_files.set(quote_files_data)

        # Map existing items by id
        existing_items = {item.id: item for item in instance.item_details.all()}
        incoming_ids = [item_data.get('id') for item_data in item_details_data if item_data.get('id')]

        # Delete removed items
        for existing_id in existing_items:
            if existing_id not in incoming_ids:
                existing_items[existing_id].delete()

        # Update or create items
        for idx, item_data in enumerate(item_details_data, start=1):
            item_id = item_data.get('id', None)
            if item_id and item_id in existing_items:
                item_instance = existing_items[item_id]
                for attr, value in item_data.items():
                    setattr(item_instance, attr, value)
                item_instance.quote_item_number = idx
                item_instance.save()
            else:
                DraftQuoteItem.objects.create(draft_quote=instance, quote_item_number=idx, **item_data)

        instance.update_totals()
        return instance

    def publish(self):
        """Publish draft quote to final Quote."""
        draft_quote = self.instance
        if not draft_quote:
            raise ValidationError("DraftQuote instance is required to publish.")

        draft_quote.validate_for_publish()

        with transaction.atomic():
            existing_quote = Quote.objects.filter(quote_number=draft_quote.quote_number).first()
            if existing_quote and existing_quote.pk != getattr(draft_quote, 'final_quote_id', None):
                raise ValidationError(f"Quote number {draft_quote.quote_number} already exists.")

            quote, created = Quote.objects.update_or_create(
                quote_number=draft_quote.quote_number,
                defaults={
                    'customer': draft_quote.customer,
                    'place_of_supply': draft_quote.place_of_supply,
                    'deal': draft_quote.deal,
                    'quote_date': draft_quote.quote_date,
                    'expiry_date': draft_quote.due_date,
                    'salesperson': draft_quote.salesperson,
                    'project_name': draft_quote.project_name,
                    'subject': draft_quote.subject,
                    'subtotal_amount': draft_quote.subtotal_amount,
                    'discount_percentage': draft_quote.discount_percentage,
                    'discount_amount': draft_quote.discount_amount,
                    'tax_percentage': draft_quote.tax_percentage,
                    'gst_amount': draft_quote.gst_amount,
                    'adjustment_amount': draft_quote.adjustment_amount,
                    'total_amount': draft_quote.total_amount,
                    'customer_notes': draft_quote.customer_notes,
                    'terms_and_conditions': draft_quote.terms_and_conditions,
                    'status': 'sent',
                },
            )

            # Copy items
            quote.item_details.all().delete()
            for draft_item in draft_quote.item_details.all():
                QuoteItem.objects.create(
                    quote=quote,
                    item=draft_item.item,
                    quantity=draft_item.quantity,
                    rate=draft_item.rate,
                    amount=draft_item.amount,
                    quote_item_number=draft_item.quote_item_number,
                )

            # Copy files
            quote.quote_files.set(draft_quote.quote_files.all())
            quote.save()

            # Delete draft
            draft_quote.delete()

        transaction.on_commit(lambda: quote.refresh_from_db())
        return quote


################################################################################

######################### Proforma Invoice Serializers #########################

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
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(queryset=Deal.objects.all(), source='deal', write_only=True)

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for ProformaInvoiceSerializer."""

        model = ProformaInvoice
        fields = [
            "id",
            "customer",
            "customer_id",
            "invoice_number",
            "deal_no",
            "deal_id",
            "place_of_supply",
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

################################################################################

######################## Delivery Challan Serializers ##########################
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
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(queryset=Deal.objects.all(), source='deal', write_only=True)

    """Serializer for DeliveryChallan model."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Meta options for DeliveryChallanSerializer."""

        model = DeliveryChallan
        fields = [
            "id",
            "customer",
            "customer_id",
            "challan_number",
            "deal_no",
            "deal_id",
            "place_of_supply",
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

################################################################################


######################## Inventory Adjustment Serializers ######################
class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    """Serializer for InventoryAdjustment model."""
    
class DealSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(),source='customer', write_only=True)

    class Meta:
        model = Deal
        fields = ['id', 'deal_no', 'customer', 'customer_id','start_date', 'end_date', 'created_at']
        read_only_fields = ['id', 'created_at']
