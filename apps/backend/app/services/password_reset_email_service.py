from __future__ import annotations

import json
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from urllib import request as urllib_request
from urllib.parse import urlencode

from app.core.config import SETTINGS


@dataclass(frozen=True)
class PasswordResetLinks:
    deep_link: str
    web_link: str


@dataclass(frozen=True)
class PasswordResetDeliveryStatus:
    ready: bool
    provider: str
    reason: str

    def as_dict(self) -> dict[str, str | bool]:
        return {
            "ready": self.ready,
            "provider": self.provider,
            "reason": self.reason,
        }


def build_password_reset_links(*, token: str) -> PasswordResetLinks:
    query = urlencode({"token": token})
    deep_link = f"{SETTINGS.password_reset_deep_link_base}?{query}"
    web_link = f"{SETTINGS.password_reset_web_base_url}?{query}"
    return PasswordResetLinks(deep_link=deep_link, web_link=web_link)


def _smtp_configuration_status() -> PasswordResetDeliveryStatus:
    host = str(SETTINGS.password_reset_smtp_host or "").strip()
    sender = str(SETTINGS.password_reset_email_from or "").strip()
    username = str(SETTINGS.password_reset_smtp_username or "").strip()
    password = str(SETTINGS.password_reset_smtp_password or "").strip()
    use_tls = bool(SETTINGS.password_reset_smtp_use_tls)
    use_ssl = bool(SETTINGS.password_reset_smtp_use_ssl)
    port = int(SETTINGS.password_reset_smtp_port or 0)

    if not host:
        if username or password:
            return PasswordResetDeliveryStatus(False, "smtp", "smtp_host_missing")
        return PasswordResetDeliveryStatus(False, "none", "provider_not_configured")
    if not sender:
        return PasswordResetDeliveryStatus(False, "smtp", "sender_missing")
    if port <= 0 or port > 65535:
        return PasswordResetDeliveryStatus(False, "smtp", "smtp_port_invalid")
    if use_tls and use_ssl:
        return PasswordResetDeliveryStatus(False, "smtp", "smtp_tls_mode_conflict")
    if bool(username) != bool(password):
        return PasswordResetDeliveryStatus(False, "smtp", "smtp_credentials_incomplete")
    return PasswordResetDeliveryStatus(True, "smtp", "ready")


def get_password_reset_delivery_status() -> PasswordResetDeliveryStatus:
    sender = str(SETTINGS.password_reset_email_from or "").strip()
    webhook_url = str(SETTINGS.password_reset_email_webhook_url or "").strip()

    if webhook_url and sender:
        return PasswordResetDeliveryStatus(True, "webhook", "ready")

    smtp_status = _smtp_configuration_status()
    if smtp_status.ready:
        return smtp_status

    if webhook_url and not sender:
        return PasswordResetDeliveryStatus(False, "webhook", "sender_missing")
    if sender and not webhook_url and smtp_status.provider == "none":
        return PasswordResetDeliveryStatus(False, "none", "provider_not_configured")
    return smtp_status


def _send_via_webhook(*, email: str, links: PasswordResetLinks, expires_in_minutes: int) -> bool:
    webhook_url = str(SETTINGS.password_reset_email_webhook_url or "").strip()
    sender = str(SETTINGS.password_reset_email_from or "").strip()
    if not webhook_url or not sender:
        return False

    payload = {
        "type": "password_reset",
        "to": email,
        "from": sender,
        "subject": "Reset your KieliValmis password",
        "template_data": {
            "deep_link": links.deep_link,
            "web_link": links.web_link,
            "expires_in_minutes": expires_in_minutes,
        },
    }
    req = urllib_request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib_request.urlopen(req, timeout=5) as response:
        return 200 <= int(getattr(response, "status", 500)) < 300


def _password_reset_message(*, email: str, links: PasswordResetLinks, expires_in_minutes: int) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = "Reset your KieliValmis password"
    message["From"] = str(SETTINGS.password_reset_email_from or "").strip()
    message["To"] = email
    message.set_content(
        "\n".join(
            (
                "We received a request to reset your KieliValmis password.",
                "",
                f"Open this link to reset your password: {links.web_link}",
                f"On a mobile device, you can also use: {links.deep_link}",
                "",
                f"This link expires in {expires_in_minutes} minutes.",
                "If you did not request a password reset, you can ignore this message.",
            )
        )
    )
    return message


def _send_via_smtp(*, email: str, links: PasswordResetLinks, expires_in_minutes: int) -> bool:
    status = _smtp_configuration_status()
    if not status.ready:
        return False

    host = str(SETTINGS.password_reset_smtp_host or "").strip()
    port = int(SETTINGS.password_reset_smtp_port)
    username = str(SETTINGS.password_reset_smtp_username or "").strip()
    password = str(SETTINGS.password_reset_smtp_password or "").strip()
    context = ssl.create_default_context()
    message = _password_reset_message(
        email=email,
        links=links,
        expires_in_minutes=expires_in_minutes,
    )

    if SETTINGS.password_reset_smtp_use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=5, context=context) as smtp:
            if username:
                smtp.login(username, password)
            smtp.send_message(message)
        return True

    with smtplib.SMTP(host, port, timeout=5) as smtp:
        smtp.ehlo()
        if SETTINGS.password_reset_smtp_use_tls:
            smtp.starttls(context=context)
            smtp.ehlo()
        if username:
            smtp.login(username, password)
        smtp.send_message(message)
    return True


def send_password_reset_email(*, email: str, links: PasswordResetLinks, expires_in_minutes: int) -> bool:
    """Dispatch a password-reset email through a configured server-side provider.

    The existing webhook integration remains preferred. SMTP is a provider-neutral
    fallback. False means no provider is currently ready; provider exceptions are
    intentionally allowed to propagate to the caller so they can be logged without
    changing the neutral public reset response.
    """
    status = get_password_reset_delivery_status()
    if not status.ready:
        return False
    if status.provider == "webhook":
        return _send_via_webhook(
            email=email,
            links=links,
            expires_in_minutes=expires_in_minutes,
        )
    if status.provider == "smtp":
        return _send_via_smtp(
            email=email,
            links=links,
            expires_in_minutes=expires_in_minutes,
        )
    return False
