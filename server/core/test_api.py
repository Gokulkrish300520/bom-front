
"""API tests for CRUD operations on Customer and Vendor endpoints."""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class CustomerAPITestCase(APITestCase):
    """Test CRUD operations for Customer endpoint."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="testpass"
        )
        self.client.force_authenticate(user=self.user)
        self.customer_data = {
            "display_name": "Test Customer",
            "email": "test@example.com",
            "contact_persons": [
                {
                    "salutation": "mr",
                    "first_name": "John",
                    "last_name": "Smith",
                    "email": "john.smith@example.com",
                    "work_phone": "1234567890",
                    "mobile": "9876543210"
                }
            ]
        }

    def test_create_customer(self):
        """Test creating a customer via the API."""
        url = reverse("customer-list")
        response = self.client.post(url, self.customer_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["display_name"], self.customer_data["display_name"]
        )
        self.assertIn("contact_persons", response.data)
        self.assertEqual(len(response.data["contact_persons"]), 1)
        cp = response.data["contact_persons"][0]
        self.assertEqual(cp["first_name"], "John")
        self.assertEqual(cp["last_name"], "Smith")
        self.assertEqual(cp["email"], "john.smith@example.com")

    def test_list_customers(self):
        """Test listing customers via the API."""
        url = reverse("customer-list")
        self.client.post(url, self.customer_data, format="json")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"] if "results" in response.data else response.data
        self.assertGreaterEqual(len(results), 1)
        customer = results[0]
        self.assertIn("contact_persons", customer)
        self.assertEqual(len(customer["contact_persons"]), 1)
        cp = customer["contact_persons"][0]
        self.assertEqual(cp["first_name"], "John")
        self.assertEqual(cp["last_name"], "Smith")
        self.assertEqual(cp["email"], "john.smith@example.com")


class VendorAPITestCase(APITestCase):
    def test_update_vendor_contact_persons_id_retention(self):
        """Test that updating a vendor with an existing contact person retains the ID, and adding a new one creates a new ID."""
        # Create vendor with one contact person
        url = reverse("vendor-list")
        response = self.client.post(url, self.vendor_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        vendor_id = response.data["id"]
        cps = response.data["contact_persons"]
        self.assertEqual(len(cps), 1)
        old_cp = cps[0]
        old_cp_id = old_cp["id"]
        # Prepare update: retain old, add new
        update_data = self.vendor_data.copy()
        update_data["contact_persons"] = [
            {"id": old_cp_id, "salutation": old_cp["salutation"], "first_name": old_cp["first_name"], "last_name": old_cp["last_name"], "email": old_cp["email"], "work_phone": "", "mobile": ""},
            {"salutation": "mr", "first_name": "New", "last_name": "Person", "email": "new@vendor.com", "work_phone": "", "mobile": ""}
        ]
        update_url = reverse("vendor-detail", args=[vendor_id])
        response = self.client.put(update_url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cps = response.data["contact_persons"]
        self.assertEqual(len(cps), 2)
        ids = [cp["id"] for cp in cps]
        self.assertIn(old_cp_id, ids)
        # Find the new contact person
        new_cp = next(cp for cp in cps if cp["id"] != old_cp_id)
        self.assertEqual(new_cp["first_name"], "New")
        self.assertEqual(new_cp["email"], "new@vendor.com")
        # Now remove the old contact person, only new should remain
        update_data["contact_persons"] = [
            {"id": new_cp["id"], "salutation": new_cp["salutation"], "first_name": new_cp["first_name"], "last_name": new_cp["last_name"], "email": new_cp["email"], "work_phone": "", "mobile": ""}
        ]
        response = self.client.put(update_url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cps = response.data["contact_persons"]
        self.assertEqual(len(cps), 1)
        self.assertEqual(cps[0]["id"], new_cp["id"])
    """Test CRUD operations for Vendor endpoint."""


    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser2", password="testpass2"
        )
        self.client.force_authenticate(user=self.user)
        self.vendor_data = {
            "vendor_type": "business",
            "salutation": "mr",
            "first_name": "Test",
            "last_name": "Vendor",
            "company_name": "Test Vendor Pvt Ltd",
            "display_name": "Test Vendor Pvt Ltd (Test Vendor)",
            "email": "vendor@example.com",
            "work_phone": "1234567890",
            "mobile": "9876543210",
            "pan": "ABCDE1234F",
            "currency": "INR",
            "opening_balance": "5000.00",
            "payment_terms": "net_30",
            "billing_attention": "Accounts",
            "billing_country": "India",
            "billing_street1": "123 Vendor St",
            "billing_street2": "Suite 200",
            "billing_city": "Mumbai",
            "billing_state": "MH",
            "billing_pin_code": "400001",
            "billing_phone": "0221234567",
            "billing_fax": "0227654321",
            "shipping_attention": "Warehouse",
            "shipping_country": "India",
            "shipping_street1": "456 Warehouse Rd",
            "shipping_street2": "",
            "shipping_city": "Mumbai",
            "shipping_state": "MH",
            "shipping_pin_code": "400002",
            "shipping_phone": "0229876543",
            "shipping_fax": "0223456789",
            "contact_persons": [
                {
                    "salutation": "ms",
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "email": "jane@vendor.com",
                    "work_phone": "",
                    "mobile": ""
                }
            ],
            "custom_fields": {"GSTIN": "27ABCDE1234F1Z5"},
            "tags": ["priority", "2025"],
            "remarks": "Important vendor"
        }


    def test_create_vendor(self):
        """Test creating a vendor via the API with all fields and contact persons."""
        url = reverse("vendor-list")
        response = self.client.post(url, self.vendor_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["display_name"], self.vendor_data["display_name"])
        self.assertIn("contact_persons", response.data)
        self.assertEqual(len(response.data["contact_persons"]), 1)
        cp = response.data["contact_persons"][0]
        self.assertEqual(cp["first_name"], "Jane")
        self.assertEqual(cp["last_name"], "Smith")
        self.assertEqual(cp["email"], "jane@vendor.com")


    def test_list_vendors(self):
        """Test listing vendors via the API."""
        url = reverse("vendor-list")
        self.client.post(url, self.vendor_data, format="json")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"] if "results" in response.data else response.data
        self.assertGreaterEqual(len(results), 1)
        vendor = results[0]
        self.assertIn("contact_persons", vendor)
        self.assertEqual(len(vendor["contact_persons"]), 1)
        cp = vendor["contact_persons"][0]
        self.assertEqual(cp["first_name"], "Jane")
        self.assertEqual(cp["last_name"], "Smith")
