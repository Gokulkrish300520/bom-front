from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from .models_banking import BankingAccount
from .models_transaction import Transaction


class BankingAccountModelTest(TestCase):
    def test_create_bank_account(self):
        acc = BankingAccount.objects.create(
            account_type="bank",
            account_name="Test Bank Account",
            account_code="BANK001",
            account_number="1234567890",
            bank_name="Test Bank",
            ifsc="TEST0001",
            opening_balance=1000.0,
            primary=True,
        )
        self.assertEqual(acc.current_balance, 1000.0)
        self.assertTrue(acc.primary)

    def test_create_credit_card_account(self):
        acc = BankingAccount.objects.create(
            account_type="credit_card",
            card_number="4111111111111111",
            card_holder_name="Test User",
            expiry_date="2030-12-31",
            opening_outstanding=500.0,
            primary=True,
        )
        self.assertEqual(acc.current_outstanding, 500.0)
        self.assertTrue(acc.primary)


class TransactionModelTest(TestCase):
    def setUp(self):
        self.bank = BankingAccount.objects.create(
            account_type="bank",
            account_name="Bank1",
            account_code="B1",
            account_number="111",
            bank_name="Bank1",
            ifsc="IFSC1",
            opening_balance=1000.0,
            primary=True,
        )
        self.cc = BankingAccount.objects.create(
            account_type="credit_card",
            card_number="4111",
            card_holder_name="User",
            expiry_date="2030-12-31",
            opening_outstanding=200.0,
            primary=False,
        )

    def test_create_transaction_bank_to_cc(self):
        Transaction.objects.create(
            source_type="bank",
            source_id=self.bank.id,
            destination_type="credit_card",
            destination_id=self.cc.id,
            transaction_type="payment",
            amount=100.0,
            date="2025-09-11",
        )
        self.bank.refresh_from_db()
        self.cc.refresh_from_db()
        self.assertEqual(self.bank.current_balance, 900.0)
        self.assertEqual(self.cc.current_outstanding, 100.0)

    def test_prevent_self_reference(self):
        with self.assertRaises(Exception):
            Transaction.objects.create(
                source_type="bank",
                source_id=self.bank.id,
                destination_type="bank",
                destination_id=self.bank.id,
                transaction_type="transfer",
                amount=50.0,
                date="2025-09-11",
            )


class BankingAccountAPITest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="bankapiuser", password="testpass"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = reverse("bankingaccount-list")

    def test_create_bank_account_api(self):
        data = {
            "account_type": "bank",
            "account_name": "API Bank",
            "account_code": "API001",
            "account_number": "222",
            "bank_name": "API Bank",
            "ifsc": "APIIFSC",
            "opening_balance": 500.0,
            "primary": True,
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["current_balance"], 500.0)


class TransactionAPITest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="txnapiuser", password="testpass"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.bank = BankingAccount.objects.create(
            account_type="bank",
            account_name="BankAPI",
            account_code="BAPI",
            account_number="333",
            bank_name="BankAPI",
            ifsc="IFSCAPI",
            opening_balance=1000.0,
            primary=True,
        )
        self.cc = BankingAccount.objects.create(
            account_type="credit_card",
            card_number="4222",
            card_holder_name="UserAPI",
            expiry_date="2030-12-31",
            opening_outstanding=300.0,
            primary=False,
        )
        self.url = reverse("transaction-list")

    def test_create_transaction_api(self):
        data = {
            "source_type": "bank",
            "source_id": self.bank.id,
            "destination_type": "credit_card",
            "destination_id": self.cc.id,
            "transaction_type": "payment",
            "amount": 150.0,
            "date": "2025-09-11",
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        self.bank.refresh_from_db()
        self.cc.refresh_from_db()
        self.assertEqual(self.bank.current_balance, 850.0)
        self.assertEqual(self.cc.current_outstanding, 150.0)

    def test_filter_transactions(self):
        Transaction.objects.create(
            source_type="bank",
            source_id=self.bank.id,
            destination_type="credit_card",
            destination_id=self.cc.id,
            transaction_type="payment",
            amount=100.0,
            date="2025-09-10",
        )
        resp = self.client.get(
            self.url, {"from_date": "2025-09-09", "to_date": "2025-09-11"}
        )
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)
