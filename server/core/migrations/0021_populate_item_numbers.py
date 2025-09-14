from django.db import migrations


def populate_item_numbers(apps, schema_editor):
    InvoiceItem = apps.get_model("core", "InvoiceItem")
    ProformaInvoiceItem = apps.get_model("core", "ProformaInvoiceItem")
    DeliveryChallanItem = apps.get_model("core", "DeliveryChallanItem")

    # InvoiceItem
    for invoice_id in InvoiceItem.objects.values_list(
        "invoice_id", flat=True
    ).distinct():
        items = InvoiceItem.objects.filter(
            invoice_id=invoice_id).order_by("id")
        for idx, item in enumerate(items, 1):
            item.invoice_item_number = idx
            item.save(update_fields=["invoice_item_number"])

    # ProformaInvoiceItem
    for proforma_id in ProformaInvoiceItem.objects.values_list(
        "proforma_invoice_id", flat=True
    ).distinct():
        items = ProformaInvoiceItem.objects.filter(
            proforma_invoice_id=proforma_id
        ).order_by("id")
        for idx, item in enumerate(items, 1):
            item.proforma_invoice_item_number = idx
            item.save(update_fields=["proforma_invoice_item_number"])

    # DeliveryChallanItem
    for challan_id in DeliveryChallanItem.objects.values_list(
        "delivery_challan_id", flat=True
    ).distinct():
        items = DeliveryChallanItem.objects.filter(
            delivery_challan_id=challan_id
        ).order_by("id")
        for idx, item in enumerate(items, 1):
            item.delivery_challan_item_number = idx
            item.save(update_fields=["delivery_challan_item_number"])


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0020_deliverychallanitem_delivery_challan_item_number_and_more"),
    ]
    operations = [
        migrations.RunPython(
            populate_item_numbers, reverse_code=migrations.RunPython.noop
        ),
    ]
