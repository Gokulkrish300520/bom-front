from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model


class ItemAPITestCase(APITestCase):
    """Test CRUD operations for Item endpoint."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="itemuser", password="itempass"
        )
        self.client.force_authenticate(user=self.user)
        self.item_data = {"name": "Test Item",
                          "price": "10.00",
                          "sku": "SKU123"}

    def test_create_item(self):
        url = reverse("item-list")
        response = self.client.post(url, self.item_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], self.item_data["name"])

    def test_list_items(self):
        url = reverse("item-list")
        self.client.post(url, self.item_data)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
