
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
    """Test CRUD operations for Vendor endpoint."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser2", password="testpass2"
        )
        self.client.force_authenticate(user=self.user)
        self.vendor_data = {"name": "Test Vendor",
                            "email": "vendor@example.com"}

    def test_create_vendor(self):
        """Test creating a vendor via the API."""
        url = reverse("vendor-list")
        response = self.client.post(url, self.vendor_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], self.vendor_data["name"])

    def test_list_vendors(self):
        """Test listing vendors via the API."""
        url = reverse("vendor-list")
        self.client.post(url, self.vendor_data)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
