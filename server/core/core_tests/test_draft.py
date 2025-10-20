from django.test import TestCase
from django.core.exceptions import ValidationError
from ..models import DraftInvoice, DraftInvoiceItem, Invoice, InvoiceItem, Customer, Item, Deal
from ..serializers import DraftInvoiceSerializer
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

class DraftInvoiceTests(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(display_name="Test Customer", email="test@example.com")
        self.deal = Deal.objects.create(deal_no="D001", customer=self.customer)  # Existing deal setup
        self.item1 = Item.objects.create(name="Item 1", hsn_code="1001")
        self.item2 = Item.objects.create(name="Item 2", hsn_code="1002")

    def test_create_draft_invoice_with_items(self):
        draft = DraftInvoice.objects.create(customer=self.customer, invoice_number="INV-DRAFT-1", deal=self.deal)
        DraftInvoiceItem.objects.create(draft_invoice=draft, item=self.item1, quantity=2, rate=100, amount=200)
        DraftInvoiceItem.objects.create(draft_invoice=draft, item=self.item2, quantity=1, rate=300, amount=300)
        self.assertEqual(draft.item_details.count(), 2)

    def test_validate_for_publish_missing_required_fields(self):
        draft = DraftInvoice.objects.create()  # Create and save draft before validating
        with self.assertRaises(ValidationError) as context:
            draft.validate_for_publish()
        self.assertIn('customer', context.exception.message_dict)
        self.assertIn('invoice_date', context.exception.message_dict)
        self.assertIn('due_date', context.exception.message_dict)
        self.assertIn('invoice_number', context.exception.message_dict)
        self.assertIn('item_details', context.exception.message_dict)

    def test_publish_creates_final_invoice_and_items(self):
        draft = DraftInvoice.objects.create(
            customer=self.customer,
            invoice_number="INV-DRAFT-2",
            invoice_date="2025-10-20",
            due_date="2025-11-20",
            deal=self.deal,  # Add deal to fix not-null violation
            subtotal_amount=500,
            gst_amount=90,
            total_amount=590,
        )
        DraftInvoiceItem.objects.create(draft_invoice=draft, item=self.item1, quantity=2, rate=100, amount=200)
        DraftInvoiceItem.objects.create(draft_invoice=draft, item=self.item2, quantity=1, rate=300, amount=300)

        final_invoice = draft.publish()

        with self.assertRaises(DraftInvoice.DoesNotExist):
            DraftInvoice.objects.get(pk=draft.pk)

        self.assertEqual(final_invoice.invoice_number, "INV-DRAFT-2")
        self.assertEqual(final_invoice.customer, self.customer)
        self.assertEqual(final_invoice.status, "UNPAID")
        self.assertEqual(final_invoice.item_details.count(), 2)

        final_items = final_invoice.item_details.all()
        self.assertTrue(final_items.filter(item=self.item1, quantity=2).exists())
        self.assertTrue(final_items.filter(item=self.item2, quantity=1).exists())

    def test_publish_duplicate_invoice_number_raises_error(self):
        Invoice.objects.create(
            invoice_number="INV-EXISTING",
            customer=self.customer,
            invoice_date="2025-10-01",
            due_date="2025-10-15",
            deal=self.deal  # Add deal here as well
        )

        draft = DraftInvoice.objects.create(
            customer=self.customer,
            invoice_number="INV-EXISTING",
            invoice_date="2025-10-20",
            due_date="2025-11-20",
            deal=self.deal  # Include deal to prevent not-null error
        )
        DraftInvoiceItem.objects.create(
    draft_invoice=draft,
    item=self.item1,
    quantity=1,
    rate=100,
    amount=100,
)


        with self.assertRaises(ValidationError) as context:
            draft.publish()
        self.assertIn("Invoice number INV-EXISTING already exists.", str(context.exception))

    def test_partial_update_draft_invoice_items(self):
        draft = DraftInvoice.objects.create(
            customer=self.customer,
            invoice_number="INV-DRAFT-UPDATE",
            invoice_date="2025-10-20",
            due_date="2025-11-20",
            deal=self.deal  # Add deal here too
        )
        item1 = DraftInvoiceItem.objects.create(draft_invoice=draft, item=self.item1, quantity=2, rate=100, amount=200)
        item2 = DraftInvoiceItem.objects.create(draft_invoice=draft, item=self.item2, quantity=1, rate=300, amount=300)

        new_item = Item.objects.create(name="Item 3", hsn_code="1003")
        update_data = {
    'customer': self.customer.pk,
    'invoice_number': "INV-DRAFT-UPDATE",
    'deal': self.deal.pk,
    'item_details': [
        {
            'id': item1.id,  # Must include correct existing item id to update
            'item': self.item1.pk,
            'quantity': 5,
            'rate': 100,
            'amount': 500,
            'invoice_item_number': 1,
        },
        {
            'item': new_item.pk,
            'quantity': 3,
            'rate': 150,
            'amount': 450,
            'invoice_item_number': 2,
        }
    ]
}


        serializer = DraftInvoiceSerializer(draft, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        draft.refresh_from_db()
        print("Draft items after update:", list(draft.item_details.values_list('id', flat=True)))
        self.assertEqual(draft.item_details.count(), 2)
        updated_item = draft.item_details.get(id=item1.id)
        self.assertEqual(updated_item.quantity, 5)
        self.assertTrue(draft.item_details.filter(item=new_item).exists())
        self.assertFalse(draft.item_details.filter(id=item2.id).exists())
