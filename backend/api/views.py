from django.db import transaction
from django.db.models import Prefetch
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .catalog import ALLERGENS, DIETARY_TAGS, as_dicts
from .models import Business, Category, Comment, MenuVisit, Product, Table, WaiterCall
from .qr import qr_png, table_cards_pdf
from .serializers import (
    BusinessSerializer,
    CategorySerializer,
    CommentSerializer,
    ProductSerializer,
    PublicCommentSerializer,
    PublicMenuSerializer,
    PublicWaiterCallSerializer,
    TableSerializer,
    WaiterCallSerializer,
    menu_url,
)
from .stats import business_stats

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
        return png_response(qr_png(menu_url(business)), f"{business.slug}-qr.png")

    @action(detail=True, methods=["get"])
    def stats(self, request, slug=None):
        """Panel için özet: ziyaretler, garson çağrıları, yanıt süresi, puanlar."""
        try:
            days = min(max(int(request.query_params.get("days", 30)), 1), 365)
        except ValueError:
            days = 30
        return Response(business_stats(self.get_object(), days))

    @action(detail=True, methods=["get"], url_path="table-cards")
    def table_cards(self, request, slug=None):
        """Tüm masaların QR kartlarını yazdırılabilir tek bir PDF olarak döndürür."""
        business = self.get_object()
        tables = list(business.tables.all())
        if not tables:
            return Response(
                {"detail": "Önce en az bir masa ekleyin."}, status=status.HTTP_400_BAD_REQUEST
            )
        pdf = table_cards_pdf(business.name, [(t.label, menu_url(business, t)) for t in tables])
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{business.slug}-masalar.pdf"'
        return response


def png_response(data, filename):
    response = HttpResponse(data, content_type="image/png")
    response["Content-Disposition"] = f'inline; filename="{filename}"'
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


class TableViewSet(OwnerFilterMixin, viewsets.ModelViewSet):
    serializer_class = TableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Table.objects.filter(business__owner=self.request.user).select_related("business")
        return self.filter_by_business(qs)

    @action(detail=True, methods=["get"])
    def qr(self, request, pk=None):
        table = self.get_object()
        name = f"{table.business.slug}-masa-{table.label}.png"
        return png_response(qr_png(menu_url(table.business, table)), name)

    @action(detail=True, methods=["post"], url_path="regenerate-token")
    def regenerate_token(self, request, pk=None):
        table = self.get_object()
        table.regenerate_token()
        return Response(self.get_serializer(table).data)


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

    def get_serializer_context(self):
        return super().get_serializer_context() | {
            "table_token": self.request.query_params.get("masa", "")[:20]
        }

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        # Paneldeki tema önizlemesi ziyaret sayılmaz
        if request.query_params.get("preview") != "1":
            MenuVisit.record(self.get_object())
        return response

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
    """Masadan garson çağrısı. Aynı masanın açık çağrısı varsa yenisi açılmaz."""

    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = PublicWaiterCallSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_waiter_call"

    def get_serializer_context(self):
        return super().get_serializer_context() | {
            "business": get_public_business(self.kwargs["slug"])
        }

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        table = serializer.validated_data["table"]
        with transaction.atomic():
            open_call = table.calls.select_for_update().filter(status="pending").first()
            if open_call:
                # Tekrar basılan düğme yeni çağrı oluşturmaz; mevcut çağrı döner (idempotent)
                return Response(self.get_serializer(open_call).data, status=status.HTTP_200_OK)
            call = WaiterCall.objects.create(
                business=table.business,
                table=table,
                table_label=table.label,
                note=serializer.validated_data.get("note", ""),
            )
        return Response(self.get_serializer(call).data, status=status.HTTP_201_CREATED)


class PublicTableCallStatusView(generics.RetrieveAPIView):
    """Müşteri, masasının son çağrısının durumunu görür (masa belirteci gerekir)."""

    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = PublicWaiterCallSerializer

    def get_object(self):
        table = get_object_or_404(
            Table, business__slug=self.kwargs["slug"], token=self.kwargs["token"]
        )
        call = table.calls.order_by("-created_at").first()
        if call is None:
            from django.http import Http404

            raise Http404
        return call


class MetaView(generics.GenericAPIView):
    """Ön yüzün kullandığı sabit listeler (alerjenler, beslenme etiketleri, temalar)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response(
            {
                "allergens": as_dicts(ALLERGENS),
                "dietary": as_dicts(DIETARY_TAGS),
                "themes": [{"code": c, "label": label} for c, label in Business.THEME_CHOICES],
            }
        )
