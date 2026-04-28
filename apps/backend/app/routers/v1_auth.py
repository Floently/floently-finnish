from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, Request

from app.middleware.request_id import get_request_id
from app.models.api_models import (
    DeleteAccountRequest,
    EmailVerificationConfirmRequest,
    EmailVerificationRequest,
    GoogleAuthRequest,
    LoginPasswordRequest,
    LoginProviderRequest,
    LogoutRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RefreshRequest,
    RegisterPasswordRequest,
    SetPasswordRequest,
)
from app.core.config import SETTINGS
from app.core.errors import AppError
from app.core.responses import success_payload
from app.services.account_deletion_service import delete_account_for_user
from app.services.auth_service import (
    auth_methods,
    auth_session_payload,
    confirm_email_verification,
    complete_password_reset,
    create_user,
    current_user_from_authorization,
    enforce_register_guards,
    login_dev_user,
    login_provider,
    login_user,
    logout_auth,
    refresh_auth,
    request_email_verification,
    request_password_reset,
    set_password,
)
from app.integrations.google_oauth_service import complete_google_id_token_auth, complete_google_oauth, handle_google_callback, start_google_oauth


def build_auth_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.get("/auth/methods")
    async def get_auth_methods(request: Request) -> dict[str, Any]:
        return success_payload(data={"methods": auth_methods()}, request_id=get_request_id(request))

    @router.post("/auth/register/password")
    async def register_password(request: Request, payload: RegisterPasswordRequest) -> dict[str, Any]:
        forwarded = request.headers.get("x-forwarded-for", "")
        request_ip = forwarded.split(",", 1)[0].strip() or (request.client.host if request.client else None)
        enforce_register_guards(email=payload.email, request_ip=request_ip, captcha_token=payload.captcha_token)
        data = create_user(email=payload.email, password=payload.password, name=payload.name)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/login/password")
    async def login_password_route(request: Request, payload: LoginPasswordRequest) -> dict[str, Any]:
        data = login_user(email=payload.email, password=payload.password)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/set-password")
    async def set_password_route(request: Request, payload: SetPasswordRequest) -> dict[str, Any]:
        data = set_password(email=payload.email, password=payload.password, confirm_password=payload.confirm_password)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/password-reset/request")
    async def password_reset_request_route(request: Request, payload: PasswordResetRequest) -> dict[str, Any]:
        forwarded = request.headers.get("x-forwarded-for", "")
        request_ip = forwarded.split(",", 1)[0].strip() or (request.client.host if request.client else None)
        data = request_password_reset(email=payload.email, request_ip=request_ip)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/password-reset/confirm")
    async def password_reset_confirm_route(request: Request, payload: PasswordResetConfirmRequest) -> dict[str, Any]:
        data = complete_password_reset(token=payload.token, password=payload.password, confirm_password=payload.confirm_password)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/email-verification/request")
    async def email_verification_request_route(request: Request, payload: EmailVerificationRequest) -> dict[str, Any]:
        data = request_email_verification(email=payload.email)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/email-verification/confirm")
    async def email_verification_confirm_route(request: Request, payload: EmailVerificationConfirmRequest) -> dict[str, Any]:
        data = confirm_email_verification(token=payload.token)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/login/provider")
    async def login_provider_route(request: Request, payload: LoginProviderRequest) -> dict[str, Any]:
        data = login_provider(provider_id=payload.provider_id, provider_token=payload.provider_token)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/google")
    async def google_auth_route(request: Request, payload: GoogleAuthRequest) -> dict[str, Any]:
        if payload.oauth_result_id:
            data = complete_google_oauth(payload.oauth_result_id)
        elif payload.id_token or payload.credential:
            data = complete_google_id_token_auth(payload.id_token or payload.credential or "")
        else:
            data = start_google_oauth(
                request=request,
                redirect_origin=payload.redirect_origin,
            )
        return success_payload(data=data, request_id=get_request_id(request))

    @router.get("/auth/google/callback", name="google_callback_route")
    async def google_callback_route(
        request: Request,
        code: str | None = None,
        state: str | None = None,
        error: str | None = None,
        error_description: str | None = None,
    ):
        return handle_google_callback(
            request=request,
            code=code,
            state=state,
            error=error,
            error_description=error_description,
        )

    @router.get("/auth/session")
    async def get_auth_session(request: Request, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, token_payload = current_user_from_authorization(authorization)
        return success_payload(data=auth_session_payload(user=user, token_payload=token_payload), request_id=get_request_id(request))

    @router.get("/auth/status")
    async def auth_status(request: Request) -> dict[str, Any]:
        del request
        return {
            "isAuthenticated": False,
            "mockAuthEnabled": SETTINGS.environment == "development",
            "mode": SETTINGS.environment,
        }

    if SETTINGS.environment == "development":
        @router.post("/auth/mock-login")
        async def auth_mock_login(request: Request, email: str | None = None) -> dict[str, Any]:
            del request
            normalized = (email or "learner@floently.local").strip().lower()
            display_name = (
                " ".join(
                    part.capitalize()
                    for part in normalized.split("@")[0].replace(".", " ").replace("_", " ").replace("-", " ").split()
                )
                or "Floently Finnish Dev User"
            )
            session = login_dev_user(email=normalized, name=display_name)
            return {
                "token": session["tokens"]["access_token"],
                "user": {
                    "email": session["auth_user"]["email"],
                    "id": session["auth_user"]["user_id"],
                    "name": session["auth_user"]["name"] or display_name,
                },
            }

    @router.post("/auth/token/refresh")
    async def refresh_route(request: Request, payload: RefreshRequest) -> dict[str, Any]:
        data = refresh_auth(refresh_token=payload.refresh_token)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/logout")
    async def logout_route(request: Request, payload: LogoutRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        data = logout_auth(authorization=authorization, refresh_token=payload.refresh_token)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/auth/account/delete")
    async def delete_account_route(
        request: Request,
        payload: DeleteAccountRequest,
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        if not payload.confirm_delete:
            raise AppError(
                400,
                "VALIDATION_ERROR",
                "Account deletion requires explicit confirmation.",
                False,
                {"classification": "non_retryable"},
            )
        user, _ = current_user_from_authorization(authorization)
        data = await delete_account_for_user(user=user, deletion_reason=payload.deletion_reason)
        return success_payload(data=data, request_id=get_request_id(request))

    return router
