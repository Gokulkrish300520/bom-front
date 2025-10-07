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
    Deal
)
from rest_framework import serializers
from .inventory_management_models import (
    InventoryManagement
)
from .purchase_models import (
    Freight,FreightItem,ImportBill,ImportBillItem,Duty,DutyItem,Gst,GstItem,NonGst,NonGstItem,Billorder,BillorderItem
)

from rest_framework import serializers
from rest_framework.exceptions import ValidationError


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
            "items",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "vendor", "deal_no", "created_by", "created_at", "total_amount"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        user = self.context['request'].user if 'request' in self.context else None
        bill = Gst.objects.create(created_by=user, **validated_data)

        total_amount = 0
        for item_data in items_data:
            item_data['total_price'] = item_data.get('quantity', 0) * item_data.get('unit_price', 0)
            GstItem.objects.create(gst=bill, **item_data)
            total_amount += item_data['total_price']

        bill.total_amount = total_amount
        bill.save()
        return bill

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        # Update top-level fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
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
            "items",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "vendor", "deal_no", "created_by", "created_at", "total_amount"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        user = self.context['request'].user if 'request' in self.context else None
        bill = NonGst.objects.create(created_by=user, **validated_data)

        total_amount = 0
        for item_data in items_data:
            item_data['total_price'] = item_data.get('quantity', 0) * item_data.get('unit_price', 0)
            NonGstItem.objects.create(nongst=bill, **item_data)
            total_amount += item_data['total_price']

        bill.total_amount = total_amount
        bill.save()
        return bill

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        # Update top-level fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
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

        return instance

class FreightItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreightItem
        exclude = ['freight']


class FreightSerializer(serializers.ModelSerializer):
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
    items = FreightItemSerializer(many=True)
    created_by = serializers.ReadOnlyField(source="created_by.username")

    class Meta:
        model = Freight
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "deal_no",
            "deal_id",
            "date",
            "currency",
            "items",
            "total_amount",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "vendor", "deal_no", "created_by", "created_at"]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user if 'request' in self.context else None
        freight = Freight.objects.create(created_by=user, **validated_data)

        total = 0
        for item_data in items_data:
            # calculate total_price for each item
            quantity = item_data.get("quantity", 0)
            unit_price = item_data.get("unit_price", 0)
            item_data["total_price"] = quantity * unit_price

            item = FreightItem.objects.create(freight=freight, **item_data)
            total += item.total_price or 0

        freight.total_amount = total
        freight.save()
        return freight

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        # update freight fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            existing_items = {item.id: item for item in instance.items.all()}
            sent_item_ids = []

            for item_data in items_data:
                item_id = item_data.get("id", None)
                quantity = item_data.get("quantity", 0)
                unit_price = item_data.get("unit_price", 0)
                item_data["total_price"] = quantity * unit_price

                if item_id:  # update existing
                    if item_id in existing_items:
                        item = existing_items[item_id]
                        for attr, value in item_data.items():
                            setattr(item, attr, value)
                        item.save()
                        sent_item_ids.append(item_id)
                    else:
                        raise ValidationError({"items": f"Invalid item id {item_id}"})
                else:  # create new
                    new_item = FreightItem.objects.create(freight=instance, **item_data)
                    sent_item_ids.append(new_item.id)

            # optionally delete missing items
            for item_id, item in existing_items.items():
                if item_id not in sent_item_ids:
                    item.delete()

            # recalc total_amount
            instance.total_amount = sum(
                item.total_price or 0 for item in instance.items.all()
            )
            instance.save()

        return instance

class ImportBillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportBillItem
        exclude=["bill"]
        extra_kwargs = {
            "bill": {"required": False}  # bill will be set automatically in parent
        }

class ImportBillSerializer(serializers.ModelSerializer):
    bill_items = ImportBillItemSerializer(many=True,required=False)
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
            "bill_items",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "vendor", "deal_no", "created_by", "created_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("bill_items", [])
        user = self.context['request'].user if 'request' in self.context else None
        bill = ImportBill.objects.create(created_by=user, **validated_data)
        total = 0
        for item in items_data:
            new_item = ImportBillItem.objects.create(bill=bill, **item)
            total += new_item.total_price or 0
        bill.total_amount = total
        bill.save()
        return bill

    def update(self, instance, validated_data):
        items_data = validated_data.pop("bill_items", None)

        # update top-level ImportBill fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            existing_items = {item.id: item for item in instance.bill_items.all()}
            sent_item_ids = []

            for item_data in items_data:
                item_id = item_data.get("id", None)

                if item_id:  # update existing item
                    if item_id in existing_items:
                        item = existing_items[item_id]
                        for attr, value in item_data.items():
                            setattr(item, attr, value)
                        item.save()
                        sent_item_ids.append(item_id)
                    else:
                        raise serializers.ValidationError({"bill_items": f"Invalid item id {item_id}"})
                else:  # create new item
                    new_item = ImportBillItem.objects.create(bill=instance, **item_data)
                    sent_item_ids.append(new_item.id)

            # ⚠️ Option 1: Delete missing items
            for item_id, item in existing_items.items():
                if item_id not in sent_item_ids:
                    item.delete()
                    
            instance.total_amount = sum(item.total_price or 0 for item in instance.bill_items.all())
            instance.save()

            
        return instance
  
class DutyItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DutyItem
        exclude=["duty"]
        extra_kwargs = {
            "duty": {"required": False}
        }


class DutySerializer(serializers.ModelSerializer):
    duty_items = DutyItemSerializer(many=True, required=False)
    vendor = serializers.StringRelatedField(read_only=True)
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
    date = serializers.DateField(required=False)
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
            "total_amount",
            "duty_items",
            "created_by",
            "created_at"
        ]
        read_only_fields = ["id", "vendor", "deal_no", "total_amount","created_by","created_at"]

    # CREATE
    def create(self, validated_data):
        items_data = validated_data.pop("duty_items", [])
        user = self.context['request'].user if 'request' in self.context else None
        duty = Duty.objects.create(created_by=user, **validated_data)

        total = 0
        for item_data in items_data:
            duty_item = DutyItem.objects.create(duty=duty, **item_data)
            total += duty_item.total_duty or 0

        duty.total_amount = total
        duty.save()
        return duty

    def update(self, instance, validated_data):
        items_data = validated_data.pop("duty_items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            existing_items = {item.id: item for item in instance.duty_items.all()}
            sent_item_ids = []

            for item_data in items_data:
                item_id = item_data.get("id", None)
                if item_id and item_id in existing_items:
                    item = existing_items[item_id]
                    for attr, value in item_data.items():
                        setattr(item, attr, value)
                    item.save()
                    sent_item_ids.append(item_id)
                else:
                    new_item = DutyItem.objects.create(duty=instance, **item_data)
                    sent_item_ids.append(new_item.id)

            for item_id, item in existing_items.items():
                if item_id not in sent_item_ids:
                    item.delete()

            instance.total_amount = sum(item.total_duty or 0 for item in instance.duty_items.all())
            instance.save()

        return instance

from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from decimal import Decimal, InvalidOperation

class BillorderItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)  # For updates

    class Meta:
        model = BillorderItem
        fields = [
            "id",
            "item_name",
            "description",
            "item_specification",
            "brand",
            "hsn_code",
            "quantity",
            "unit_price",
            "total_price",
        ]
        read_only_fields = ["total_price"]

    def validate(self, attrs):
        # Automatically calculate total_price
        quantity = attrs.get("quantity", 0)
        unit_price = attrs.get("unit_price", 0)
        attrs["total_price"] = quantity * unit_price
        return attrs


class BillorderSerializer(serializers.ModelSerializer):
    billorder_items = BillorderItemSerializer(many=True)
    vendor = serializers.StringRelatedField(read_only=True)
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

    class Meta:
        model = Billorder
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "deal_no",
            "deal_id",
            "bill_number",
            "status",
            "Paid_by"
            "bill_date",
            "due_date",
            "notes",
            "subtotal",
            "tax_type",
            "tax_percentage",
            "adjustments",
            "total_amount",
            "paid_amount",
            "amount_to_pay",
            "created_at",
            "created_by",
            "billorder_items",
        ]
        read_only_fields = ["created_at", "created_by", "vendor", "deal_no", "subtotal", "total_amount", "amount_to_pay"]
    
    def _to_decimal(self, value):
        try:
            return Decimal(str(value or 0))
        except (InvalidOperation, TypeError):
            return Decimal(0)
    
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("billorder_items", [])
        paid_amount = Decimal(validated_data.pop("paid_amount", 0))
        user = self.context['request'].user if 'request' in self.context else None

        bill_order = Billorder.objects.create(created_by=user, **validated_data)

        subtotal = 0
        items_to_create = []
        
        for item_data in items_data:
            quantity = item_data.get("quantity", 0)
            unit_price = item_data.get("unit_price", 0)
            total_price = quantity * unit_price
            subtotal += total_price
            item_data.pop("total_price", None)
            items_to_create.append(BillorderItem(bill_order=bill_order, total_price=total_price, **item_data))

        if items_to_create:
            BillorderItem.objects.bulk_create(items_to_create)

        tax_percentage = Decimal(bill_order.tax_percentage)
        tax_amount = subtotal * tax_percentage / Decimal(100)
        total_amount = subtotal + tax_amount + bill_order.adjustments if bill_order.tax_type == "TCS" else subtotal - tax_amount + bill_order.adjustments

        bill_order.subtotal = subtotal
        bill_order.total_amount = total_amount
        bill_order.paid_amount = paid_amount
        bill_order.amount_to_pay = max(total_amount - paid_amount, 0)

        if paid_amount >= total_amount:
            bill_order.status = "PAID"
        elif paid_amount > 0:
            bill_order.status = "PARTIAL"
        else:
            bill_order.status = "UNPAID"

        bill_order.save()
        return bill_order

    @transaction.atomic
    def update(self, instance, validated_data):
        # Accept either 'paid_amount' (total so far) or 'amount_to_pay' (new payment)
        new_paid = Decimal(validated_data.pop("paid_amount", None) or 0)
        add_paid = Decimal(validated_data.pop("amount_to_pay", 0))
        paid_by = validated_data.pop("paid_by", None)

        # Update fields
        for field in ["vendor", "deal", "bill_number", "bill_date", "due_date", "notes", "tax_type", "tax_percentage", "adjustments"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        # Handle payment logic
        if new_paid:  # if total paid amount is directly provided
            instance.paid_amount = new_paid
        elif add_paid is not None:
        # Incremental payment
            instance.paid_amount += Decimal(add_paid)

    # Ensure paid_amount is never negative
        if instance.paid_amount < 0:
            instance.paid_amount = 0

    # Update paid_by if provided
        if paid_by:
            instance.paid_by = paid_by  # incremental payment

        items_data = validated_data.pop("billorder_items", None)
        subtotal = 0

        if items_data is not None:
            existing_ids = [item.id for item in instance.billorder_items.all()]
            sent_ids = [item.get("id") for item in items_data if item.get("id")]

            # Delete removed items
            for item_id in existing_ids:
                if item_id not in sent_ids:
                    BillorderItem.objects.filter(id=item_id).delete()

            # Update or create items
            for item_data in items_data:
                if "id" in item_data:
                    item = BillorderItem.objects.get(id=item_data["id"], bill_order=instance)
                    for key, value in item_data.items():
                        if key in ["quantity", "unit_price", "item_name", "description", "item_specification", "brand", "hsn_code"]:
                            setattr(item, key, value)
                    item.total_price = item.quantity * item.unit_price
                    item.save()
                    subtotal += item.total_price
                else:
                    quantity = item_data.get("quantity", 0)
                    unit_price = item_data.get("unit_price", 0)
                    total_price = quantity * unit_price
                    subtotal += total_price
                    BillorderItem.objects.create(bill_order=instance, total_price=total_price, **item_data)
        else:
            subtotal = sum(item.total_price for item in instance.billorder_items.all())

        # Recalculate totals
        tax_percentage = Decimal(instance.tax_percentage)
        tax_amount = subtotal * tax_percentage / Decimal(100)
        total_amount = subtotal + tax_amount + instance.adjustments if instance.tax_type == "TCS" else subtotal - tax_amount + instance.adjustments

        instance.subtotal = subtotal
        instance.total_amount = total_amount
        instance.amount_to_pay = max(total_amount - instance.paid_amount, 0)

        # Update status
        if instance.paid_amount >= total_amount:
            instance.status = "PAID"
        elif instance.paid_amount > 0:
            instance.status = "PARTIAL"
        else:
            instance.status = "UNPAID"

        instance.save()
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
            "order_number",
            "deal_no",
            "deal_id",
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
    
    deal_no = serializers.CharField(source='deal.deal_no', read_only=True)
    deal_id = serializers.PrimaryKeyRelatedField(queryset=Deal.objects.all(), source='deal', write_only=True)

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
    
class DealSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(),source='customer', write_only=True)

    class Meta:
        model = Deal
        fields = ['id', 'deal_no', 'customer', 'customer_id','start_date', 'end_date', 'created_at']
        read_only_fields = ['id', 'created_at']
