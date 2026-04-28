from __future__ import annotations

from datetime import timedelta
from typing import Any
from urllib.parse import urlencode

from ..core.config import SETTINGS
from ..core.errors import AppError
from ..core.state_store import STORE
from ..core.utils import parse_iso, utc_now
from ..db import auth_repository

ALL_PROFESSIONS = ["doctor", "nurse", "practical_nurse"]
PROFESSION_LABELS = {
    "doctor": "Doctor",
    "nurse": "Nurse",
    "practical_nurse": "Practical Nurse",
}
ADDITIONAL_PROFESSION_DISCOUNT_PERCENT = 15

BILLING_PERIOD_LABELS = {
    "monthly": "month",
    "3_months": "3 months",
    "yearly": "year",
}

BILLING_PERIOD_ALIASES = {
    "monthly": "monthly",
    "month": "monthly",
    "1_month": "monthly",
    "3_months": "3_months",
    "three_months": "3_months",
    "quarterly": "3_months",
    "quarter": "3_months",
    "yearly": "yearly",
    "annual": "yearly",
    "annually": "yearly",
    "12_months": "yearly",
}

PATHWAY_ALIASES = {
    "yki": "yki",
    "professional": "professional",
    "profession": "professional",
    "combined": "combined",
    "bundle": "combined",
}

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
        "pathway": "yki",
        "title": "YKI Pathway",
        "description": "YKI exam practice for citizenship, permanent residence, study, and life in Finland.",
        "checkout_label": "EUR 14.90 / month",
        "billing_period": "monthly",
        "included_profession_slots": 0,
    },
    {
        "id": "yki_3_months",
        "category": "yki",
        "pathway": "yki",
        "title": "YKI Pathway",
        "description": "YKI exam practice for citizenship, permanent residence, study, and life in Finland.",
        "checkout_label": "EUR 39.90 / 3 months",
        "billing_period": "3_months",
        "included_profession_slots": 0,
    },
    {
        "id": "yki_yearly",
        "category": "yki",
        "pathway": "yki",
        "title": "YKI Pathway",
        "description": "YKI exam practice for citizenship, permanent residence, study, and life in Finland.",
        "checkout_label": "EUR 149 / year",
        "billing_period": "yearly",
        "included_profession_slots": 0,
    },
    {
        "id": "professional_monthly",
        "category": "professional",
        "pathway": "professional",
        "title": "Professional Pathway",
        "description": "Role-specific Finnish for healthcare and other professional pathways. Choose one or more professions at checkout.",
        "checkout_label": "EUR 24.90 / profession / month",
        "billing_period": "monthly",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
    },
    {
        "id": "professional_3_months",
        "category": "professional",
        "pathway": "professional",
        "title": "Professional Pathway",
        "description": "Role-specific Finnish for healthcare and other professional pathways. Choose one or more professions at checkout.",
        "checkout_label": "EUR 67.90 / profession / 3 months",
        "billing_period": "3_months",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
    },
    {
        "id": "professional_yearly",
        "category": "professional",
        "pathway": "professional",
        "title": "Professional Pathway",
        "description": "Role-specific Finnish for healthcare and other professional pathways. Choose one or more professions at checkout.",
        "checkout_label": "EUR 249 / profession / year",
        "billing_period": "yearly",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
    },
    {
        "id": "combined_monthly",
        "category": "bundle",
        "pathway": "combined",
        "title": "Combined Pathway",
        "description": "YKI preparation plus one professional pathway. Add more professions when needed.",
        "checkout_label": "EUR 29.90 / month",
        "billing_period": "monthly",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
    },
    {
        "id": "combined_3_months",
        "category": "bundle",
        "pathway": "combined",
        "title": "Combined Pathway",
        "description": "YKI preparation plus one professional pathway. Add more professions when needed.",
        "checkout_label": "EUR 80.90 / 3 months",
        "billing_period": "3_months",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
    },
    {
        "id": "combined_yearly",
        "category": "bundle",
        "pathway": "combined",
        "title": "Combined Pathway",
        "description": "YKI preparation plus one professional pathway. Add more professions when needed.",
        "checkout_label": "EUR 299 / year",
        "billing_period": "yearly",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
    },
    {
        "id": "employer_programme",
        "category": "organisation",
        "pathway": "employer_programme",
        "title": "Employer Programme Access",
        "description": "Support international employees with YKI preparation, workplace Finnish, onboarding language, and role-based communication practice.",
        "checkout_label": "Contact sales",
        "billing_period": "monthly",
    },
    {
        "id": "city_programme",
        "category": "organisation",
        "pathway": "city_programme",
        "title": "City Programme Access",
        "description": "Offer residents a scalable pathway for YKI, employability, integration, citizenship, and permanent residence language goals.",
        "checkout_label": "Contact sales",
        "billing_period": "monthly",
    },
]

PLAN_BY_ID = {str(plan["id"]): plan for plan in PLAN_CATALOG}


def _normalize_profession(value: Any) -> str | None:
    normalized = str(value or "").strip().lower().replace("-", "_")
    if normalized in {"lahioitaja", "laehihoitaja"}:
        normalized = "practical_nurse"
    return normalized if normalized in ALL_PROFESSIONS else None


def _as_iterable_professions(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    if isinstance(value, (list, tuple, set)):
        return list(value)
    return [value]


def _normalize_professions(value: Any) -> list[str]:
    result: list[str] = []
    for item in _as_iterable_professions(value):
        profession = _normalize_profession(item)
        if profession and profession not in result:
            result.append(profession)
    return result


def _profession_labels(professions: list[str]) -> list[str]:
    return [PROFESSION_LABELS.get(profession, profession.replace("_", " ").title()) for profession in professions]


def _normalize_billing_period(value: Any) -> str | None:
    normalized = str(value or "").strip().lower().replace("-", "_")
    return BILLING_PERIOD_ALIASES.get(normalized)


def _normalize_pathway(value: Any) -> str | None:
    normalized = str(value or "").strip().lower().replace("-", "_")
    return PATHWAY_ALIASES.get(normalized)


def _plan_id_for(pathway: str, billing_period: str) -> str:
    prefix = "combined" if pathway == "combined" else pathway
    plan_id = f"{prefix}_{billing_period}"
    if plan_id not in PLAN_BY_ID:
        raise AppError(400, "VALIDATION_ERROR", "Unknown billing plan.", False, {"classification": "non_retryable", "plan_id": plan_id})
    return plan_id


def _parse_plan_id(plan_id: str) -> tuple[str | None, str | None, list[str]]:
    normalized = str(plan_id or "").strip().lower().replace("-", "_")
    if normalized in PLAN_BY_ID:
        plan = PLAN_BY_ID[normalized]
        return _normalize_pathway(plan.get("pathway") or plan.get("category")), _normalize_billing_period(plan.get("billing_period")), []

    if normalized.startswith("yki_"):
        return "yki", _normalize_billing_period(normalized.removeprefix("yki_")), []

    if normalized.startswith("combined_"):
        return "combined", _normalize_billing_period(normalized.removeprefix("combined_")), []

    for profession in sorted(ALL_PROFESSIONS, key=len, reverse=True):
        professional_prefix = f"professional_{profession}_"
        bundle_prefix = f"bundle_{profession}_"
        if normalized.startswith(professional_prefix):
            return "professional", _normalize_billing_period(normalized.removeprefix(professional_prefix)), [profession]
        if normalized.startswith(bundle_prefix):
            return "combined", _normalize_billing_period(normalized.removeprefix(bundle_prefix)), [profession]

    if normalized.startswith("professional_"):
        return "professional", _normalize_billing_period(normalized.removeprefix("professional_")), []
    if normalized.startswith("bundle_"):
        return "combined", _normalize_billing_period(normalized.removeprefix("bundle_")), []
    return None, None, []


def _checkout_details_from_payload(payload: dict[str, Any]) -> dict[str, Any]:
    raw_plan = str(payload.get("plan") or payload.get("plan_id") or payload.get("planId") or "").strip()
    if raw_plan == "trial_3day":
        return {
            "plan_id": "trial_3day",
            "pathway": "trial",
            "billing_period": "trial",
            "professions": [],
            "profession_count": 0,
            "line_items": [],
        }

    plan_pathway, plan_period, plan_professions = _parse_plan_id(raw_plan) if raw_plan else (None, None, [])
    pathway = _normalize_pathway(payload.get("pathway") or payload.get("plan_type") or payload.get("planType")) or plan_pathway
    billing_period = _normalize_billing_period(payload.get("billing_period") or payload.get("billingPeriod")) or plan_period or "monthly"
    professions = _normalize_professions(payload.get("professions") or payload.get("selected_professions") or payload.get("selectedProfessions")) or plan_professions

    if pathway is None:
        raise AppError(400, "VALIDATION_ERROR", "Choose a valid pathway.", False, {"classification": "non_retryable"})
    if billing_period not in BILLING_PERIOD_LABELS:
        raise AppError(400, "VALIDATION_ERROR", "Choose a valid billing period.", False, {"classification": "non_retryable", "billing_period": billing_period})

    if pathway in {"professional", "combined"} and not professions:
        raise AppError(400, "VALIDATION_ERROR", "Choose at least one profession.", False, {"classification": "non_retryable", "pathway": pathway})
    if pathway == "yki":
        professions = []

    plan_id = _plan_id_for(pathway, billing_period)
    extra_profession_count = max(0, len(professions) - 1) if pathway in {"professional", "combined"} else 0
    line_items: list[dict[str, Any]] = [{"plan": plan_id, "quantity": 1}]
    if extra_profession_count:
        line_items.append({"plan": _plan_id_for("professional", billing_period), "quantity": extra_profession_count, "discount_percent": ADDITIONAL_PROFESSION_DISCOUNT_PERCENT})

    return {
        "plan_id": plan_id,
        "pathway": pathway,
        "billing_period": billing_period,
        "professions": professions,
        "profession_count": len(professions),
        "extra_profession_count": extra_profession_count,
        "extra_profession_discount_percent": ADDITIONAL_PROFESSION_DISCOUNT_PERCENT if extra_profession_count else 0,
        "line_items": line_items,
    }


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


def _accessible_professions_for_user(user: dict[str, Any], tier: str) -> list[str]:
    explicit = (
        _normalize_professions(user.get("selected_professions"))
        or _normalize_professions(user.get("accessible_professions"))
        or _normalize_professions(user.get("professions"))
        or _normalize_professions(user.get("profession"))
        or _normalize_professions(user.get("primary_profession"))
    )
    if explicit:
        return explicit

    normalized = str(tier or "free").strip().lower().replace("-", "_")
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
    normalized = str(tier or "").strip().lower().replace("-", "_")
    return normalized.startswith("yki_") or normalized.startswith("combined_") or normalized.startswith("bundle_") or normalized in {"professional_premium", "internal_all_access"}


def _professional_access_for_tier(tier: str, features: dict[str, dict[str, Any]]) -> bool:
    if isinstance(features.get("workplace"), dict) and isinstance(features["workplace"].get("available"), bool):
        return bool(features["workplace"]["available"])
    normalized = str(tier or "").strip().lower().replace("-", "_")
    return normalized.startswith("professional_") or normalized.startswith("combined_") or normalized.startswith("bundle_") or normalized in {"professional_premium", "internal_all_access"}


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
        normalized = str(tier or "free").strip().lower().replace("-", "_")
        if normalized in TIER_FEATURES:
            return TIER_FEATURES[normalized]
        if normalized.startswith("combined_") or normalized.startswith("bundle_") or normalized in {"internal_all_access", "professional_premium"}:
            return TIER_FEATURES["professional_premium"]
        if normalized.startswith("professional_"):
            return {
                "general_finnish": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
                "workplace": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
                "yki": {"available": False, "limit": 0, "unit": "not_available", "message": "Requires YKI or combined plan"},
            }
        if normalized.startswith("yki_"):
            return {
                "general_finnish": {"available": True, "limit": -1, "unit": "unlimited", "message": "Unlimited"},
                "workplace": {"available": False, "limit": 0, "unit": "not_available", "message": "Requires Professional or combined plan"},
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


def _pathway_for_tier(tier: str, yki_access: bool, professional_access: bool) -> str:
    normalized = str(tier or "free").strip().lower().replace("-", "_")
    if normalized == "internal_all_access":
        return "internal"
    if normalized.startswith("combined_") or normalized.startswith("bundle_") or (yki_access and professional_access):
        return "combined"
    if normalized.startswith("professional_") or professional_access:
        return "professional"
    if normalized.startswith("yki_") or yki_access:
        return "yki"
    return "free"


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
            "selected_professions": list(ALL_PROFESSIONS),
            "profession_labels": _profession_labels(list(ALL_PROFESSIONS)),
            "profession_slot_count": len(ALL_PROFESSIONS),
            "access_type": "internal",
            "pathway": "internal",
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
            "selected_professions": [],
            "profession_labels": [],
            "profession_slot_count": 0,
            "access_type": "individual",
            "pathway": "yki",
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
            "selected_professions": list(ALL_PROFESSIONS),
            "profession_labels": _profession_labels(list(ALL_PROFESSIONS)),
            "profession_slot_count": len(ALL_PROFESSIONS),
            "access_type": "individual",
            "pathway": "combined",
            "plan_key": "professional_premium",
        }

    effective_tier = _effective_tier(user)
    features = _feature_map(user)
    yki_access = _yki_access_for_tier(effective_tier, features)
    professional_access = _professional_access_for_tier(effective_tier, features)
    professions = _accessible_professions_for_user(user, effective_tier)
    pathway = _pathway_for_tier(effective_tier, yki_access, professional_access)
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
        "selected_professions": professions,
        "profession_labels": _profession_labels(professions),
        "profession_slot_count": len(professions),
        "access_type": str(user.get("access_type") or "individual"),
        "pathway": pathway,
        "plan_key": effective_tier,
    }


def start_trial(*, user: dict[str, Any], trial_days: int = 3) -> dict[str, Any]:
    user_id = str(user["user_id"])
    updated = dict(user)
    updated["access_choice"] = "trial"
    updated["access_choice_at"] = utc_now().replace(microsecond=0).isoformat()
    updated["trial_ends_at"] = (utc_now() + timedelta(days=max(1, trial_days))).replace(microsecond=0).isoformat()
    auth_repository.AUTH_USERS.save_user(updated, overwrite_password=False)
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
        "pathway": status.get("pathway"),
        "selected_professions": status.get("selected_professions", []),
        "profession_slot_count": status.get("profession_slot_count", 0),
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


def billing_checkout_details(*, payload: dict[str, Any], user_id: str) -> dict[str, Any]:
    details = _checkout_details_from_payload(payload)
    details["user_id"] = user_id
    details["metadata"] = {
        "user_id": user_id,
        "plan": details["plan_id"],
        "pathway": details["pathway"],
        "billing_period": details["billing_period"],
        "professions": ",".join(details["professions"]),
        "profession_count": str(details["profession_count"]),
    }
    return details


def billing_checkout_url(*, plan_id: str | None = None, user_id: str, payload: dict[str, Any] | None = None) -> str:
    base_url = SETTINGS.billing_checkout_base_url
    if not base_url:
        raise AppError(
            503,
            "BILLING_NOT_CONFIGURED",
            "Billing checkout is not configured for this deployment.",
            False,
            {"classification": "non_retryable", "plan_id": plan_id},
        )
    details = billing_checkout_details(payload=(payload or {"plan": plan_id}), user_id=user_id)
    query = urlencode(
        {
            "plan": details["plan_id"],
            "pathway": details["pathway"],
            "billing_period": details["billing_period"],
            "professions": ",".join(details["professions"]),
            "profession_count": str(details["profession_count"]),
            "user": user_id,
        }
    )
    return f"{base_url.rstrip('/')}?{query}"


def billing_checkout_session(*, payload: dict[str, Any], user_id: str) -> dict[str, Any]:
    details = billing_checkout_details(payload=payload, user_id=user_id)
    return {
        "checkout_url": billing_checkout_url(user_id=user_id, payload=payload),
        "plan": details["plan_id"],
        "pathway": details["pathway"],
        "billing_period": details["billing_period"],
        "professions": details["professions"],
        "profession_count": details["profession_count"],
        "extra_profession_count": details.get("extra_profession_count", 0),
        "extra_profession_discount_percent": details.get("extra_profession_discount_percent", 0),
        "line_items": details["line_items"],
        "metadata": details["metadata"],
        "mode": "configured",
    }


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
