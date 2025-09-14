from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0024_item_extended_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="item",
            name="current_stock",
            field=models.DecimalField(
                max_digits=12, decimal_places=2, default=0),
        ),
    ]
