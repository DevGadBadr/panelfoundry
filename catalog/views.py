from django.db.models import Max
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Component, PriceListEntry
from .serializers import (
    ComponentSerializer,
    ComponentDetailSerializer,
    PriceListEntrySerializer,
)


class ComponentViewSet(viewsets.ModelViewSet):
    queryset = Component.objects.all()
    lookup_field = "serial_number"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ComponentDetailSerializer
        return ComponentSerializer

    def perform_create(self, serializer):
        # Each component gets its own internal pricelist automatically.
        next_id = (Component.objects.aggregate(m=Max("pricelist_id"))["m"] or 0) + 1
        serializer.save(pricelist_id=next_id)

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
