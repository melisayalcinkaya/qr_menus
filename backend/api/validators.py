from django.core.exceptions import ValidationError

MAX_IMAGE_BYTES = 2 * 1024 * 1024  # 2 MB
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_image_file(file):
    """Yüklenen görselin boyutunu ve gerçek biçimini denetler.

    Dosya uzantısına değil, Pillow'un okuduğu içeriğe bakılır; böylece
    'resim.png' adıyla yüklenen bir HTML/SVG dosyası reddedilir.
    """
    if file.size > MAX_IMAGE_BYTES:
        raise ValidationError("Görsel en fazla 2 MB olabilir.")

    image = getattr(file, "image", None)  # ImageField, Pillow ile açtığında doldurur
    fmt = getattr(image, "format", None)
    if fmt is None:
        from PIL import Image

        try:
            file.seek(0)
            with Image.open(file) as img:
                fmt = img.format
        except Exception as exc:
            raise ValidationError("Geçerli bir görsel dosyası değil.") from exc
        finally:
            file.seek(0)
    if fmt not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError("Yalnızca JPEG, PNG veya WEBP yüklenebilir.")
