"""Kimlik doğrulama uç noktaları.

Erişim (access) belirteci kısa ömürlüdür ve yanıt gövdesinde döner; ön yüz onu
yalnızca bellekte tutar. Yenileme (refresh) belirteci ise JavaScript'in
okuyamadığı HttpOnly bir çereze yazılır. Böylece bir XSS açığı olsa bile uzun
ömürlü belirteç çalınamaz.
"""

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    AccessTokenSerializer,
    LoginSerializer,
    RefreshRequestSerializer,
    RegisterSerializer,
    TokenResponseSerializer,
    UserSerializer,
)

REFRESH_COOKIE = "qrmenu_refresh"
REFRESH_COOKIE_PATH = "/api/auth/"


class PublicAuthView:
    """Kimlik bilgisi beklemeyen uç noktalar için ortak ayarlar.

    `authentication_classes = []` olunca DRF hatalı girişte 403 döndürür;
    WWW-Authenticate başlığı tanımlayarak doğru durum kodunu (401) alırız.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get_authenticate_header(self, request):
        return 'Bearer realm="api"'


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        REFRESH_COOKIE,
        str(refresh_token),
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Strict",
        path=REFRESH_COOKIE_PATH,
    )


def token_response(user, refresh, status_code=status.HTTP_200_OK):
    response = Response(
        {"access": str(refresh.access_token), "user": UserSerializer(user).data},
        status=status_code,
    )
    set_refresh_cookie(response, refresh)
    return response


@extend_schema(responses={201: TokenResponseSerializer})
class RegisterView(PublicAuthView, generics.CreateAPIView):
    serializer_class = RegisterSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return token_response(user, RefreshToken.for_user(user), status.HTTP_201_CREATED)


class LoginView(PublicAuthView, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(request=LoginSerializer, responses={200: TokenResponseSerializer})
    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:  # pragma: no cover
            raise InvalidToken(exc.args[0]) from exc
        return token_response(serializer.user, RefreshToken(serializer.validated_data["refresh"]))


class RefreshView(PublicAuthView, APIView):
    """Yenileme belirteciyle yeni erişim belirteci üretir.

    Tarayıcı belirteci çerezle, masaüstü istemcileri gövdeyle gönderir.
    """

    @extend_schema(request=RefreshRequestSerializer, responses={200: AccessTokenSerializer})
    def post(self, request):
        raw = request.data.get("refresh") or request.COOKIES.get(REFRESH_COOKIE)
        if not raw:
            return Response({"detail": "Oturum bulunamadı."}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = TokenRefreshSerializer(data={"refresh": raw})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(exc.args[0]) from exc
        response = Response({"access": serializer.validated_data["access"]})
        if "refresh" in serializer.validated_data:  # rotasyon açıksa yeni çerez
            set_refresh_cookie(response, serializer.validated_data["refresh"])
        return response


class LogoutView(PublicAuthView, APIView):
    @extend_schema(request=RefreshRequestSerializer, responses={204: None})
    def post(self, request):
        raw = request.data.get("refresh") or request.COOKIES.get(REFRESH_COOKIE)
        if raw:
            try:
                RefreshToken(raw).blacklist()  # çalınmış olsa bile artık kullanılamaz
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(REFRESH_COOKIE, path=REFRESH_COOKIE_PATH, samesite="Strict")
        return response


class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
