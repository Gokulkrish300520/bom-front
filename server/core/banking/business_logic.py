from django.db import transaction as db_transaction
from django.core.exceptions import ObjectDoesNotExist
from .models_banking import BankingAccount
from .models_transaction import Transaction


def update_balances_for_transaction(txn: Transaction, reverse=False):
    """
    Update balances for the involved accounts atomically when a transaction is
    created, updated, or deleted.
    If reverse=True, the effect of the transaction is reversed (for
    delete/rollback).
    """
    amount = -txn.amount if reverse else txn.amount
    with db_transaction.atomic():
        # Source: decrease for bank/credit_card
        if txn.source_type in ("bank", "credit_card"):
            try:
                acc = BankingAccount.objects.select_for_update().get(
                    id=txn.source_id,
                    account_type=txn.source_type,
                )
                if txn.source_type == "bank":
                    acc.current_balance = round(
                        acc.current_balance - amount, 2)
                else:
                    acc.current_outstanding = round(
                        acc.current_outstanding + amount, 2)
                acc.save()
            except ObjectDoesNotExist:
                pass  # Optionally raise or log
        # Destination: increase for bank/credit_card
        if txn.destination_type in ("bank", "credit_card"):
            try:
                acc = BankingAccount.objects.select_for_update().get(
                    id=txn.destination_id,
                    account_type=txn.destination_type,
                )
                if txn.destination_type == "bank":
                    acc.current_balance = round(
                        acc.current_balance + amount, 2)
                else:
                    acc.current_outstanding = round(
                        acc.current_outstanding - amount, 2)
                acc.save()
            except ObjectDoesNotExist:
                pass  # Optionally raise or log
