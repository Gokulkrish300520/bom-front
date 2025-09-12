"""Shared test utilities for DRF file attachment and item detail tests."""

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from .models import Customer, CustomerDocument, Item

class FileAttachmentTestBase(APITestCase):
    """Base class for file attachment and item detail test setup."""
    user_username = "testuser"
    user_password = "testpass"
    customer_email = "testcustomer@example.com"
    item_name = "Test Item"
    item_sku = "SKU1"
    file_names = ["file1.pdf", "file2.pdf", "file3.pdf"]

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username=self.user_username, password=self.user_password
        )
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(  # pylint: disable=no-member
            display_name="Test Customer", email=self.customer_email
        )
        self.files = [
            CustomerDocument.objects.create(file=fname) for fname in self.file_names  # pylint: disable=no-member
        ]
        self.item = Item.objects.create(  # pylint: disable=no-member
            name=self.item_name
        )

    def get_file_ids(self, count=None):
        """Return a list of file IDs, limited by count if provided."""
        if count is None:
            return [f.id for f in self.files]
        return [f.id for f in self.files[:count]]
