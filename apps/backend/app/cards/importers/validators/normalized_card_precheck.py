from __future__ import annotations

REQUIRED_KEYS = {
    "id",
    "content_type",
    "path",
    "domain",
    "profession",
    "level_band",
    "difficulty",
    "front_text",
    "back_prompt",
    "served_follow_up",
    "_accepted_variants",
}


def precheck_normalized_card(raw_item: dict) -> list[str]:
    errors: list[str] = []
    missing = sorted(key for key in REQUIRED_KEYS if key not in raw_item)
    if missing:
        errors.append("missing_keys:" + ",".join(missing))

    follow_up = raw_item.get("served_follow_up")
    if not isinstance(follow_up, dict):
        errors.append("served_follow_up_not_object")
    else:
        variant_type = str(follow_up.get("variant_type") or "").strip()
        if not variant_type:
            errors.append("missing_follow_up_variant_type")

    accepted = raw_item.get("_accepted_variants")
    if not isinstance(accepted, list) or not accepted:
        errors.append("missing_accepted_variants")

    return errors
