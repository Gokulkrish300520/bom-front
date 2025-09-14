import django_filters
from .models import Quote


class QuoteFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="customer_id")

    class Meta:
        model = Quote
        fields = ["customer_id"]
