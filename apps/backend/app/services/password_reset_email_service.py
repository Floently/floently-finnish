from __future__ import annotations

import json
from dataclasses import dataclass
from urllib import request as urllib_request
from urllib.parse import urlencode

from app.core.config import SETTINGS


@dataclass(frozen=True)
class PasswordResetLinks:
    deep_link: str
    web_link: str


def build_password_reset_links(*, token: str) -> PasswordResetLinks:
    query = urlencode({"token": token})
    deep_link = f"{SETTINGS.password_reset_deep_link_base}?{query}"
    web_link = f"{SETTINGS.password_reset_web_base_url}?{query}"
    return PasswordResetLinks(deep_link=deep_link, web_link=web_link)


def send_password_reset_email(*, email: str, links: PasswordResetLinks, expires_in_minutes: int) -> bool:
    """Dispatch password-reset email via webhook when configured.

    Returns True only when provider integration is configured and accepted the request.
    """
    webhook_url = SETTINGS.password_reset_email_webhook_url
    if not webhook_url:
        return False

    payload = {
        "type": "password_reset",
        "to": email,
        "from": SETTINGS.password_reset_email_from,
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
