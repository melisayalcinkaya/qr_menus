"""Demo verisi: her tema için bir işletme, menü, masalar, yorumlar ve istatistik geçmişi.

Kullanım:  python manage.py seed_demo [--reset]
Tüm veriler kurgusaldır.
"""

import random
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import (
    Business,
    Category,
    Comment,
    MenuVisit,
    Product,
    Table,
    WaiterCall,
    turkish_slugify,
)

# Yapay zekâ ile üretilmiş kurgusal yemek görselleri: demo_images/<tema>/<ürün-slug>.webp
DEMO_IMAGES = Path(__file__).resolve().parents[2] / "demo_images"

# Vitrin temasının büyük başlığında görünen metinler (diğer temalarda isteğe bağlı)
TAGLINES = {
    "klasik": (
        "Ev usulü, günlük taze",
        "Home-style, cooked fresh daily",
        "Kırk yıllık tariflerle her gün yeniden pişen sulu yemekler.",
        "Slow-cooked Turkish classics, made fresh every morning.",
    ),
    "bistro": (
        "Rıhtımda akşam yemeği",
        "Dinner by the harbour",
        "Izgarada günün balığı, paylaşmalık mezeler ve fıçı bira.",
        "Catch of the day from the grill, sharing plates and draught beer.",
    ),
    "vitrin": (
        "Taze baklava, kaymaklı katmer!",
        "Fresh baklava, creamy katmer!",
        "Her sabah fırından çıkan baklava ve poğaçalar, bol Antep fıstığıyla.",
        "Baklava and pastries straight from the oven every morning, with plenty of pistachio.",
    ),
}

DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo-sifre-2026"  # noqa: S105 - herkese açık demo hesabı

# (ad, ad_en, açıklama, açıklama_en, fiyat, alerjenler, beslenme, popüler, hazırlık dk)
MENUS = {
    "klasik": {
        "name": "Çınaraltı Lokantası",
        "wifi": ("Cinaralti-Misafir", "ayran2026"),
        "categories": [
            (
                "Çorbalar",
                "Soups",
                "soup",
                [
                    (
                        "Mercimek çorbası",
                        "Red lentil soup",
                        "Limon ve kıtır ekmekle",
                        "With lemon and croutons",
                        95,
                        ["gluten", "celery"],
                        ["vegan"],
                        True,
                        5,
                    ),
                    (
                        "Ezogelin",
                        "Ezogelin soup",
                        "Bulgur, kırmızı mercimek, nane",
                        "Bulgur, red lentil, dried mint",
                        95,
                        ["gluten"],
                        ["vegetarian"],
                        False,
                        5,
                    ),
                    (
                        "İşkembe",
                        "Tripe soup",
                        "Sarımsaklı sirke ile",
                        "With garlic vinegar",
                        140,
                        ["milk"],
                        [],
                        False,
                        5,
                    ),
                ],
            ),
            (
                "Ana yemekler",
                "Mains",
                "meat",
                [
                    (
                        "Hünkâr beğendi",
                        "Sultan's delight",
                        "Közlenmiş patlıcan beğendi üzerinde kuzu güveç",
                        "Braised lamb on smoky aubergine purée",
                        420,
                        ["milk", "gluten"],
                        [],
                        True,
                        15,
                    ),
                    (
                        "İzmir köfte",
                        "Izmir meatballs",
                        "Fırında patates, biber ve domates sosuyla",
                        "Baked with potatoes, peppers and tomato sauce",
                        310,
                        ["gluten", "eggs"],
                        [],
                        False,
                        20,
                    ),
                    (
                        "Etli kuru fasulye",
                        "White beans with beef",
                        "Tereyağlı pilav ile",
                        "Served with butter rice",
                        260,
                        ["milk"],
                        [],
                        True,
                        10,
                    ),
                    (
                        "Zeytinyağlı enginar",
                        "Artichokes in olive oil",
                        "Soğuk servis, dereotu ve bakla ile",
                        "Served cold with dill and broad beans",
                        230,
                        [],
                        ["vegan"],
                        False,
                        5,
                    ),
                    (
                        "Tavuk şiş",
                        "Chicken skewer",
                        "Közlenmiş biber, sumaklı soğan",
                        "Charred peppers, sumac onions",
                        290,
                        [],
                        ["spicy"],
                        False,
                        18,
                    ),
                ],
            ),
            (
                "Tatlılar",
                "Desserts",
                "dessert",
                [
                    (
                        "Fırın sütlaç",
                        "Baked rice pudding",
                        "Üstü kızarmış, tarçınsız",
                        "Caramelised top, no cinnamon",
                        120,
                        ["milk"],
                        ["vegetarian"],
                        True,
                        3,
                    ),
                    (
                        "Kabak tatlısı",
                        "Candied pumpkin",
                        "Tahin ve ceviz ile",
                        "With tahini and walnuts",
                        130,
                        ["nuts", "sesame"],
                        ["vegan"],
                        False,
                        3,
                    ),
                ],
            ),
            (
                "İçecekler",
                "Drinks",
                "cold_drink",
                [
                    (
                        "Ayran",
                        "Ayran",
                        "Yayık ayranı",
                        "Churned yoghurt drink",
                        45,
                        ["milk"],
                        ["vegetarian"],
                        False,
                        1,
                    ),
                    (
                        "Şalgam",
                        "Turnip juice",
                        "Acılı ya da acısız",
                        "Hot or mild",
                        50,
                        [],
                        ["vegan"],
                        False,
                        1,
                    ),
                    (
                        "Çay",
                        "Turkish tea",
                        "İnce belli bardakta",
                        "Served in a tulip glass",
                        25,
                        [],
                        ["vegan"],
                        True,
                        1,
                    ),
                ],
            ),
        ],
    },
    "bistro": {
        "name": "Liman Bistro",
        "wifi": ("LimanBistro", "rihtim-44"),
        "categories": [
            (
                "Başlangıçlar",
                "Starters",
                "salad",
                [
                    (
                        "Humus",
                        "Hummus",
                        "Pastırma kırıntısı ve tereyağı ile",
                        "With crispy pastırma and brown butter",
                        180,
                        ["sesame", "milk"],
                        [],
                        True,
                        8,
                    ),
                    (
                        "Girit ezmesi",
                        "Cretan dip",
                        "Lor, fıstık, dereotu",
                        "Curd cheese, pistachio, dill",
                        170,
                        ["milk", "nuts"],
                        ["vegetarian"],
                        False,
                        5,
                    ),
                    (
                        "Kalamar tava",
                        "Fried calamari",
                        "Tarator sos ile",
                        "With tarator sauce",
                        290,
                        ["molluscs", "gluten", "nuts"],
                        [],
                        True,
                        12,
                    ),
                ],
            ),
            (
                "Izgaradan",
                "From the grill",
                "fish",
                [
                    (
                        "Levrek ızgara",
                        "Grilled sea bass",
                        "Roka, kırmızı soğan, limon",
                        "Rocket, red onion, lemon",
                        520,
                        ["fish"],
                        [],
                        True,
                        22,
                    ),
                    (
                        "Karides güveç",
                        "Shrimp casserole",
                        "Kaşarlı, tereyağlı, pul biberli",
                        "Baked with kashar cheese and chilli butter",
                        460,
                        ["crustaceans", "milk"],
                        ["spicy"],
                        False,
                        18,
                    ),
                    (
                        "Dana bonfile",
                        "Beef tenderloin",
                        "Patates püresi, demi-glace",
                        "Mash and demi-glace",
                        780,
                        ["milk", "celery"],
                        [],
                        False,
                        25,
                    ),
                ],
            ),
            (
                "Makarnalar",
                "Pasta",
                "utensils",
                [
                    (
                        "Mantı",
                        "Turkish dumplings",
                        "Sarımsaklı yoğurt, kızgın tereyağı",
                        "Garlic yoghurt and sizzling butter",
                        330,
                        ["gluten", "milk", "eggs"],
                        [],
                        True,
                        15,
                    ),
                    (
                        "Fesleğenli linguine",
                        "Basil linguine",
                        "Domates, burrata",
                        "Tomato and burrata",
                        340,
                        ["gluten", "milk"],
                        ["vegetarian"],
                        False,
                        15,
                    ),
                ],
            ),
            (
                "Bar",
                "Bar",
                "wine",
                [
                    (
                        "Ev şarabı (kadeh)",
                        "House wine (glass)",
                        "Kırmızı ya da beyaz",
                        "Red or white",
                        220,
                        ["sulphites"],
                        ["vegan"],
                        False,
                        1,
                    ),
                    (
                        "Fıçı bira",
                        "Draught beer",
                        "50 cl",
                        "50 cl",
                        160,
                        ["gluten"],
                        ["vegan"],
                        False,
                        1,
                    ),
                    (
                        "Limonata",
                        "Lemonade",
                        "Taze nane ile",
                        "With fresh mint",
                        90,
                        [],
                        ["vegan"],
                        True,
                        2,
                    ),
                ],
            ),
        ],
    },
    "vitrin": {
        "name": "Fıstık Pastanesi",
        "wifi": ("Fistik-Pastane", "kaymak123"),
        "categories": [
            (
                "Baklava",
                "Baklava",
                "dessert",
                [
                    (
                        "Fıstıklı baklava",
                        "Pistachio baklava",
                        "4 dilim, Antep fıstığı",
                        "4 pieces, Antep pistachio",
                        260,
                        ["gluten", "nuts", "milk"],
                        ["vegetarian"],
                        True,
                        2,
                    ),
                    (
                        "Cevizli baklava",
                        "Walnut baklava",
                        "4 dilim",
                        "4 pieces",
                        210,
                        ["gluten", "nuts", "milk"],
                        ["vegetarian"],
                        False,
                        2,
                    ),
                    (
                        "Şöbiyet",
                        "Şöbiyet",
                        "Kaymaklı, fıstıklı",
                        "Clotted cream and pistachio",
                        280,
                        ["gluten", "nuts", "milk"],
                        ["vegetarian"],
                        True,
                        2,
                    ),
                ],
            ),
            (
                "Sütlü tatlılar",
                "Milk desserts",
                "icecream",
                [
                    (
                        "Kazandibi",
                        "Kazandibi",
                        "Karamelize tavuk göğsü tatlısı",
                        "Caramelised milk pudding",
                        140,
                        ["milk"],
                        [],
                        False,
                        2,
                    ),
                    (
                        "Maraş dondurması",
                        "Maraş ice cream",
                        "Sade, 3 top",
                        "Plain, 3 scoops",
                        150,
                        ["milk"],
                        ["vegetarian"],
                        True,
                        2,
                    ),
                    (
                        "Katmer",
                        "Katmer",
                        "Kaymak ve fıstıkla, sıcak",
                        "Warm, with clotted cream and pistachio",
                        240,
                        ["gluten", "nuts", "milk"],
                        ["vegetarian"],
                        False,
                        12,
                    ),
                ],
            ),
            (
                "Fırından",
                "From the oven",
                "bakery",
                [
                    (
                        "Açma",
                        "Açma",
                        "Tereyağlı",
                        "Buttery roll",
                        35,
                        ["gluten", "milk", "eggs"],
                        ["vegetarian"],
                        False,
                        1,
                    ),
                    (
                        "Peynirli poğaça",
                        "Cheese poğaça",
                        "Beyaz peynirli",
                        "With white cheese",
                        35,
                        ["gluten", "milk", "eggs"],
                        ["vegetarian"],
                        False,
                        1,
                    ),
                ],
            ),
            (
                "Sıcak içecekler",
                "Hot drinks",
                "coffee",
                [
                    (
                        "Türk kahvesi",
                        "Turkish coffee",
                        "Lokum ile",
                        "With Turkish delight",
                        80,
                        [],
                        ["vegan"],
                        True,
                        5,
                    ),
                    (
                        "Sahlep",
                        "Salep",
                        "Tarçınlı",
                        "With cinnamon",
                        95,
                        ["milk"],
                        ["vegetarian"],
                        False,
                        4,
                    ),
                    ("Demlik çay", "Teapot", "2 kişilik", "For two", 70, [], ["vegan"], False, 3),
                ],
            ),
        ],
    },
}

COMMENTS = [
    ("Selin", 5, "Mercimek çorbası tam kıvamında, servis çok hızlıydı."),
    ("Mert", 4, "Lezzetler güzel, akşamları biraz kalabalık oluyor."),
    ("", 5, "QR menüden alerjenleri görebilmek çok iyi, oğlumun fıstık alerjisi var."),
    ("Deniz", 3, "Yemekler iyi ama tatlı biraz fazla şekerliydi."),
    ("Ece", 5, "Garson çağır düğmesi harika, el kaldırmaya gerek kalmadı."),
    ("Kaan", 4, "Fiyat/performans gayet iyi."),
]
PENDING_COMMENTS = [
    ("Bora", 2, "Siparişim geç geldi."),
    ("", 5, "Her şey çok güzeldi, teşekkürler!"),
]


class Command(BaseCommand):
    help = "Demo kullanıcısı ve üç temalı örnek işletme oluşturur."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Demo verisini silip baştan kur")

    @transaction.atomic
    def handle(self, *args, reset=False, **options):
        rng = random.Random(42)  # her çalıştırmada aynı veri  # noqa: S311
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=DEMO_USERNAME, defaults={"email": "demo@example.com"}
        )
        if created or reset:
            user.set_password(DEMO_PASSWORD)
            user.save()
        if reset:
            # Kayıtlarla birlikte yüklenmiş görsel dosyalarını da sil (yeniden kurulumda birikmesin)
            for business in user.businesses.all():
                files = [business.logo] + [c.image for c in business.categories.all()]
                files += [p.image for c in business.categories.all() for p in c.products.all()]
                for f in files:
                    if f:
                        f.delete(save=False)
            user.businesses.all().delete()
        if user.businesses.exists():
            self.stdout.write("Demo verisi zaten var (yeniden kurmak için --reset).")
            return

        for theme, menu in MENUS.items():
            business = Business.objects.create(
                owner=user,
                name=menu["name"],
                theme=theme,
                wifi_ssid=menu["wifi"][0],
                wifi_password=menu["wifi"][1],
                wifi_enabled=True,
                tagline=TAGLINES[theme][0],
                tagline_en=TAGLINES[theme][1],
                about=TAGLINES[theme][2],
                about_en=TAGLINES[theme][3],
            )
            for pos, (name, name_en, icon, products) in enumerate(menu["categories"]):
                category = Category.objects.create(
                    business=business, name=name, name_en=name_en, icon=icon, position=pos
                )
                cover = None
                for ppos, row in enumerate(products):
                    pname, pname_en, desc, desc_en, price, allergens, diet, popular, prep = row
                    product = Product.objects.create(
                        category=category,
                        name=pname,
                        name_en=pname_en,
                        description=desc,
                        description_en=desc_en,
                        price=Decimal(price),
                        allergens=allergens,
                        dietary=diet,
                        is_popular=popular,
                        preparation_time=prep,
                        position=ppos,
                    )
                    image = DEMO_IMAGES / theme / f"{turkish_slugify(pname)}.webp"
                    if image.exists():
                        with image.open("rb") as fh:
                            product.image.save(image.name, File(fh), save=True)
                        # Kategori kapağı: kategorinin ilk "sevilen" ürünü, yoksa ilk ürünü
                        if cover is None or (popular and not cover[1]):
                            cover = (image, popular)
                if cover:
                    with cover[0].open("rb") as fh:
                        category.image.save(cover[0].name, File(fh), save=True)
            tables = [
                Table.objects.create(business=business, label=label, position=i)
                for i, label in enumerate(["1", "2", "3", "4", "5", "6", "Bahçe 1", "Bahçe 2"])
            ]
            # Tanıtım sayfasındaki "garson çağırmayı dene" bağlantısı için sabit belirteç.
            # Gerçek masalarda belirteç her zaman rastgele üretilir.
            Table.objects.filter(pk=tables[3].pk).update(token=f"demo-{theme}-4")
            self._history(business, tables, rng)
            self.stdout.write(f"  {business.name} ({theme}) -> /m/{business.slug}")

        self.stdout.write(
            self.style.SUCCESS(f"Demo hazır. Giriş: {DEMO_USERNAME} / {DEMO_PASSWORD}")
        )

    def _history(self, business, tables, rng):
        now = timezone.now()
        today = timezone.localdate()
        for name, rating, text in COMMENTS:
            c = Comment.objects.create(
                business=business,
                author_name=name or "Misafir",
                text=text,
                rating=rating,
                status="approved",
                reviewed_at=now,
            )
            Comment.objects.filter(pk=c.pk).update(
                created_at=now - timedelta(days=rng.randint(1, 25), hours=rng.randint(0, 10))
            )
        for name, rating, text in PENDING_COMMENTS:
            Comment.objects.create(
                business=business, author_name=name or "Misafir", text=text, rating=rating
            )

        for day in range(30):
            date = today - timedelta(days=day)
            weekend = date.weekday() >= 5
            MenuVisit.objects.create(
                business=business, date=date, count=rng.randint(40, 70) + (45 if weekend else 0)
            )
            # Öğle ve akşam yoğunluğunu taklit eden garson çağrıları
            for _ in range(rng.randint(3, 9)):
                hour = rng.choice([12, 12, 13, 13, 14, 19, 19, 20, 20, 21, 17, 10])
                created = timezone.make_aware(
                    timezone.datetime.combine(date, timezone.datetime.min.time())
                ) + timedelta(hours=hour, minutes=rng.randint(0, 59))
                if created >= now:
                    continue
                table = rng.choice(tables)
                call = WaiterCall.objects.create(
                    business=business, table=table, table_label=table.label, status="completed"
                )
                WaiterCall.objects.filter(pk=call.pk).update(
                    created_at=created,
                    completed_at=created + timedelta(seconds=rng.randint(40, 260)),
                )
        # Panelde görünmesi için iki açık çağrı
        for table, note in [(tables[2], "Hesap lütfen"), (tables[6], "")]:
            WaiterCall.objects.create(
                business=business, table=table, table_label=table.label, note=note
            )
