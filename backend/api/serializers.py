import json

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Business, Category, Comment, Product, Table, WaiterCall

User = get_user_model()


# --- Kimlik doğrulama -------------------------------------------------------


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    password2 = serializers.CharField(write_only=True, style={"input_type": "password"})
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Bu e-posta ile kayıtlı bir hesap var.")
        return value.lower()

    def validate(self, data):
        if data["password"] != data.pop("password2"):
            raise serializers.ValidationError({"password2": "Şifreler eşleşmiyor."})
        # Django'nun şifre kurallarını (uzunluk, yaygın şifre, yalnızca rakam...) uygula
        candidate = User(username=data.get("username"), email=data.get("email"))
        try:
            validate_password(data["password"], user=candidate)
        except Exception as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return data

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


# --- Sahip (yönetim paneli) serializer'ları ----------------------------------


class OwnedBusinessField(serializers.SlugRelatedField):
    """Yalnızca isteği yapan kullanıcının işletmelerini kabul eden alan.

    İstemci başka birinin işletme slug'ını gönderirse 'bulunamadı' hatası alır;
    böylece kayıt başka bir işletmeye bağlanamaz (toplu atama / IDOR koruması).
    """

    def get_queryset(self):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return Business.objects.none()
        return Business.objects.filter(owner=request.user)


class OwnedCategoryField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return Category.objects.none()
        return Category.objects.filter(business__owner=request.user)


class BusinessSerializer(serializers.ModelSerializer):
    menu_url = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            "id",
            "name",
            "slug",
            "logo",
            "theme",
            "wifi_ssid",
            "wifi_password",
            "wifi_enabled",
            "menu_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["slug", "created_at", "updated_at"]

    def get_menu_url(self, obj):
        return menu_url(obj)


class CategorySerializer(serializers.ModelSerializer):
    business = OwnedBusinessField(slug_field="slug")
    product_count = serializers.IntegerField(source="products.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "business", "name", "image", "position", "product_count", "created_at"]
        read_only_fields = ["created_at"]

    def validate_business(self, value):
        # Var olan kategori başka işletmeye taşınamaz
        if self.instance and self.instance.business_id != value.id:
            raise serializers.ValidationError("Kategori başka bir işletmeye taşınamaz.")
        return value


def _clean_str_list(value, field):
    if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
        raise serializers.ValidationError(f"{field} bir metin listesi olmalı.")
    cleaned = [v.strip()[:40] for v in value if v.strip()]
    if len(cleaned) > 30:
        raise serializers.ValidationError(f"{field} en fazla 30 öğe içerebilir.")
    return cleaned


class StringListField(serializers.Field):
    """Metin listesi. Çok parçalı (multipart) formda JSON metni olarak da gelebilir."""

    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data) if data.strip() else []
            except ValueError as exc:
                raise serializers.ValidationError("Geçerli bir JSON listesi değil.") from exc
        return _clean_str_list(data, self.field_name)

    def to_representation(self, value):
        return list(value or [])


class ProductSerializer(serializers.ModelSerializer):
    category = OwnedCategoryField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    ingredients = StringListField(required=False)
    allergens = StringListField(required=False)

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "description",
            "price",
            "image",
            "is_active",
            "is_popular",
            "preparation_time",
            "ingredients",
            "allergens",
            "position",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_category(self, value):
        # Ürün yalnızca aynı işletmenin kategorileri arasında taşınabilir
        if self.instance and self.instance.category.business_id != value.business_id:
            raise serializers.ValidationError("Ürün başka bir işletmeye taşınamaz.")
        return value


class CommentSerializer(serializers.ModelSerializer):
    """İşletme sahibinin gördüğü yorum. Metin değiştirilemez, yalnızca durum yönetilir."""

    business = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "business",
            "author_name",
            "text",
            "rating",
            "status",
            "reviewed_at",
            "created_at",
        ]
        read_only_fields = fields


def menu_url(business, table=None):
    from django.conf import settings

    url = f"{settings.PUBLIC_MENU_BASE_URL}/m/{business.slug}"
    return f"{url}?masa={table.token}" if table else url


class TableSerializer(serializers.ModelSerializer):
    business = OwnedBusinessField(slug_field="slug")
    menu_url = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = ["id", "business", "label", "token", "position", "menu_url", "created_at"]
        read_only_fields = ["token", "created_at"]

    def get_menu_url(self, obj):
        return menu_url(obj.business, obj)

    def validate_business(self, value):
        if self.instance and self.instance.business_id != value.id:
            raise serializers.ValidationError("Masa başka bir işletmeye taşınamaz.")
        return value

    def validate(self, data):
        business = data.get("business") or self.instance.business
        label = data.get("label", getattr(self.instance, "label", "")).strip()
        clash = Table.objects.filter(business=business, label__iexact=label)
        if self.instance:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError({"label": "Bu işletmede aynı adlı bir masa var."})
        data["label"] = label
        return data


class WaiterCallSerializer(serializers.ModelSerializer):
    business = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = WaiterCall
        fields = [
            "id",
            "business",
            "table",
            "table_label",
            "note",
            "status",
            "created_at",
            "completed_at",
        ]
        read_only_fields = fields


# --- Herkese açık menü serializer'ları ---------------------------------------
# Bu serializer'lar müşteriye gider; yalnızca menüde gösterilecek alanları içerir.


class PublicProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "image",
            "is_popular",
            "preparation_time",
            "ingredients",
            "allergens",
        ]


class PublicCategorySerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "image", "products"]

    def get_products(self, obj):
        # Pasif ürünler müşteriye hiç gönderilmez (prefetch edilmiş listeden süzülür)
        active = [p for p in obj.products.all() if p.is_active]
        return PublicProductSerializer(active, many=True, context=self.context).data


class PublicMenuSerializer(serializers.ModelSerializer):
    categories = PublicCategorySerializer(many=True, read_only=True)
    wifi = serializers.SerializerMethodField()

    table = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = ["name", "slug", "logo", "theme", "wifi", "table", "categories"]

    def get_table(self, obj):
        # Geçerli bir masa belirteci varsa menü masaya özel açılır (garson çağırma etkin)
        token = self.context.get("table_token")
        if not token:
            return None
        table = obj.tables.filter(token=token).first()
        return {"label": table.label, "token": table.token} if table else None

    def get_wifi(self, obj):
        if not obj.wifi_enabled or not obj.wifi_ssid:
            return None
        return {"ssid": obj.wifi_ssid, "password": obj.wifi_password}


class PublicCommentSerializer(serializers.ModelSerializer):
    """Müşterinin gördüğü/gönderdiği yorum. Kimlik veya iletişim bilgisi içermez."""

    class Meta:
        model = Comment
        fields = ["id", "author_name", "text", "rating", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {"text": {"min_length": 3}}

    def validate_author_name(self, value):
        return value.strip() or "Misafir"


class PublicWaiterCallSerializer(serializers.ModelSerializer):
    """Müşteri masa belirtecini (QR'daki `masa` parametresi) gönderir."""

    table = serializers.CharField(write_only=True, max_length=20)

    class Meta:
        model = WaiterCall
        fields = ["id", "table", "table_label", "note", "status", "created_at"]
        read_only_fields = ["id", "table_label", "status", "created_at"]

    def validate_table(self, token):
        business = self.context["business"]
        table = Table.objects.filter(business=business, token=token).first()
        if table is None:
            raise serializers.ValidationError(
                "Masa bulunamadı. Lütfen masadaki QR kodu yeniden okutun."
            )
        return table
