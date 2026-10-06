import base64
import datetime
import random
import string
from typing import List, Optional, Tuple, Dict, Any
from fastapi import UploadFile
from app.services.crop_catalog import match_crop, resolve_language

MAX_DISEASE_IMAGES = 10
MAX_PESTICIDE_IMAGES = 3
MAX_DISEASE_IMAGE_BYTES = 4 * 1024 * 1024  # 4MB
MAX_PESTICIDE_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB
MAX_TOTAL_DISEASE_BYTES = 12 * 1024 * 1024  # 12MB

def generate_request_id(prefix: str = "KRISHI") -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    date_str = now.strftime("%Y%m%d")
    rand_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{date_str}-{rand_str}"

class ValidationResult:
    def __init__(self, is_valid: bool, error_code: Optional[str] = None, error_message: Optional[str] = None, data: Optional[Dict[str, Any]] = None):
        self.is_valid = is_valid
        self.error_code = error_code
        self.error_message = error_message
        self.data = data or {}

async def validate_disease_request(
    crop: Optional[str],
    images: List[UploadFile],
    language: Optional[str] = "en",
    symptoms: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    state: Optional[str] = "South India"
) -> ValidationResult:
    request_id = generate_request_id("KRISHI")

    # 1. Image count check (1 to 10)
    if not images or len(images) == 0:
        return ValidationResult(
            is_valid=False,
            error_code="NO_IMAGES_UPLOADED",
            error_message="Please upload at least 1 image (up to 10 images supported).",
            data={"requestId": request_id}
        )

    if len(images) > MAX_DISEASE_IMAGES:
        return ValidationResult(
            is_valid=False,
            error_code="TOO_MANY_IMAGES",
            error_message="Maximum 10 images allowed per diagnosis request. Please select between 1 and 10 photos.",
            data={"requestId": request_id}
        )

    # 2. Crop check
    if not crop or not crop.strip():
        return ValidationResult(
            is_valid=False,
            error_code="INVALID_CROP",
            error_message="Please select exactly one target crop for this diagnosis case.",
            data={"requestId": request_id}
        )

    crop_trimmed = crop.strip()
    if "," in crop_trimmed or ";" in crop_trimmed:
        return ValidationResult(
            is_valid=False,
            error_code="MULTIPLE_CROPS_NOT_SUPPORTED",
            error_message="Only one crop can be diagnosed per request. Please submit separate requests for different crops.",
            data={"requestId": request_id}
        )

    matched_crop = match_crop(crop_trimmed)
    if not matched_crop:
        return ValidationResult(
            is_valid=False,
            error_code="UNSUPPORTED_CROP",
            error_message=f"Crop '{crop_trimmed}' is not in the 75 target crop catalogue. Please choose a valid target crop.",
            data={"requestId": request_id}
        )

    # 3. Image validation and base64 extraction
    images_list = []
    total_bytes = 0

    for i, img in enumerate(images):
        mime = img.content_type or "image/jpeg"
        if not mime.startswith("image/"):
            return ValidationResult(
                is_valid=False,
                error_code="INVALID_FILE_TYPE",
                error_message=f"File '{img.filename or f'image_{i+1}'}' is not a supported image format (JPEG, PNG, WEBP).",
                data={"requestId": request_id}
            )

        content = await img.read()
        if not content:
            return ValidationResult(
                is_valid=False,
                error_code="UNREADABLE_IMAGE",
                error_message=f"Image '{img.filename or f'image_{i+1}'}' could not be read. Please retake the photo.",
                data={"requestId": request_id}
            )

        size_bytes = len(content)
        if size_bytes > MAX_DISEASE_IMAGE_BYTES:
            return ValidationResult(
                is_valid=False,
                error_code="IMAGE_TOO_LARGE",
                error_message="One of the photos is too large. Please retake it at a lower resolution.",
                data={"requestId": request_id}
            )

        total_bytes += size_bytes
        if total_bytes > MAX_TOTAL_DISEASE_BYTES:
            return ValidationResult(
                is_valid=False,
                error_code="PAYLOAD_TOO_LARGE",
                error_message="The combined photo size is too large. Please send fewer photos.",
                data={"requestId": request_id}
            )

        b64 = base64.b64encode(content).decode("utf-8")
        images_list.append({
            "mimeType": mime,
            "data": b64,
            "raw_bytes": content,
            "fileName": img.filename or f"image_{i+1}.jpg"
        })

    lang_code, lang_name = resolve_language(language)

    return ValidationResult(
        is_valid=True,
        data={
            "requestId": request_id,
            "crop": crop_trimmed,
            "cropCanonicalId": matched_crop,
            "imageCount": len(images_list),
            "images": images_list,
            "symptoms": symptoms,
            "language": lang_code,
            "requestedLanguage": lang_name,
            "latitude": latitude,
            "longitude": longitude,
            "state": state or "South India"
        }
    )

async def validate_pesticide_request(
    images: List[UploadFile],
    language: Optional[str] = "en",
    crop: Optional[str] = None
) -> ValidationResult:
    request_id = generate_request_id("KRISHI-PEST")

    if not images or len(images) == 0:
        return ValidationResult(
            is_valid=False,
            error_code="NO_IMAGES_UPLOADED",
            error_message="Please upload at least one photo of the pesticide label.",
            data={"requestId": request_id}
        )

    if len(images) > MAX_PESTICIDE_IMAGES:
        return ValidationResult(
            is_valid=False,
            error_code="TOO_MANY_IMAGES",
            error_message="Please send at most 3 label photos (front, back, dosage panel).",
            data={"requestId": request_id}
        )

    images_list = []
    total_bytes = 0

    for i, img in enumerate(images):
        mime = img.content_type or "image/jpeg"
        if not mime.startswith("image/"):
            return ValidationResult(
                is_valid=False,
                error_code="INVALID_FILE_TYPE",
                error_message=f"File '{img.filename or f'label_{i+1}'}' is not a supported image (JPEG, PNG, WEBP).",
                data={"requestId": request_id}
            )

        content = await img.read()
        if not content:
            return ValidationResult(
                is_valid=False,
                error_code="UNREADABLE_IMAGE",
                error_message="A label photo could not be read. Please retake it.",
                data={"requestId": request_id}
            )

        size_bytes = len(content)
        if size_bytes > MAX_PESTICIDE_IMAGE_BYTES:
            return ValidationResult(
                is_valid=False,
                error_code="IMAGE_TOO_LARGE",
                error_message="The label photo is too large. Please retake it at a lower resolution.",
                data={"requestId": request_id}
            )

        total_bytes += size_bytes
        b64 = base64.b64encode(content).decode("utf-8")
        images_list.append({
            "mimeType": mime,
            "data": b64,
            "raw_bytes": content,
            "fileName": img.filename or f"label_{i+1}.jpg"
        })

    lang_code, lang_name = resolve_language(language)

    return ValidationResult(
        is_valid=True,
        data={
            "requestId": request_id,
            "crop": crop.strip() if crop and crop.strip() else None,
            "imageCount": len(images_list),
            "images": images_list,
            "language": lang_code,
            "requestedLanguage": lang_name
        }
    )
