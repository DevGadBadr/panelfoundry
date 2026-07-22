from rest_framework import serializers
from .models import Component, PriceListEntry


class PriceListEntrySerializer(serializers.ModelSerializer):
    component_id = serializers.CharField(read_only=True)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PriceListEntry
        fields = [
            "id", "pricelist_id", "component_id", "price", "quantity",
            "total", "order_time", "created_at",
        ]
        read_only_fields = ["id", "pricelist_id", "total", "created_at"]


class ComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Component
        fields = [
            "serial_number", "name", "description", "type", "pricelist_id",
            "width_mm", "height_mm", "env_temp_c", "env_coated",
            "created_at", "updated_at",
        ]
        read_only_fields = ["pricelist_id", "created_at", "updated_at"]


class ComponentDetailSerializer(ComponentSerializer):
    price_entries = PriceListEntrySerializer(many=True, read_only=True)

    class Meta(ComponentSerializer.Meta):
        fields = ComponentSerializer.Meta.fields + ["price_entries"]
