from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Customer, ContactPerson, Quote, QuoteItem, CustomerDocument, Vendor
from django.utils import timezone

class Command(BaseCommand):
    help = 'Load realistic demo data into all tables.'

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.filter(username='demo').exists():
            user = User.objects.create_user('demo', 'demo@example.com', 'demopassword')
            self.stdout.write(self.style.SUCCESS('Created demo user'))
        else:
            user = User.objects.get(username='demo')

        # Items
        from core.models import Item
        item1, _ = Item.objects.get_or_create(
            name='Widget A',
            defaults={
                # legacy fields removed
                'track_inventory': True,
                'opening_stock': 100,
                'current_stock': 100,
            }
        )
        item2, _ = Item.objects.get_or_create(
            name='Widget B',
            defaults={
                # legacy fields removed
                'track_inventory': True,
                'opening_stock': 50,
                'current_stock': 50,
            }
        )
        item3, _ = Item.objects.get_or_create(
            name='Gadget X',
            defaults={
                # legacy fields removed
                'track_inventory': False,
            }
        )

        # Inventory Management Demo Data
        from core.inventory_management_models import InventoryManagement, InventoryItemDetail
        inv1, _ = InventoryManagement.objects.get_or_create(
            item_name="Demo Inventory Item 1",
            unit="Nos",
            type="Goods",
            hsn_code="1001",
            # description removed
            selling_price=150.00,
            purchase_price=120.00,
            tax="18%",
        )
        InventoryItemDetail.objects.get_or_create(
            inventory=inv1,
            # description removed
            quantity=10,
            adjustment=0,
            amount=1500.00,
        )
        InventoryItemDetail.objects.get_or_create(
            inventory=inv1,
            # description removed
            quantity=5,
            adjustment=1,
            amount=750.00,
        )
        inv2, _ = InventoryManagement.objects.get_or_create(
            item_name="Demo Inventory Item 2",
            unit="Kgs",
            type="Goods",
            hsn_code="2002",
            # description removed
            selling_price=300.00,
            purchase_price=250.00,
            tax="12%",
        )
        InventoryItemDetail.objects.get_or_create(
            inventory=inv2,
            # description removed
            quantity=20,
            adjustment=0,
            amount=6000.00,
        )

        # Customers
        customer1, _ = Customer.objects.get_or_create(
            email='acme@example.com',
            defaults={
                'display_name': 'Acme Corp',
                'company_name': 'Acme Corporation',
                'billing_phone': '1234567890',
                'billing_street1': '123 Main St',
                'billing_city': 'Metropolis',
                'billing_state': 'State1',
                'billing_pin_code': '100001',
                'customer_type': 'business',
            }
        )
        customer2, _ = Customer.objects.get_or_create(
            email='globex@example.com',
            defaults={
                'display_name': 'Globex Inc',
                'company_name': 'Globex Incorporated',
                'billing_phone': '9876543210',
                'billing_street1': '456 Elm St',
                'billing_city': 'Gotham',
                'billing_state': 'State2',
                'billing_pin_code': '200002',
                'customer_type': 'business',
            }
        )

        # Vendors
        vendor1, _ = Vendor.objects.get_or_create(
            email='vendor1@example.com',
            defaults={
                'display_name': 'Vendor One',
                'company_name': 'Vendor One Pvt Ltd',
                'vendor_type': 'business',
                'billing_phone': '9988776655',
                'billing_street1': '789 Supplier Rd',
                'billing_city': 'Supplier City',
                'billing_state': 'State2',
                'billing_pin_code': '200002',
                'currency': 'INR',
                'payment_terms': 'net_30',
                'custom_fields': {"GSTIN": "27VENDOR1234F1Z5"},
                'tags': ['preferred', '2025'],
                'remarks': 'Key vendor',
            }
        )
        vendor2, _ = Vendor.objects.get_or_create(
            email='vendor2@example.com',
            defaults={
                'display_name': 'Vendor Two',
                'company_name': 'Vendor Two LLP',
                'vendor_type': 'individual',
                'billing_phone': '8877665544',
                'billing_street1': '456 Vendor Lane',
                'billing_city': 'Vendor Town',
                'billing_state': 'State3',
                'billing_pin_code': '300003',
                'currency': 'USD',
                'payment_terms': 'due_on_receipt',
                'custom_fields': {"GSTIN": "29VENDOR5678F2Z6"},
                'tags': ['international'],
                'remarks': 'Occasional supplier',
            }
        )
        # Vendor contact persons
        ContactPerson.objects.get_or_create(
            vendor=vendor1,
            email='alice@vendor1.com',
            defaults={
                'salutation': 'ms',
                'first_name': 'Alice',
                'last_name': 'Vendor',
                'work_phone': '9988776655',
                'mobile': '9123456789',
            }
        )
        ContactPerson.objects.get_or_create(
            vendor=vendor2,
            email='bob@vendor2.com',
            defaults={
                'salutation': 'mr',
                'first_name': 'Bob',
                'last_name': 'Supplier',
                'work_phone': '8877665544',
                'mobile': '9876543210',
            }
        )

        # Contact Persons
        cp1, _ = ContactPerson.objects.get_or_create(
            customer=customer1,
            email='alice@acme.com',
            defaults={
                'first_name': 'Alice',
                'last_name': 'Smith',
                'work_phone': '1112223333',
                'mobile': '',
            }
        )
        cp2, _ = ContactPerson.objects.get_or_create(
            customer=customer1,
            email='bob@acme.com',
            defaults={
                'first_name': 'Bob',
                'last_name': 'Jones',
                'work_phone': '4445556666',
                'mobile': '',
            }
        )
        cp3, _ = ContactPerson.objects.get_or_create(
            customer=customer2,
            email='carol@globex.com',
            defaults={
                'first_name': 'Carol',
                'last_name': 'White',
                'work_phone': '7778889999',
                'mobile': '',
            }
        )

        # Quotes
        today = timezone.now().date()
        quote1, _ = Quote.objects.get_or_create(
            quote_number='Q-1001',
            defaults={
                'customer': customer1,
                'quote_date': today,
                'expiry_date': today,
                'customer_notes': 'Urgent delivery',
                'subtotal': 9000,
                'discount': 0,
                'tax_type': 'TDS',
                'tax_percentage': '0',
                'adjustment': 0,
                'total_amount': 10000,
            }
        )
        quote2, _ = Quote.objects.get_or_create(
            quote_number='Q-1002',
            defaults={
                'customer': customer2,
                'quote_date': today,
                'expiry_date': today,
                'customer_notes': 'Standard terms',
                'subtotal': 18000,
                'discount': 0,
                'tax_type': 'TDS',
                'tax_percentage': '0',
                'adjustment': 0,
                'total_amount': 20000,
            }
        )

        # Quote Items
        QuoteItem.objects.get_or_create(
            quote=quote1,
            item=item1,
            defaults={
                'quantity': 10,
                'rate': 500,
                'amount': 5000,
                'quote_item_number': 1,
            }
        )
        QuoteItem.objects.get_or_create(
            quote=quote1,
            item=item2,
            defaults={
                'quantity': 5,
                'rate': 1000,
                'amount': 5000,
                'quote_item_number': 2,
            }
        )
        QuoteItem.objects.get_or_create(
            quote=quote2,
            item=item3,
            defaults={
                'quantity': 20,
                'rate': 800,
                'amount': 16000,
                'quote_item_number': 1,
            }
        )

        # Demo Invoices
        from core.models import Invoice, InvoiceItem
        import decimal
        invoice1, _ = Invoice.objects.get_or_create(
            invoice_number="INV-2025-001",
            defaults={
                "customer": customer1,
                "order_number": "ORD-123",
                "invoice_date": today,
                "due_date": today.replace(day=min(today.day+15,28)),
                "status": "UNPAID",
                "customer_notes": "Demo invoice for Acme Corp.",
                "terms_and_conditions": "Payment due in 30 days.",
                "subtotal_amount": decimal.Decimal("11000.00"),
                "gst_amount": decimal.Decimal("1980.00"),
                "total_amount": decimal.Decimal("12980.00"),
            }
        )
        invoice2, _ = Invoice.objects.get_or_create(
            invoice_number="INV-2025-002",
            defaults={
                "customer": customer2,
                "order_number": "ORD-124",
                "invoice_date": today,
                "due_date": today.replace(day=min(today.day+20,28)),
                "status": "DRAFT",
                "customer_notes": "Demo invoice for Globex Inc.",
                "terms_and_conditions": "Payment due in 15 days.",
                "subtotal_amount": decimal.Decimal("5000.00"),
                "gst_amount": decimal.Decimal("900.00"),
                "total_amount": decimal.Decimal("5900.00"),
            }
        )
        # Demo Invoice Items
        InvoiceItem.objects.get_or_create(
            invoice=invoice1,
            item=item1,
            invoice_item_number=1,
            defaults={
                "quantity": 2,
                "rate": decimal.Decimal("5000.00"),
                "amount": decimal.Decimal("10000.00"),
            }
        )
        InvoiceItem.objects.get_or_create(
            invoice=invoice1,
            item=item2,
            invoice_item_number=2,
            defaults={
                "quantity": 1,
                "rate": decimal.Decimal("1000.00"),
                "amount": decimal.Decimal("1000.00"),
            }
        )
        InvoiceItem.objects.get_or_create(
            invoice=invoice2,
            item=item3,
            invoice_item_number=1,
            defaults={
                "quantity": 5,
                "rate": decimal.Decimal("1000.00"),
                "amount": decimal.Decimal("5000.00"),
            }
        )

        # Example for InvoiceItem, ProformaInvoiceItem, DeliveryChallanItem (future-proof, add real demo if needed)
        # from core.models import InvoiceItem, ProformaInvoiceItem, DeliveryChallanItem, Invoice, ProformaInvoice, DeliveryChallan
        # invoice = Invoice.objects.first()
        # item = Item.objects.first()
        # if invoice and item:
        #     InvoiceItem.objects.create(invoice=invoice, item=item, quantity=1, rate=100, amount=100, invoice_item_number=1)
        # proforma = ProformaInvoice.objects.first()
        # if proforma and item:
        #     ProformaInvoiceItem.objects.create(proforma_invoice=proforma, item=item, quantity=1, rate=100, amount=100, proforma_invoice_item_number=1)
        # challan = DeliveryChallan.objects.first()
        # if challan and item:
        #     DeliveryChallanItem.objects.create(delivery_challan=challan, item=item, quantity=1, rate=100, amount=100, delivery_challan_item_number=1)

        # Customer Documents (dummy entries, not real files)
        CustomerDocument.objects.create(
            file='customer_documents/testfile.txt',
            uploaded_at=timezone.now(),
        )
        CustomerDocument.objects.create(
            file='customer_documents/testfile_1TjmGU8.txt',
            uploaded_at=timezone.now(),
        )

        self.stdout.write(self.style.SUCCESS('Demo data loaded successfully.'))


