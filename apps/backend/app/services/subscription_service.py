from __future__ import annotations

from datetime import datetime, timedelta, timezone

UTC = timezone.utc
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
from ..db.models import (
    AccessGrant,
    AnalyticsDailyOrganizationSummary,
    AnalyticsDailySubscriptionSummary,
    AnalyticsDailyUserSummary,
    SubscriptionEvent,
    TrackingEvent,
)

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
    {
        "id": "school_programme",
        "category": "organisation",
        "pathway": "school_programme",
        "title": "School & Training Provider Access",
        "description": "Support students, language learners, and programme cohorts with structured Finnish, YKI preparation, and workplace communication practice.",
        "checkout_label": "Contact sales",
        "billing_period": "monthly",
    },
    {
        "id": "healthcare_organisation_programme",
        "category": "organisation",
        "pathway": "healthcare_organisation_programme",
        "title": "Healthcare Organisation Access",
        "description": "Support internationally trained healthcare professionals with role-based Finnish and communication practice.",
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
        # Backward compatibility for older web/mobile bundles.
        # Old clients call /subscription/trial and then checkout with plan="trial_3day".
        # Convert that into the real Stripe YKI monthly checkout with a 3-day trial.
        payload = {
            **payload,
            "plan": "yki_monthly",
            "pathway": "yki",
            "billing_period": "monthly",
            "professions": [],
            "trial_days": payload.get("trial_days") or payload.get("trialDays") or 3,
        }
        raw_plan = "yki_monthly"


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
    raw_trial_days = payload.get("trial_days") if "trial_days" in payload else payload.get("trialDays")
    trial_days = 3 if raw_trial_days is None and pathway in {"yki", "professional", "combined"} else 0
    if raw_trial_days is not None:
        try:
            trial_days = int(raw_trial_days)
        except (TypeError, ValueError):
            trial_days = 0
    trial_days = max(0, min(trial_days, 30))

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
        "trial_days": trial_days,
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
        "trial_days": str(int(details.get("trial_days") or 0)),
        "price_id": price_id,
    }
    return metadata


def _front_end_base_url() -> str:
    return (SETTINGS.frontend_base_url or SETTINGS.public_base_url or "https://learn.floently.com").rstrip("/")



ACCESS_SOURCES = {
    "b2c_direct",
    "b2b2c_business",
    "b2m2c_municipality",
    "school",
    "training_provider",
    "healthcare_provider",
    "manual_grant",
    "pilot_grant",
    "internal_admin",
    "preview",
}

ORGANIZATION_TYPES = {
    "business",
    "municipality",
    "school",
    "training_provider",
    "healthcare_provider",
    "other",
}

SUBSCRIPTION_PROVIDERS = {"stripe", "google_play", "apple", "contract", "manual", "internal"}


def _normalize_access_source(value: Any, default: str = "b2c_direct") -> str:
    normalized = str(value or "").strip().lower().replace("-", "_")
    aliases = {
        "individual": "b2c_direct",
        "direct": "b2c_direct",
        "employer": "b2b2c_business",
        "employer_programme": "b2b2c_business",
        "organization": "b2b2c_business",
        "organisation": "b2b2c_business",
        "business": "b2b2c_business",
        "city": "b2m2c_municipality",
        "city_programme": "b2m2c_municipality",
        "municipality": "b2m2c_municipality",
        "municipality_programme": "b2m2c_municipality",
        "school_programme": "school",
        "education": "school",
        "training": "training_provider",
        "training_programme": "training_provider",
        "pilot": "pilot_grant",
        "admin": "internal_admin",
        "internal": "internal_admin",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized if normalized in ACCESS_SOURCES else default


def _normalize_provider(value: Any, default: str = "stripe") -> str:
    normalized = str(value or "").strip().lower().replace("-", "_")
    return normalized if normalized in SUBSCRIPTION_PROVIDERS else default


def _fresh_user_record(user: dict[str, Any]) -> dict[str, Any]:
    user_id = str(user.get("user_id") or "").strip()
    if not user_id:
        return user
    try:
        fresh = auth_repository.AUTH_USERS.get_user_by_id(user_id)
    except Exception:
        return user
    return fresh or user


def _safe_metadata(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        result: dict[str, Any] = {}
        for key, item in value.items():
            key_text = str(key)
            if isinstance(item, (str, int, float, bool)) or item is None:
                result[key_text] = item
            elif isinstance(item, (list, tuple)):
                result[key_text] = [str(x) if not isinstance(x, (str, int, float, bool)) else x for x in item[:50]]
            elif isinstance(item, dict):
                result[key_text] = _safe_metadata(item)
            else:
                result[key_text] = str(item)
        return result
    return {}


def _daily_key(moment: datetime | None = None) -> str:
    current = moment or utc_now()
    if current.tzinfo is None:
        current = current.replace(tzinfo=UTC)
    return current.astimezone(UTC).strftime("%Y-%m-%d")


def _summary_for_date(session: Any, model: Any, date: str, **filters: Any) -> Any:
    query = session.query(model).filter(model.date == date)
    for field, value in filters.items():
        query = query.filter(getattr(model, field) == value)
    row = query.first()
    if row is None:
        row = model(date=date, **filters)
        session.add(row)
    return row


def _log_subscription_event(
    event_type: str,
    *,
    user: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
    provider_event_id: str | None = None,
    status_before: str | None = None,
    status_after: str | None = None,
) -> None:
    try:
        auth_repository.AUTH_USERS.ensure_schema()
        current = _fresh_user_record(user or {}) if user else {}
        now = utc_now().replace(microsecond=0)
        plan_key = str(current.get("subscription_tier") or current.get("plan_key") or "").strip() or None
        access_source = _normalize_access_source(current.get("access_source") or current.get("access_type"))
        provider = _normalize_provider(current.get("subscription_provider") or "stripe")
        meta = _safe_metadata(metadata or {})
        with auth_repository.AUTH_USERS.session() as session:
            session.add(
                SubscriptionEvent(
                    user_id=current.get("user_id"),
                    email=current.get("email"),
                    organization_id=current.get("organization_id"),
                    cohort_id=current.get("cohort_id"),
                    access_source=access_source,
                    provider=provider,
                    provider_event_id=provider_event_id,
                    provider_customer_id=current.get("stripe_customer_id"),
                    provider_subscription_id=current.get("stripe_subscription_id"),
                    plan_key=plan_key,
                    status_before=status_before,
                    status_after=status_after or current.get("subscription_status"),
                    event_type=event_type,
                    metadata_json=meta,
                    created_at=now,
                )
            )
            session.add(
                TrackingEvent(
                    user_id=current.get("user_id"),
                    email=current.get("email"),
                    organization_id=current.get("organization_id"),
                    cohort_id=current.get("cohort_id"),
                    access_source=access_source,
                    event_type=event_type,
                    feature="subscription",
                    screen=None,
                    plan_key=plan_key,
                    profession=None,
                    session_id=str(meta.get("checkout_session_id") or meta.get("session_id") or "") or None,
                    metadata_json=meta,
                    created_at=now,
                )
            )
            daily = _summary_for_date(session, AnalyticsDailySubscriptionSummary, _daily_key(now))
            if event_type in {"trial_started", "checkout_trial_started"}:
                daily.trials_started = int(daily.trials_started or 0) + 1
            if event_type in {"trial_cancel_requested", "cancel_at_period_end_enabled"}:
                daily.trials_cancelled = int(daily.trials_cancelled or 0) + 1
            if event_type in {"invoice_paid", "payment_succeeded", "trial_converted_to_paid"}:
                daily.payment_succeeded_count = int(daily.payment_succeeded_count or 0) + 1
            if event_type in {"invoice_payment_failed", "payment_failed"}:
                daily.payment_failed_count = int(daily.payment_failed_count or 0) + 1
            if event_type in {"subscription_active", "customer_subscription_created", "customer_subscription_updated"}:
                daily.active_subscriptions = int(daily.active_subscriptions or 0) + 1
            if event_type in {"customer_subscription_deleted", "subscription_expired", "subscription_cancelled"}:
                daily.subscription_cancelled_count = int(daily.subscription_cancelled_count or 0) + 1
            daily.updated_at = now
            session.commit()
    except Exception:
        # Tracking must never break billing/access.
        return


def track_usage_event(
    *,
    user: dict[str, Any],
    event_type: str,
    feature: str | None = None,
    screen: str | None = None,
    profession: str | None = None,
    session_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    current = _fresh_user_record(user)
    now = utc_now().replace(microsecond=0)
    access_source = _normalize_access_source(current.get("access_source") or current.get("access_type"))
    plan_key = str(current.get("subscription_tier") or "free")
    meta = _safe_metadata(metadata or {})
    auth_repository.AUTH_USERS.ensure_schema()
    with auth_repository.AUTH_USERS.session() as session:
        session.add(
            TrackingEvent(
                user_id=current.get("user_id"),
                email=current.get("email"),
                organization_id=current.get("organization_id"),
                cohort_id=current.get("cohort_id"),
                access_source=access_source,
                event_type=str(event_type or "event").strip() or "event",
                feature=str(feature or "").strip() or None,
                screen=str(screen or "").strip() or None,
                plan_key=plan_key,
                profession=str(profession or "").strip() or None,
                session_id=str(session_id or "").strip() or None,
                metadata_json=meta,
                created_at=now,
            )
        )
        daily = _summary_for_date(
            session,
            AnalyticsDailyUserSummary,
            _daily_key(now),
            user_id=str(current.get("user_id")),
        )
        daily.email = current.get("email")
        daily.organization_id = current.get("organization_id")
        daily.cohort_id = current.get("cohort_id")
        daily.access_source = access_source
        daily.plan_key = plan_key
        daily.sessions_count = int(daily.sessions_count or 0) + (1 if event_type in {"session_started", "login", "app_opened"} else 0)
        if event_type == "roleplay_started":
            daily.roleplay_started_count = int(daily.roleplay_started_count or 0) + 1
        if event_type == "roleplay_completed":
            daily.roleplay_completed_count = int(daily.roleplay_completed_count or 0) + 1
        if event_type in {"yki_started", "yki_exam_started", "yki_practice_started"}:
            daily.yki_started_count = int(daily.yki_started_count or 0) + 1
        if event_type == "card_session_started":
            daily.card_session_started_count = int(daily.card_session_started_count or 0) + 1
        if event_type == "card_session_completed":
            daily.card_session_completed_count = int(daily.card_session_completed_count or 0) + 1
        daily.last_seen_at = now
        daily.updated_at = now
        session.commit()
    return {"tracked": True}


def _active_access_grant_for_user(user: dict[str, Any]) -> dict[str, Any] | None:
    user_id = str(user.get("user_id") or "").strip()
    email = str(user.get("email") or "").strip().lower()
    if not user_id and not email:
        return None
    now = utc_now()
    try:
        auth_repository.AUTH_USERS.ensure_schema()
        with auth_repository.AUTH_USERS.session() as session:
            rows = session.query(AccessGrant).filter(AccessGrant.status == "active").all()
            for row in rows:
                if row.user_id and user_id and str(row.user_id) != user_id:
                    continue
                if not row.user_id and row.email and email and str(row.email).strip().lower() != email:
                    continue
                if not row.user_id and not row.email:
                    continue
                starts_at = row.starts_at
                ends_at = row.ends_at
                if starts_at and starts_at > now.replace(tzinfo=None):
                    continue
                if ends_at and ends_at <= now.replace(tzinfo=None):
                    continue
                return {
                    "id": row.id,
                    "user_id": row.user_id,
                    "email": row.email,
                    "organization_id": row.organization_id,
                    "cohort_id": row.cohort_id,
                    "source": row.source,
                    "grant_type": row.grant_type,
                    "plan_key": row.plan_key,
                    "learn_access": bool(row.learn_access),
                    "yki_access": bool(row.yki_access),
                    "professional_access": bool(row.professional_access),
                    "professions": list(row.professions or []),
                    "starts_at": row.starts_at.isoformat() if row.starts_at else None,
                    "ends_at": row.ends_at.isoformat() if row.ends_at else None,
                    "status": row.status,
                }
    except Exception:
        return None
    return None


def _access_ends_at_for_user(user: dict[str, Any]) -> str | None:
    status = _normalized_subscription_status(user)
    if _is_payment_blocked_status(status):
        return _safe_access_ends_at_for_user(user)
    return (
        user.get("access_ends_at")
        or user.get("current_period_end")
        or user.get("subscription_expires_at")
        or user.get("trial_ends_at")
    )


def _stripe_to_dict(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if hasattr(value, "_to_dict_recursive"):
        try:
            return value._to_dict_recursive()
        except Exception:
            pass
    if hasattr(value, "to_dict_recursive"):
        try:
            return value.to_dict_recursive()
        except Exception:
            pass
    if hasattr(value, "to_dict"):
        try:
            return value.to_dict()
        except Exception:
            pass
    try:
        return dict(value)
    except Exception:
        return {}


def _parse_subscription_metadata(metadata: Any) -> dict[str, Any]:
    raw = _stripe_to_dict(metadata)
    professions = _normalize_professions(raw.get("professions") or raw.get("selected_professions"))
    user_id = str(raw.get("user_id") or "").strip()
    plan_id = str(raw.get("plan") or raw.get("plan_id") or "").strip()
    pathway = _normalize_pathway(raw.get("pathway")) or (_parse_plan_id(plan_id)[0] if plan_id else None)
    billing_period = _normalize_billing_period(raw.get("billing_period")) or (_parse_plan_id(plan_id)[1] if plan_id else None)
    profession_count = int(raw.get("profession_count") or len(professions) or 0)
    try:
        trial_days = int(raw.get("trial_days") or raw.get("trialDays") or 0)
    except (TypeError, ValueError):
        trial_days = 0
    trial_days = max(0, min(trial_days, 30))
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
    trial_ends_at: str | None = None,
    current_period_start: str | None = None,
    current_period_end: str | None = None,
    trial_started_at: str | None = None,
    cancel_at_period_end: bool | None = None,
    canceled_at: str | None = None,
    subscription_status: str | None = None,
    subscription_provider: str | None = "stripe",
    access_source: str | None = "b2c_direct",
    access_choice: str | None = "paid",
) -> dict[str, Any]:
    tier = _subscription_tier_from_details(details)
    now_iso = utc_now().replace(microsecond=0).isoformat()
    status = subscription_status or ("trialing" if access_choice == "trial" else ("active" if tier != "free" else "free"))
    if str(status or "").strip().lower() == "trialing":
        access_ends_at = trial_ends_at or subscription_expires_at or current_period_end
    elif _is_payment_blocked_status(status):
        access_ends_at = None
    else:
        access_ends_at = subscription_expires_at or current_period_end or trial_ends_at
    payload: dict[str, Any] = {
        "access_choice": access_choice,
        "access_choice_at": now_iso,
        "subscription_tier": tier,
        "subscription_pathway": details.get("pathway"),
        "subscription_billing_period": details.get("billing_period"),
        "profession_slot_count": int(details.get("profession_count") or 0),
        "selected_professions": list(details.get("professions") or []),
        "stripe_customer_id": stripe_customer_id or user.get("stripe_customer_id"),
        "stripe_subscription_id": stripe_subscription_id or user.get("stripe_subscription_id"),
        "stripe_price_id": stripe_price_id or user.get("stripe_price_id"),
        "stripe_checkout_session_id": stripe_checkout_session_id or user.get("stripe_checkout_session_id"),
        "subscription_provider": _normalize_provider(subscription_provider),
        "subscription_status": status,
        "access_source": _normalize_access_source(access_source),
        "access_ends_at": access_ends_at,
    }
    if cancel_at_period_end is not None:
        payload["cancel_at_period_end"] = bool(cancel_at_period_end)
    if canceled_at is not None:
        payload["canceled_at"] = canceled_at
    if subscription_expires_at is not None:
        payload["subscription_expires_at"] = subscription_expires_at
    if trial_ends_at is not None:
        payload["trial_ends_at"] = trial_ends_at
    if current_period_start is not None:
        payload["current_period_start"] = current_period_start
    if current_period_end is not None:
        payload["current_period_end"] = current_period_end
    if trial_started_at is not None:
        payload["trial_started_at"] = trial_started_at
    elif trial_ends_at is not None and not user.get("trial_started_at"):
        payload["trial_started_at"] = now_iso
    updated, _ = auth_repository.AUTH_USERS.update_user(user["user_id"], **payload)
    STORE.write_snapshot()
    return updated


def _stripe_subscription_from_session(session: Any) -> dict[str, Any] | None:
    session_data = _stripe_to_dict(session)
    subscription_id = str(session_data.get("subscription") or "").strip()
    if not subscription_id:
        try:
            subscription_id = str(getattr(session, "subscription", "") or "").strip()
        except Exception:
            subscription_id = ""
    if stripe is None or not subscription_id:
        return None
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
    except Exception:
        return None
    data = _stripe_to_dict(subscription)
    if data:
        return data
    return {"id": subscription_id}

def apply_stripe_checkout_session_completed(session: Any) -> dict[str, Any]:
    session_data = _stripe_to_dict(session)
    metadata = _parse_subscription_metadata(session_data.get("metadata"))

    subscription_id = str(session_data.get("subscription") or "").strip() or None
    customer_id = str(session_data.get("customer") or "").strip() or None
    checkout_session_id = str(session_data.get("id") or "").strip() or None

    customer_details = session_data.get("customer_details") if isinstance(session_data.get("customer_details"), dict) else {}
    customer_email = (
        str(session_data.get("customer_email") or "").strip().lower()
        or str(customer_details.get("email") or "").strip().lower()
    )

    user = _find_user_for_subscription_event(
        user_id=metadata.get("user_id"),
        subscription_id=subscription_id,
        customer_id=customer_id,
    )

    if user is None and customer_email:
        user = auth_repository.AUTH_USERS.get_user_by_email(customer_email)

    if user is None:
        raise AppError(
            404,
            "USER_NOT_FOUND",
            "Unable to match Stripe checkout session to a user.",
            False,
            {
                "classification": "non_retryable",
                "session_id": checkout_session_id,
                "metadata_user_id": metadata.get("user_id"),
                "customer_email": customer_email,
                "customer_id": customer_id,
                "subscription_id": subscription_id,
            },
        )

    subscription = _stripe_subscription_from_session(session)
    subscription_data = _stripe_to_dict(subscription)

    expires_at = _normalize_unix_timestamp(subscription_data.get("current_period_end"))
    trial_ends_at = _normalize_unix_timestamp(subscription_data.get("trial_end"))
    trial_started_at = _normalize_unix_timestamp(subscription_data.get("trial_start"))
    current_period_start = _normalize_unix_timestamp(subscription_data.get("current_period_start"))
    current_period_end = _normalize_unix_timestamp(subscription_data.get("current_period_end"))
    stripe_status = str(subscription_data.get("status") or "").strip().lower()
    access_choice = "trial" if stripe_status == "trialing" or trial_ends_at else "paid"

    updated = _update_user_subscription_from_details(
        user=user,
        details=metadata,
        stripe_customer_id=customer_id,
        stripe_subscription_id=subscription_id,
        stripe_price_id=metadata.get("price_id"),
        stripe_checkout_session_id=checkout_session_id,
        subscription_expires_at=expires_at,
        trial_ends_at=trial_ends_at,
        current_period_start=current_period_start,
        current_period_end=current_period_end,
        trial_started_at=trial_started_at,
        cancel_at_period_end=bool(subscription_data.get("cancel_at_period_end")),
        subscription_status=stripe_status or None,
        access_source="b2c_direct",
        access_choice=access_choice,
    )
    _log_subscription_event(
        "checkout_completed",
        user=updated,
        metadata={"checkout_session_id": checkout_session_id, "subscription_id": subscription_id, "stripe_status": stripe_status, **metadata},
    )
    if access_choice == "trial":
        _log_subscription_event("checkout_trial_started", user=updated, metadata={"trial_ends_at": trial_ends_at, **metadata})
    return updated

def apply_stripe_subscription_event(subscription: Any, *, event_type: str) -> dict[str, Any]:
    subscription_data = _stripe_to_dict(subscription)

    subscription_id = str(subscription_data.get("id") or "").strip() or None
    metadata = _parse_subscription_metadata(subscription_data.get("metadata"))
    customer_id = str(subscription_data.get("customer") or "").strip() or None

    user = _find_user_for_subscription_event(
        user_id=metadata.get("user_id"),
        subscription_id=subscription_id,
        customer_id=customer_id,
    )

    if user is None:
        raise AppError(
            404,
            "USER_NOT_FOUND",
            "Unable to match Stripe subscription to a user.",
            False,
            {
                "classification": "non_retryable",
                "metadata_user_id": metadata.get("user_id"),
                "customer_id": customer_id,
                "subscription_id": subscription_id,
            },
        )

    status = str(subscription_data.get("status") or "").strip().lower()
    current_period_start = _normalize_unix_timestamp(subscription_data.get("current_period_start"))
    current_period_end = _normalize_unix_timestamp(subscription_data.get("current_period_end"))
    trial_started_at = _normalize_unix_timestamp(subscription_data.get("trial_start"))
    trial_ends_at = _normalize_unix_timestamp(subscription_data.get("trial_end"))
    cancel_at_period_end = bool(subscription_data.get("cancel_at_period_end"))

    if event_type == "customer.subscription.deleted" or status in {"canceled", "incomplete_expired"}:
        cleared_details = dict(metadata)
        cleared_details["plan_id"] = "free"
        cleared_details["pathway"] = None
        cleared_details["billing_period"] = None
        cleared_details["professions"] = []
        cleared_details["profession_count"] = 0
        updated = _update_user_subscription_from_details(
            user=user,
            details=cleared_details,
            stripe_customer_id=customer_id or user.get("stripe_customer_id"),
            stripe_subscription_id=subscription_id or user.get("stripe_subscription_id"),
            stripe_price_id=metadata.get("price_id") or user.get("stripe_price_id"),
            subscription_expires_at=current_period_end or utc_now().replace(microsecond=0).isoformat(),
            current_period_start=current_period_start,
            current_period_end=current_period_end,
            cancel_at_period_end=cancel_at_period_end,
            subscription_status=status or "canceled",
            access_choice="paid",
        )
        _log_subscription_event(event_type.replace(".", "_"), user=updated, metadata={"stripe_status": status, **metadata})
        return updated

    access_choice = "trial" if status == "trialing" or trial_ends_at else "paid"

    updated = _update_user_subscription_from_details(
        user=user,
        details=metadata,
        stripe_customer_id=customer_id or user.get("stripe_customer_id"),
        stripe_subscription_id=subscription_id or user.get("stripe_subscription_id"),
        stripe_price_id=metadata.get("price_id") or user.get("stripe_price_id"),
        subscription_expires_at=current_period_end,
        trial_ends_at=trial_ends_at,
        current_period_start=current_period_start,
        current_period_end=current_period_end,
        trial_started_at=trial_started_at,
        cancel_at_period_end=cancel_at_period_end,
        subscription_status=status or None,
        access_choice=access_choice,
    )
    _log_subscription_event(event_type.replace(".", "_"), user=updated, metadata={"stripe_status": status, "cancel_at_period_end": cancel_at_period_end, **metadata})
    if status == "active":
        _log_subscription_event("subscription_active", user=updated, metadata=metadata)
    if cancel_at_period_end:
        _log_subscription_event("cancel_at_period_end_enabled", user=updated, metadata=metadata)
    return updated

def handle_stripe_event(event: Any) -> dict[str, Any]:
    event_type = str(getattr(event, "type", None) or (event.get("type") if isinstance(event, dict) else "")).strip()
    event_id = str(getattr(event, "id", None) or (event.get("id") if isinstance(event, dict) else "") or "").strip() or None
    payload = getattr(event, "data", None) if not isinstance(event, dict) else event.get("data")
    obj = getattr(payload, "object", None) if payload is not None and not isinstance(payload, dict) else (payload.get("object") if isinstance(payload, dict) else None)
    if event_type == "checkout.session.completed":
        user = apply_stripe_checkout_session_completed(obj)
        _log_subscription_event("stripe_checkout_session_completed", user=user, provider_event_id=event_id, metadata={"stripe_event_type": event_type})
        return {"event_type": event_type, "user": user}
    if event_type in {"customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"}:
        user = apply_stripe_subscription_event(obj, event_type=event_type)
        _log_subscription_event(event_type.replace(".", "_"), user=user, provider_event_id=event_id, metadata={"stripe_event_type": event_type})
        return {"event_type": event_type, "user": user}
    if event_type in {"invoice.payment_failed", "invoice.payment_action_required"}:
        obj_data = _stripe_to_dict(obj)
        subscription_id = str(obj_data.get("subscription") or "").strip() or None
        user = _find_user_for_subscription_event(subscription_id=subscription_id)
        if user:
            updated = dict(user)
            updated["subscription_status"] = "past_due"
            updated["access_ends_at"] = _safe_access_ends_at_for_user(updated)
            saved, _ = auth_repository.AUTH_USERS.save_user(updated, overwrite_password=False)
            STORE.write_snapshot()
            _log_subscription_event(
                "invoice_payment_failed",
                user=saved,
                provider_event_id=event_id,
                metadata={"stripe_event_type": event_type, "subscription_id": subscription_id},
            )
        return {"event_type": event_type, "handled": bool(user)}
    if event_type == "invoice.paid":
        subscription_id = str(getattr(obj, "subscription", None) or (obj.get("subscription") if isinstance(obj, dict) else "")).strip() or None
        subscription = None
        if stripe is not None and subscription_id:
            try:
                subscription = stripe.Subscription.retrieve(subscription_id)
            except Exception:
                subscription = None
        if subscription is not None:
            user = apply_stripe_subscription_event(subscription, event_type="customer.subscription.updated")
            _log_subscription_event("invoice_paid", user=user, provider_event_id=event_id, metadata={"stripe_event_type": event_type, "subscription_id": subscription_id})
            return {"event_type": event_type, "user": user}
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


def _trial_used(user: dict[str, Any]) -> bool:
    """True once a user has ever started or received a trial.

    This is intentionally stricter than _trial_active. A used/expired/cancelled
    trial still counts as used and must not be granted again.
    """
    if not isinstance(user, dict):
        return False
    return bool(
        user.get("trial_started_at")
        or user.get("trial_ends_at")
        or str(user.get("access_choice") or "").strip().lower() == "trial"
        or str(user.get("subscription_status") or "").strip().lower() == "trialing"
    )


def _can_start_trial(user: dict[str, Any]) -> bool:
    return not _trial_used(user)


def _trial_reuse_payload(user: dict[str, Any]) -> dict[str, Any]:
    used = _trial_used(user)
    can_start = not used
    return {
        "trial_used": used,
        "trialUsed": used,
        "can_start_trial": can_start,
        "canStartTrial": can_start,
        "trial_already_used": used,
        "trialAlreadyUsed": used,
    }


def _raise_trial_already_used(user: dict[str, Any], *, context: str = "trial") -> None:
    raise AppError(
        409,
        "TRIAL_ALREADY_USED",
        "Trial already used. Choose a paid subscription to continue.",
        False,
        {
            "classification": "non_retryable",
            "context": context,
            **_trial_reuse_payload(user),
        },
    )


def _has_paid_access(user: dict[str, Any]) -> bool:
    status = _normalized_subscription_status(user)
    if _is_payment_blocked_status(status):
        return False
    tier = str(user.get("subscription_tier") or "free").strip().lower()
    return tier != "free" and _is_subscription_active(user)


PAYMENT_BLOCKED_STATUSES = {"past_due", "unpaid", "incomplete", "incomplete_expired", "canceled"}
PAYMENT_WARNING_STATUSES = {"past_due", "unpaid", "incomplete", "incomplete_expired"}

def _normalized_subscription_status(user: dict[str, Any]) -> str:
    return str(user.get("subscription_status") or "").strip().lower()


def _access_expired_for_user(user: dict[str, Any]) -> bool:
    ends_at = (
        parse_iso(user.get("current_period_end"))
        or parse_iso(user.get("subscription_ends_at"))
        or parse_iso(user.get("access_ends_at"))
        or parse_iso(user.get("trial_ends_at"))
    )
    return bool(ends_at and ends_at <= utc_now())


def _subscription_truth_flags(user: dict[str, Any]) -> dict[str, Any]:
    raw_status = str(user.get("subscription_status") or "").strip().lower()
    payment_blocked = _is_payment_blocked_status(raw_status)
    expired = _access_expired_for_user(user)

    paid_access = _has_paid_access(user)
    trial_access = _has_trial_access(user)
    active = bool((paid_access or trial_access) and not payment_blocked and not expired)

    return {
        "is_active": active,
        "isActive": active,
        "has_any_subscription": active,
        "hasAnySubscription": active,
        "access_expired": expired,
        "accessExpired": expired,
        "has_payment_issue": payment_blocked,
        "hasPaymentIssue": payment_blocked,
        "effective_tier": _effective_tier(user) if active else "free",
        "effectiveTier": _effective_tier(user) if active else "free",
    }


def _is_payment_blocked_status(status: str | None) -> bool:
    return str(status or "").strip().lower() in PAYMENT_BLOCKED_STATUSES

def _is_payment_warning_status(status: str | None) -> bool:
    return str(status or "").strip().lower() in PAYMENT_WARNING_STATUSES

def _safe_access_ends_at_for_user(user: dict[str, Any]) -> str | None:
    status = _normalized_subscription_status(user)
    trial_ends_at = user.get("trial_ends_at")
    if status == "trialing" and trial_ends_at:
        return trial_ends_at
    if _is_payment_blocked_status(status):
        return trial_ends_at if status == "past_due" and trial_ends_at else None
    if user.get("cancel_at_period_end") and trial_ends_at and status == "trialing":
        return trial_ends_at
    return user.get("subscription_expires_at") or user.get("current_period_end") or trial_ends_at

def _payment_issue_payload(user: dict[str, Any]) -> dict[str, Any]:
    status = _normalized_subscription_status(user)
    return {
        "has_payment_issue": _is_payment_warning_status(status),
        "payment_status": status or None,
        "payment_issue_message": "Payment failed. Please update your payment method to keep access." if _is_payment_warning_status(status) else None,
    }

def _has_trial_access(user: dict[str, Any]) -> bool:
    status = _normalized_subscription_status(user)
    if _is_payment_blocked_status(status):
        return False
    # Paid access must always win over trial access.
    # Otherwise a user who started a trial and then paid can still be treated as trial.
    if _has_paid_access(user):
        return False
    return str(user.get("access_choice") or "").strip().lower() == "trial" and _trial_active(user)


def _effective_tier(user: dict[str, Any]) -> str:
    status = _normalized_subscription_status(user)
    if _is_payment_blocked_status(status):
        return "free"
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


def _subscription_status_base(*, user: dict[str, Any]) -> dict[str, Any]:
    user = _fresh_user_record(user)

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
            "access_source": "internal_admin",
            "subscription_provider": "internal",
            "subscription_status": "active",
            "cancel_at_period_end": False,
            "canceled_at": None,
            "current_period_start": user.get("current_period_start"),
            "current_period_end": user.get("current_period_end"),
            "access_ends_at": None,
            "organization_id": user.get("organization_id"),
            "cohort_id": user.get("cohort_id"),
            "role": user.get("role") or "admin",
            "pathway": "internal",
            "plan_key": "internal_all_access",
        }

    grant = _active_access_grant_for_user(user)
    if grant:
        professions = _normalize_professions(grant.get("professions"))
        yki_access = bool(grant.get("yki_access"))
        professional_access = bool(grant.get("professional_access"))
        features = {
            "general_finnish": {"available": bool(grant.get("learn_access")), "limit": -1, "unit": "granted", "message": "Access granted by programme."},
            "workplace": {"available": professional_access, "limit": -1 if professional_access else 0, "unit": "granted" if professional_access else "not_available", "message": "Programme access." if professional_access else "Not included in this programme."},
            "yki": {"available": yki_access, "limit": -1 if yki_access else 0, "unit": "granted" if yki_access else "not_available", "message": "Programme access." if yki_access else "Not included in this programme."},
        }
        return {
            "user_id": user["user_id"],
            "tier": grant.get("plan_key") or "programme_access",
            "billing_tier": grant.get("plan_key") or "programme_access",
            "access_choice": "programme",
            "features": features,
            "expires_at": grant.get("ends_at"),
            "trial_ends_at": None,
            "is_trial": False,
            "is_active": True,
            "is_internal_all_access": False,
            "yki_access": yki_access,
            "professional_access": professional_access,
            "accessible_professions": professions,
            "selected_professions": professions,
            "profession_labels": _profession_labels(professions),
            "profession_slot_count": len(professions),
            "access_type": grant.get("source"),
            "access_source": grant.get("source"),
            "subscription_provider": "contract",
            "subscription_status": "active",
            "cancel_at_period_end": False,
            "canceled_at": None,
            "current_period_start": grant.get("starts_at"),
            "current_period_end": grant.get("ends_at"),
            "access_ends_at": grant.get("ends_at"),
            "organization_id": grant.get("organization_id"),
            "cohort_id": grant.get("cohort_id"),
            "role": user.get("role") or "user",
            "pathway": "combined" if yki_access and professional_access else ("professional" if professional_access else ("yki" if yki_access else "programme")),
            "plan_key": grant.get("plan_key") or "programme_access",
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
            "access_type": _normalize_access_source(user.get("access_source") or "b2c_direct"),
            "access_source": _normalize_access_source(user.get("access_source") or "b2c_direct"),
            "subscription_provider": _normalize_provider(user.get("subscription_provider") or "stripe"),
            "subscription_status": user.get("subscription_status") or "trialing",
            "cancel_at_period_end": bool(user.get("cancel_at_period_end")),
            "canceled_at": user.get("canceled_at"),
            "current_period_start": user.get("current_period_start"),
            "current_period_end": user.get("current_period_end"),
            "access_ends_at": _access_ends_at_for_user(user),
            "organization_id": user.get("organization_id"),
            "cohort_id": user.get("cohort_id"),
            "role": user.get("role") or "user",
            "pathway": "yki",
            "plan_key": "preview_yki",
            **_payment_issue_payload(user),
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
            "access_type": _normalize_access_source(user.get("access_source") or "b2c_direct"),
            "access_source": _normalize_access_source(user.get("access_source") or "b2c_direct"),
            "subscription_provider": _normalize_provider(user.get("subscription_provider") or "stripe"),
            "subscription_status": user.get("subscription_status") or "active",
            "cancel_at_period_end": bool(user.get("cancel_at_period_end")),
            "canceled_at": user.get("canceled_at"),
            "current_period_start": user.get("current_period_start"),
            "current_period_end": user.get("current_period_end"),
            "access_ends_at": _access_ends_at_for_user(user),
            "organization_id": user.get("organization_id"),
            "cohort_id": user.get("cohort_id"),
            "role": user.get("role") or "user",
            "pathway": "combined",
            "plan_key": "professional_premium",
            **_payment_issue_payload(user),
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
        "access_type": _normalize_access_source(user.get("access_source") or user.get("access_type") or "b2c_direct"),
        "access_source": _normalize_access_source(user.get("access_source") or user.get("access_type") or "b2c_direct"),
        "subscription_provider": _normalize_provider(user.get("subscription_provider") or "stripe"),
        "subscription_status": user.get("subscription_status") or ("active" if _has_paid_access(user) else "free"),
        "cancel_at_period_end": bool(user.get("cancel_at_period_end")),
        "canceled_at": user.get("canceled_at"),
        "current_period_start": user.get("current_period_start"),
        "current_period_end": user.get("current_period_end"),
        "access_ends_at": _access_ends_at_for_user(user),
        "organization_id": user.get("organization_id"),
        "cohort_id": user.get("cohort_id"),
        "role": user.get("role") or "user",
        "pathway": pathway,
        "plan_key": effective_tier,
        **_payment_issue_payload(user),
    }



def subscription_status(*, user: dict[str, Any]) -> dict[str, Any]:
    payload = _subscription_status_base(user=user)
    trial_payload = _trial_reuse_payload(user)
    truth_payload = _subscription_truth_flags(user)

    payload.update(trial_payload)
    payload.update(truth_payload)

    nested = payload.get("subscription")
    if isinstance(nested, dict):
        nested.update(trial_payload)
        nested.update(truth_payload)

    if truth_payload.get("access_expired") and not truth_payload.get("is_active"):
        payload["subscription_status"] = "expired"
        payload["subscriptionStatus"] = "expired"
        if isinstance(nested, dict):
            nested["subscription_status"] = "expired"
            nested["subscriptionStatus"] = "expired"

    return payload



def start_trial(*, user: dict[str, Any], trial_days: int = 3) -> dict[str, Any]:
    if _trial_used(user):
        _raise_trial_already_used(user, context="legacy_local_trial")

    # Never downgrade an already-paid/internal user into trial mode.
    if _is_internal_all_access_user(user) or _has_paid_access(user):
        return subscription_status(user=user)

    user_id = str(user["user_id"])
    updated = dict(user)
    now_iso = utc_now().replace(microsecond=0).isoformat()
    updated["access_choice"] = "trial"
    updated["access_choice_at"] = now_iso
    updated["trial_started_at"] = now_iso
    updated["trial_ends_at"] = (utc_now() + timedelta(days=max(1, trial_days))).replace(microsecond=0).isoformat()
    updated["subscription_status"] = "trialing"
    updated["subscription_provider"] = "manual"
    updated["access_source"] = "preview"
    updated["cancel_at_period_end"] = False
    updated["access_ends_at"] = updated["trial_ends_at"]
    saved, _ = auth_repository.AUTH_USERS.save_user(updated, overwrite_password=False)
    STORE.write_snapshot()
    _log_subscription_event("trial_started", user=saved, metadata={"trial_days": max(1, trial_days), "mode": "legacy_local_trial"})
    return subscription_status(user=saved)




def _details_from_user(user: dict[str, Any]) -> dict[str, Any]:
    tier = str(user.get("subscription_tier") or "free")
    pathway, billing_period, tier_professions = _parse_plan_id(tier)
    professions = _normalize_professions(user.get("selected_professions")) or tier_professions
    return {
        "plan_id": tier,
        "pathway": pathway,
        "billing_period": billing_period,
        "professions": professions,
        "profession_count": len(professions),
        "price_id": user.get("stripe_price_id"),
    }


def cancel_trial_at_period_end(*, user: dict[str, Any]) -> dict[str, Any]:
    current = _fresh_user_record(user)
    if _is_internal_all_access_user(current):
        raise AppError(409, "CANNOT_CANCEL_INTERNAL_ACCESS", "Internal access cannot be cancelled from billing.", False, {"classification": "non_retryable"})

    status_before = subscription_status(user=current)
    if not status_before.get("is_trial") and not status_before.get("is_active"):
        raise AppError(409, "NO_ACTIVE_SUBSCRIPTION", "There is no active trial or subscription to cancel.", False, {"classification": "non_retryable"})

    now_iso = utc_now().replace(microsecond=0).isoformat()
    subscription_id = str(current.get("stripe_subscription_id") or "").strip()
    updated = current

    if _stripe_enabled() and subscription_id:
        if stripe is None:
            raise AppError(503, "BILLING_NOT_CONFIGURED", "Stripe is not available in this deployment.", False, {"classification": "non_retryable"})
        stripe.api_key = SETTINGS.stripe_secret_key
        try:
            subscription = stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)
        except Exception as exc:
            raise AppError(503, "STRIPE_CANCEL_FAILED", "Could not cancel renewal for this trial/subscription.", True, {"classification": "retryable"}) from exc
        data = _stripe_to_dict(subscription)
        metadata = _parse_subscription_metadata(data.get("metadata"))
        if not metadata.get("plan_id"):
            metadata = _details_from_user(current)
        updated = _update_user_subscription_from_details(
            user=current,
            details=metadata,
            stripe_customer_id=str(data.get("customer") or current.get("stripe_customer_id") or "").strip() or None,
            stripe_subscription_id=str(data.get("id") or subscription_id).strip() or subscription_id,
            stripe_price_id=metadata.get("price_id") or current.get("stripe_price_id"),
            stripe_checkout_session_id=current.get("stripe_checkout_session_id"),
            subscription_expires_at=_normalize_unix_timestamp(data.get("current_period_end")) or current.get("subscription_expires_at"),
            trial_ends_at=_normalize_unix_timestamp(data.get("trial_end")) or current.get("trial_ends_at"),
            current_period_start=_normalize_unix_timestamp(data.get("current_period_start")) or current.get("current_period_start"),
            current_period_end=_normalize_unix_timestamp(data.get("current_period_end")) or current.get("current_period_end"),
            trial_started_at=_normalize_unix_timestamp(data.get("trial_start")) or current.get("trial_started_at"),
            cancel_at_period_end=True,
            canceled_at=now_iso,
            subscription_status=str(data.get("status") or current.get("subscription_status") or "").strip() or None,
            access_choice=current.get("access_choice") or ("trial" if status_before.get("is_trial") else "paid"),
        )
    else:
        access_ends_at = current.get("trial_ends_at") or current.get("subscription_expires_at") or current.get("current_period_end")
        updated, _ = auth_repository.AUTH_USERS.update_user(
            current["user_id"],
            cancel_at_period_end=True,
            canceled_at=now_iso,
            subscription_status=current.get("subscription_status") or ("trialing" if status_before.get("is_trial") else "active"),
            access_ends_at=access_ends_at,
        )
        STORE.write_snapshot()

    _log_subscription_event(
        "trial_cancel_requested" if status_before.get("is_trial") else "subscription_cancel_requested",
        user=updated,
        status_before=str(status_before.get("subscription_status") or status_before.get("tier") or ""),
        status_after=str(updated.get("subscription_status") or ""),
        metadata={"cancel_at_period_end": True, "access_ends_at": _access_ends_at_for_user(updated)},
    )
    return {
        "cancelled": True,
        "cancel_at_period_end": True,
        "access_ends_at": _access_ends_at_for_user(updated),
        "subscription": subscription_status(user=updated),
    }


def resume_subscription_renewal(*, user: dict[str, Any]) -> dict[str, Any]:
    current = _fresh_user_record(user)
    subscription_id = str(current.get("stripe_subscription_id") or "").strip()
    now_status = subscription_status(user=current)
    if not bool(now_status.get("cancel_at_period_end")):
        return {"resumed": False, "subscription": now_status}

    if _stripe_enabled() and subscription_id:
        if stripe is None:
            raise AppError(503, "BILLING_NOT_CONFIGURED", "Stripe is not available in this deployment.", False, {"classification": "non_retryable"})
        stripe.api_key = SETTINGS.stripe_secret_key
        try:
            subscription = stripe.Subscription.modify(subscription_id, cancel_at_period_end=False)
        except Exception as exc:
            raise AppError(503, "STRIPE_RESUME_FAILED", "Could not resume this subscription.", True, {"classification": "retryable"}) from exc
        data = _stripe_to_dict(subscription)
        metadata = _parse_subscription_metadata(data.get("metadata"))
        if not metadata.get("plan_id"):
            metadata = _details_from_user(current)
        updated = _update_user_subscription_from_details(
            user=current,
            details=metadata,
            stripe_customer_id=str(data.get("customer") or current.get("stripe_customer_id") or "").strip() or None,
            stripe_subscription_id=str(data.get("id") or subscription_id).strip() or subscription_id,
            stripe_price_id=metadata.get("price_id") or current.get("stripe_price_id"),
            subscription_expires_at=_normalize_unix_timestamp(data.get("current_period_end")) or current.get("subscription_expires_at"),
            trial_ends_at=_normalize_unix_timestamp(data.get("trial_end")) or current.get("trial_ends_at"),
            current_period_start=_normalize_unix_timestamp(data.get("current_period_start")) or current.get("current_period_start"),
            current_period_end=_normalize_unix_timestamp(data.get("current_period_end")) or current.get("current_period_end"),
            trial_started_at=_normalize_unix_timestamp(data.get("trial_start")) or current.get("trial_started_at"),
            cancel_at_period_end=False,
            canceled_at=None,
            subscription_status=str(data.get("status") or current.get("subscription_status") or "").strip() or None,
            access_choice=current.get("access_choice") or ("trial" if now_status.get("is_trial") else "paid"),
        )
    else:
        updated, _ = auth_repository.AUTH_USERS.update_user(
            current["user_id"],
            cancel_at_period_end=False,
            canceled_at=None,
        )
        STORE.write_snapshot()

    _log_subscription_event("subscription_reactivated", user=updated, metadata={"cancel_at_period_end": False})
    return {"resumed": True, "subscription": subscription_status(user=updated)}


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
        "trial_days": str(details.get("trial_days") or 0),
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
    existing_user = auth_repository.AUTH_USERS.get_user_by_id(user_id)
    if existing_user:
        current_status = subscription_status(user=existing_user)
        if bool(current_status.get("is_active")) and str(current_status.get("billing_tier") or current_status.get("tier") or "free") != "free":
            raise AppError(
                409,
                "SUBSCRIPTION_ALREADY_ACTIVE",
                "You already have an active trial or subscription.",
                False,
                {
                    "classification": "non_retryable",
                    "billing_tier": current_status.get("billing_tier"),
                    "trial_ends_at": current_status.get("trial_ends_at"),
                    "stripe_subscription_id": existing_user.get("stripe_subscription_id"),
                },
            )

    details = billing_checkout_details(payload=payload, user_id=user_id)
    # trial_already_used_checkout_guard
    user_for_trial_guard = auth_repository.AUTH_USERS.get_user_by_id(user_id) or {}
    raw_checkout_payload = payload or {}
    raw_plan_for_trial_guard = str(
        raw_checkout_payload.get("plan")
        or raw_checkout_payload.get("plan_id")
        or raw_checkout_payload.get("planId")
        or ""
    ).strip()
    explicit_trial_request = (
        raw_plan_for_trial_guard == "trial_3day"
        or "trial_days" in raw_checkout_payload
        or "trialDays" in raw_checkout_payload
    )
    try:
        requested_trial_days = int(details.get("trial_days") or 0)
    except (TypeError, ValueError):
        requested_trial_days = 0

    if requested_trial_days > 0 and _trial_used(user_for_trial_guard):
        if explicit_trial_request:
            _raise_trial_already_used(user_for_trial_guard, context="stripe_checkout")
        details = {**details, "trial_days": 0, "trial_already_used": True}

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
            subscription_data: dict[str, Any] = {"metadata": metadata}
            trial_days = int(details.get("trial_days") or 0)
            if trial_days > 0:
                subscription_data["trial_period_days"] = trial_days
                subscription_data["trial_settings"] = {
                    "end_behavior": {"missing_payment_method": "cancel"}
                }

            checkout_params: dict[str, Any] = {
                "mode": "subscription",
                "payment_method_collection": "always",
                "line_items": [{"price": selected_price_id, "quantity": 1}],
                "success_url": "https://learn.floently.com/billing/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}",
                "cancel_url": "https://learn.floently.com/billing/subscription?checkout=cancelled",
                "client_reference_id": user_id,
                "metadata": metadata,
                "subscription_data": subscription_data,
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
        user_for_event = auth_repository.AUTH_USERS.get_user_by_id(user_id)
        if user_for_event:
            _log_subscription_event(
                "checkout_started",
                user=user_for_event,
                metadata={"checkout_session_id": checkout_session_id, "plan": details["plan_id"], "pathway": details["pathway"], "billing_period": details["billing_period"], "professions": details["professions"]},
            )
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
    if not _stripe_enabled():
        raise AppError(
            503,
            "BILLING_NOT_CONFIGURED",
            "Stripe is not available in this deployment.",
            False,
            {"classification": "non_retryable"},
        )
    user = auth_repository.AUTH_USERS.get_user_by_id(user_id)
    stripe_customer_id = (user or {}).get("stripe_customer_id") or None
    if not stripe_customer_id:
        raise AppError(
            409,
            "STRIPE_CUSTOMER_MISSING",
            "No Stripe subscription is linked to this account yet. Please complete checkout first.",
            False,
            {"classification": "non_retryable"},
        )
    stripe.api_key = SETTINGS.stripe_secret_key
    try:
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url="https://learn.floently.com/billing/subscription",
        )
    except Exception as exc:
        raise AppError(
            503,
            "STRIPE_PORTAL_FAILED",
            "Failed to create Stripe billing portal session.",
            True,
            {"classification": "retryable"},
        ) from exc
    return str(getattr(session, "url", "") or session.get("url", ""))
