from django.db import migrations


def normalize_wago(apps, schema_editor):
    Component = apps.get_model("catalog", "Component")
    Component.objects.filter(manufacturer__iexact="wago").update(manufacturer="Wago")


def noop_reverse(apps, schema_editor):
    # Irreversible: original WAGO vs Wago casing cannot be restored.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0004_component_depth_mm"),
    ]

    operations = [
        migrations.RunPython(normalize_wago, noop_reverse),
    ]
