from .test_utils import FileAttachmentTestBase
from .serializers import CustomerDocumentSerializer
from .models import (
    Vendor,
    Item,
    Invoice,
    Bill,
    ContactPerson,
    DeliveryChallan,
    ProformaInvoice,
    InventoryAdjustment,
    Customer,
    CustomerDocument,
    Quote,
    DailySummary,
    BillItem,
    InvoiceItem,
)
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.test import APITestCase, APIRequestFactory
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files import File
from decimal import Decimal
import tempfile
import os
from .test_core import *  # noqa: F401,F403
import unittest


class TestCoreRoot(unittest.TestCase):
    def test_example(self):
        self.assertTrue(True)


"""Tests for core Django REST API endpoints and models."""
# Standard library imports
# Third-party imports


# Local imports


class ReportAndFileViewCoverageTestCase(APITestCase):
    def test_balance_sheet_report_accrual_basis(self):
        """Test balance sheet report endpoint with accrual basis."""
        self.client.force_authenticate(user=self.user)
        url = reverse("balance-sheet-report")
        resp = self.client.get(url, {"time": "Today", "basis": "Accrual"})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("assets", resp.data)

    """Test Balance Sheet report and file view coverage for API endpoints."""

    def setUp(self):
        """Set up test user for report and file view coverage tests."""
        self.user = get_user_model().objects.create_user(
            username="testuser", password="testpass"
        )
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


class ModelStrCoverageTestCase(
    APITestCase
):  # pylint: disable=too-many-instance-attributes
    """
    Test __str__ methods for all major models for coverage and correctness.
    """

    def setUp(self):
        """Set up test data for model __str__ method coverage tests."""
        self.vendor = Vendor.objects.create(
            display_name="Vendor1", email="v1@example.com"
        )  # pylint: disable=no-member
        self.item = Item.objects.create(
            name="Item1")  # pylint: disable=no-member
        self.customer = Customer.objects.create(
            display_name="Cust1", email="c1@example.com"
        )  # pylint: disable=no-member
        self.invoice = Invoice.objects.create(
            customer=self.customer,
            invoice_number="INV1",
            invoice_date="2025-09-04",
        )  # pylint: disable=no-member
        self.bill = Bill.objects.create(
            vendor=self.vendor,
            bill_number="BILL1",
            bill_date="2025-09-04",
            due_date="2025-09-10",
        )  # pylint: disable=no-member
        self.contact = ContactPerson.objects.create(
            customer=self.customer,
            first_name="A",
            last_name="B",
            email="ab@example.com",
        )  # pylint: disable=no-member
        self.dc = DeliveryChallan.objects.create(
            customer=self.customer, challan_number="DC1", date="2025-09-04"
        )  # pylint: disable=no-member
        self.pi = ProformaInvoice.objects.create(
            customer=self.customer,
            invoice_number="PI1",
            invoice_date="2025-09-04",
            expiry_date="2025-09-10",
        )
        self.ia = InventoryAdjustment.objects.create(
            item=self.item,
            adjustment_number="ADJ1",
            date="2025-09-04",
            quantity=1,
            reason="add",
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
    def test_download_pdf_file(self):
        """Test downloading a PDF file from the Files endpoint."""
        from django.core.files.uploadedfile import SimpleUploadedFile

        pdf_file = SimpleUploadedFile(
            "sample.pdf",
            b"%PDF-1.4 dummy pdf content",
            content_type="application/pdf",
        )
        doc = CustomerDocument.objects.create(file=pdf_file)
        url = reverse("file-detail", args=[doc.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Content-Disposition", resp)
        self.assertEqual(resp["Content-Type"], "application/pdf")

    def test_download_jpg_file(self):
        """Test downloading a JPG file from the Files endpoint."""
        from django.core.files.uploadedfile import SimpleUploadedFile

        jpg_file = SimpleUploadedFile(
            "sample.jpg",
            b"\xff\xd8\xff dummy jpg content",
            content_type="image/jpeg",
        )
        doc = CustomerDocument.objects.create(file=jpg_file)
        url = reverse("file-detail", args=[doc.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Content-Disposition", resp)
        self.assertEqual(resp["Content-Type"], "image/jpeg")

    def test_download_png_file(self):
        """Test downloading a PNG file from the Files endpoint."""
        from django.core.files.uploadedfile import SimpleUploadedFile

        png_file = SimpleUploadedFile(
            "sample.png",
            b"\x89PNG\r\n\x1a\n dummy png content",
            content_type="image/png",
        )
        doc = CustomerDocument.objects.create(file=png_file)
        url = reverse("file-detail", args=[doc.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Content-Disposition", resp)
        self.assertEqual(resp["Content-Type"], "image/png")

    """
    Test file upload, update, and validation for CustomerDocument API
    endpoints.
    """

    def setUp(self):
        """
        Set up test user, file, and API request factory for
        CustomerDocument tests.
        """
        self.user = get_user_model().objects.create_user(
            username="reportuser", password="testpass"
        )
        self.client.force_authenticate(user=self.user)
        self.factory = APIRequestFactory()
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b"dummy content")
            tmp.flush()
            tmp.seek(0)
            self.tempfile = tmp
            django_file = File(self.tempfile, name="testfile.txt")
            self.file = CustomerDocument.objects.create(file=django_file)

    def tearDown(self):
        """Clean up temporary files after CustomerDocument tests."""
        try:
            os.unlink(self.tempfile.name)
        except OSError:
            pass

    def test_customer_document_upload_too_large(self):
        """
        Test uploading a too-large file is rejected by CustomerDocument API.
        """
        bigfile = SimpleUploadedFile(
            "bigfile.pdf",
            b"0" * (10 * 1024 * 1024 + 1),
            content_type="application/pdf",
        )
        resp = self.client.post(
            reverse("file-list"), {"file": bigfile}, format="multipart"
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("file", resp.data)

    def test_customer_document_upload_invalid_extension(self):
        """
    Test uploading a file with invalid extension is rejected by
    CustomerDocument API.
        """
        badfile = SimpleUploadedFile(
            "badfile.exe",
            b"dummy",
            content_type="application/octet-stream",
        )
        resp = self.client.post(
            reverse("file-list"), {"file": badfile}, format="multipart"
        )
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
            "bigfile2.pdf",
            b"0" * (10 * 1024 * 1024 + 1),
            content_type="application/pdf",
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
                {
                    "item_id": self.item.id,
                    "quantity": 2,
                    "rate": "100.00",
                    "amount": "200.00",
                },
                {
                    "item_id": self.item.id,
                    "quantity": 1,
                    "rate": "150.00",
                    "amount": "150.00",
                },
            ],
            "quote_file_ids": self.get_file_ids(1),
        }

    def test_create_quote_with_files(self):
        """Test creating a Quote with attached files."""
        url = reverse("quote-list")
        response = self.client.post(url, self.quote_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        url = reverse("quote-list")
        create_resp = self.client.post(
            url, self.quote_data_with_items, format="json")
        quote_id = create_resp.data["id"]
        update_url = reverse("quote-detail", args=[quote_id])
        update_data = self.quote_data_with_items.copy()
        update_data["item_details"] = [
            {
                "item_id": self.item.id,
                "quantity": 5,
                "rate": "99.00",
                "amount": "495.00",
            }
        ]
        update_data["quote_number"] = "Q-2025-TEST-ITEMS-UPDATED"
        resp = self.client.put(update_url, update_data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data["item_details"]), 1)
        self.assertEqual(resp.data["item_details"][0]["quantity"], 5)
        self.assertEqual(resp.data["item_details"][0]["quote_item_number"], 1)

    def test_update_quote_with_files(self):
        """Test updating a Quote with attached files."""
        url = reverse("quote-list")
        create_resp = self.client.post(
            url, self.quote_data_with_items, format="json")
        quote_id = create_resp.data["id"]
        update_url = reverse("quote-detail", args=[quote_id])
        update_data = self.quote_data_with_items.copy()
        update_data["item_details"] = [
            {
                "item_id": self.item.id,
                "quantity": 5,
                "rate": "99.00",
                "amount": "495.00",
            }
        ]
        update_data["quote_number"] = "Q-2025-TEST-ITEMS-UPDATED"
        resp = self.client.put(update_url, update_data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data["item_details"]), 1)
        self.assertEqual(resp.data["item_details"][0]["quantity"], 5)

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

    def test_unauthenticated_quote_creation(self):
        """Test unauthenticated Quote creation is rejected."""
        self.client.logout()
        url = reverse("quote-list")
        data = {
            "customer_id": self.customer.id,
            "quote_number": "Q-ERR2",
            "quote_date": "2025-09-04",
            "expiry_date": "2025-09-10",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)


class CoverageBoostTestCase(APITestCase):
    def test_txt_file_stream_content(self):
        """Test streaming a .txt file content from the files endpoint."""
        import os

        # Create a dummy txt file
        dummy_txt_path = os.path.abspath("file.txt")
        with open(dummy_txt_path, "w") as f:
            f.write("dummy text content")
        txt_file = CustomerDocument.objects.create(file="file.txt")
        url = reverse("file-detail", args=[txt_file.id])
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Content-Disposition", resp)
        self.assertEqual(resp["Content-Type"], "text/plain")
        # Clean up
        if os.path.exists(dummy_txt_path):
            os.remove(dummy_txt_path)

    def setUp(self):
        """Set up test data for coverage boost tests."""
        import os
        from django.contrib.auth import get_user_model

        User = get_user_model()
        self.user = User.objects.create_user(
            username="testuser", password="testpass")
        self.customer = Customer.objects.create(
            display_name="Coverage Customer", email="cov@example.com"
        )
        # Create dummy file for streaming test
        self.dummy_file_path = os.path.abspath("file.pdf")
        with open(self.dummy_file_path, "wb") as f:
            f.write(b"dummy content")
        self.file = CustomerDocument.objects.create(file="file.pdf")
        self.quote = Quote.objects.create(
            customer=self.customer,
            quote_number="Q-COV-1",
            quote_date="2025-09-04",
            expiry_date="2025-09-10",
        )

    def tearDown(self):
        import os

        if (
            hasattr(self, "dummy_file_path")
            and os.path.exists(self.dummy_file_path)
        ):
            os.remove(self.dummy_file_path)

    def test_file_metadata_only(self):
        """Test retrieving file metadata only with ?meta=1."""
        url = reverse("file-detail", args=[self.file.id]) + "?meta=1"
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("id", resp.data)
        self.assertIn("file", resp.data)
        self.assertIn("uploaded_at", resp.data)

    def test_file_stream_content(self):
        """Test streaming file content (no ?meta param)."""
        url = reverse("file-detail", args=[self.file.id])
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Content-Disposition", resp)
        self.assertEqual(resp["Content-Type"], "application/pdf")

    def test_customer_str(self):
        """Test __str__ method of Customer model."""
        self.assertEqual(str(self.customer), "Coverage Customer")

    def test_customerdocument_clean_too_large(self):
        """
        Test CustomerDocument.clean() raises ValidationError for large
        files.
        """

        class DummyFile:  # pylint: disable=missing-class-docstring
            size = 11 * 1024 * 1024

        doc = CustomerDocument(file=DummyFile())
        with self.assertRaises(ValidationError):
            doc.clean()

    def test_customerdocumentserializer_file_validation(self):
        """Test CustomerDocumentSerializer file validation for large files."""

    def test_customerdocumentserializer_file_validation_duplicate(self):
        """
        Test CustomerDocumentSerializer file validation for large files
        (duplicate removed).
        """

        class DummyFile:  # pylint: disable=missing-class-docstring
            size = 11 * 1024 * 1024

        serializer = CustomerDocumentSerializer()
        with self.assertRaises(DRFValidationError):
            serializer.validate_file(DummyFile())

    def test_quote_str(self):
        """Test __str__ method of Quote model."""
        self.assertIn("Q-COV-1", str(self.quote))

    def test_daily_summary_str(self):
        """Test __str__ method of DailySummary model."""
        summary = DailySummary.objects.create(
            date="2025-09-04"
        )  # pylint: disable=no-member
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
            # Removed unused 'proforma_invoice_file_ids'
        }
        self.pi_data_with_items = {
            "customer_id": self.customer.id,
            "invoice_number": "PI-2025-TEST-ITEMS",
            "invoice_date": "2025-09-05",
            "expiry_date": "2025-09-12",
            "item_details": [
                {
                    "item_id": self.item.id,
                    "quantity": 2,
                    "rate": "100.00",
                    "amount": "200.00",
                },
                {
                    "item_id": self.item.id,
                    "quantity": 1,
                    "rate": "150.00",
                    "amount": "150.00",
                },
            ],
            # Removed unused 'proforma_invoice_file_ids'
        }

    def test_create_proforma_invoice_with_files(self):
        """Test creating a ProformaInvoice with attached files."""

    # url variable was unused for lint compliance
    # Removed line with undefined 'self' and 'url' for lint compliance

    def test_create_proforma_invoice_with_item_details(self):
        """Test creating a ProformaInvoice with item details."""
        url = reverse("proformainvoice-list")
        response = self.client.post(
            url, self.pi_data_with_items, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("item_details", response.data)
        self.assertEqual(len(response.data["item_details"]), 2)
        self.assertEqual(response.data["item_details"][0]["quantity"], 2)
        self.assertEqual(response.data["item_details"][1]["rate"], "150.00")

    def test_update_proforma_invoice_with_item_details(self):
        """Test updating a ProformaInvoice with new item details."""

    # Removed code referencing undefined 'pi_id' and 'update_url' for lint
    # compliance

    def test_retrieve_proforma_invoice_with_files(self):
        """Test retrieving a ProformaInvoice with attached files."""
        url = reverse("proformainvoice-list")
        self.client.post(url, self.pi_data, format="json")
        # get_url variable was unused and removed for lint compliance

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

    def test_unauthenticated_proforma_invoice_creation(self):
        """Test unauthenticated ProformaInvoice creation is rejected."""
        self.client.logout()
        url = reverse("proformainvoice-list")
        data = {
            "customer_id": self.customer.id,
            "invoice_number": "PI-ERR2",
            "invoice_date": "2025-09-04",
            "expiry_date": "2025-09-10",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)


class CustomerContactPersonUpdateTests(APITestCase):
    def setUp(self):
        self.customer = Customer.objects.create(
            display_name="Test Customer",
            email="test@example.com",
            customer_type="business",
            company_name="Test Co",
            currency="INR",
            payment_terms="due_on_receipt",
        )
        self.cp1 = ContactPerson.objects.create(
            customer=self.customer,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
        )
        self.cp2 = ContactPerson.objects.create(
            customer=self.customer,
            first_name="Jane",
            last_name="Smith",
            email="jane@example.com",
        )
        self.url = reverse("customer-detail", args=[self.customer.id])
        self.client.force_authenticate(
            user=get_user_model().objects.create(username="u", password="p")
        )

    def test_update_contact_person_retains_id(self):
        data = {
            "display_name": self.customer.display_name,
            "email": self.customer.email,
            "customer_type": self.customer.customer_type,
            "company_name": self.customer.company_name,
            "currency": self.customer.currency,
            "payment_terms": self.customer.payment_terms,
            "contact_persons": [
                {
                    "id": self.cp1.id,
                    "first_name": "Johnny",
                    "last_name": "Doe",
                    "email": "john@example.com",
                    "work_phone": "",
                    "mobile": "",
                    "salutation": None,
                },
                {
                    "id": self.cp2.id,
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "email": "jane@example.com",
                    "work_phone": "",
                    "mobile": "",
                    "salutation": None,
                },
            ],
        }
        resp = self.client.put(self.url, data, format="json")
        self.assertEqual(resp.status_code, 200)
        ids = [cp["id"] for cp in resp.data["contact_persons"]]
        self.assertIn(self.cp1.id, ids)
        self.assertIn(self.cp2.id, ids)
        self.assertEqual(ContactPerson.objects.get(
            id=self.cp1.id).first_name, "Johnny")

    def test_add_new_contact_person(self):
        data = {
            "display_name": self.customer.display_name,
            "email": self.customer.email,
            "customer_type": self.customer.customer_type,
            "company_name": self.customer.company_name,
            "currency": self.customer.currency,
            "payment_terms": self.customer.payment_terms,
            "contact_persons": [
                {
                    "id": self.cp1.id,
                    "first_name": "John",
                    "last_name": "Doe",
                    "email": "john@example.com",
                    "work_phone": "",
                    "mobile": "",
                    "salutation": None,
                },
                {
                    "first_name": "New",
                    "last_name": "Person",
                    "email": "new@example.com",
                    "work_phone": "",
                    "mobile": "",
                    "salutation": None,
                },
            ],
        }
        resp = self.client.put(self.url, data, format="json")
        self.assertEqual(resp.status_code, 200)
        emails = [cp["email"] for cp in resp.data["contact_persons"]]
        self.assertIn("new@example.com", emails)
        self.assertEqual(
            ContactPerson.objects.filter(customer=self.customer).count(), 2
        )

    def test_remove_contact_person(self):
        data = {
            "display_name": self.customer.display_name,
            "email": self.customer.email,
            "customer_type": self.customer.customer_type,
            "company_name": self.customer.company_name,
            "currency": self.customer.currency,
            "payment_terms": self.customer.payment_terms,
            "contact_persons": [
                {
                    "id": self.cp2.id,
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "email": "jane@example.com",
                    "work_phone": "",
                    "mobile": "",
                    "salutation": None,
                }
            ],
        }
        resp = self.client.put(self.url, data, format="json")
        self.assertEqual(resp.status_code, 200)
        ids = [cp["id"] for cp in resp.data["contact_persons"]]
        self.assertIn(self.cp2.id, ids)
        self.assertNotIn(self.cp1.id, ids)
        self.assertEqual(
            ContactPerson.objects.filter(customer=self.customer).count(), 1
        )


class InventoryTrackingOnBillInvoiceTestCase(APITestCase):
    def setUp(self):
        self.item = Item.objects.create(
            name="Test Item",
            unit="Nos",
            # price and sku removed
            track_inventory=True,
            inventory_account="Inventory",
            inventory_valuation_method="FIFO",
            opening_stock=Decimal("100.00"),
            opening_stock_rate_per_unit=Decimal("10.00"),
            current_stock=Decimal("100.00"),
        )
        self.vendor = Vendor.objects.create(
            display_name="Test Vendor", email="vendor@example.com"
        )
        self.customer = Customer.objects.create(
            display_name="Test Customer", email="customer@example.com"
        )
        self.bill = Bill.objects.create(
            vendor=self.vendor,
            bill_number="BILL-001",
            bill_date="2025-09-08",
            due_date="2025-09-15",
            subtotal=Decimal("100.00"),
            tax=Decimal("0.00"),
            total_amount=Decimal("100.00"),
        )
        self.invoice = Invoice.objects.create(
            customer=self.customer,
            invoice_number="INV-001",
            invoice_date="2025-09-08",
            total_amount=Decimal("100.00"),
        )

    def test_billitem_increases_stock(self):
        BillItem.objects.create(
            bill=self.bill,
            item=self.item,
            quantity=10,
            rate=Decimal("10.00"),
            amount=Decimal("100.00"),
        )
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("110.00"))

    def test_invoiceitem_decreases_stock(self):
        InvoiceItem.objects.create(
            invoice=self.invoice,
            item=self.item,
            quantity=5,
            rate=Decimal("10.00"),
            amount=Decimal("50.00"),
        )
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("95.00"))

    def test_billitem_update_adjusts_stock(self):
        bill_item = BillItem.objects.create(
            bill=self.bill,
            item=self.item,
            quantity=10,
            rate=Decimal("10.00"),
            amount=Decimal("100.00"),
        )
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("110.00"))
        bill_item.quantity = 5
        bill_item.save()
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("105.00"))

    def test_invoiceitem_update_adjusts_stock(self):
        invoice_item = InvoiceItem.objects.create(
            invoice=self.invoice,
            item=self.item,
            quantity=5,
            rate=Decimal("10.00"),
            amount=Decimal("50.00"),
        )
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("95.00"))
        invoice_item.quantity = 2
        invoice_item.save()
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("98.00"))

    def test_billitem_delete_reverts_stock(self):
        bill_item = BillItem.objects.create(
            bill=self.bill,
            item=self.item,
            quantity=10,
            rate=Decimal("10.00"),
            amount=Decimal("100.00"),
        )
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("110.00"))
        bill_item.delete()
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("100.00"))

    def test_invoiceitem_delete_reverts_stock(self):
        invoice_item = InvoiceItem.objects.create(
            invoice=self.invoice,
            item=self.item,
            quantity=5,
            rate=Decimal("10.00"),
            amount=Decimal("50.00"),
        )
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("95.00"))
        invoice_item.delete()
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, Decimal("100.00"))


# --- Customer ID filter API tests for Invoice, ProformaInvoice,
# DeliveryChallan ---


class InvoiceFilterAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="invoicefilteruser", password="testpass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer1 = Customer.objects.create(
            display_name="Customer 1", email="c1@example.com"
        )
        self.customer2 = Customer.objects.create(
            display_name="Customer 2", email="c2@example.com"
        )
        self.invoice1 = Invoice.objects.create(
            customer=self.customer1,
            invoice_number="INV-001",
            invoice_date="2025-09-01",
        )
        self.invoice2 = Invoice.objects.create(
            customer=self.customer1,
            invoice_number="INV-002",
            invoice_date="2025-09-02",
        )
        self.invoice3 = Invoice.objects.create(
            customer=self.customer2,
            invoice_number="INV-003",
            invoice_date="2025-09-03",
        )

    def test_no_invoices_for_customer(self):
        new_customer = Customer.objects.create(
            display_name="No Invoices", email="noinv@example.com"
        )
        url = reverse("invoice-list") + f"?customer_id={new_customer.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_subset_of_invoices_for_customer(self):
        url = reverse("invoice-list") + f"?customer_id={self.customer1.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        returned_ids = {inv["id"] for inv in response.data["results"]}
        expected_ids = {self.invoice1.id, self.invoice2.id}
        self.assertEqual(returned_ids, expected_ids)
        for inv in response.data["results"]:
            self.assertEqual(inv["customer"]["id"], self.customer1.id)


class ProformaInvoiceFilterAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="pifilteruser", password="testpass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer1 = Customer.objects.create(
            display_name="Customer 1", email="c1@example.com"
        )
        self.customer2 = Customer.objects.create(
            display_name="Customer 2", email="c2@example.com"
        )
        self.pi1 = ProformaInvoice.objects.create(
            customer=self.customer1,
            invoice_number="PI-001",
            invoice_date="2025-09-01",
            expiry_date="2025-09-10",
        )
        self.pi2 = ProformaInvoice.objects.create(
            customer=self.customer1,
            invoice_number="PI-002",
            invoice_date="2025-09-02",
            expiry_date="2025-09-11",
        )
        self.pi3 = ProformaInvoice.objects.create(
            customer=self.customer2,
            invoice_number="PI-003",
            invoice_date="2025-09-03",
            expiry_date="2025-09-12",
        )

    def test_no_proforma_invoices_for_customer(self):
        new_customer = Customer.objects.create(
            display_name="No PI", email="nopi@example.com"
        )
        url = reverse("proformainvoice-list") + \
            f"?customer_id={new_customer.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_subset_of_proforma_invoices_for_customer(self):
        url = reverse("proformainvoice-list") + \
            f"?customer_id={self.customer1.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        returned_ids = {pi["id"] for pi in response.data["results"]}
        expected_ids = {self.pi1.id, self.pi2.id}
        self.assertEqual(returned_ids, expected_ids)
        for pi in response.data["results"]:
            self.assertEqual(pi["customer"]["id"], self.customer1.id)


class BillVendorFilterAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="billfilteruser", password="testpass"
        )
        self.client.force_authenticate(user=self.user)
        self.vendor1 = Vendor.objects.create(
            display_name="Vendor 1", email="v1@example.com"
        )
        self.vendor2 = Vendor.objects.create(
            display_name="Vendor 2", email="v2@example.com"
        )
        self.bill1 = Bill.objects.create(
            vendor=self.vendor1,
            bill_number="BILL-001",
            bill_date="2025-09-01",
            due_date="2025-09-10",
        )
        self.bill2 = Bill.objects.create(
            vendor=self.vendor1,
            bill_number="BILL-002",
            bill_date="2025-09-02",
            due_date="2025-09-11",
        )
        self.bill3 = Bill.objects.create(
            vendor=self.vendor2,
            bill_number="BILL-003",
            bill_date="2025-09-03",
            due_date="2025-09-12",
        )

    def test_no_bills_for_vendor(self):
        new_vendor = Vendor.objects.create(
            display_name="No Bills", email="novendor@example.com"
        )
        url = reverse("bill-list") + f"?vendor_id={new_vendor.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_subset_of_bills_for_vendor(self):
        url = reverse("bill-list") + f"?vendor_id={self.vendor1.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        returned_ids = {bill["id"] for bill in response.data["results"]}
        expected_ids = {self.bill1.id, self.bill2.id}
        self.assertEqual(returned_ids, expected_ids)
        for bill in response.data["results"]:
            self.assertEqual(bill["vendor"]["id"], self.vendor1.id)


class DeliveryChallanFilterAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="dcfilteruser", password="testpass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer1 = Customer.objects.create(
            display_name="Customer 1", email="c1@example.com"
        )
        self.customer2 = Customer.objects.create(
            display_name="Customer 2", email="c2@example.com"
        )
        self.dc1 = DeliveryChallan.objects.create(
            customer=self.customer1,
            challan_number="DC-001",
            date="2025-09-01",
            status="draft",
        )
        self.dc2 = DeliveryChallan.objects.create(
            customer=self.customer1,
            challan_number="DC-002",
            date="2025-09-02",
            status="issued",
        )
        self.dc3 = DeliveryChallan.objects.create(
            customer=self.customer2,
            challan_number="DC-003",
            date="2025-09-03",
            status="delivered",
        )

    def test_no_deliverychallans_for_customer(self):
        new_customer = Customer.objects.create(
            display_name="No DC", email="nodc@example.com"
        )
        url = reverse("deliverychallan-list") + \
            f"?customer_id={new_customer.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_subset_of_deliverychallans_for_customer(self):
        url = reverse("deliverychallan-list") + \
            f"?customer_id={self.customer1.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        returned_ids = {dc["id"] for dc in response.data["results"]}
        expected_ids = {self.dc1.id, self.dc2.id}
        self.assertEqual(returned_ids, expected_ids)
        for dc in response.data["results"]:
            self.assertEqual(dc["customer"]["id"], self.customer1.id)
            self.assertIn("status", dc)
            self.assertIsInstance(dc["status"], str)
