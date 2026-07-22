from django.db import migrations, models
from django.db.models import F


def backfill_part_number(apps, schema_editor):
    Component = apps.get_model("catalog", "Component")
    Component.objects.filter(serial_is_generated=False).update(
        part_number=F("serial_number")
    )


def clear_part_number(apps, schema_editor):
    Component = apps.get_model("catalog", "Component")
    Component.objects.all().update(part_number="")


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0005_normalize_wago_manufacturer"),
    ]

    operations = [
        migrations.AddField(
            model_name="component",
            name="part_number",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.RunPython(backfill_part_number, clear_part_number),
    ]
