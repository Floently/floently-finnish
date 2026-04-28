"""Database configuration placeholders."""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()
DATABASE_URL = settings.database_url or "sqlite+aiosqlite:///./puhis.db"
engine = None
_session_factory = None


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
