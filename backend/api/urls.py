from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView,
    BusinessListCreateView, BusinessRetrieveUpdateDestroyView,
    CategoryViewSet, ProductListCreateView, ProductRetrieveUpdateDestroyView,
    generate_qr, public_categories, CommentViewSet,
    public_comments, public_wifi_info, WiFiInfoDetailUpdateView,
    create_waiter_call, BusinessWaiterCallListView, get_user_info,
    WaiterCallViewSet,
)

router = DefaultRouter()
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'waiter-calls', WaiterCallViewSet, basename='waitercall')
# waiter-calls için ViewSet kullanmayacağız çünkü özel endpoint var

urlpatterns = [
    path('', include(router.urls)),

    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
   path('user-info/', get_user_info, name='user-info'),
    # İşletmeler
    path('businesses/', BusinessListCreateView.as_view(), name='business-list'),
    path('businesses/<slug:slug>/', BusinessRetrieveUpdateDestroyView.as_view(), name='business-detail'),

    # Public QR menü kategorileri
    path('public/categories/', public_categories, name='public-category-list'),

    # Ürünler
    path('products/', ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:id>/', ProductRetrieveUpdateDestroyView.as_view(), name='product-detail'),

    # Yorumlar (public)
    path("comments/public/", public_comments, name="public-comments"),

    # QR kod
    path('qr/generate/', generate_qr, name='generate_qr'),

    # Wi-Fi
    path('businesses/<slug:business_slug>/wifi-info/', WiFiInfoDetailUpdateView.as_view(), name='wifi-info-detail'),
    path('public/wifi/<slug:business_slug>/', public_wifi_info, name='public-wifi-info'),

    # Garson çağırma
    path('waiter-calls/public/', create_waiter_call, name='public-waiter-call'),
    path('businesses/<slug:business_slug>/waiter-calls/', BusinessWaiterCallListView.as_view(), name='business-waiter-calls'),
]
