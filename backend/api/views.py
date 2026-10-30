from io import BytesIO

import qrcode
from django.db.models import Prefetch
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import Business, Category, Comment, Product, WaiterCall
from .serializers import (
    BusinessSerializer,
    CategorySerializer,
    CommentSerializer,
    ProductSerializer,
    PublicCommentSerializer,
    PublicMenuSerializer,
    PublicWaiterCallSerializer,
    WaiterCallSerializer,
)

# --- Yönetim paneli (yalnızca işletme sahibi) --------------------------------
# Her queryset isteği yapan kullanıcıya göre süzülür. Başkasının kaydına
# erişilmek istendiğinde 404 döner; böylece kaydın var olduğu bile sızmaz.


class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "slug"

    def get_queryset(self):
        return Business.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["get"])
    def qr(self, request, slug=None):
        """İşletmenin menü adresini içeren QR kodunu PNG olarak döndürür."""
        business = self.get_object()
        url = BusinessSerializer(business).data["menu_url"]
        buffer = BytesIO()
        qrcode.make(url, box_size=10, border=2).save(buffer, format="PNG")
        response = HttpResponse(buffer.getvalue(), content_type="image/png")
        response["Content-Disposition"] = f'inline; filename="{business.slug}-qr.png"'
        return response


class OwnerFilterMixin:
    """`?business=<slug>` ile sahibin işletmelerinden birine süzme."""

    business_lookup = "business__slug"

    def filter_by_business(self, qs):
        slug = self.request.query_params.get("business")
        return qs.filter(**{self.business_lookup: slug}) if slug else qs


class CategoryViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Category.objects.filter(business__owner=self.request.user).select_related("business")
        return self.filter_by_business(qs)


class ProductViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    business_lookup = "category__business__slug"

    def get_queryset(self):
        qs = Product.objects.filter(category__business__owner=self.request.user).select_related(
            "category"
        )
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category_id=category)
        return self.filter_by_business(qs)


class CommentViewSet(
    OwnerFilterMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Sahip yorumları görür, onaylar/reddeder veya siler; metni değiştiremez."""

    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Comment.objects.filter(business__owner=self.request.user).select_related("business")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return self.filter_by_business(qs)

    def _review(self, new_status):
        comment = self.get_object()
        comment.status = new_status
        comment.reviewed_at = timezone.now()
        comment.save(update_fields=["status", "reviewed_at"])
        return Response(self.get_serializer(comment).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._review("approved")

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._review("rejected")


class WaiterCallViewSet(
    OwnerFilterMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    serializer_class = WaiterCallSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = WaiterCall.objects.filter(business__owner=self.request.user).select_related("business")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return self.filter_by_business(qs)

    def _close(self, new_status):
        call = self.get_object()
        if call.status != "pending":
            return Response(
                {"detail": "Bu çağrı zaten kapatılmış."}, status=status.HTTP_409_CONFLICT
            )
        call.status = new_status
        call.completed_at = timezone.now()
        call.save(update_fields=["status", "completed_at"])
        return Response(self.get_serializer(call).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        return self._close("completed")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        return self._close("cancelled")


# --- Herkese açık menü (müşteri) ---------------------------------------------


def get_public_business(slug):
    return get_object_or_404(Business, slug=slug)


class PublicMenuView(generics.RetrieveAPIView):
    """Menü sayfası için işletme, kategoriler ve aktif ürünler tek istekte."""

    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = PublicMenuSerializer

    def get_object(self):
        qs = Business.objects.prefetch_related(
            Prefetch("categories", queryset=Category.objects.prefetch_related("products"))
        )
        return get_object_or_404(qs, slug=self.kwargs["slug"])


class PublicCommentView(generics.ListCreateAPIView):
    """Onaylı yorumları listeler; yeni yorumlar onay bekler."""

    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = PublicCommentSerializer
    throttle_scope = "public_comment"

    def get_throttles(self):
        # Hız sınırı yalnızca yorum gönderirken uygulanır, okurken değil
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        business = get_public_business(self.kwargs["slug"])
        return Comment.objects.filter(business=business, status="approved")

    def perform_create(self, serializer):
        serializer.save(business=get_public_business(self.kwargs["slug"]), status="pending")


class PublicWaiterCallView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = PublicWaiterCallSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_waiter_call"

    def perform_create(self, serializer):
        serializer.save(business=get_public_business(self.kwargs["slug"]))
