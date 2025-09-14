from rest_framework import serializers
from .models_banking import BankingAccount
from .models_transaction import Transaction


class BankingAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankingAccount
        fields = "__all__"
        read_only_fields = [
            "id",
            "current_balance",
            "current_outstanding",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        account_type = data.get("account_type")
        if account_type == "bank":
            required = [
                "account_name",
                "account_code",
                "account_number",
                "bank_name",
                "ifsc",
                "opening_balance",
            ]
        elif account_type == "credit_card":
            required = [
                "card_number",
                "card_holder_name",
                "expiry_date",
                "opening_outstanding",
            ]
        else:
            required = []
        for field in required:
            if not data.get(field):
                raise serializers.ValidationError(
                    f"{field} is required for {account_type} account."
                )
        return data


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        if (
            data["source_type"] == data["destination_type"]
            and data["source_id"] == data["destination_id"]
        ):
            raise serializers.ValidationError(
                "Source and destination cannot be the same."
            )
        if data["amount"] <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return data
