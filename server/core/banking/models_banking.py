from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class BankingAccount(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ("bank", "Bank"),
        ("credit_card", "Credit Card"),
    ]
    account_type = models.CharField(
        max_length=16, choices=ACCOUNT_TYPE_CHOICES)
    currency = models.CharField(max_length=8, default="INR")
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    primary = models.BooleanField(default=False)

    # Bank fields
    account_name = models.CharField(max_length=128, blank=True)
    account_code = models.CharField(max_length=64, blank=True)
    account_number = models.CharField(max_length=64, blank=True)
    bank_name = models.CharField(max_length=128, blank=True)
    ifsc = models.CharField(max_length=32, blank=True)
    opening_balance = models.FloatField(null=True, blank=True)
    current_balance = models.FloatField(default=0, editable=False)

    # Credit card fields
    card_number = models.CharField(max_length=32, blank=True)
    card_holder_name = models.CharField(max_length=128, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    credit_limit = models.FloatField(null=True, blank=True)
    issuing_bank = models.CharField(max_length=128, blank=True)
    statement_day = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(31)],
    )
    payment_due_day = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(31)],
    )
    opening_outstanding = models.FloatField(null=True, blank=True)
    current_outstanding = models.FloatField(default=0, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Enforce only one primary account
        if self.primary:
            (
                BankingAccount.objects.filter(primary=True)
                .exclude(id=self.id)
                .update(primary=False)
            )
        # Set current_balance/opening_balance for bank
        if self.account_type == "bank":
            if self._state.adding and self.opening_balance is not None:
                self.current_balance = round(self.opening_balance, 2)
        # Set current_outstanding/opening_outstanding for credit card
        if self.account_type == "credit_card":
            if self._state.adding and self.opening_outstanding is not None:
                self.current_outstanding = round(self.opening_outstanding, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        if self.account_type == "bank":
            return f"Bank: {self.account_name or self.account_number}"
        if self.account_type == "credit_card":
            return f"Credit Card: {self.card_holder_name or self.card_number}"
        return f"Account {self.id}"
