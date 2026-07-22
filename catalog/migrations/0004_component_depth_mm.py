import re
from decimal import Decimal, InvalidOperation

from django.db import migrations, models


WHD_IN_NAME_RE = re.compile(
    r"WHD\s*:\s*"
    r"(\d+(?:\.\d+)?)\s*[xX×]\s*"
    r"(\d+(?:\.\d+)?)\s*[xX×]\s*"
    r"(\d+(?:\.\d+)?)"
    r"(?:\s*mm)?",
    re.IGNORECASE,
)


def _to_mm(raw: str):
    try:
        return Decimal(raw).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None


def fill_whd_from_names(apps, schema_editor):
    Component = apps.get_model("catalog", "Component")
    for component in Component.objects.all().iterator():
        match = WHD_IN_NAME_RE.search(component.name or "")
        if not match:
            continue
        width = _to_mm(match.group(1))
        height = _to_mm(match.group(2))
        depth = _to_mm(match.group(3))
        update_fields = []
        if width is not None and component.width_mm is None:
            component.width_mm = width
            update_fields.append("width_mm")
        if height is not None and component.height_mm is None:
            component.height_mm = height
            update_fields.append("height_mm")
        if depth is not None and component.depth_mm is None:
            component.depth_mm = depth
            update_fields.append("depth_mm")
        if update_fields:
            component.save(update_fields=update_fields)


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0003_manufacturer_current_currency_generated_serial"),
    ]

    operations = [
        migrations.AddField(
            model_name="component",
            name="depth_mm",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.RunPython(fill_whd_from_names, migrations.RunPython.noop),
    ]
