"""Database configuration placeholders."""

from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.core.paths import BACKEND_ROOT

settings = get_settings()
DATABASE_URL = settings.database_url or "sqlite+aiosqlite:///./puhis.db"
engine = None
_session_factory = None


def resolve_sqlite_database_path(database_url: str | None = None) -> Path:
    raw_url = database_url or DATABASE_URL
    url = make_url(raw_url)
    if not url.drivername.startswith("sqlite"):
        return (BACKEND_ROOT / "puhis.db").resolve()
    database = Path(url.database or "./puhis.db")
    if not database.is_absolute():
        database = BACKEND_ROOT / database
    return database.resolve()


def _ensure_session_factory():
    global engine, _session_factory
    if _session_factory is not None:
        return _session_factory
    engine = create_async_engine(DATABASE_URL, future=True, echo=False)
    _session_factory = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    return _session_factory


def AsyncSessionLocal() -> AsyncSession:
    factory = _ensure_session_factory()
    return factory()


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
