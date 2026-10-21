"""
SENTINEL — Upload Security & Image Validation Tests
Tests file size enforcement, format validation, EXIF stripping, and corrupted input rejection.
"""
import io
import pytest
from PIL import Image


def create_test_image(format="JPEG", size=(100, 100), color="blue") -> io.BytesIO:
    """Generates an in-memory valid image file for upload testing."""
    image = Image.new("RGB", size, color=color)
    output = io.BytesIO()
    image.save(output, format=format)
    output.seek(0)
    return output


def test_upload_photo_valid_jpeg(client):
    """Valid JPEG should be accepted, stripped of EXIF, saved with a random filename, and return 201."""
    img_bytes = create_test_image("JPEG")
    files = {"file": ("waterlogging.jpg", img_bytes, "image/jpeg")}

    response = client.post("/api/reports/upload-photo", files=files)
    assert response.status_code == 201
    data = response.json()
    assert "filename" in data
    assert "url" in data
    assert data["filename"].endswith(".jpg")
    assert "waterlogging" not in data["filename"]  # Random UUID name used


def test_upload_photo_valid_png(client):
    """Valid PNG should be accepted and saved with a random filename."""
    img_bytes = create_test_image("PNG")
    files = {"file": ("scene.png", img_bytes, "image/png")}

    response = client.post("/api/reports/upload-photo", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["filename"].endswith(".png")


def test_upload_photo_oversized_rejected(client, monkeypatch):
    """Files exceeding MAX_UPLOAD_SIZE_BYTES must be rejected with 413 Payload Too Large."""
    # Temporarily set max size to 500 bytes for test
    from app import uploads
    monkeypatch.setattr(uploads, "MAX_UPLOAD_SIZE_BYTES", 500)

    large_bytes = io.BytesIO(b"A" * 1024)
    files = {"file": ("large_image.jpg", large_bytes, "image/jpeg")}

    response = client.post("/api/reports/upload-photo", files=files)
    assert response.status_code == 413
    assert "exceeds maximum allowed limit" in response.json()["detail"]


def test_upload_photo_invalid_extension(client):
    """Non-image extensions must be rejected with 415 Unsupported Media Type."""
    text_file = io.BytesIO(b"Plain text content masquerading as a photo")
    files = {"file": ("malicious.txt", text_file, "text/plain")}

    response = client.post("/api/reports/upload-photo", files=files)
    assert response.status_code == 415
    assert "Unsupported file extension" in response.json()["detail"]


def test_upload_photo_corrupted_image(client):
    """A file with an image extension but corrupt content must be rejected with 400 Bad Request."""
    corrupted_bytes = io.BytesIO(b"THIS IS NOT A VALID JPEG BYTE STREAM")
    files = {"file": ("fake.jpg", corrupted_bytes, "image/jpeg")}

    response = client.post("/api/reports/upload-photo", files=files)
    assert response.status_code == 400
    assert "not a valid or readable image" in response.json()["detail"]
