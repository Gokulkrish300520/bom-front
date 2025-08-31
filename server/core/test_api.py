from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model


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
        }

    def test_create_customer(self):
        url = reverse("customer-list")
        response = self.client.post(url, self.customer_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["display_name"], self.customer_data["display_name"]
        )

    def test_list_customers(self):
        url = reverse("customer-list")
        self.client.post(url, self.customer_data)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)


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
        url = reverse("vendor-list")
        response = self.client.post(url, self.vendor_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], self.vendor_data["name"])

    def test_list_vendors(self):
        url = reverse("vendor-list")
        self.client.post(url, self.vendor_data)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
