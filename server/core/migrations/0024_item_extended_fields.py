from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0023_remove_vendor_address_remove_vendor_name_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="item",
            name="unit",
            field=models.CharField(
                max_length=10,
                choices=[("Nos", "Nos"), ("Kgs", "Kgs"), ("Litres", "Litres")],
                default="Nos",
            ),
        ),
        migrations.AddField(
            model_name="item",
            name="manage_sales_info",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="item",
            name="sales_selling_price",
            field=models.DecimalField(
                max_digits=12, decimal_places=2, null=True, blank=True
            ),
        ),
        migrations.AddField(
            model_name="item",
            name="sales_account",
            field=models.CharField(
                max_length=100, default="Sales", blank=True),
        ),
        migrations.AddField(
            model_name="item",
            name="sales_description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="item",
            name="manage_purchase_info",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="item",
            name="purchase_cost_price",
            field=models.DecimalField(
                max_digits=12, decimal_places=2, null=True, blank=True
            ),
        ),
        migrations.AddField(
            model_name="item",
            name="purchase_account",
            field=models.CharField(
                max_length=100, default="Cost of Goods Sold", blank=True
            ),
        ),
        migrations.AddField(
            model_name="item",
            name="purchase_description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="item",
            name="preferred_vendor",
            field=models.ForeignKey(
                null=True,
                blank=True,
                to="core.vendor",
                on_delete=django.db.models.deletion.SET_NULL,
            ),
        ),
        migrations.AddField(
            model_name="item",
            name="track_inventory",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="item",
            name="inventory_account",
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name="item",
            name="inventory_valuation_method",
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name="item",
            name="opening_stock",
            field=models.DecimalField(
                max_digits=12, decimal_places=2, null=True, blank=True
            ),
        ),
        migrations.AddField(
            model_name="item",
            name="opening_stock_rate_per_unit",
            field=models.DecimalField(
                max_digits=12, decimal_places=2, null=True, blank=True
            ),
        ),
        migrations.AddField(
            model_name="item",
            name="reorder_point",
            field=models.DecimalField(
                max_digits=12, decimal_places=2, null=True, blank=True
            ),
        ),
    ]
