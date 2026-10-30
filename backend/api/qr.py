"""QR kodu ve yazdırılabilir masa kartı (PDF) üretimi."""

from io import BytesIO
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_M

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Debian/Ubuntu (fonts-dejavu-core)
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "C:/Windows/Fonts/arial.ttf",
]
FONT_BOLD_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def qr_image(url):
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").get_image()


def qr_png(url):
    buffer = BytesIO()
    qr_image(url).save(buffer, format="PNG")
    return buffer.getvalue()


def _register_fonts():
    """Türkçe karakterler (ş, ğ, ı) için Unicode bir TTF yazı tipi kaydeder."""
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    regular = next((p for p in FONT_CANDIDATES if Path(p).exists()), None)
    bold = next((p for p in FONT_BOLD_CANDIDATES if Path(p).exists()), regular)
    if not regular:  # pragma: no cover - yazı tipi yoksa yerleşik yazı tipine düş
        return "Helvetica", "Helvetica-Bold"
    if "QR-Regular" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont("QR-Regular", regular))
        pdfmetrics.registerFont(TTFont("QR-Bold", bold))
    return "QR-Regular", "QR-Bold"


def table_cards_pdf(business_name, cards):
    """Masa başına bir kart içeren A4 PDF üretir (sayfa başına 2x3 kart).

    `cards`: (masa etiketi, menü adresi) çiftlerinden oluşan liste.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas

    regular, bold = _register_fonts()
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle(f"{business_name} - Masa QR kodları")

    page_w, page_h = A4
    cols, rows = 2, 3
    margin = 12 * mm
    card_w = (page_w - 2 * margin) / cols
    card_h = (page_h - 2 * margin) / rows

    for index, (label, url) in enumerate(cards):
        slot = index % (cols * rows)
        if index and slot == 0:
            pdf.showPage()
        col, row = slot % cols, slot // cols
        x = margin + col * card_w
        y = page_h - margin - (row + 1) * card_h

        # Kesim çizgisi
        pdf.setDash(3, 3)
        pdf.setStrokeColorRGB(0.75, 0.75, 0.75)
        pdf.rect(x, y, card_w, card_h)
        pdf.setDash()

        cx = x + card_w / 2
        pdf.setFillColorRGB(0.1, 0.1, 0.1)
        pdf.setFont(bold, 13)
        pdf.drawCentredString(cx, y + card_h - 12 * mm, business_name[:40])
        pdf.setFont(bold, 22)
        pdf.drawCentredString(cx, y + card_h - 22 * mm, f"Masa {label}")

        qr_size = min(card_w, card_h) - 42 * mm
        pdf.drawImage(
            ImageReader(qr_image(url)),
            cx - qr_size / 2,
            y + 14 * mm,
            qr_size,
            qr_size,
        )
        pdf.setFont(regular, 9)
        pdf.drawCentredString(cx, y + 8 * mm, "Menü ve garson çağırma için okutun")
        pdf.drawCentredString(cx, y + 4 * mm, "Scan for menu & waiter call")

    pdf.save()
    return buffer.getvalue()
