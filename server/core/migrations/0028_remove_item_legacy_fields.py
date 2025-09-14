from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0027_alter_inventoryitemdetail_id_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="item",
            name="description",
        ),
        migrations.RemoveField(
            model_name="item",
            name="price",
        ),
        migrations.RemoveField(
            model_name="item",
            name="sku",
        ),
    ]
