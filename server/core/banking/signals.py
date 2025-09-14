from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models_transaction import Transaction
from .business_logic import update_balances_for_transaction


@receiver(post_save, sender=Transaction)
def handle_transaction_save(sender, instance, created, **kwargs):
    # On create, always update balances
    if created:
        update_balances_for_transaction(instance, reverse=False)
    else:
        # For updates, you may want to handle old vs new values
        # (not shown here for brevity)
        pass


@receiver(post_delete, sender=Transaction)
def handle_transaction_delete(sender, instance, **kwargs):
    # On delete, reverse the transaction effect
    update_balances_for_transaction(instance, reverse=True)
