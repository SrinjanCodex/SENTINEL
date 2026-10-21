"""
SENTINEL — Secure Photo Upload & Processing
Enforces strict MIME validation, real-content inspection via Pillow,
EXIF metadata stripping, and cryptographic random naming.
"""
import io
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps
from app.config import (
    UPLOAD_DIR,
    MAX_UPLOAD_SIZE_BYTES,
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
)

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def process_and_save_photo(file: UploadFile) -> Tuple[str, str]:
    """
    Validates, strips metadata from, and securely saves an uploaded photo.

    Returns:
        Tuple[str, str]: (saved_filename, relative_url_path)

    Raises:
        HTTPException: 413 for oversized files, 400 or 415 for invalid images.
    """
    # 1. Read file content into memory
    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
            detail=f"File size ({file_size / (1024*1024):.2f} MB) exceeds maximum allowed limit of {MAX_UPLOAD_SIZE_BYTES / (1024*1024):.0f} MB.",
        )

    # 2. Check filename extension
    original_ext = Path(file.filename or "").suffix.lower()
    if original_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension '{original_ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # 3. Inspect real content with Pillow
    try:
        image_stream = io.BytesIO(content)
        with Image.open(image_stream) as img:
            img_format = (img.format or "").upper()
            if img_format not in {"JPEG", "PNG", "WEBP"}:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"Unsupported image format: {img_format}. Allowed: JPEG, PNG, WEBP.",
                )

            # Transpose according to EXIF orientation before stripping EXIF tags
            clean_img = ImageOps.exif_transpose(img)

            # Determine target extension and format
            ext = ".jpg" if img_format == "JPEG" else f".{img_format.lower()}"
            random_filename = f"{uuid.uuid4().hex}{ext}"
            destination_path = UPLOAD_DIR / random_filename

            # Save clean image without EXIF metadata
            # Discarding exif parameter ensures privacy and prevents location leaks
            if img_format == "JPEG":
                # Convert RGBA to RGB for JPEG compatibility
                if clean_img.mode in ("RGBA", "P"):
                    clean_img = clean_img.convert("RGB")
                clean_img.save(destination_path, format="JPEG", quality=88, optimize=True)
            elif img_format == "PNG":
                clean_img.save(destination_path, format="PNG", optimize=True)
            elif img_format == "WEBP":
                clean_img.save(destination_path, format="WEBP", quality=88)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid or readable image.",
        ) from exc

    return random_filename, f"/uploads/{random_filename}"
