# views.py
from rest_framework import generics, status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Business, Category, Product, WiFiInfo, Comment, WaiterCall
from .serializers import RegisterSerializer, BusinessSerializer, CategorySerializer, ProductSerializer, WiFiInfoSerializer, CommentSerializer , WaiterCallSerializer, WaiterCallCreateSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import json
from django.utils import timezone
import qrcode
import base64
from io import BytesIO
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings
from rest_framework.decorators import permission_classes
from rest_framework import serializers
from django.db.models import Q
from rest_framework import permissions
from rest_framework.decorators import authentication_classes

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    })

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class BusinessListCreateView(generics.ListCreateAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Business.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BusinessRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BusinessSerializer
    lookup_field = 'slug'
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Business.objects.filter(user=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        slug = self.kwargs.get('slug')
        return get_object_or_404(queryset, slug=slug)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        business_slug = self.request.query_params.get("business")
        user = self.request.user

        if self.action in ['list', 'retrieve']:
            qs = Category.objects.all()
        else:
            qs = Category.objects.filter(businesses__user=user).distinct()

        if business_slug:
            qs = qs.filter(businesses__slug=business_slug)
        return qs

    def create(self, request, *args, **kwargs):
        print(f"DEBUG: Create request data: {request.data}")
        print(f"DEBUG: Request files: {request.FILES}")
        print(f"DEBUG: Request user: {request.user}")
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Frontend'den business slugs listesi geliyor
        slugs = self.request.data.get('business_slugs', [])
        if isinstance(slugs, str):
            # Eğer string olarak gelirse JSON parse et
            slugs = json.loads(slugs)
        instance = serializer.save()
        # Sadece kullanıcının işletmeleriyle eşleştir
        businesses = Business.objects.filter(slug__in=slugs, user=self.request.user)
        instance.businesses.set(businesses)

class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_businesses = Business.objects.filter(user=self.request.user)
        return Category.objects.filter(businesses__in=user_businesses).distinct()

    def perform_create(self, serializer):
        slugs = self.request.data.get('business_slugs', None)
        if isinstance(slugs, str):
            slugs = json.loads(slugs)
        businesses = Business.objects.filter(slug__in=slugs, user=self.request.user)
        serializer.save()
        serializer.instance.businesses.set(businesses)

class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        user_businesses = Business.objects.filter(user=self.request.user)
        return Category.objects.filter(businesses__in=user_businesses).distinct()

# Ürün Listeleme (herkes görebilir) + Ekleme (sadece giriş yapanlar)
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        # business ve category query param alıyoruz
        business_slug = self.request.query_params.get("business")
        category_id = self.request.query_params.get("category")

        queryset = Product.objects.all()

        if business_slug:
            queryset = queryset.filter(category__businesses__slug=business_slug)
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        return queryset.distinct()

    def perform_create(self, serializer):
        category_id = self.request.data.get("category")
        category = Category.objects.filter(
            id=category_id,
            businesses__user=self.request.user
        ).first()

        if not category:
            raise ValueError("Kategori bulunamadı veya bu kullanıcıya ait değil")

        serializer.save(category=category)


# Ürün Detay / Güncelle / Sil
class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        businesses = Business.objects.filter(user=self.request.user)
        return Product.objects.filter(
            category__businesses__in=businesses
        ).distinct()
    

# QR Menü tarafı: Public kategori listesi
@api_view(['GET'])
@permission_classes([AllowAny])
def public_categories(request):
    business_slug = request.query_params.get("business")
    qs = Category.objects.all()
    if business_slug:
        qs = qs.filter(businesses__slug=business_slug)  # işletmeye göre filtrele
    serializer = CategorySerializer(qs, many=True)
    return Response(serializer.data)


class WiFiInfoDetailUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = WiFiInfoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        business_slug = self.kwargs['business_slug']
        business = get_object_or_404(Business, slug=business_slug, user=self.request.user)
        self.check_object_permissions(self.request, business)
        wifi_info, created = WiFiInfo.objects.get_or_create(business=business)
        return wifi_info
    
class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_anonymous:
            # Giriş yapmamış kullanıcılar sadece onaylanmış yorumları görsün
            return Comment.objects.filter(status="approved").select_related("business").order_by("-created_at")

        # Giriş yapmış kullanıcı → kendi işletmesine ait yorumları görsün
        return Comment.objects.filter(business__user=user).select_related("business").order_by("-created_at")

    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(status='pending')

    @action(detail=True, methods=["patch"], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        comment = self.get_object()
        
        # Sadece işletme sahibi yorumları onaylayabilir
        if comment.business.user != request.user:
            raise PermissionDenied("Bu işlemi yapmaya yetkiniz yok.")
            
        comment.status = "approved"
        comment.approved_by = request.user.username
        comment.approved_at = timezone.now()
        comment.save()
        serializer = self.get_serializer(comment)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        comment = self.get_object()
        
        # Sadece işletme sahibi yorumları reddedebilir
        if comment.business.user != request.user:
            raise PermissionDenied("Bu işlemi yapmaya yetkiniz yok.")
            
        comment.status = "rejected"
        comment.save()
        serializer = self.get_serializer(comment)
        return Response(serializer.data)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def public_comments(request):
    business_slug = request.query_params.get("business")
    
    if not business_slug:
        return Response({"error": "Business slug gerekli."}, status=400)

    qs = Comment.objects.filter(business__slug=business_slug, status="approved").select_related('business')
    
    qs = qs.order_by("-created_at")
    serializer = CommentSerializer(qs, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def generate_qr(request):
    business_id = request.data.get("business_id")
    menu_type = request.data.get("menu_type", "menu1")

    try:
        business = Business.objects.get(id=business_id)
        menu_type = menu_type.replace("_", "")
        # Dinamik URL oluştur
        url = f"http://10.65.156.131:5173/{menu_type}?business={business.slug}"
        qr_img = qrcode.make(url)
        buffer = BytesIO()
        qr_img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            "qr_code": img_str,
            "url": url,
            "business_slug": business.slug
        })
    except Business.DoesNotExist:
        return Response({"error": "İşletme bulunamadı"}, status=404)


@api_view(['GET'])
def category_products_view(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
        products = Product.objects.filter(category=category, is_active=True)
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    except Category.DoesNotExist:
        return Response({"error": "Kategori bulunamadı"}, status=404)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def public_wifi_info(request, business_slug):
    try:
        business = Business.objects.get(slug=business_slug)
        wifi_info = WiFiInfo.objects.filter(business=business).first()
        
        print(f"WiFi Info for {business_slug}: {wifi_info}")
        
        if wifi_info:
            serializer = WiFiInfoSerializer(wifi_info)
            print(f"Serialized data: {serializer.data}")
            return Response(serializer.data)
        else:
            print("No WiFi info found")
            return Response({"ssid": "", "password": "", "is_enabled": False})
    except Business.DoesNotExist:
        print(f"Business not found: {business_slug}")
        return Response({"error": "İşletme bulunamadı"}, status=404)
    

class WaiterCallViewSet(viewsets.ModelViewSet):
    serializer_class = WaiterCallSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Sadece kullanıcının kendi işletmelerinin çağrıları
        user_businesses = Business.objects.filter(user=self.request.user)
        return WaiterCall.objects.filter(business__in=user_businesses)

    def get_serializer_class(self):
        if self.action == 'create':
            return WaiterCallCreateSerializer
        return WaiterCallSerializer

    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        call = self.get_object()
        call.status = 'completed'
        call.completed_at = timezone.now()
        call.save()
        return Response(WaiterCallSerializer(call).data)

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        call = self.get_object()
        call.status = 'cancelled'
        call.save()
        return Response(WaiterCallSerializer(call).data)

# Public endpoint - müşterilerin çağrı oluşturması için
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def create_waiter_call(request):
    print("Public waiter call endpoint called")
    print("Request data:", request.data)

    business_slug = request.data.get("business_slug")
    if not business_slug:
        return Response({"error": "business_slug is required"}, status=status.HTTP_400_BAD_REQUEST)

    # İlgili işletmeyi bul
    try:
        business = Business.objects.get(slug=business_slug)
    except Business.DoesNotExist:
        return Response({"error": "Invalid business_slug"}, status=status.HTTP_404_NOT_FOUND)

    serializer = WaiterCallCreateSerializer(data=request.data)
    if serializer.is_valid():
        instance = serializer.save(business=business)  # 🔑 İşletmeyi manuel bağladık
        print("Saved successfully:", instance.id)
        return Response(WaiterCallSerializer(instance).data, status=status.HTTP_201_CREATED)

    print("Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BusinessWaiterCallListView(generics.ListAPIView):
    serializer_class = WaiterCallSerializer

    def get_queryset(self):
        business_slug = self.kwargs['business_slug']
        return WaiterCall.objects.filter(business__slug=business_slug).order_by('-called_at')