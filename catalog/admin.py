from django.contrib import admin
from .models import Component, PriceListEntry


@admin.register(Component)
class ComponentAdmin(admin.ModelAdmin):
    list_display = [
        "serial_number", "part_number", "name", "manufacturer", "type",
        "pricelist_id", "serial_is_generated", "env_coated", "updated_at",
    ]
    search_fields = ["serial_number", "part_number", "name", "type", "manufacturer"]
    list_filter = ["type", "env_coated", "serial_is_generated"]


@admin.register(PriceListEntry)
class PriceListEntryAdmin(admin.ModelAdmin):
    list_display = [
        "id", "component", "pricelist_id", "price", "currency",
        "quantity", "total", "order_time",
    ]
    readonly_fields = ["total"]
    search_fields = ["component__serial_number", "component__name"]
    list_filter = ["pricelist_id", "currency"]
    ordering = ["-order_time"]
