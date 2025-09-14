from rest_framework import viewsets, permissions, filters
from .models_banking import BankingAccount
from .models_transaction import Transaction
from .serializers import BankingAccountSerializer, TransactionSerializer


class BankingAccountViewSet(viewsets.ModelViewSet):
    queryset = BankingAccount.objects.all()
    serializer_class = BankingAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "account_name",
        "account_number",
        "bank_name",
        "card_holder_name",
        "card_number",
    ]
    ordering_fields = ["id", "account_name", "created_at"]


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by("-created_at")
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "reference_number"]
    ordering_fields = ["id", "date", "amount", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        # Filtering logic
        if params.get("from_date"):
            qs = qs.filter(date__gte=params["from_date"])
        if params.get("to_date"):
            qs = qs.filter(date__lte=params["to_date"])
        if params.get("transaction_type"):
            qs = qs.filter(transaction_type=params["transaction_type"])
        if params.get("from_amount"):
            qs = qs.filter(amount__gte=params["from_amount"])
        if params.get("to_amount"):
            qs = qs.filter(amount__lte=params["to_amount"])
        if params.get("source_type"):
            qs = qs.filter(source_type=params["source_type"])
        if params.get("source_id"):
            qs = qs.filter(source_id=params["source_id"])
        if params.get("destination_type"):
            qs = qs.filter(destination_type=params["destination_type"])
        if params.get("destination_id"):
            qs = qs.filter(destination_id=params["destination_id"])
        return qs
