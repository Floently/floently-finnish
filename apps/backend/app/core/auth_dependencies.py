"""Authentication dependency helpers.

These helpers are shared by protected routers. The canonical HTTP auth surface
lives in app.routers.v1_auth, while reusable authentication dependencies live
here for admin, YKI, and card runtime routers.
"""
from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_user_id_from_token
from app.core.config import get_settings
from app.db.database import get_session
from app.db.models import User

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Return the authenticated database user for a required Bearer token."""
    token = credentials.credentials
    user_id = get_user_id_from_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return current user only if the email is in the configured admin allowlist."""
    allowed = {
        email.strip().lower()
        for email in get_settings().admin_email_allowlist
        if email.strip()
    }
    if current_user.email.strip().lower() not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_optional),
    session: AsyncSession = Depends(get_session),
) -> Optional[User]:
    """Return current user when a valid Bearer token is present; otherwise None."""
    if not credentials:
        return None

    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        return None

    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
