import django_filters
from .models import Quote


class QuoteFilter(django_filters.FilterSet):
    customer_id = django_filters.NumberFilter(field_name="customer_id")
    start_date = django_filters.DateFilter(field_name="quote_date", lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name="quote_date", lookup_expr='lte')
    deal_no = django_filters.CharFilter(field_name="deal_no", lookup_expr='exact')
    company_name = django_filters.CharFilter(field_name="customer__company_name", lookup_expr='icontains')
    status = django_filters.ChoiceFilter(field_name="status", choices=Quote._meta.get_field('status').choices)
    deal_no= django_filters.CharFilter(field_name="item_details__deal_no", lookup_expr='exact')

    class Meta:
        model = Quote
        fields = ["customer_id", "start_date", "end_date", "deal_no","company_name", "status"]