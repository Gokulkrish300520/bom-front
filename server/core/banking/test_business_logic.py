

from django.test import TestCase
from unittest.mock import patch, MagicMock
from django.core.exceptions import ObjectDoesNotExist
from server.core.banking.business_logic import update_balances_for_transaction


class UpdateBalancesForTransactionTest(TestCase):

    @patch(
        'server.core.banking.business_logic.BankingAccount'
    )
    def test_update_balances_for_transaction_credit_card(
        self, mock_account
    ):
        txn = MagicMock()
        txn.amount = 150
        txn.source_type = 'credit_card'
        txn.source_id = 3
        txn.destination_type = 'credit_card'
        txn.destination_id = 4
        # Mock source and destination accounts
        source_acc = MagicMock(current_outstanding=1000)
        dest_acc = MagicMock(current_outstanding=500)
        mock_account.objects.select_for_update().get.side_effect = [
            source_acc,
            dest_acc
        ]
        update_balances_for_transaction(txn)
        source_acc.save.assert_called()
        dest_acc.save.assert_called()
        self.assertEqual(source_acc.current_outstanding, 1150)
        self.assertEqual(dest_acc.current_outstanding, 350)

    @patch(
        'server.core.banking.business_logic.BankingAccount'
    )
    def test_update_balances_for_transaction_source_missing(
        self, mock_account
    ):
        txn = MagicMock()
        txn.amount = 100
        txn.source_type = 'bank'
        txn.source_id = 1
        txn.destination_type = 'bank'
        txn.destination_id = 2
        # Simulate ObjectDoesNotExist for source, valid dest
        dest_acc = MagicMock(current_balance=200)
        obj_dne = ObjectDoesNotExist()
        side_effects = [
            obj_dne,
            dest_acc
        ]
        get_method = mock_account.objects.select_for_update().get
        get_method.side_effect = side_effects
        update_balances_for_transaction(txn)
        dest_acc.save.assert_called()
        self.assertEqual(dest_acc.current_balance, 300)

    @patch(
        'server.core.banking.business_logic.BankingAccount'
    )
    def test_update_balances_for_transaction_dest_missing(
        self, mock_account
    ):
        txn = MagicMock()
        txn.amount = 100
        txn.source_type = 'bank'
        txn.source_id = 1
        txn.destination_type = 'bank'
        txn.destination_id = 2
        # Simulate valid source, ObjectDoesNotExist for dest
        source_acc = MagicMock(current_balance=500)
        mock_account.objects.select_for_update().get.side_effect = [
            source_acc, ObjectDoesNotExist()
        ]
        update_balances_for_transaction(txn)
        source_acc.save.assert_called()
        # No assertion for dest_acc.save since it should not be called

    @patch(
        'server.core.banking.business_logic.BankingAccount'
    )
    def test_update_balances_for_transaction_only_source(
        self, mock_account
    ):
        txn = MagicMock()
        txn.amount = 75
        txn.source_type = 'bank'
        txn.source_id = 1
        txn.destination_type = None
        txn.destination_id = None
        source_acc = MagicMock(current_balance=500)
        mock_account.objects.select_for_update().get.side_effect = [
            source_acc
        ]
        update_balances_for_transaction(txn)
        source_acc.save.assert_called()

    @patch(
        'server.core.banking.business_logic.BankingAccount'
    )
    def test_update_balances_for_transaction_only_dest(
        self, mock_account
    ):
        txn = MagicMock()
        txn.amount = 60
        txn.source_type = None
        txn.source_id = None
        txn.destination_type = 'bank'
        txn.destination_id = 2
        dest_acc = MagicMock(current_balance=200)
        mock_account.objects.select_for_update().get.side_effect = [
            dest_acc
        ]
        update_balances_for_transaction(txn)
        dest_acc.save.assert_called()

    @patch(
        'server.core.banking.business_logic.BankingAccount'
    )
    def test_update_balances_for_transaction_bank(
        self, mock_account
    ):
        txn = MagicMock()
        txn.amount = 100
        txn.source_type = 'bank'
        txn.source_id = 1
        txn.destination_type = 'bank'
        txn.destination_id = 2
        # Mock source and destination accounts
        source_acc = MagicMock(current_balance=500)
        dest_acc = MagicMock(current_balance=200)
        mock_account.objects.select_for_update().get.side_effect = [
            source_acc, dest_acc
        ]
        update_balances_for_transaction(txn)
        source_acc.save.assert_called()
        dest_acc.save.assert_called()
        self.assertEqual(source_acc.current_balance, 400)
        self.assertEqual(dest_acc.current_balance, 300)

    @patch(
        'server.core.banking.business_logic.BankingAccount'
    )
    def test_update_balances_for_transaction_reverse(
        self, mock_account
    ):
        txn = MagicMock()
        txn.amount = 50
        txn.source_type = 'bank'
        txn.source_id = 1
        txn.destination_type = 'bank'
        txn.destination_id = 2
        source_acc = MagicMock(current_balance=500)
        dest_acc = MagicMock(current_balance=200)
        mock_account.objects.select_for_update().get.side_effect = [
            source_acc, dest_acc
        ]
        update_balances_for_transaction(txn, reverse=True)
        self.assertEqual(source_acc.current_balance, 550)
        self.assertEqual(dest_acc.current_balance, 150)
