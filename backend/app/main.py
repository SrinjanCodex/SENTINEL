"""
SENTINEL — Backend Application Entry Point
FastAPI application with CORS, secure static uploads, clean error handlers,
and automatic database table initialization.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.config import CORS_ORIGINS, UPLOAD_DIR
from app.database import init_db
from app.routers import health, reports, incidents

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sentinel.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown tasks."""
    logger.info("Initializing SENTINEL SQLite database tables...")
    init_db()
    # Pre-warm the severity classification pipeline
    try:
        from app.analysis.classifier import _load_pipeline
        _load_pipeline()
    except Exception as exc:
        logger.warning("Could not pre-warm severity classifier: %s", exc)
    logger.info("SENTINEL backend started successfully.")
    yield
    logger.info("SENTINEL backend shutting down.")


app = FastAPI(
    title="SENTINEL Intelligence API",
    description="Community waterlogging intelligence platform backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for sanitized uploads
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# Clean, secure error handling — never leak stack traces or internal server paths
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats validation errors into clean user-facing error descriptions."""
    errors = []
    for err in exc.errors():
        field_path = " -> ".join(str(loc) for loc in err.get("loc", []) if loc != "body")
        errors.append({
            "field": field_path or "payload",
            "message": err.get("msg", "Invalid value"),
        })
    return JSONResponse(
        status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
        content={"detail": "Request validation failed", "errors": errors},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catches unexpected exceptions to prevent internal file paths or stack trace leaks."""
    logger.error("Unhandled internal exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact the administrator."},
    )


# Register API routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")


@app.get("/")
def root():
    """Root redirect / index notice."""
    return {
        "service": "SENTINEL API",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "status": "online",
    }
