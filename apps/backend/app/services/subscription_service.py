from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlencode

try:
    import stripe
except Exception:  # pragma: no cover - optional at import time
    stripe = None

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

STRIPE_PRICE_CONFIG: dict[str, dict[str, dict[str, str]]] = {
    "yki": {
        "monthly": {"setting": "stripe_price_yki_1_month"},
        "3_months": {"setting": "stripe_price_yki_3_months"},
        "yearly": {"setting": "stripe_price_yki_12_months"},
    },
    "professional": {
        "1": {
            "monthly": {"setting": "stripe_price_professional_1_profession_1_month"},
            "3_months": {"setting": "stripe_price_professional_1_profession_3_months"},
            "yearly": {"setting": "stripe_price_professional_1_profession_12_months"},
        },
        "2": {
            "monthly": {"setting": "stripe_price_professional_2_professions_1_month"},
            "3_months": {"setting": "stripe_price_professional_2_professions_3_months"},
            "yearly": {"setting": "stripe_price_professional_2_professions_12_months"},
        },
        "3": {
            "monthly": {"setting": "stripe_price_professional_3_professions_1_month"},
            "3_months": {"setting": "stripe_price_professional_3_professions_3_months"},
            "yearly": {"setting": "stripe_price_professional_3_professions_12_months"},
        },
    },
    "combined": {
        "1": {
            "monthly": {"setting": "stripe_price_bundle_1_profession_1_month"},
            "3_months": {"setting": "stripe_price_bundle_1_profession_3_months"},
            "yearly": {"setting": "stripe_price_bundle_1_profession_12_months"},
        },
        "2": {
            "monthly": {"setting": "stripe_price_bundle_2_professions_1_month"},
            "3_months": {"setting": "stripe_price_bundle_2_professions_3_months"},
            "yearly": {"setting": "stripe_price_bundle_2_professions_12_months"},
        },
        "3": {
            "monthly": {"setting": "stripe_price_bundle_3_professions_1_month"},
            "3_months": {"setting": "stripe_price_bundle_3_professions_3_months"},
            "yearly": {"setting": "stripe_price_bundle_3_professions_12_months"},
        },
    },
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
        "checkout_label": "EUR 19.90 / month",
        "billing_period": "monthly",
        "included_profession_slots": 0,
    },
    {
        "id": "yki_3_months",
        "category": "yki",
        "pathway": "yki",
        "title": "YKI Pathway",
        "description": "YKI exam practice for citizenship, permanent residence, study, and life in Finland.",
        "checkout_label": "EUR 49.90 / 3 months",
        "billing_period": "3_months",
        "included_profession_slots": 0,
    },
    {
        "id": "yki_yearly",
        "category": "yki",
        "pathway": "yki",
        "title": "YKI Pathway",
        "description": "YKI exam practice for citizenship, permanent residence, study, and life in Finland.",
        "checkout_label": "EUR 179 / year",
        "billing_period": "yearly",
        "included_profession_slots": 0,
    },
    {
        "id": "professional_monthly",
        "category": "professional",
        "pathway": "professional",
        "title": "Professional Pathway",
        "description": "Role-specific Finnish for healthcare and other professional pathways. Choose one or more professions at checkout.",
        "checkout_label": "EUR 24.90 / month",
        "billing_period": "monthly",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": 0,
    },
    {
        "id": "professional_3_months",
        "category": "professional",
        "pathway": "professional",
        "title": "Professional Pathway",
        "description": "Role-specific Finnish for healthcare and other professional pathways. Choose one or more professions at checkout.",
        "checkout_label": "EUR 64.90 / 3 months",
        "billing_period": "3_months",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": 0,
    },
    {
        "id": "professional_yearly",
        "category": "professional",
        "pathway": "professional",
        "title": "Professional Pathway",
        "description": "Role-specific Finnish for healthcare and other professional pathways. Choose one or more professions at checkout.",
        "checkout_label": "EUR 249 / year",
        "billing_period": "yearly",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": 0,
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
        "extra_profession_discount_percent": 0,
    },
    {
        "id": "combined_3_months",
        "category": "bundle",
        "pathway": "combined",
        "title": "Combined Pathway",
        "description": "YKI preparation plus one professional pathway. Add more professions when needed.",
        "checkout_label": "EUR 79.90 / 3 months",
        "billing_period": "3_months",
        "included_profession_slots": 1,
        "extra_profession_discount_percent": 0,
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
        "extra_profession_discount_percent": 0,
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
    if len(professions) > len(ALL_PROFESSIONS):
        raise AppError(
            400,
            "VALIDATION_ERROR",
            "Choose no more than 3 professions.",
            False,
            {"classification": "non_retryable", "profession_count": len(professions)},
        )

    plan_id = _plan_id_for(pathway, billing_period)
    profession_count = len(professions)
    extra_profession_count = max(0, profession_count - 1) if pathway in {"professional", "combined"} else 0
    line_items: list[dict[str, Any]] = [
        {
            "plan": plan_id,
            "quantity": 1,
            "profession_count": profession_count,
            "pricing_model": "fixed_stripe_price_tier",
        }
    ]

    return {
        "plan_id": plan_id,
        "pathway": pathway,
        "billing_period": billing_period,
        "professions": professions,
        "profession_count": profession_count,
        "extra_profession_count": extra_profession_count,
        "extra_profession_discount_percent": 0,
        "pricing_model": "fixed_stripe_price_tier",
        "line_items": line_items,
    }


def _stripe_settings_value(setting_name: str) -> str | None:
    value = getattr(SETTINGS, setting_name, None)
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _stripe_price_id_for_details(details: dict[str, Any]) -> str | None:
    pathway = str(details.get("pathway") or "").strip().lower()
    billing_period = str(details.get("billing_period") or "").strip().lower()
    profession_count = int(details.get("profession_count") or 0)
    if pathway == "yki":
        config = STRIPE_PRICE_CONFIG["yki"].get(billing_period)
        return _stripe_settings_value(config["setting"]) if config else None
    if pathway in {"professional", "combined"}:
        slot_key = str(min(max(profession_count, 1), 3))
        config = STRIPE_PRICE_CONFIG[pathway].get(slot_key, {}).get(billing_period)
        return _stripe_settings_value(config["setting"]) if config else None
    return None


def _stripe_enabled() -> bool:
    return bool(stripe and SETTINGS.stripe_secret_key)


def _stripe_metadata(details: dict[str, Any], price_id: str) -> dict[str, str]:
    metadata = {
        "user_id": str(details.get("user_id") or "").strip(),
        "plan": str(details.get("plan_id") or "").strip(),
        "pathway": str(details.get("pathway") or "").strip(),
        "billing_period": str(details.get("billing_period") or "").strip(),
        "professions": ",".join(str(item) for item in details.get("professions", []) if str(item).strip()),
        "selected_professions": ",".join(str(item) for item in details.get("professions", []) if str(item).strip()),
        "profession_count": str(int(details.get("profession_count") or 0)),
        "price_id": price_id,
    }
    return metadata


def _front_end_base_url() -> str:
    return (SETTINGS.frontend_base_url or SETTINGS.public_base_url or "https://learn.floently.com").rstrip("/")


def _parse_subscription_metadata(metadata: Any) -> dict[str, Any]:
    raw = metadata if isinstance(metadata, dict) else {}
    professions = _normalize_professions(raw.get("professions") or raw.get("selected_professions"))
    user_id = str(raw.get("user_id") or "").strip()
    plan_id = str(raw.get("plan") or raw.get("plan_id") or "").strip()
    pathway = _normalize_pathway(raw.get("pathway")) or (_parse_plan_id(plan_id)[0] if plan_id else None)
    billing_period = _normalize_billing_period(raw.get("billing_period")) or (_parse_plan_id(plan_id)[1] if plan_id else None)
    profession_count = int(raw.get("profession_count") or len(professions) or 0)
    price_id = str(raw.get("price_id") or "").strip() or None
    return {
        "user_id": user_id or None,
        "plan_id": plan_id or None,
        "pathway": pathway,
        "billing_period": billing_period,
        "professions": professions,
        "profession_count": profession_count,
        "price_id": price_id,
    }


def _find_user_for_subscription_event(*, user_id: str | None = None, subscription_id: str | None = None, customer_id: str | None = None) -> dict[str, Any] | None:
    if user_id:
        user = auth_repository.AUTH_USERS.get_user_by_id(user_id)
        if user:
            return user
    if subscription_id:
        for user in auth_repository.AUTH_USERS.list_users():
            if str(user.get("stripe_subscription_id") or "").strip() == str(subscription_id).strip():
                return user
    if customer_id:
        for user in auth_repository.AUTH_USERS.list_users():
            if str(user.get("stripe_customer_id") or "").strip() == str(customer_id).strip():
                return user
    return None


def _normalize_unix_timestamp(value: Any) -> str | None:
    try:
        if value in (None, ""):
            return None
        return datetime.fromtimestamp(int(value), tz=UTC).replace(microsecond=0).isoformat()
    except Exception:
        return None


def _subscription_tier_from_details(details: dict[str, Any]) -> str:
    plan_id = str(details.get("plan_id") or "").strip()
    if plan_id == "free":
        return "free"
    if plan_id:
        return plan_id
    pathway = str(details.get("pathway") or "").strip()
    billing_period = str(details.get("billing_period") or "").strip()
    if pathway in {"yki", "professional", "combined"} and billing_period in BILLING_PERIOD_LABELS:
        return _plan_id_for(pathway, billing_period)
    return "free"


def _update_user_subscription_from_details(
    *,
    user: dict[str, Any],
    details: dict[str, Any],
    stripe_customer_id: str | None = None,
    stripe_subscription_id: str | None = None,
    stripe_price_id: str | None = None,
    stripe_checkout_session_id: str | None = None,
    subscription_expires_at: str | None = None,
    access_choice: str | None = "paid",
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "user_id": user["user_id"],
        "access_choice": access_choice,
        "access_choice_at": utc_now().replace(microsecond=0).isoformat(),
        "subscription_tier": _subscription_tier_from_details(details),
        "subscription_pathway": details.get("pathway"),
        "subscription_billing_period": details.get("billing_period"),
        "profession_slot_count": int(details.get("profession_count") or 0),
        "selected_professions": list(details.get("professions") or []),
        "stripe_customer_id": stripe_customer_id or user.get("stripe_customer_id"),
        "stripe_subscription_id": stripe_subscription_id or user.get("stripe_subscription_id"),
        "stripe_price_id": stripe_price_id or user.get("stripe_price_id"),
        "stripe_checkout_session_id": stripe_checkout_session_id or user.get("stripe_checkout_session_id"),
    }
    if subscription_expires_at is not None:
        payload["subscription_expires_at"] = subscription_expires_at
    updated, _ = auth_repository.AUTH_USERS.update_user(user["user_id"], **payload)
    STORE.write_snapshot()
    return updated


def _stripe_subscription_from_session(session: Any) -> dict[str, Any] | None:
    if stripe is None or not getattr(session, "subscription", None):
        return None
    subscription_id = str(session.subscription).strip()
    if not subscription_id:
        return None
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
    except Exception:
        return None
    if isinstance(subscription, dict):
        return subscription
    try:
        return subscription.to_dict()
    except Exception:
        return {"id": subscription_id}


def apply_stripe_checkout_session_completed(session: Any) -> dict[str, Any]:
    metadata = _parse_subscription_metadata(getattr(session, "metadata", None) if not isinstance(session, dict) else session.get("metadata"))
    user = _find_user_for_subscription_event(
        user_id=metadata.get("user_id"),
        subscription_id=str(getattr(session, "subscription", None) or (session.get("subscription") if isinstance(session, dict) else "")).strip() or None,
        customer_id=str(getattr(session, "customer", None) or (session.get("customer") if isinstance(session, dict) else "")).strip() or None,
    )
    if user is None:
        raise AppError(404, "USER_NOT_FOUND", "Unable to match Stripe checkout session to a user.", False, {"classification": "non_retryable"})
    subscription = _stripe_subscription_from_session(session)
    expires_at = None
    if isinstance(subscription, dict):
        expires_at = _normalize_unix_timestamp(subscription.get("current_period_end"))
    return _update_user_subscription_from_details(
        user=user,
        details=metadata,
        stripe_customer_id=str(getattr(session, "customer", None) or (session.get("customer") if isinstance(session, dict) else "")).strip() or None,
        stripe_subscription_id=str(getattr(session, "subscription", None) or (session.get("subscription") if isinstance(session, dict) else "")).strip() or None,
        stripe_price_id=metadata.get("price_id"),
        stripe_checkout_session_id=str(getattr(session, "id", None) or (session.get("id") if isinstance(session, dict) else "")).strip() or None,
        subscription_expires_at=expires_at,
    )


def apply_stripe_subscription_event(subscription: Any, *, event_type: str) -> dict[str, Any]:
    subscription_id = str(getattr(subscription, "id", None) or (subscription.get("id") if isinstance(subscription, dict) else "")).strip() or None
    metadata = _parse_subscription_metadata(getattr(subscription, "metadata", None) if not isinstance(subscription, dict) else subscription.get("metadata"))
    customer_id = str(getattr(subscription, "customer", None) or (subscription.get("customer") if isinstance(subscription, dict) else "")).strip() or None
    user = _find_user_for_subscription_event(
        user_id=metadata.get("user_id"),
        subscription_id=subscription_id,
        customer_id=customer_id,
    )
    if user is None:
        raise AppError(404, "USER_NOT_FOUND", "Unable to match Stripe subscription to a user.", False, {"classification": "non_retryable"})

    status = str(getattr(subscription, "status", None) or (subscription.get("status") if isinstance(subscription, dict) else "")).strip().lower()
    current_period_end = _normalize_unix_timestamp(getattr(subscription, "current_period_end", None) if not isinstance(subscription, dict) else subscription.get("current_period_end"))
    if event_type == "customer.subscription.deleted" or status in {"canceled", "incomplete_expired"}:
        cleared_details = dict(metadata)
        cleared_details["plan_id"] = "free"
        cleared_details["pathway"] = None
        cleared_details["billing_period"] = None
        cleared_details["professions"] = []
        cleared_details["profession_count"] = 0
        return _update_user_subscription_from_details(
            user=user,
            details=cleared_details,
            stripe_customer_id=customer_id or user.get("stripe_customer_id"),
            stripe_subscription_id=subscription_id or user.get("stripe_subscription_id"),
            stripe_price_id=metadata.get("price_id") or user.get("stripe_price_id"),
            subscription_expires_at=current_period_end or utc_now().replace(microsecond=0).isoformat(),
            access_choice="paid",
        )

    return _update_user_subscription_from_details(
        user=user,
        details=metadata,
        stripe_customer_id=customer_id or user.get("stripe_customer_id"),
        stripe_subscription_id=subscription_id or user.get("stripe_subscription_id"),
        stripe_price_id=metadata.get("price_id") or user.get("stripe_price_id"),
        subscription_expires_at=current_period_end,
    )


def handle_stripe_event(event: Any) -> dict[str, Any]:
    event_type = str(getattr(event, "type", None) or (event.get("type") if isinstance(event, dict) else "")).strip()
    payload = getattr(event, "data", None) if not isinstance(event, dict) else event.get("data")
    obj = getattr(payload, "object", None) if payload is not None and not isinstance(payload, dict) else (payload.get("object") if isinstance(payload, dict) else None)
    if event_type == "checkout.session.completed":
        return {"event_type": event_type, "user": apply_stripe_checkout_session_completed(obj)}
    if event_type in {"customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"}:
        return {"event_type": event_type, "user": apply_stripe_subscription_event(obj, event_type=event_type)}
    if event_type == "invoice.paid":
        subscription_id = str(getattr(obj, "subscription", None) or (obj.get("subscription") if isinstance(obj, dict) else "")).strip() or None
        subscription = None
        if stripe is not None and subscription_id:
            try:
                subscription = stripe.Subscription.retrieve(subscription_id)
            except Exception:
                subscription = None
        if subscription is not None:
            return {"event_type": event_type, "user": apply_stripe_subscription_event(subscription, event_type="customer.subscription.updated")}
        return {"event_type": event_type, "handled": False}
    return {"event_type": event_type, "handled": False}


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


def _has_paid_access(user: dict[str, Any]) -> bool:
    tier = str(user.get("subscription_tier") or "free").strip().lower()
    return tier != "free" and _is_subscription_active(user)


def _has_trial_access(user: dict[str, Any]) -> bool:
    # Paid access must always win over trial access.
    # Otherwise a user who started a trial and then paid can still be treated as trial.
    if _has_paid_access(user):
        return False
    return str(user.get("access_choice") or "").strip().lower() == "trial" and _trial_active(user)


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
            "is_trial": False,
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
    # Never downgrade an already-paid/internal user into trial mode.
    if _is_internal_all_access_user(user) or _has_paid_access(user):
        return subscription_status(user=user)

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
        "selected_professions": ",".join(details["professions"]),
        "profession_count": str(details["profession_count"]),
    }
    details["price_id"] = _stripe_price_id_for_details(details)
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
    if _stripe_enabled():
        selected_price_id = details.get("price_id")
        if not selected_price_id:
            raise AppError(
                503,
                "BILLING_NOT_CONFIGURED",
                "Stripe price configuration is incomplete.",
                False,
                {"classification": "non_retryable", "plan_id": details["plan_id"], "pathway": details["pathway"], "billing_period": details["billing_period"]},
            )
        if stripe is None:
            raise AppError(
                503,
                "BILLING_NOT_CONFIGURED",
                "Stripe is not available in this deployment.",
                False,
                {"classification": "non_retryable"},
            )
        stripe.api_key = SETTINGS.stripe_secret_key
        front_end_base_url = _front_end_base_url()
        metadata = _stripe_metadata(details, selected_price_id)
        try:
            checkout_params: dict[str, Any] = {
                "mode": "subscription",
                "line_items": [{"price": selected_price_id, "quantity": 1}],
                "success_url": f"{front_end_base_url}/?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
                "cancel_url": f"{front_end_base_url}/?checkout=cancelled",
                "client_reference_id": user_id,
                "metadata": metadata,
                "subscription_data": {"metadata": metadata},
            }
            customer_email = (auth_repository.AUTH_USERS.get_user_by_id(user_id) or {}).get("email") or None
            if customer_email:
                checkout_params["customer_email"] = customer_email
            session = stripe.checkout.Session.create(**checkout_params)
        except Exception as exc:
            raise AppError(
                503,
                "STRIPE_CHECKOUT_FAILED",
                "Failed to create Stripe checkout session.",
                True,
                {"classification": "retryable", "plan_id": details["plan_id"]},
            ) from exc
        if isinstance(session, dict):
            checkout_url = str(session.get("url") or "").strip() or billing_checkout_url(user_id=user_id, payload=payload)
            checkout_session_id = str(session.get("id") or "").strip() or None
        else:
            checkout_url = str(getattr(session, "url", "") or "").strip() or billing_checkout_url(user_id=user_id, payload=payload)
            checkout_session_id = str(getattr(session, "id", "") or "").strip() or None
        return {
            "checkout_url": checkout_url,
            "checkout_session_id": checkout_session_id,
            "price_id": selected_price_id,
            "plan": details["plan_id"],
            "pathway": details["pathway"],
            "billing_period": details["billing_period"],
            "professions": details["professions"],
            "profession_count": details["profession_count"],
            "extra_profession_count": details.get("extra_profession_count", 0),
            "extra_profession_discount_percent": details.get("extra_profession_discount_percent", 0),
            "line_items": [{"price": selected_price_id, "quantity": 1}],
            "metadata": metadata,
            "mode": "stripe",
        }
    return {
        "checkout_url": billing_checkout_url(user_id=user_id, payload=payload),
        "checkout_session_id": None,
        "price_id": details.get("price_id"),
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
