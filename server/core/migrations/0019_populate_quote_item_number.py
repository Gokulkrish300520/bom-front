from django.db import migrations, models


def assign_quote_item_numbers(apps, schema_editor):
    Quote = apps.get_model("core", "Quote")
    QuoteItem = apps.get_model("core", "QuoteItem")
    for quote in Quote.objects.all():
        items = QuoteItem.objects.filter(quote=quote).order_by("id")
        for idx, item in enumerate(items, start=1):
            item.quote_item_number = idx
            item.save(update_fields=["quote_item_number"])


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0018_add_quote_item_number"),
    ]

    operations = [
        migrations.RunPython(
            assign_quote_item_numbers, reverse_code=migrations.RunPython.noop
        ),
        migrations.AlterField(
            model_name="quoteitem",
            name="quote_item_number",
            field=models.PositiveIntegerField(null=False),
        ),
        migrations.AlterUniqueTogether(
            name="quoteitem",
            unique_together={("quote", "quote_item_number")},
        ),
    ]
