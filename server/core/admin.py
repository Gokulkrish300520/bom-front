from django.contrib import admin
from .models import Customer, CustomerDocument, ContactPerson, Quote, QuoteItem

admin.site.register(Customer)
admin.site.register(CustomerDocument)
admin.site.register(ContactPerson)
admin.site.register(Quote)
admin.site.register(QuoteItem)
