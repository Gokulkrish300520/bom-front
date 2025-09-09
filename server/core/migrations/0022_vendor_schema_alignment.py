from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("core", "0021_populate_item_numbers"),
    ]

    operations = [
        migrations.AddField(
            model_name="vendor",
            name="vendor_type",
            field=models.CharField(max_length=20, choices=[("business", "Business"), ("individual", "Individual")], default="business"),
        ),
        migrations.AddField(
            model_name="vendor",
            name="salutation",
            field=models.CharField(max_length=5, choices=[("dr", "Dr"), ("mr", "Mr"), ("ms", "Ms"), ("mrs", "Mrs")], blank=True, null=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="first_name",
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="last_name",
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="display_name",
            field=models.CharField(max_length=255, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="vendor",
            name="work_phone",
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="mobile",
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="pan",
            field=models.CharField(max_length=20, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="currency",
            field=models.CharField(max_length=3, choices=[("AED", "AED"), ("AUD", "AUD"), ("BND", "BND"), ("CAD", "CAD"), ("CNY", "CNY"), ("EUR", "EUR"), ("GBP", "GBP"), ("INR", "INR"), ("JPY", "JPY"), ("SAR", "SAR"), ("USD", "USD"), ("ZAR", "ZAR")], default="INR"),
        ),
        migrations.AddField(
            model_name="vendor",
            name="opening_balance",
            field=models.DecimalField(max_digits=12, decimal_places=2, default=0),
        ),
        migrations.AddField(
            model_name="vendor",
            name="payment_terms",
            field=models.CharField(max_length=20, choices=[("due_on_receipt", "Due on Receipt"), ("net_7", "Net 7"), ("net_15", "Net 15"), ("net_30", "Net 30"), ("net_45", "Net 45")], default="due_on_receipt"),
        ),
        migrations.AddField(
            model_name="vendor",
            name="billing_attention",
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="billing_country",
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="billing_street1",
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="billing_street2",
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="billing_city",
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="billing_state",
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="billing_pin_code",
            field=models.CharField(max_length=20, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="billing_phone",
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="billing_fax",
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="shipping_attention",
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="shipping_country",
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="shipping_street1",
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="shipping_street2",
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="shipping_city",
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="shipping_state",
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="shipping_pin_code",
            field=models.CharField(max_length=20, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="shipping_phone",
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="shipping_fax",
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="custom_fields",
            field=models.JSONField(default=dict, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="tags",
            field=models.JSONField(default=list, blank=True),
        ),
        migrations.AddField(
            model_name="vendor",
            name="remarks",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="contactperson",
            name="vendor",
            field=models.ForeignKey(related_name="contact_persons", on_delete=models.CASCADE, to="core.vendor", null=True, blank=True),
        ),
        migrations.AlterField(
            model_name="contactperson",
            name="customer",
            field=models.ForeignKey(related_name="contact_persons", on_delete=models.CASCADE, to="core.customer", null=True, blank=True),
        ),
    ]