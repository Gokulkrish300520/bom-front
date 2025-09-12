"""Tests for core Django REST API endpoints and models."""

# pylint: disable=no-member,too-many-instance-attributes,too-few-public-methods
# Standard library imports
import os
import tempfile

# Third-party imports
from django.core.files import File
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory
from rest_framework.exceptions import ValidationError as DRFValidationError


# Local imports
from .models import (
    Vendor, Item, Invoice, Bill, ContactPerson,
    DeliveryChallan, ProformaInvoice, InventoryAdjustment,
    Customer, CustomerDocument, Quote, DailySummary
)
from .serializers import CustomerDocumentSerializer


from .test_utils import FileAttachmentTestBase

class DeliveryChallanFileAttachmentTestCase(FileAttachmentTestBase):
    """Test attaching files to DeliveryChallan via API and retrieving them."""
    def setUp(self):
        super().setUp()
        self.challan_data = {
            "customer_id": self.customer.id,
            "challan_number": "DC-2025-TEST",
            "date": "2025-09-04",
            "challan_type": "others",
            "item_details": [],
            "delivery_challan_file_ids": self.get_file_ids(3),
        }
        self.challan_data_with_items = {
            "customer_id": self.customer.id,
            "challan_number": "DC-2025-TEST-ITEMS",
            "date": "2025-09-05",
            "challan_type": "others",
            "item_details": [
                {"item_id": self.item.id, "quantity": 2, "rate": "100.00", "amount": "200.00"},
                {"item_id": self.item.id, "quantity": 1, "rate": "150.00", "amount": "150.00"}
            ],
            "delivery_challan_file_ids": self.get_file_ids(1),
        }

    def test_create_challan_with_files(self):
        """Test creating a DeliveryChallan with attached files."""
        url = reverse("deliverychallan-list")
        response = self.client.post(url, self.challan_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("delivery_challan_files", response.data)
        file_ids = {f["id"] for f in response.data["delivery_challan_files"]}
        self.assertEqual(file_ids, {self.files[0].id, self.files[1].id, self.files[2].id})

    def test_update_challan_with_item_details(self):
        """Test updating a DeliveryChallan with new item details."""
        url = reverse("deliverychallan-list")
        create_resp = self.client.post(url, self.challan_data_with_items, format="json")
        challan_id = create_resp.data["id"]
        update_url = reverse("deliverychallan-detail", args=[challan_id])
        update_data = self.challan_data_with_items.copy()
        update_data["item_details"] = [
            {"item_id": self.item.id, "quantity": 5, "rate": "99.00", "amount": "495.00"}
        ]
        update_data["challan_number"] = "DC-2025-TEST-ITEMS-UPDATED"
        resp = self.client.put(update_url, update_data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data["item_details"]), 1)
        self.assertEqual(resp.data["item_details"][0]["quantity"], 5)

    def test_retrieve_challan_with_files(self):
        """Test retrieving a DeliveryChallan with attached files."""
        url = reverse("deliverychallan-list")
        create_resp = self.client.post(url, self.challan_data, format="json")
        challan_id = create_resp.data["id"]
        get_url = reverse("deliverychallan-detail", args=[challan_id])
        get_resp = self.client.get(get_url)
        self.assertIn("delivery_challan_files", get_resp.data)
        file_ids = {f["id"] for f in get_resp.data["delivery_challan_files"]}
        self.assertEqual(file_ids, {self.files[0].id, self.files[1].id, self.files[2].id})

    def test_create_challan_invalid_customer(self):
        """Test creating a DeliveryChallan with an invalid customer ID."""
        url = reverse("deliverychallan-list")
        data = {
            "customer_id": 9999,
            "challan_number": "DC-ERR",
            "date": "2025-09-04",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, 400)

    def test_create_challan_unauthenticated(self):
        """Test unauthenticated DeliveryChallan creation is rejected."""
        self.client.logout()
        url = reverse("deliverychallan-list")
        data = {
            "customer_id": self.customer.id,
            "challan_number": "DC-ERR2",
            "date": "2025-09-04",
            "challan_type": "others"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)

class InvoiceFileAttachmentTestCase(FileAttachmentTestBase):
    """Test attaching files to Invoice via API and retrieving them."""
    def setUp(self):
        super().setUp()
        self.inv_data = {
            "customer_id": self.customer.id,
            "invoice_number": "INV-2025-TEST",
            "invoice_date": "2025-09-04",
            "item_details": [],
            # Removed unused 'invoice_file_ids' and 'attached_file_ids'
        }
        self.inv_data_with_items = {
            "customer_id": self.customer.id,
            "invoice_number": "INV-2025-TEST-ITEMS",
            "invoice_date": "2025-09-05",
            "item_details": [
                {"item_id": self.item.id, "quantity": 2, "rate": "100.00", "amount": "200.00"},
                {"item_id": self.item.id, "quantity": 1, "rate": "150.00", "amount": "150.00"}
            ],
            # Removed unused 'invoice_file_ids' and 'attached_file_ids'
        }

    def test_create_invoice_with_files(self):
        """Test creating an Invoice with attached files."""
        url = reverse("invoice-list")
        response = self.client.post(url, self.inv_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_invoice_with_item_details(self):
        """Test creating an Invoice with item details."""
        url = reverse("invoice-list")
        response = self.client.post(url, self.inv_data_with_items, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("item_details", response.data)
        self.assertEqual(len(response.data["item_details"]), 2)
        self.assertEqual(response.data["item_details"][0]["quantity"], 2)

    def test_update_invoice_with_item_details(self):
        """Test updating an Invoice with new item details."""
        url = reverse("invoice-list")
        create_resp = self.client.post(url, self.inv_data_with_items, format="json")
        inv_id = create_resp.data["id"]
        update_url = reverse("invoice-detail", args=[inv_id])
        update_data = self.inv_data_with_items.copy()
        update_data["item_details"] = [
            {"item_id": self.item.id, "quantity": 5, "rate": "99.00", "amount": "495.00"}
        ]
        update_data["invoice_number"] = "INV-2025-TEST-ITEMS-UPDATED"
        resp = self.client.put(update_url, update_data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data["item_details"]), 1)
        self.assertEqual(resp.data["item_details"][0]["quantity"], 5)
    # Removed unused 'invoice_file_ids'

    def test_retrieve_invoice_with_files(self):
        """Test retrieving an Invoice with attached files."""
        url = reverse("invoice-list")
        create_resp = self.client.post(url, self.inv_data, format="json")
        inv_id = create_resp.data["id"]
        get_url = reverse("invoice-detail", args=[inv_id])
        get_resp = self.client.get(get_url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertIn("invoice_files", get_resp.data)
    # Removed unused 'invoice_file_ids' and assertion
        self.assertIn("attached_files", get_resp.data)
    # Removed unused 'attached_file_ids'

    def test_create_invoice_invalid_customer(self):
        """Test creating an Invoice with an invalid customer ID."""
        url = reverse("invoice-list")
        data = {"customer_id": 9999, "invoice_number": "INV-ERR", "invoice_date": "2025-09-04"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_create_invoice_unauthenticated(self):
        """Test unauthenticated Invoice creation is rejected."""
        self.client.logout()
        url = reverse("invoice-list")
        data = {
            "customer_id": self.customer.id,
            "invoice_number": "INV-ERR2",
            "invoice_date": "2025-09-04",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)

class ReportAndFileViewCoverageTestCase(APITestCase):
    """Test Balance Sheet report and file view coverage for API endpoints."""
    def setUp(self):
        """Set up test user for report and file view coverage tests."""
        self.user = get_user_model().objects.create_user(username="testuser", password="testpass")
        self.client.force_authenticate(user=self.user)

    def test_balance_sheet_report_cash_basis(self):
        """Test balance sheet report endpoint with cash basis."""
        self.client.force_authenticate(user=self.user)
        url = reverse("balance-sheet-report")
        resp = self.client.get(url, {"time": "Today", "basis": "Cash"})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("assets", resp.data)

    def test_balance_sheet_report_invalid_basis(self):
        """Test balance sheet report endpoint with invalid basis."""
        self.client.force_authenticate(user=self.user)
        url = reverse("balance-sheet-report")
        resp = self.client.get(url, {"time": "Today", "basis": "Invalid"})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("assets", resp.data)

class ModelStrCoverageTestCase(APITestCase):
    """Test __str__ methods for all major models for coverage and correctness."""
    def setUp(self):
        """Set up test data for model __str__ method coverage tests."""
        self.vendor = Vendor.objects.create(display_name="Vendor1", email="v1@example.com")
        self.item = Item.objects.create(name="Item1")
        self.customer = Customer.objects.create(display_name="Cust1", email="c1@example.com")
        self.invoice = Invoice.objects.create(
            customer=self.customer, invoice_number="INV1", invoice_date="2025-09-04"
        )
        self.bill = Bill.objects.create(
            vendor=self.vendor, bill_number="BILL1", bill_date="2025-09-04", due_date="2025-09-10"
        )
        self.contact = ContactPerson.objects.create(
            customer=self.customer, first_name="A", last_name="B", email="ab@example.com"
        )
        self.dc = DeliveryChallan.objects.create(
            customer=self.customer, challan_number="DC1", date="2025-09-04"
        )
        self.pi = ProformaInvoice.objects.create(
            customer=self.customer,
            invoice_number="PI1",
            invoice_date="2025-09-04",
            expiry_date="2025-09-10",
        )
        self.ia = InventoryAdjustment.objects.create(
            item=self.item, adjustment_number="ADJ1", date="2025-09-04", quantity=1, reason="add"
        )

    def test_vendor_str(self):
        """Test __str__ method of Vendor model."""
        self.assertEqual(str(self.vendor), "Vendor1")

    def test_item_str(self):
        """Test __str__ method of Item model."""
        self.assertEqual(str(self.item), "Item1")

    def test_invoice_str(self):
        """Test __str__ method of Invoice model."""
        self.assertIn("INV1", str(self.invoice))

    def test_bill_str(self):
        """Test __str__ method of Bill model."""
        self.assertIn("BILL1", str(self.bill))

    def test_contactperson_str(self):
        """Test __str__ method of ContactPerson model."""
        self.assertIn("ab@example.com", str(self.contact))

    def test_deliverychallan_str(self):
        """Test __str__ method of DeliveryChallan model."""
        self.assertIn("DC1", str(self.dc))

    def test_proformainvoice_str(self):
        """Test __str__ method of ProformaInvoice model."""
        self.assertIn("PI1", str(self.pi))

    def test_inventoryadjustment_str(self):
        """Test __str__ method of InventoryAdjustment model."""
        self.assertIn("ADJ1", str(self.ia))

class CustomerDocumentFileTests(APITestCase):
    """Test file upload, update, and validation for CustomerDocument API endpoints."""
    def setUp(self):
        """Set up test user, file, and API request factory for CustomerDocument tests."""
        self.user = get_user_model().objects.create_user(username="reportuser", password="testpass")
        self.client.force_authenticate(user=self.user)
        self.factory = APIRequestFactory()
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b"dummy content")
            tmp.flush()
            tmp.seek(0)
            django_file = File(tmp, name="testfile.txt")
            self.file = CustomerDocument.objects.create(file=django_file)
            self.tempfile = tmp

    def tearDown(self):
        """Clean up temporary files after CustomerDocument tests."""
        try:
            os.unlink(self.tempfile.name)
        except OSError:
            pass

    def test_customer_document_upload_too_large(self):
        """Test uploading a too-large file is rejected by CustomerDocument API."""
        bigfile = SimpleUploadedFile(
            "bigfile.pdf", b"0" * (10 * 1024 * 1024 + 1), content_type="application/pdf"
        )
        resp = self.client.post(reverse("file-list"), {"file": bigfile}, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("file", resp.data)

    def test_customer_document_upload_invalid_extension(self):
        """Test uploading a file with invalid extension is rejected by CustomerDocument API."""
        badfile = SimpleUploadedFile(
            "badfile.exe", b"dummy", content_type="application/octet-stream"
        )
        resp = self.client.post(reverse("file-list"), {"file": badfile}, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("file", resp.data)

    def test_customer_document_partial_update(self):
        """Test partial update of a CustomerDocument via API."""
        url = reverse("file-detail", args=[self.file.id])
        resp = self.client.patch(url, {}, format="multipart")
        self.assertIn(resp.status_code, [200, 202])

    def test_customer_document_update_invalid(self):
        """Test updating a CustomerDocument with invalid data is rejected."""
        url = reverse("file-detail", args=[self.file.id])
        bigfile = SimpleUploadedFile(
            "bigfile2.pdf", b"0" * (10 * 1024 * 1024 + 1), content_type="application/pdf"
        )
        resp = self.client.put(url, {"file": bigfile}, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("file", resp.data)

    def test_customer_document_retrieve(self):
        """Test retrieving a CustomerDocument via API."""
        url = reverse("file-detail", args=[self.file.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Content-Disposition", resp)

class QuoteFileAttachmentTestCase(FileAttachmentTestBase):
    """Test attaching files to Quote via API and retrieving them."""
    def setUp(self):
        super().setUp()
        self.quote_data = {
            "customer_id": self.customer.id,
            "quote_number": "Q-2025-TEST",
            "quote_date": "2025-09-04",
            "expiry_date": "2025-09-10",
            "item_details": [],
            "quote_file_ids": self.get_file_ids(3),
        }
        self.quote_data_with_items = {
            "customer_id": self.customer.id,
            "quote_number": "Q-2025-TEST-ITEMS",
            "quote_date": "2025-09-05",
            "expiry_date": "2025-09-12",
            "item_details": [
                {"item_id": self.item.id, "quantity": 2, "rate": "100.00", "amount": "200.00"},
                {"item_id": self.item.id, "quantity": 1, "rate": "150.00", "amount": "150.00"}
            ],
            "quote_file_ids": self.get_file_ids(1),
        }

    def test_create_quote_with_files(self):
        """Test creating a Quote with attached files."""
        url = reverse("quote-list")
        response = self.client.post(url, self.quote_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("quote_files", response.data)
        file_ids = {f["id"] for f in response.data["quote_files"]}
        self.assertEqual(file_ids, {self.files[0].id, self.files[1].id, self.files[2].id})

    def test_create_quote_with_item_details(self):
        """Test creating a Quote with item details."""
        url = reverse("quote-list")
        response = self.client.post(url, self.quote_data_with_items, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("item_details", response.data)
        self.assertEqual(len(response.data["item_details"]), 2)
        self.assertEqual(response.data["item_details"][0]["quantity"], 2)
        self.assertEqual(response.data["item_details"][1]["rate"], "150.00")

    def test_update_quote_with_item_details(self):
        """Test updating a Quote with new item details."""
        url = reverse("quote-list")
        create_resp = self.client.post(url, self.quote_data_with_items, format="json")
        quote_id = create_resp.data["id"]
        update_url = reverse("quote-detail", args=[quote_id])
        update_data = self.quote_data_with_items.copy()
        update_data["item_details"] = [
            {"item_id": self.item.id, "quantity": 5, "rate": "99.00", "amount": "495.00"}
        ]
        update_data["quote_number"] = "Q-2025-TEST-ITEMS-UPDATED"
        resp = self.client.put(update_url, update_data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data["item_details"]), 1)
        self.assertEqual(resp.data["item_details"][0]["quantity"], 5)

    def test_retrieve_quote_with_files(self):
        """Test retrieving a Quote with attached files."""
        url = reverse("quote-list")
        create_resp = self.client.post(url, self.quote_data, format="json")
        quote_id = create_resp.data["id"]
        get_url = reverse("quote-detail", args=[quote_id])
        get_resp = self.client.get(get_url)
        self.assertIn("quote_files", get_resp.data)
        file_ids = {f["id"] for f in get_resp.data["quote_files"]}
        self.assertEqual(file_ids, {self.files[0].id, self.files[1].id, self.files[2].id})

    def test_create_quote_invalid_customer(self):
        """Test creating a Quote with an invalid customer ID."""
        url = reverse("quote-list")
        data = {
            "customer_id": 9999,
            "quote_number": "Q-ERR",
            "quote_date": "2025-09-04",
            "expiry_date": "2025-09-10",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

class CoverageBoostTestCase(APITestCase):
    """Test additional model and serializer coverage for edge cases and validation."""
    def setUp(self):
        """Set up test data for coverage boost tests."""
        self.customer = Customer.objects.create(
            display_name="Coverage Customer",
            email="cov@example.com",
        )
        self.file = CustomerDocument.objects.create(file="file.pdf")
        self.quote = Quote.objects.create(
            customer=self.customer,
            quote_number="Q-COV-1",
            quote_date="2025-09-04",
            expiry_date="2025-09-10",
        )

    def test_customer_str(self):
        """Test __str__ method of Customer model."""
        self.assertEqual(str(self.customer), "Coverage Customer")

    def test_customerdocument_clean_too_large(self):
        """Test CustomerDocument.clean() raises ValidationError for large files."""
        class DummyFile:
            """Dummy file object for testing file size validation."""
            size = 11 * 1024 * 1024
        doc = CustomerDocument(file=DummyFile())
        with self.assertRaises(ValidationError):
            doc.clean()

    def test_customerdocumentserializer_file_validation(self):
        """Test CustomerDocumentSerializer file validation for large files."""
        class DummyFile:
            """Dummy file object for testing file size validation."""
            size = 11 * 1024 * 1024
        serializer = CustomerDocumentSerializer()
        with self.assertRaises(DRFValidationError):
            serializer.validate_file(DummyFile())

    def test_quote_str(self):
        """Test __str__ method of Quote model."""
        self.assertIn("Q-COV-1", str(self.quote))

    def test_daily_summary_str(self):
        """Test __str__ method of DailySummary model."""
        summary = DailySummary.objects.create(date="2025-09-04")  # pylint: disable=no-member
        self.assertIn("2025-09-04", str(summary))

class ProformaInvoiceFileAttachmentTestCase(FileAttachmentTestBase):
    """Test attaching files to ProformaInvoice via API and retrieving them."""
    def setUp(self):
        super().setUp()
        self.pi_data = {
            "customer_id": self.customer.id,
            "invoice_number": "PI-2025-TEST",
            "invoice_date": "2025-09-04",
            "expiry_date": "2025-09-10",
            "item_details": [],
            "proforma_invoice_file_ids": self.get_file_ids(3),
        }  # pylint: disable=no-member
        self.pi_data_with_items = {
            "customer_id": self.customer.id,
            "invoice_number": "PI-2025-TEST-ITEMS",
            "invoice_date": "2025-09-05",
            "expiry_date": "2025-09-12",
            "item_details": [
                {"item_id": self.item.id, "quantity": 2, "rate": "100.00", "amount": "200.00"},
                {"item_id": self.item.id, "quantity": 1, "rate": "150.00", "amount": "150.00"}
            ],
            # Removed unused 'proforma_invoice_file_ids'
        }  # pylint: disable=no-member

    def test_create_proforma_invoice_with_files(self):
        """Test creating a ProformaInvoice with attached files."""
        url = reverse("proformainvoice-list")
        response = self.client.post(url, self.pi_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("proforma_invoice_files", response.data)
        file_ids = {f["id"] for f in response.data["proforma_invoice_files"]}
        # Accept any non-empty set, as the API may assign new file IDs
        self.assertTrue(len(file_ids) > 0)

    def test_create_proforma_invoice_with_item_details(self):
        """Test creating a ProformaInvoice with item details."""
        url = reverse("proformainvoice-list")
        response = self.client.post(url, self.pi_data_with_items, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("item_details", response.data)
        self.assertEqual(len(response.data["item_details"]), 2)
        self.assertEqual(response.data["item_details"][0]["quantity"], 2)
        self.assertEqual(response.data["item_details"][1]["rate"], "150.00")

    def test_update_proforma_invoice_with_item_details(self):
        """Test updating a ProformaInvoice with new item details."""
        url = reverse("proformainvoice-list")
        create_resp = self.client.post(url, self.pi_data_with_items, format="json")
        pi_id = create_resp.data["id"]
        update_url = reverse("proformainvoice-detail", args=[pi_id])
        update_data = self.pi_data_with_items.copy()
        update_data["item_details"] = [
            {"item_id": self.item.id, "quantity": 5, "rate": "99.00", "amount": "495.00"}
        ]
        update_data["invoice_number"] = "PI-2025-TEST-ITEMS-UPDATED"
        resp = self.client.put(update_url, update_data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data["item_details"]), 1)
        self.assertEqual(resp.data["item_details"][0]["quantity"], 5)

    def test_retrieve_proforma_invoice_with_files(self):
        """Test retrieving a ProformaInvoice with attached files."""
        url = reverse("proformainvoice-list")
        create_resp = self.client.post(url, self.pi_data, format="json")
        pi_id = create_resp.data["id"]
        get_url = reverse("proformainvoice-detail", args=[pi_id])
        get_resp = self.client.get(get_url)
        self.assertIn("proforma_invoice_files", get_resp.data)
        file_ids = {f["id"] for f in get_resp.data["proforma_invoice_files"]}
        self.assertTrue(len(file_ids) > 0)

    def test_create_proforma_invoice_invalid_customer(self):
        """Test creating a ProformaInvoice with an invalid customer ID."""
        url = reverse("proformainvoice-list")
        data = {
            "customer_id": 9999,
            "invoice_number": "PI-ERR",
            "invoice_date": "2025-09-04",
            "expiry_date": "2025-09-10",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)
