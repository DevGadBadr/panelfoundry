from django.db.models import Max, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .manufacturer import normalize_manufacturer
from .models import Component, PriceListEntry
from .pagination import ComponentPagination
from .serializers import (
    ComponentSerializer,
    ComponentDetailSerializer,
    PriceListEntrySerializer,
)


class ComponentViewSet(viewsets.ModelViewSet):
    queryset = Component.objects.all()
    lookup_field = "serial_number"
    pagination_class = ComponentPagination

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ComponentDetailSerializer
        return ComponentSerializer

    def get_queryset(self):
        qs = Component.objects.all()
        if self.action != "list":
            return qs

        type_param = self.request.query_params.get("type")
        if type_param:
            qs = qs.filter(type=type_param)

        manufacturer = self.request.query_params.get("manufacturer")
        if manufacturer:
            qs = qs.filter(
                manufacturer__iexact=normalize_manufacturer(manufacturer)
            )

        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(serial_number__icontains=search)
                | Q(part_number__icontains=search)
                | Q(name__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        # Each component gets its own internal pricelist automatically.
        next_id = (Component.objects.aggregate(m=Max("pricelist_id"))["m"] or 0) + 1
        serializer.save(pricelist_id=next_id)

    @action(detail=False, methods=["get"], url_path="facets")
    def facets(self, request):
        types = (
            Component.objects.exclude(type="")
            .values_list("type", flat=True)
            .distinct()
            .order_by("type")
        )
        manufacturers = (
            Component.objects.exclude(manufacturer="")
            .values_list("manufacturer", flat=True)
            .distinct()
            .order_by("manufacturer")
        )
        normalized_manufacturers = sorted(
            {
                normalize_manufacturer(m)
                for m in manufacturers
                if m and normalize_manufacturer(m)
            }
        )
        return Response(
            {
                "types": list(types),
                "manufacturers": normalized_manufacturers,
                "count": Component.objects.count(),
            }
        )

    @action(detail=True, methods=["get", "post"], url_path="prices")
    def prices(self, request, serial_number=None):
        component = get_object_or_404(Component, serial_number=serial_number)

        if request.method == "GET":
            entries = component.price_entries.all()
            serializer = PriceListEntrySerializer(entries, many=True)
            return Response(serializer.data)

        serializer = PriceListEntrySerializer(data=request.data)
        if serializer.is_valid():
            # Price entries inherit the component's pricelist — never user-supplied.
            serializer.save(component=component, pricelist_id=component.pricelist_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PriceListEntryViewSet(viewsets.ModelViewSet):
    serializer_class = PriceListEntrySerializer

    def get_queryset(self):
        pricelist_id = self.kwargs.get("pricelist_id")
        if pricelist_id:
            return PriceListEntry.objects.filter(pricelist_id=pricelist_id)
        return PriceListEntry.objects.all()
