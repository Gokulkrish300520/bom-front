from decimal import Decimal
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from server.core.models import Customer, Invoice
from datetime import date, timedelta


class InvoiceFieldAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="invoicefielduser", password="testpass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            display_name="FieldTest Customer", email="ftest@example.com"
        )
        self.invoice = Invoice.objects.create(
            customer=self.customer,
            invoice_number="INV-FIELD-001",
            order_number="ORD-FIELD-001",
            invoice_date=date.today(),
            due_date=date.today() + timedelta(days=10),
            status="PAID",
            subtotal_amount=Decimal("1234.56"),
            gst_amount=Decimal("222.22"),
            total_amount=Decimal("1456.78"),
            customer_notes="Field test notes",
            terms_and_conditions="Field test terms",
        )

    def test_invoice_fields_in_api_response(self):
        url = reverse("invoice-detail", args=[self.invoice.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data["id"], self.invoice.id)
        self.assertEqual(data["status"], "PAID")
        self.assertEqual(data["due_date"], str(self.invoice.due_date))
        self.assertEqual(Decimal(data["subtotal_amount"]), Decimal("1234.56"))
        self.assertEqual(Decimal(data["gst_amount"]), Decimal("222.22"))
        self.assertEqual(Decimal(data["total_amount"]), Decimal("1456.78"))
        self.assertIn("item_details", data)
        self.assertIn("customer_notes", data)
        self.assertIn("terms_and_conditions", data)

    def test_invoice_fields_are_writable(self):
        url = reverse("invoice-detail", args=[self.invoice.id])
        patch_data = {
            "subtotal_amount": "9999.99",
            "gst_amount": "888.88",
            "status": "CANCELLED",
            "due_date": "2099-12-31",
        }
        response = self.client.patch(url, patch_data, format="json")
        self.assertEqual(response.status_code, 200)
        # Fetch again to confirm values changed
        response = self.client.get(url)
        data = response.data
        self.assertEqual(Decimal(data["subtotal_amount"]), Decimal("9999.99"))
        self.assertEqual(Decimal(data["gst_amount"]), Decimal("888.88"))
        self.assertEqual(data["status"], "CANCELLED")
        self.assertEqual(data["due_date"], "2099-12-31")
