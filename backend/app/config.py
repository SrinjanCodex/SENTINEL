"""
SENTINEL — Application Configuration
Reads settings from environment variables with safe development defaults.
"""
import os
from pathlib import Path
from typing import List

# Base directory for the backend package
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Database configuration
DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'sentinel.db'}")

# CORS configuration: Allow frontend development server
raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

# Upload configuration
UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(BACKEND_DIR / "uploads")))
MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(5 * 1024 * 1024))) # 5 MB

# Allowed image MIME types and pillow formats
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Application environment
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
