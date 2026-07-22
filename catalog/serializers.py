from rest_framework import serializers
from .manufacturer import normalize_manufacturer
from .models import Component, PriceListEntry


class PriceListEntrySerializer(serializers.ModelSerializer):
    component_id = serializers.CharField(read_only=True)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PriceListEntry
        fields = [
            "id", "pricelist_id", "component_id", "price", "quantity",
            "currency", "total", "order_time", "created_at",
        ]
        read_only_fields = ["id", "pricelist_id", "total", "created_at"]


class ComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Component
        fields = [
            "serial_number", "name", "description", "type", "part_number",
            "manufacturer",
            "pricelist_id", "width_mm", "height_mm", "depth_mm",
            "consumed_dc_current_ma",
            "env_temp_c", "env_coated", "serial_is_generated",
            "created_at", "updated_at",
        ]
        read_only_fields = ["pricelist_id", "created_at", "updated_at"]

    def validate_manufacturer(self, value):
        return normalize_manufacturer(value)

    def get_extra_kwargs(self):
        kwargs = super().get_extra_kwargs()
        if self.instance is not None:
            kwargs.setdefault("serial_is_generated", {})["read_only"] = True
        return kwargs


class ComponentDetailSerializer(ComponentSerializer):
    price_entries = PriceListEntrySerializer(many=True, read_only=True)

    class Meta(ComponentSerializer.Meta):
        fields = ComponentSerializer.Meta.fields + ["price_entries"]
