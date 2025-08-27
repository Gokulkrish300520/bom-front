from django.contrib import admin
from .models import Customer, CustomerDocument, ContactPerson

admin.site.register(Customer)
admin.site.register(CustomerDocument)
admin.site.register(ContactPerson)
