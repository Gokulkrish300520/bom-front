from django.urls import reverse
from django.contrib.auth import get_user_model

from rest_framework.test import APITestCase
from .models import Customer, Vendor, Invoice, Bill
from decimal import Decimal


class ProfitAndLossReportFilterTestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="plreportuser", password="testpass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer1 = Customer.objects.create(
            display_name="Customer 1", email="c1@example.com"
        )
        self.customer2 = Customer.objects.create(
            display_name="Customer 2", email="c2@example.com"
        )
        self.vendor1 = Vendor.objects.create(
            display_name="Vendor 1", email="v1@example.com"
        )
        self.vendor2 = Vendor.objects.create(
            display_name="Vendor 2", email="v2@example.com"
        )
        self.invoice1 = Invoice.objects.create(
            customer=self.customer1,
            invoice_number="INV-001",
            invoice_date="2025-09-01",
            total_amount=Decimal("100.00"),
        )
        self.invoice2 = Invoice.objects.create(
            customer=self.customer2,
            invoice_number="INV-002",
            invoice_date="2025-09-01",
            total_amount=Decimal("200.00"),
        )
        self.bill1 = Bill.objects.create(
            vendor=self.vendor1,
            bill_number="BILL-001",
            bill_date="2025-09-01",
            due_date="2025-09-10",
            total_amount=Decimal("50.00"),
        )
        self.bill2 = Bill.objects.create(
            vendor=self.vendor2,
            bill_number="BILL-002",
            bill_date="2025-09-01",
            due_date="2025-09-10",
            total_amount=Decimal("75.00"),
        )

    def test_profit_and_loss_filter_by_customer_id(self):
        url = (
            reverse("profit-and-loss-report")
            + f"?customer_id={self.customer1.id}&time=This%20Month"
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["report"]["operating_income"], 100.0)
        # Bills are not filtered by customer
        self.assertIn("cost_of_goods_sold", response.data["report"])

    def test_profit_and_loss_filter_by_vendor_id(self):
        url = (
            reverse("profit-and-loss-report")
            + f"?vendor_id={self.vendor1.id}&time=This%20Month"
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["report"]["cost_of_goods_sold"], 50.0)
        # Invoices are not filtered by vendor
        self.assertIn("operating_income", response.data["report"])

    def test_profit_and_loss_filter_by_customer_and_vendor_id(self):
        url = (
            reverse("profit-and-loss-report")
            + f"?customer_id={self.customer2.id}"
            f"&vendor_id={self.vendor2.id}&time=This%20Month"
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["report"]["operating_income"], 200.0)
        self.assertEqual(response.data["report"]["cost_of_goods_sold"], 75.0)
