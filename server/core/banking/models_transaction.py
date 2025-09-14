from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError


class Transaction(models.Model):
    TYPE_CHOICES = [
        ("customer", "Customer"),
        ("vendor", "Vendor"),
        ("bank", "Bank"),
        ("credit_card", "Credit Card"),
    ]
    TRANSACTION_TYPE_CHOICES = [
        ("payment", "Payment"),
        ("receipt", "Receipt"),
        ("transfer", "Transfer"),
        ("refund", "Refund"),
        ("fee", "Fee"),
        ("interest", "Interest"),
        ("adjustment", "Adjustment"),
    ]
    source_type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    source_id = models.PositiveIntegerField()
    destination_type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    destination_id = models.PositiveIntegerField()
    transaction_type = models.CharField(
        max_length=16, choices=TRANSACTION_TYPE_CHOICES)
    name = models.CharField(max_length=128, blank=True)
    date = models.DateField(default=timezone.now)
    amount = models.FloatField(validators=[MinValueValidator(0.01)])
    description = models.TextField(blank=True)
    reference_number = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["source_type", "source_id"]),
            models.Index(fields=["destination_type", "destination_id"]),
            models.Index(fields=["transaction_type"]),
            models.Index(fields=["date"]),
        ]

    def clean(self):
        # Prevent self-referencing
        if (
            self.source_type == self.destination_type
            and self.source_id == self.destination_id
        ):
            raise ValidationError(
                "Source and destination cannot be the same in a transaction."
            )
        # Add more validation as needed (e.g., check referenced objects exist)

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.transaction_type.title()} of {self.amount} "
            f"from {self.source_type}:{self.source_id} "
            f"to {self.destination_type}:{self.destination_id} "
            f"on {self.date}"
        )
