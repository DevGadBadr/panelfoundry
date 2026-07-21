from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComponentViewSet, PriceListEntryViewSet

router = DefaultRouter()
router.register(r"components", ComponentViewSet, basename="component")
router.register(r"prices", PriceListEntryViewSet, basename="price")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "pricelists/<int:pricelist_id>/",
        PriceListEntryViewSet.as_view({"get": "list"}),
        name="pricelist-entries",
    ),
]
