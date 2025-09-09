from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("core", "0017_deliverychallan_delivery_challan_files"),
    ]

    operations = [
        migrations.AddField(
            model_name="quoteitem",
            name="quote_item_number",
            field=models.PositiveIntegerField(null=True),
        ),
    ]
