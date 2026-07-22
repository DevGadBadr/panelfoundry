from django.db import models


class Component(models.Model):
    serial_number = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=100)
    pricelist_id = models.IntegerField(db_index=True)
    width_mm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    height_mm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    env_temp_c = models.IntegerField(null=True, blank=True)
    env_coated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["serial_number"]

    def __str__(self):
        return f"{self.serial_number} — {self.name}"


class PriceListEntry(models.Model):
    pricelist_id = models.IntegerField(db_index=True)
    component = models.ForeignKey(
        Component,
        on_delete=models.CASCADE,
        related_name="price_entries",
    )
    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    order_time = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-order_time"]
        indexes = [
            models.Index(fields=["pricelist_id", "component"]),
            models.Index(fields=["order_time"]),
        ]

    @property
    def total(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.component_id} @ {self.price} ({self.order_time:%Y-%m-%d})"
