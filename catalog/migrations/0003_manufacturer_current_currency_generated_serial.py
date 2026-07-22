from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0002_price_order_date_and_total"),
    ]

    operations = [
        migrations.AddField(
            model_name="component",
            name="manufacturer",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="component",
            name="consumed_dc_current_ma",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AddField(
            model_name="component",
            name="serial_is_generated",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="pricelistentry",
            name="currency",
            field=models.CharField(
                choices=[("EUR", "EUR"), ("USD", "USD")],
                default="EUR",
                max_length=3,
            ),
        ),
    ]
