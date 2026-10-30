from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import auth_views, views

router = DefaultRouter()
router.register("businesses", views.BusinessViewSet, basename="business")
router.register("categories", views.CategoryViewSet, basename="category")
router.register("products", views.ProductViewSet, basename="product")
router.register("comments", views.CommentViewSet, basename="comment")
router.register("tables", views.TableViewSet, basename="table")
router.register("waiter-calls", views.WaiterCallViewSet, basename="waitercall")

auth_patterns = [
    path("register/", auth_views.RegisterView.as_view(), name="register"),
    path("login/", auth_views.LoginView.as_view(), name="login"),
    path("refresh/", auth_views.RefreshView.as_view(), name="refresh"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("me/", auth_views.MeView.as_view(), name="me"),
]

# Müşteriye açık uç noktalar ayrı bir önek altında; yönetim router'ının
# `<pk>/` desenleriyle çakışmaz.
public_patterns = [
    path("<slug:slug>/", views.PublicMenuView.as_view(), name="public-menu"),
    path("<slug:slug>/comments/", views.PublicCommentView.as_view(), name="public-comments"),
    path(
        "<slug:slug>/tables/<str:token>/call/",
        views.PublicTableCallStatusView.as_view(),
        name="public-table-call",
    ),
    path(
        "<slug:slug>/waiter-calls/", views.PublicWaiterCallView.as_view(), name="public-waiter-call"
    ),
]

urlpatterns = [
    path("auth/", include(auth_patterns)),
    path("public/", include(public_patterns)),
    path("meta/", views.MetaView.as_view(), name="meta"),
    path("", include(router.urls)),
]
