from django.contrib import admin
from .models import Component, PriceListEntry


@admin.register(Component)
class ComponentAdmin(admin.ModelAdmin):
    list_display = ["serial_number", "name", "type", "pricelist_id", "env_coated", "updated_at"]
    search_fields = ["serial_number", "name", "type"]
    list_filter = ["type", "env_coated"]


@admin.register(PriceListEntry)
class PriceListEntryAdmin(admin.ModelAdmin):
    list_display = ["id", "component", "pricelist_id", "price", "quantity", "total", "order_time"]
    readonly_fields = ["total"]
    search_fields = ["component__serial_number", "component__name"]
    list_filter = ["pricelist_id"]
    ordering = ["-order_time"]
