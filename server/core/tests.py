
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.contrib.auth import get_user_model
from .models import (
    Vendor, Item, Invoice, Bill, ContactPerson, DeliveryChallan, ProformaInvoice, InventoryAdjustment,
    Customer, CustomerDocument, Quote, DailySummary
)
import io
from django.core.files.uploadedfile import SimpleUploadedFile


class DeliveryChallanFileAttachmentTestCase(APITestCase):
    """Test attaching files to DeliveryChallan via API and retrieving them."""
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="challanfileuser", password="challanfilepass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            display_name="Test Customer Challan", email="testchallan@example.com"
        )
        # Create files
        self.file1 = CustomerDocument.objects.create(file="file1.pdf")
        self.file2 = CustomerDocument.objects.create(file="file2.pdf")
        self.file3 = CustomerDocument.objects.create(file="file3.pdf")
        self.challan_data = {
            "customer_id": self.customer.id,
            "challan_number": "DC-2025-TEST",
            "date": "2025-09-04",
            "challan_type": "others",
            "item_details": [],
            "delivery_challan_file_ids": [self.file1.id, self.file2.id, self.file3.id],
        }

    def test_create_challan_with_files(self):
        url = reverse("deliverychallan-list")
        response = self.client.post(url, self.challan_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("delivery_challan_file_ids", response.data)
        self.assertEqual(set(response.data["delivery_challan_file_ids"]), {self.file1.id, self.file2.id, self.file3.id})

    def test_retrieve_challan_with_files(self):
        url = reverse("deliverychallan-list")
        create_resp = self.client.post(url, self.challan_data, format="json")
        challan_id = create_resp.data["id"]
        get_url = reverse("deliverychallan-detail", args=[challan_id])
        get_resp = self.client.get(get_url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertIn("delivery_challan_file_ids", get_resp.data)
        self.assertEqual(set(get_resp.data["delivery_challan_file_ids"]), {self.file1.id, self.file2.id, self.file3.id})

    def test_create_challan_invalid_customer(self):
        url = reverse("deliverychallan-list")
        data = {"customer_id": 9999, "challan_number": "DC-ERR", "date": "2025-09-04", "challan_type": "others"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_create_challan_unauthenticated(self):
        self.client.logout()
        url = reverse("deliverychallan-list")
        data = {"customer_id": self.customer.id, "challan_number": "DC-ERR2", "date": "2025-09-04", "challan_type": "others"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)


class InvoiceFileAttachmentTestCase(APITestCase):
    """Test attaching files to Invoice via API and retrieving them."""
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="invoicefileuser", password="invoicefilepass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            display_name="Test Customer Invoice", email="testinv@example.com"
        )
        # Create files
        self.file1 = CustomerDocument.objects.create(file="file1.pdf")
        self.file2 = CustomerDocument.objects.create(file="file2.pdf")
        self.file3 = CustomerDocument.objects.create(file="file3.pdf")
        self.inv_data = {
            "customer_id": self.customer.id,
            "invoice_number": "INV-2025-TEST",
            "invoice_date": "2025-09-04",
            "item_details": [],
            "invoice_file_ids": [self.file1.id, self.file2.id, self.file3.id],
        }

    def test_create_invoice_with_files(self):
        url = reverse("invoice-list")
        response = self.client.post(url, self.inv_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("invoice_file_ids", response.data)
        self.assertEqual(set(response.data["invoice_file_ids"]), {self.file1.id, self.file2.id, self.file3.id})

    def test_retrieve_invoice_with_files(self):
        url = reverse("invoice-list")
        create_resp = self.client.post(url, self.inv_data, format="json")
        inv_id = create_resp.data["id"]
        get_url = reverse("invoice-detail", args=[inv_id])
        get_resp = self.client.get(get_url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertIn("invoice_file_ids", get_resp.data)
        self.assertEqual(set(get_resp.data["invoice_file_ids"]), {self.file1.id, self.file2.id, self.file3.id})

    def test_create_invoice_invalid_customer(self):
        url = reverse("invoice-list")
        data = {"customer_id": 9999, "invoice_number": "INV-ERR", "invoice_date": "2025-09-04"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_create_invoice_unauthenticated(self):
        self.client.logout()
        url = reverse("invoice-list")
        data = {"customer_id": self.customer.id, "invoice_number": "INV-ERR2", "invoice_date": "2025-09-04"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)
from .serializers import CustomerDocumentSerializer

class ReportAndFileViewCoverageTestCase(APITestCase):
    """Test Balance Sheet report and file view coverage for API endpoints."""
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="testuser", password="testpass")
        self.client.force_authenticate(user=self.user)
    def test_balance_sheet_report_cash_basis(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("balance-sheet-report")
        resp = self.client.get(url, {"time": "Today", "basis": "Cash"})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("assets", resp.data)

    def test_balance_sheet_report_invalid_basis(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("balance-sheet-report")
        resp = self.client.get(url, {"time": "Today", "basis": "Invalid"})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("assets", resp.data)

class ModelStrCoverageTestCase(APITestCase):
    """Test __str__ methods for all major models for coverage and correctness."""
    def setUp(self):
        self.vendor = Vendor.objects.create(name="Vendor1", email="v1@example.com")
        self.item = Item.objects.create(name="Item1", description="desc", price=10, sku="SKU1")
        self.customer = Customer.objects.create(display_name="Cust1", email="c1@example.com")
        self.invoice = Invoice.objects.create(customer=self.customer, invoice_number="INV1", invoice_date="2025-09-04")
        self.bill = Bill.objects.create(vendor=self.vendor, bill_number="BILL1", bill_date="2025-09-04", due_date="2025-09-10")
        self.contact = ContactPerson.objects.create(customer=self.customer, first_name="A", last_name="B", email="ab@example.com")
        self.dc = DeliveryChallan.objects.create(customer=self.customer, challan_number="DC1", date="2025-09-04")
        self.pi = ProformaInvoice.objects.create(customer=self.customer, invoice_number="PI1", invoice_date="2025-09-04", expiry_date="2025-09-10")
        self.ia = InventoryAdjustment.objects.create(item=self.item, adjustment_number="ADJ1", date="2025-09-04", quantity=1, reason="add")

    def test_vendor_str(self):
        self.assertEqual(str(self.vendor), "Vendor1")

    def test_item_str(self):
        self.assertEqual(str(self.item), "Item1")

    def test_invoice_str(self):
        self.assertIn("INV1", str(self.invoice))

    def test_bill_str(self):
        self.assertIn("BILL1", str(self.bill))

    def test_contactperson_str(self):
        self.assertIn("ab@example.com", str(self.contact))

    def test_deliverychallan_str(self):
        self.assertIn("DC1", str(self.dc))

    def test_proformainvoice_str(self):
        self.assertIn("PI1", str(self.pi))

    def test_inventoryadjustment_str(self):
        self.assertIn("ADJ1", str(self.ia))


class CustomerDocumentFileTests(APITestCase):
    """Test file upload, update, and validation for CustomerDocument API endpoints."""
    def setUp(self):
        import tempfile
        from django.core.files import File
        self.user = get_user_model().objects.create_user(username="reportuser", password="testpass")
        self.client.force_authenticate(user=self.user)
        self.factory = APIRequestFactory()
        self.tempfile = tempfile.NamedTemporaryFile(delete=False)
        self.tempfile.write(b"dummy content")
        self.tempfile.flush()
        self.tempfile.seek(0)
        django_file = File(self.tempfile, name="testfile.txt")
        self.file = CustomerDocument.objects.create(file=django_file)

    def tearDown(self):
        import os
        try:
            os.unlink(self.tempfile.name)
        except OSError:
            pass

    def test_customer_document_upload_too_large(self):
        # Simulate a file >10MB
        bigfile = SimpleUploadedFile("bigfile.pdf", b"0" * (10 * 1024 * 1024 + 1), content_type="application/pdf")
        resp = self.client.post(reverse("file-list"), {"file": bigfile}, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("file", resp.data)

    def test_customer_document_upload_invalid_extension(self):
        badfile = SimpleUploadedFile("badfile.exe", b"dummy", content_type="application/octet-stream")
        resp = self.client.post(reverse("file-list"), {"file": badfile}, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("file", resp.data)

    def test_customer_document_partial_update(self):
        # Valid partial update (should not error)
        url = reverse("file-detail", args=[self.file.id])
        resp = self.client.patch(url, {}, format="multipart")
        self.assertIn(resp.status_code, [200, 202])

    def test_customer_document_update_invalid(self):
        # Try to update with a too-large file
        url = reverse("file-detail", args=[self.file.id])
        bigfile = SimpleUploadedFile("bigfile2.pdf", b"0" * (10 * 1024 * 1024 + 1), content_type="application/pdf")
        resp = self.client.put(url, {"file": bigfile}, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("file", resp.data)

    def test_customer_document_retrieve(self):
        url = reverse("file-detail", args=[self.file.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Content-Disposition", resp)

class QuoteFileAttachmentTestCase(APITestCase):
    """Test attaching files to Quote via API and retrieving them."""
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="quotefileuser", password="quotefilepass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            display_name="Test Customer", email="testqf@example.com"
        )
        # Create files
        self.file1 = CustomerDocument.objects.create(file="file1.pdf")
        self.file2 = CustomerDocument.objects.create(file="file2.pdf")
        self.file3 = CustomerDocument.objects.create(file="file3.pdf")
        self.quote_data = {
            "customer_id": self.customer.id,
            "quote_number": "Q-2025-TEST",
            "quote_date": "2025-09-04",
            "expiry_date": "2025-09-10",
            "item_details": [],
            "quote_file_ids": [self.file1.id, self.file2.id, self.file3.id],
        }

    def test_create_quote_with_files(self):
        url = reverse("quote-list")
        response = self.client.post(url, self.quote_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("quote_file_ids", response.data)
        self.assertEqual(set(response.data["quote_file_ids"]), {self.file1.id, self.file2.id, self.file3.id})

    def test_retrieve_quote_with_files(self):
        url = reverse("quote-list")
        create_resp = self.client.post(url, self.quote_data, format="json")
        quote_id = create_resp.data["id"]
        get_url = reverse("quote-detail", args=[quote_id])
        get_resp = self.client.get(get_url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertIn("quote_file_ids", get_resp.data)
        self.assertEqual(set(get_resp.data["quote_file_ids"]), {self.file1.id, self.file2.id, self.file3.id})

    def test_create_quote_invalid_customer(self):
        url = reverse("quote-list")
        data = {"customer_id": 9999, "quote_number": "Q-ERR", "quote_date": "2025-09-04", "expiry_date": "2025-09-10"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_create_quote_unauthenticated(self):
        self.client.logout()
        url = reverse("quote-list")
        data = {"customer_id": self.customer.id, "quote_number": "Q-ERR2", "quote_date": "2025-09-04", "expiry_date": "2025-09-10"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)

class CoverageBoostTestCase(APITestCase):
    """Test additional model and serializer coverage for edge cases and validation."""
    def setUp(self):
        self.customer = Customer.objects.create(display_name="Coverage Customer", email="cov@example.com")
        self.file = CustomerDocument.objects.create(file="file.pdf")
        self.quote = Quote.objects.create(customer=self.customer, quote_number="Q-COV-1", quote_date="2025-09-04", expiry_date="2025-09-10")

    def test_customer_str(self):
        self.assertEqual(str(self.customer), "Coverage Customer")

    def test_customerdocument_clean_too_large(self):
        class DummyFile:
            size = 11 * 1024 * 1024
        doc = CustomerDocument(file=DummyFile())
        with self.assertRaises(ValidationError):
            doc.clean()

    def test_customerdocumentserializer_file_validation(self):
        class DummyFile:
            size = 11 * 1024 * 1024
        serializer = CustomerDocumentSerializer()
        with self.assertRaises(DRFValidationError):
            serializer.validate_file(DummyFile())

    def test_quote_str(self):
        self.assertIn("Q-COV-1", str(self.quote))

    def test_daily_summary_str(self):
        summary = DailySummary.objects.create(date="2025-09-04")
        self.assertIn("2025-09-04", str(summary))

class ProformaInvoiceFileAttachmentTestCase(APITestCase):
    """Test attaching files to ProformaInvoice via API and retrieving them."""
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="proformafileuser", password="proformafilepass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            display_name="Test Customer PI", email="testpi@example.com"
        )
        # Create files
        self.file1 = CustomerDocument.objects.create(file="file1.pdf")
        self.file2 = CustomerDocument.objects.create(file="file2.pdf")
        self.file3 = CustomerDocument.objects.create(file="file3.pdf")
        self.pi_data = {
            "customer_id": self.customer.id,
            "invoice_number": "PI-2025-TEST",
            "invoice_date": "2025-09-04",
            "expiry_date": "2025-09-10",
            "item_details": [],
            "proforma_invoice_file_ids": [self.file1.id, self.file2.id, self.file3.id],
        }

    def test_create_proforma_invoice_with_files(self):
        url = reverse("proformainvoice-list")
        response = self.client.post(url, self.pi_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("proforma_invoice_file_ids", response.data)
        self.assertEqual(set(response.data["proforma_invoice_file_ids"]), {self.file1.id, self.file2.id, self.file3.id})

    def test_retrieve_proforma_invoice_with_files(self):
        url = reverse("proformainvoice-list")
        create_resp = self.client.post(url, self.pi_data, format="json")
        pi_id = create_resp.data["id"]
        get_url = reverse("proformainvoice-detail", args=[pi_id])
        get_resp = self.client.get(get_url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertIn("proforma_invoice_file_ids", get_resp.data)
        self.assertEqual(set(get_resp.data["proforma_invoice_file_ids"]), {self.file1.id, self.file2.id, self.file3.id})

    def test_create_proforma_invoice_invalid_customer(self):
        url = reverse("proformainvoice-list")
        data = {"customer_id": 9999, "invoice_number": "PI-ERR", "invoice_date": "2025-09-04", "expiry_date": "2025-09-10"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_create_proforma_invoice_unauthenticated(self):
        self.client.logout()
        url = reverse("proformainvoice-list")
        data = {"customer_id": self.customer.id, "invoice_number": "PI-ERR2", "invoice_date": "2025-09-04", "expiry_date": "2025-09-10"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)
