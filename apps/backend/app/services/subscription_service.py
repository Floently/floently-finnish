from __future__ import annotations

from typing import Any
from datetime import timedelta

from ..core.config import SETTINGS
from ..core.errors import AppError
from ..core.state_store import STORE
from ..core.utils import parse_iso, utc_now

ALL_PROFESSIONS = ["doctor", "nurse", "practical_nurse"]


TIER_FEATURES: dict[str, dict[str, dict[str, Any]]] = {
    "free": {
        "general_finnish": {"available": True, "limit": 10, "unit": "conversations_per_week", "message": "Limited to 10 conversations/week"},
        "workplace": {"available": True, "limit": 3, "unit": "lessons_total", "message": "Limited to 3 lessons total"},
        "yki": {"available": True, "limit": 1, "unit": "speaking_attempts_per_month", "message": "Limited to 1 attempt/month"},
    },
    "general_premium": {
        "general_finnish": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
        "workplace": {"available": False, "limit": 0, "unit": "not_available", "message": "Requires Professional Premium"},
        "yki": {"available": False, "limit": 0, "unit": "not_available", "message": "Requires Professional Premium"},
    },
    "professional_premium": {
        "general_finnish": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
        "workplace": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
        "yki": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
    },
}

PLAN_CATALOG: list[dict[str, Any]] = [
    {
        "id": "yki_monthly",
        "category": "yki",
        "title": "YKI Pathway",
        "description": "Prepare for YKI speaking, writing, reading, and listening with guided practice that also supports citizenship and permanent residence language goals.",
        "checkout_label": "€14.90 / month",
        "billing_period": "monthly",
    },
    {
        "id": "yki_yearly",
        "category": "yki",
        "title": "YKI Pathway",
        "description": "Prepare for YKI speaking, writing, reading, and listening with guided practice that also supports citizenship and permanent residence language goals.",
        "checkout_label": "€149 / year",
        "billing_period": "yearly",
    },
    {
        "id": "professional_doctor_monthly",
        "category": "professional",
        "profession": "doctor",
        "title": "Professional Pathway · Doctor",
        "description": "Build Finnish for patient interaction, explanations, documentation, teamwork, and real medical communication in Finland.",
        "checkout_label": "€24.90 / month",
        "billing_period": "monthly",
    },
    {
        "id": "professional_nurse_monthly",
        "category": "professional",
        "profession": "nurse",
        "title": "Professional Pathway · Nurse",
        "description": "Build Finnish for patient care, reporting, handovers, medication communication, and everyday workplace interaction.",
        "checkout_label": "€24.90 / month",
        "billing_period": "monthly",
    },
    {
        "id": "professional_practical_nurse_monthly",
        "category": "professional",
        "profession": "practical_nurse",
        "title": "Professional Pathway · Practical Nurse",
        "description": "Build Finnish for care work, routines, residents, relatives, teamwork, and practical communication in real care settings.",
        "checkout_label": "€24.90 / month",
        "billing_period": "monthly",
    },
    {
        "id": "bundle_doctor_monthly",
        "category": "bundle",
        "profession": "doctor",
        "title": "Combined Pathway · YKI + Doctor",
        "description": "Prepare for YKI while building doctor-specific Finnish for work, services, and long-term life in Finland.",
        "checkout_label": "€29.90 / month",
        "billing_period": "monthly",
    },
    {
        "id": "bundle_nurse_monthly",
        "category": "bundle",
        "profession": "nurse",
        "title": "Combined Pathway · YKI + Nurse",
        "description": "Prepare for YKI while building nurse-specific Finnish for work, services, and long-term life in Finland.",
        "checkout_label": "€29.90 / month",
        "billing_period": "monthly",
    },
    {
        "id": "bundle_practical_nurse_monthly",
        "category": "bundle",
        "profession": "practical_nurse",
        "title": "Combined Pathway · YKI + Practical Nurse",
        "description": "Prepare for YKI while building practical nurse Finnish for work, services, and long-term life in Finland.",
        "checkout_label": "€29.90 / month",
        "billing_period": "monthly",
    },
    {
        "id": "employer_programme",
        "category": "organisation",
        "title": "Employer Programme Access",
        "description": "Support international employees with YKI preparation, workplace Finnish, onboarding language, and role-based communication practice.",
        "checkout_label": "Contact sales",
        "billing_period": "monthly",
    },
    {
        "id": "city_programme",
        "category": "organisation",
        "title": "City Programme Access",
        "description": "Offer residents a scalable pathway for YKI, employability, integration, citizenship, and permanent residence language goals.",
        "checkout_label": "Contact sales",
        "billing_period": "monthly",
    },
]


def _is_subscription_active(user: dict[str, Any]) -> bool:
    tier = str(user.get("subscription_tier") or "free")
    if tier == "free":
        return True
    expires_at = parse_iso(user.get("subscription_expires_at"))
    if expires_at is None:
        return True
    return expires_at > utc_now()


def _trial_active(user: dict[str, Any]) -> bool:
    trial_ends_at = parse_iso(user.get("trial_ends_at"))
    return bool(trial_ends_at and trial_ends_at > utc_now())


def _has_trial_access(user: dict[str, Any]) -> bool:
    return str(user.get("access_choice") or "").strip().lower() == "trial" and _trial_active(user)


def _has_paid_access(user: dict[str, Any]) -> bool:
    tier = str(user.get("subscription_tier") or "free")
    return tier != "free" and _is_subscription_active(user)


def _effective_tier(user: dict[str, Any]) -> str:
    if _has_trial_access(user):
        return "preview_yki"
    tier = str(user.get("subscription_tier") or "free")
    return tier if _is_subscription_active(user) else "free"


def _normalize_email(value: Any) -> str:
    return str(value or "").strip().lower()


def _is_internal_all_access_user(user: dict[str, Any]) -> bool:
    email = _normalize_email(user.get("email"))
    return bool(email and email in SETTINGS.internal_all_access_emails)


def _accessible_professions_for_tier(tier: str) -> list[str]:
    normalized = str(tier or "free").strip().lower()
    if normalized in {"internal_all_access", "professional_premium"}:
        return list(ALL_PROFESSIONS)
    if "practical_nurse" in normalized or "lahioitaja" in normalized:
        return ["practical_nurse"]
    if "doctor" in normalized:
        return ["doctor"]
    if "nurse" in normalized:
        return ["nurse"]
    return []


def _yki_access_for_tier(tier: str, features: dict[str, dict[str, Any]]) -> bool:
    if isinstance(features.get("yki"), dict) and isinstance(features["yki"].get("available"), bool):
        return bool(features["yki"]["available"])
    normalized = str(tier or "").strip().lower()
    return normalized.startswith("yki_") or normalized.startswith("bundle_") or normalized in {"professional_premium", "internal_all_access"}


def _professional_access_for_tier(tier: str, features: dict[str, dict[str, Any]]) -> bool:
    if isinstance(features.get("workplace"), dict) and isinstance(features["workplace"].get("available"), bool):
        return bool(features["workplace"]["available"])
    normalized = str(tier or "").strip().lower()
    return normalized.startswith("professional_") or normalized.startswith("bundle_") or normalized in {"professional_premium", "internal_all_access"}


def _feature_map(user: dict[str, Any]) -> dict[str, dict[str, Any]]:
    if _has_trial_access(user):
        return TIER_FEATURES["free"]

    if not _has_paid_access(user):
        return {
            feature: {
                **config,
                "available": False,
                "limit": 0,
                "unit": "locked",
                "message": "Start a 3-day trial or pay to unlock this feature.",
            }
            for feature, config in TIER_FEATURES["free"].items()
        }

    def _plan_features_for_tier(tier: str) -> dict[str, dict[str, Any]]:
        normalized = str(tier or "free").strip().lower()
        if normalized in TIER_FEATURES:
            return TIER_FEATURES[normalized]
        if normalized.startswith("bundle_") or normalized in {"internal_all_access", "professional_premium"}:
            return TIER_FEATURES["professional_premium"]
        if normalized.startswith("professional_"):
            return {
                "general_finnish": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
                "workplace": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
                "yki": {"available": False, "limit": 0, "unit": "not_available", "message": "Requires YKI or bundle plan"},
            }
        if normalized.startswith("yki_"):
            return {
                "general_finnish": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
                "workplace": {"available": False, "limit": 0, "unit": "not_available", "message": "Requires Professional or bundle plan"},
                "yki": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
            }
        return TIER_FEATURES["free"]

    effective_tier = _effective_tier(user)
    features = _plan_features_for_tier(effective_tier)
    if effective_tier == str(user.get("subscription_tier") or "free"):
        return features

    blocked_features: dict[str, dict[str, Any]] = {}
    for feature, config in features.items():
        blocked_features[feature] = dict(config)
        if feature in {"workplace", "yki"}:
            blocked_features[feature]["available"] = False
            blocked_features[feature]["limit"] = 0
            blocked_features[feature]["unit"] = "expired"
            blocked_features[feature]["message"] = "Subscription expired."
    return blocked_features


def subscription_status(*, user: dict[str, Any]) -> dict[str, Any]:
    if _is_internal_all_access_user(user):
        features = {
            feature: {
                **config,
                "available": True,
                "limit": -1,
                "unit": "unlimited",
                "message": "Internal all-access account.",
            }
            for feature, config in TIER_FEATURES["professional_premium"].items()
        }
        return {
            "user_id": user["user_id"],
            "tier": "internal_all_access",
            "billing_tier": str(user.get("subscription_tier") or "internal_all_access"),
            "access_choice": user.get("access_choice"),
            "features": features,
            "expires_at": user.get("subscription_expires_at"),
            "trial_ends_at": user.get("trial_ends_at"),
            "is_trial": _trial_active(user),
            "is_active": True,
            "is_internal_all_access": True,
            "yki_access": True,
            "professional_access": True,
            "accessible_professions": list(ALL_PROFESSIONS),
            "access_type": "internal",
            "plan_key": "internal_all_access",
        }

    if _has_trial_access(user):
        features = _feature_map(user)
        return {
            "user_id": user["user_id"],
            "tier": "preview_yki",
            "billing_tier": "preview_yki",
            "access_choice": user.get("access_choice"),
            "features": features,
            "expires_at": user.get("subscription_expires_at"),
            "trial_ends_at": user.get("trial_ends_at"),
            "is_trial": True,
            "is_active": True,
            "is_internal_all_access": False,
            "yki_access": True,
            "professional_access": False,
            "accessible_professions": [],
            "access_type": "individual",
            "plan_key": "preview_yki",
        }

    purchased_tier = str(user.get("subscription_tier") or "free")
    if SETTINGS.allow_dev_entitlement_override:
        dev_features = {
            feature: {
                **config,
                "available": True,
                "limit": -1,
                "unit": "unlimited",
                "message": "Dev mode override enabled.",
            }
            for feature, config in TIER_FEATURES["professional_premium"].items()
        }
        return {
            "user_id": user["user_id"],
            "tier": "professional_premium",
            "billing_tier": purchased_tier,
            "access_choice": user.get("access_choice"),
            "features": dev_features,
            "expires_at": user.get("subscription_expires_at"),
            "trial_ends_at": user.get("trial_ends_at"),
            "is_trial": _trial_active(user),
            "is_active": True,
            "is_internal_all_access": False,
            "yki_access": True,
            "professional_access": True,
            "accessible_professions": list(ALL_PROFESSIONS),
            "access_type": "individual",
            "plan_key": "professional_premium",
        }
    effective_tier = _effective_tier(user)
    features = _feature_map(user)
    yki_access = _yki_access_for_tier(effective_tier, features)
    professional_access = _professional_access_for_tier(effective_tier, features)
    professions = _accessible_professions_for_tier(effective_tier)
    return {
        "user_id": user["user_id"],
        "tier": effective_tier,
        "billing_tier": purchased_tier,
        "access_choice": user.get("access_choice"),
        "features": features,
        "expires_at": user.get("subscription_expires_at"),
        "trial_ends_at": user.get("trial_ends_at"),
        "is_trial": _trial_active(user),
        "is_active": _has_paid_access(user),
        "is_internal_all_access": False,
        "yki_access": yki_access,
        "professional_access": professional_access,
        "accessible_professions": professions,
        "access_type": "individual",
        "plan_key": effective_tier,
    }


def start_trial(*, user: dict[str, Any], trial_days: int = 3) -> dict[str, Any]:
    user_id = str(user["user_id"])
    updated = dict(user)
    updated["access_choice"] = "trial"
    updated["access_choice_at"] = utc_now().replace(microsecond=0).isoformat()
    updated["trial_ends_at"] = (utc_now() + timedelta(days=max(1, trial_days))).replace(microsecond=0).isoformat()
    with STORE.locked(("users", user_id)):
        STORE.set("users", user_id, updated)
    STORE.write_snapshot()
    return subscription_status(user=updated)


def payment_status(*, user: dict[str, Any]) -> dict[str, Any]:
    status = subscription_status(user=user)
    return {
        "user_id": user["user_id"],
        "billing_tier": status["billing_tier"],
        "effective_tier": status["tier"],
        "is_active": status["is_active"],
        "expires_at": status["expires_at"],
        "trial_ends_at": status["trial_ends_at"],
        "payment_state": "trial" if status.get("is_trial") else ("free" if status["billing_tier"] == "free" else ("active" if status["is_active"] else "expired")),
    }


def check_feature(*, user: dict[str, Any], feature: str) -> dict[str, Any]:
    status = subscription_status(user=user)
    feature_payload = status["features"].get(feature)
    if not feature_payload:
        raise AppError(400, "VALIDATION_ERROR", "Unknown feature.", False, {"classification": "non_retryable", "feature": feature})
    return {
        "feature": feature,
        "allowed": bool(feature_payload.get("available")),
        "message": feature_payload.get("message"),
        "subscription": status,
    }


def require_feature(*, user: dict[str, Any], feature: str) -> None:
    if SETTINGS.allow_dev_entitlement_override:
        return
    result = check_feature(user=user, feature=feature)
    if not result["allowed"]:
        raise AppError(
            403,
            "ENTITLEMENT_REQUIRED",
            str(result["message"] or "Feature is not available."),
            False,
            {"classification": "non_retryable", "feature": feature},
        )


def billing_checkout_url(*, plan_id: str, user_id: str) -> str:
    base_url = SETTINGS.billing_checkout_base_url
    if not base_url:
        raise AppError(
            503,
            "BILLING_NOT_CONFIGURED",
            "Billing checkout is not configured for this deployment.",
            False,
            {"classification": "non_retryable", "plan_id": plan_id},
        )
    return f"{base_url.rstrip('/')}?plan={plan_id}&user={user_id}"


def billing_portal_url(*, user_id: str) -> str:
    base_url = SETTINGS.billing_portal_base_url
    if not base_url:
        raise AppError(
            503,
            "BILLING_NOT_CONFIGURED",
            "Billing portal is not configured for this deployment.",
            False,
            {"classification": "non_retryable"},
        )
    return f"{base_url.rstrip('/')}?user={user_id}"
