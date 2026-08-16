from __future__ import annotations

import re
from typing import Any


ROLE_CONTRACT_VERSION = "role-contract-v2"

PROFESSIONAL_LEARNER_ROLES = {
    "doctor",
    "nurse",
    "practical_nurse",
}

_LEARNER_LABELS = {
    "doctor": "doctor",
    "nurse": "nurse",
    "practical_nurse": "practical nurse",
}

_FORBIDDEN_LABELS = {
    "doctor": "doctor/lääkäri",
    "nurse": "nurse/sairaanhoitaja/hoitaja",
    "practical_nurse": "practical nurse/lähihoitaja/hoitaja",
}

_NON_PROFESSIONAL_COUNTERPART_HINTS = (
    "patient",
    "potilas",
    "resident",
    "asukas",
    "client",
    "asiakas",
    "customer",
    "family",
    "family member",
    "omainen",
    "relative",
)

_PROFESSIONAL_PEER_HINTS = (
    "colleague",
    "kollega",
    "coworker",
    "co-worker",
    "supervisor",
    "esihenkilö",
    "manager",
    "recruiter",
    "rekrytoija",
    "doctor",
    "lääkäri",
    "nurse",
    "sairaanhoitaja",
    "hoitaja",
)

_COACHING_LEAKAGE = (
    "voit sanoa",
    "sinun pitäisi sanoa",
    "yritä sanoa",
    "harjoittele sanomalla",
    "vastaa näin",
    "sano esimerkiksi",
    "parempi vastaus olisi",
    "korjaa näin",
)

_UNIVERSAL_PROFESSIONAL_FLIP = (
    "olen lääkäri",
    "toimin lääkärinä",
    "olen sairaanhoitaja",
    "olen hoitaja",
    "olen lähihoitaja",
    "mittaan verenpaineesi",
    "mittaan kuumeen",
    "mittaan saturaation",
    "annan lääkkeen",
    "annan sinulle lääkkeen",
    "kirjaan tämän",
    "kirjaan tiedot",
    "teen lähetteen",
    "määrään lääkkeen",
    "tutkin sinut",
    "kuuntelen keuhkot",
    "otan verikokeet",
    "vaihdan haavasidoksen",
    "autan sinua peseytymään",
    "autan sinut suihkuun",
)

_DOCTOR_INTERVIEW_FLIP = (
    "mikä toi sinut vastaanotolle",
    "mikä tuo sinut vastaanotolle",
    "miksi tulit vastaanotolle",
    "mikä oireesi on",
    "kerro oireesi",
    "kuvaile oireesi",
    "mitä oireita sinulla on",
    "onko sinulla kipua",
    "missä kipu tuntuu",
    "milloin oireet alkoivat",
    "miten voin auttaa",
    "avaa suu",
    "hengitä syvään",
)

_NURSE_ROLE_FLIP = (
    "mikä vointisi on",
    "kerro voinnistasi",
    "mitä oireita sinulla on",
    "onko sinulla kipua",
    "tarvitsetko kipulääkettä",
    "vaihdan sidoksen",
    "tarkistan lääkityksen",
    "annan injektion",
    "soitan lääkärille",
    "seuraan vointiasi",
)

_PRACTICAL_NURSE_ROLE_FLIP = (
    "autan sinua pukemaan",
    "autan sinua syömään",
    "autan sinua wc:hen",
    "autan sinua peseytymään",
    "vaihdan vaipan",
    "nostan sinut",
    "siirrän sinut",
    "tuon rollaattorin",
    "annan aamupalan",
    "tarkistan ihon",
)

_PROCESS_NOUN_STEMS = (
    "tutkim",
    "lisätutkim",
    "hoito",
    "arvio",
    "toimenpid",
    "lähete",
    "kontroll",
    "vastaanot",
    "käynt",
    "lääkity",
)

_PATIENT_TARGET_MARKERS = (
    "sinut",
    "sinua",
    "sinulle",
    "tilanteesi",
    "oireesi",
    "vointisi",
    "kipusi",
    "lääkityksesi",
    "haavasi",
)

_HIGH_CONFIDENCE_PROFESSIONAL_ACTION = re.compile(
    r"\b(?:"
    r"tutkin|tutkimme|"
    r"tarkastan|tarkastamme|"
    r"arvioin|arvioimme|"
    r"mittaan|mittaamme|"
    r"kirjaan|kirjaamme|"
    r"määrään|määräämme|"
    r"päätän|päätämme|"
    r"suosittelen|suosittelemme"
    r")\b"
)

_PROCESS_AUTHORITY_PATTERNS = (
    re.compile(
        r"\bseuraava vaihe on\b.*"
        r"(?:tutkim|hoito|arvio|toimenpid|kontroll|käynt)"
    ),
    re.compile(
        r"\bseuraavaksi\b.*"
        r"(?:tutkimme|tarkastamme|arvioimme|mittaamme)"
    ),
    re.compile(
        r"\bkäydään\b.*\boireesi\b.*"
        r"\b(?:päätän|päätämme)\b"
    ),
    re.compile(
        r"\b(?:päätän|päätämme)\b.*"
        r"\b(?:lisätutkim|tutkim|hoito|toimenpid)"
    ),
    re.compile(
        r"\bkerron sinulle\b.*"
        r"\b(?:tutkim\w*|hoi(?:to|d)\w*|arvio\w*|toimenp(?:id|it)\w*)\b.*"
        r"\bmiten sinun kannattaa edetä\b"
    ),
)


def _normalise(value: Any) -> str:
    return " ".join(
        str(value or "")
        .strip()
        .lower()
        .split()
    )


def _counterpart_kind(
    counterpart_role: str,
) -> str:
    role = _normalise(
        counterpart_role
    )

    if any(
        hint in role
        for hint in _NON_PROFESSIONAL_COUNTERPART_HINTS
    ):
        return "non_professional_counterpart"

    if any(
        hint in role
        for hint in _PROFESSIONAL_PEER_HINTS
    ):
        return "professional_peer"

    return "scenario_counterpart"


def build_role_contract(
    *,
    profession: str,
    scenario_id: str,
    persona_name: str,
    counterpart_role: str = "",
) -> dict[str, Any]:
    profession_norm = _normalise(
        profession
    )

    scenario_norm = _normalise(
        scenario_id
    )

    persona = (
        str(persona_name or "AI").strip()
        or "AI"
    )

    counterpart = (
        str(counterpart_role or "").strip()
        or persona
    )

    if (
        profession_norm
        not in PROFESSIONAL_LEARNER_ROLES
    ):
        return {
            "contract_version": ROLE_CONTRACT_VERSION,
            "profession": profession_norm or "general",
            "scenario_id": scenario_norm,
            "learner_role": "learner",
            "counterpart_role": counterpart,
            "counterpart_kind": "scenario_counterpart",
            "ai_role": counterpart,
            "learner_is_professional": False,
            "rule": (
                f"The AI must speak only as {counterpart}, "
                "the roleplay counterpart, not as the learner."
            ),
        }

    learner_label = _LEARNER_LABELS[
        profession_norm
    ]

    forbidden_label = _FORBIDDEN_LABELS[
        profession_norm
    ]

    counterpart_kind = _counterpart_kind(
        counterpart_role
    )

    return {
        "contract_version": ROLE_CONTRACT_VERSION,
        "profession": profession_norm,
        "scenario_id": scenario_norm,
        "learner_role": learner_label,
        "counterpart_role": counterpart,
        "counterpart_kind": counterpart_kind,
        "ai_role": counterpart,
        "learner_is_professional": True,
        "rule": (
            f"The learner is the {learner_label}. "
            f"The AI is the scenario counterpart: {counterpart}. "
            f"The AI must not take over the learner's "
            f"{forbidden_label} duties or treat the learner "
            "as the patient/client. A professional colleague "
            "or supervisor may perform actions belonging to "
            "that explicitly defined counterpart role."
        ),
    }


def deterministic_role_contract_assessment(
    *,
    ai_text: str,
    role_contract: dict[str, Any],
) -> dict[str, str]:
    text = _normalise(
        ai_text
    )

    if not text:
        return {
            "status": "invalid",
            "reason": "empty_ai_text",
            "source": "deterministic",
        }

    if any(
        phrase in text
        for phrase in _COACHING_LEAKAGE
    ):
        return {
            "status": "invalid",
            "reason": "coaching_leakage",
            "source": "deterministic",
        }

    profession = _normalise(
        role_contract.get(
            "profession"
        )
    )

    if (
        profession
        not in PROFESSIONAL_LEARNER_ROLES
    ):
        return {
            "status": "valid",
            "reason": "non_professional_track",
            "source": "deterministic",
        }

    # Preserve every high-confidence lexical guard that existed
    # before role-contract-v2, regardless of counterpart metadata.
    if any(
        phrase in text
        for phrase in _UNIVERSAL_PROFESSIONAL_FLIP
    ):
        return {
            "status": "invalid",
            "reason": "professional_role_action",
            "source": "deterministic",
        }

    if (
        profession == "doctor"
        and any(
            phrase in text
            for phrase in _DOCTOR_INTERVIEW_FLIP
        )
    ):
        return {
            "status": "invalid",
            "reason": "doctor_interview_role_flip",
            "source": "deterministic",
        }

    if (
        profession == "nurse"
        and any(
            phrase in text
            for phrase in _NURSE_ROLE_FLIP
        )
    ):
        return {
            "status": "invalid",
            "reason": "nurse_role_flip",
            "source": "deterministic",
        }

    if (
        profession == "practical_nurse"
        and any(
            phrase in text
            for phrase in _PRACTICAL_NURSE_ROLE_FLIP
        )
    ):
        return {
            "status": "invalid",
            "reason": "practical_nurse_role_flip",
            "source": "deterministic",
        }

    # Stronger action/authority reasoning is enabled only when the
    # backend contract proves the AI is a non-professional counterpart
    # such as a patient, resident, client, or family member.
    if (
        role_contract.get(
            "counterpart_kind"
        )
        != "non_professional_counterpart"
    ):
        return {
            "status": "valid",
            "reason": "no_high_confidence_role_violation",
            "source": "deterministic",
        }

    if any(
        pattern.search(
            text
        )
        for pattern in _PROCESS_AUTHORITY_PATTERNS
    ):
        return {
            "status": "invalid",
            "reason": "counterpart_took_process_authority",
            "source": "deterministic",
        }

    professional_action = bool(
        _HIGH_CONFIDENCE_PROFESSIONAL_ACTION.search(
            text
        )
    )

    professional_context = (
        any(
            stem in text
            for stem in _PROCESS_NOUN_STEMS
        )
        or any(
            marker in text
            for marker in _PATIENT_TARGET_MARKERS
        )
    )

    if (
        professional_action
        and professional_context
    ):
        return {
            "status": "invalid",
            "reason": "counterpart_performed_professional_action",
            "source": "deterministic",
        }

    return {
        "status": "valid",
        "reason": "no_high_confidence_role_violation",
        "source": "deterministic",
    }
