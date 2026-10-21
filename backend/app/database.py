"""
SENTINEL — Database Connection and Session Management
Configures SQLAlchemy engine and declarative base for SQLite.
"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import DATABASE_URL

# SQLite requires check_same_thread=False when used across multiple FastAPI request threads
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency to provide a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Creates all database tables defined in models.py."""
    # Import all models to ensure they are registered with Base.metadata
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
