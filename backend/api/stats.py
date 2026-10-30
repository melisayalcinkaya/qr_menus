"""İşletme paneli için özet istatistikler."""

from datetime import timedelta

from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F
from django.db.models.functions import ExtractHour
from django.utils import timezone


def business_stats(business, days=30):
    today = timezone.localdate()
    start = today - timedelta(days=days - 1)
    since = timezone.now() - timedelta(days=days)

    # Ziyaret: eksik günler 0 olarak doldurulur ki grafik kesintisiz olsun
    visits = dict(business.visits.filter(date__gte=start).values_list("date", "count"))
    visit_series = [
        {
            "date": (start + timedelta(days=i)).isoformat(),
            "count": visits.get(start + timedelta(days=i), 0),
        }
        for i in range(days)
    ]

    calls = business.waiter_calls.filter(created_at__gte=since)
    by_hour = dict(
        calls.annotate(hour=ExtractHour("created_at"))
        .values("hour")
        .annotate(n=Count("id"))
        .values_list("hour", "n")
    )
    response = (
        calls.filter(status="completed", completed_at__isnull=False)
        .annotate(
            took=ExpressionWrapper(
                F("completed_at") - F("created_at"), output_field=DurationField()
            )
        )
        .aggregate(avg=Avg("took"))["avg"]
    )

    comments = business.comments.filter(status="approved")
    rating = comments.aggregate(avg=Avg("rating"), n=Count("id"))
    distribution = dict(
        comments.values("rating").annotate(n=Count("id")).values_list("rating", "n")
    )

    return {
        "days": days,
        "visits": {"total": sum(visits.values()), "series": visit_series},
        "waiter_calls": {
            "total": calls.count(),
            "pending": business.waiter_calls.filter(status="pending").count(),
            "by_hour": [{"hour": h, "count": by_hour.get(h, 0)} for h in range(24)],
            "avg_response_seconds": round(response.total_seconds()) if response else None,
        },
        "comments": {
            "approved": rating["n"],
            "pending": business.comments.filter(status="pending").count(),
            "avg_rating": round(rating["avg"], 2) if rating["avg"] else None,
            "distribution": [{"rating": r, "count": distribution.get(r, 0)} for r in range(1, 6)],
        },
        "menu": {
            "categories": business.categories.count(),
            "products": business.categories.aggregate(n=Count("products"))["n"],
            "tables": business.tables.count(),
        },
    }
