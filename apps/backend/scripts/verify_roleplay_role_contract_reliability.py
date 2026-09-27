from __future__ import annotations

import copy
import json
import os
from pathlib import Path
import urllib.error

from app.runtime import roleplay as runtime
from app.services import roleplay_ai_service
from app.services.roleplay_contract import (
    build_role_contract,
    deterministic_role_contract_assessment,
)


FIXTURE = (
    Path(__file__).parent.parent
    / "tests"
    / "fixtures"
    / "roleplay_role_contract_regressions.json"
)


def verify_regression_corpus() -> None:
    cases = json.loads(
        FIXTURE.read_text(
            encoding="utf-8"
        )
    )

    failures: list[str] = []

    for case in cases:
        actual = (
            roleplay_ai_service
            ._violates_role_contract(
                case["text"],
                profession=case[
                    "profession"
                ],
                scenario_id=case[
                    "scenario_id"
                ],
                counterpart_role=case[
                    "counterpart_role"
                ],
            )
        )

        expected = bool(
            case["expected_violation"]
        )

        if actual != expected:
            failures.append(
                f"{case['id']}: "
                f"expected={expected} "
                f"actual={actual}"
            )

    assert not failures, (
        "ROLEPLAY_ROLE_CONTRACT_REGRESSION\n"
        + "\n".join(failures)
    )


def _create_doctor_session(
    suffix: str,
) -> tuple[str, dict]:
    created = runtime.start_session(
        profession="doctor",
        level_band="B1-B2",
        scenario_id=(
            "doctor_follow_up_explanation"
        ),
        rotation_user_key=(
            f"r2c1b-{suffix}"
        ),
    )

    session_id = created[
        "session_id"
    ]

    raw = runtime.STORE.get_ref(
        "roleplay_sessions",
        session_id,
    )

    assert raw is not None

    return (
        session_id,
        raw,
    )


def verify_frozen_backend_contract() -> None:
    _, raw = _create_doctor_session(
        "contract"
    )

    contract = raw.get(
        "role_contract"
    )

    assert isinstance(
        contract,
        dict,
    )

    assert contract[
        "learner_role"
    ] == "doctor"

    assert contract[
        "learner_is_professional"
    ] is True

    assert contract[
        "counterpart_role"
    ]

    assert contract[
        "contract_version"
    ] == "role-contract-v2"


def verify_rejected_candidate_never_enters_history() -> None:
    session_id, raw = (
        _create_doctor_session(
            "history"
        )
    )

    contract_before = copy.deepcopy(
        raw["role_contract"]
    )

    rejected = (
        "Seuraava vaihe on tutkimus. "
        "Tarkastamme tilanteesi tarkemmin."
    )

    accepted = (
        "Minua huolestuttaa tämä edelleen. "
        "Mitä tapahtuu seuraavaksi?"
    )

    candidates = [
        {
            "ai_text": rejected,
            "feedback_line": "Hyvä.",
            "missing_phrases": [],
            "engine_mode": "openai_b_lite",
        },
        {
            "ai_text": accepted,
            "feedback_line": "Hyvä.",
            "missing_phrases": [],
            "engine_mode": "openai_b_lite",
        },
    ]

    generation_calls: list[
        dict | None
    ] = []

    def fake_generate(**kwargs):
        generation_calls.append(
            kwargs.get(
                "role_repair_context"
            )
        )

        return candidates[
            len(generation_calls) - 1
        ]

    def fake_validate(
        *,
        ai_text,
        **kwargs,
    ):
        if ai_text == rejected:
            return {
                "status": "invalid",
                "reason": "doctor_role_flip",
                "source": "test",
            }

        return {
            "status": "valid",
            "reason": "patient_role",
            "source": "test",
        }

    old_generate = (
        runtime
        .generate_ai_roleplay_reply
    )

    old_validate = (
        runtime
        .validate_ai_roleplay_reply
    )

    runtime.generate_ai_roleplay_reply = (
        fake_generate
    )

    runtime.validate_ai_roleplay_reply = (
        fake_validate
    )

    try:
        result = (
            runtime
            ._submit_session_turn(
                user_id="preview",
                session_id=session_id,
                user_message=(
                    "Kerron seuraavaksi "
                    "tutkimuksesta."
                ),
            )
        )
    finally:
        runtime.generate_ai_roleplay_reply = (
            old_generate
        )

        runtime.validate_ai_roleplay_reply = (
            old_validate
        )

    stored = runtime.STORE.get_ref(
        "roleplay_sessions",
        session_id,
    )

    assert stored is not None

    texts = [
        str(turn.get("text") or "")
        for turn in stored["turns"]
    ]

    assert rejected not in texts
    assert accepted in texts

    assert (
        stored["role_contract"]
        == contract_before
    )

    assert len(
        generation_calls
    ) == 2

    assert (
        generation_calls[0]
        is None
    )

    assert isinstance(
        generation_calls[1],
        dict,
    )

    assert str(
        result.get("engine_mode")
        or ""
    ).endswith(
        "_role_retry"
    )


def verify_validator_outage_fails_closed() -> None:
    session_id, _ = (
        _create_doctor_session(
            "outage"
        )
    )

    withheld = (
        "Minua huolestuttaa tämä oire."
    )

    def fake_generate(**kwargs):
        return {
            "ai_text": withheld,
            "feedback_line": "Hyvä.",
            "missing_phrases": [],
            "engine_mode": "openai_b_lite",
        }

    def fake_validate(**kwargs):
        return {
            "status": "unavailable",
            "reason": "provider_down",
            "source": "test",
        }

    old_generate = (
        runtime
        .generate_ai_roleplay_reply
    )

    old_validate = (
        runtime
        .validate_ai_roleplay_reply
    )

    runtime.generate_ai_roleplay_reply = (
        fake_generate
    )

    runtime.validate_ai_roleplay_reply = (
        fake_validate
    )

    try:
        result = (
            runtime
            ._submit_session_turn(
                user_id="preview",
                session_id=session_id,
                user_message="Jatketaan.",
            )
        )
    finally:
        runtime.generate_ai_roleplay_reply = (
            old_generate
        )

        runtime.validate_ai_roleplay_reply = (
            old_validate
        )

    stored = runtime.STORE.get_ref(
        "roleplay_sessions",
        session_id,
    )

    texts = [
        str(turn.get("text") or "")
        for turn in stored["turns"]
    ]

    assert withheld not in texts

    assert str(
        result.get("engine_mode")
        or ""
    ).startswith(
        "deterministic_role_fallback_"
        "validator_unavailable"
    )


def verify_second_invalid_falls_back() -> None:
    session_id, _ = (
        _create_doctor_session(
            "second-invalid"
        )
    )

    bad_one = (
        "Tutkimme sinut seuraavaksi."
    )

    bad_two = (
        "Seuraavaksi tarkastamme tilanteesi."
    )

    calls = 0

    def fake_generate(**kwargs):
        nonlocal calls
        calls += 1

        text = (
            bad_one
            if calls == 1
            else bad_two
        )

        return {
            "ai_text": text,
            "feedback_line": "Hyvä.",
            "missing_phrases": [],
            "engine_mode": "openai_b_lite",
        }

    def fake_validate(**kwargs):
        return {
            "status": "invalid",
            "reason": "role_flip",
            "source": "test",
        }

    old_generate = (
        runtime
        .generate_ai_roleplay_reply
    )

    old_validate = (
        runtime
        .validate_ai_roleplay_reply
    )

    runtime.generate_ai_roleplay_reply = (
        fake_generate
    )

    runtime.validate_ai_roleplay_reply = (
        fake_validate
    )

    try:
        result = (
            runtime
            ._submit_session_turn(
                user_id="preview",
                session_id=session_id,
                user_message="Jatketaan.",
            )
        )
    finally:
        runtime.generate_ai_roleplay_reply = (
            old_generate
        )

        runtime.validate_ai_roleplay_reply = (
            old_validate
        )

    stored = runtime.STORE.get_ref(
        "roleplay_sessions",
        session_id,
    )

    texts = [
        str(turn.get("text") or "")
        for turn in stored["turns"]
    ]

    assert bad_one not in texts
    assert bad_two not in texts
    assert calls == 2

    assert str(
        result.get("engine_mode")
        or ""
    ).startswith(
        "deterministic_role_fallback_"
        "retry_invalid"
    )


class FakeResponse:
    def __init__(
        self,
        verdict: str,
    ) -> None:
        self.verdict = verdict

    def __enter__(self):
        return self

    def __exit__(
        self,
        exc_type,
        exc,
        tb,
    ):
        return False

    def read(self) -> bytes:
        return json.dumps(
            {
                "choices": [
                    {
                        "message": {
                            "content": (
                                json.dumps(
                                    {
                                        "verdict": (
                                            self.verdict
                                        ),
                                        "reason": (
                                            "test verdict"
                                        ),
                                    }
                                )
                            )
                        }
                    }
                ]
            }
        ).encode(
            "utf-8"
        )


def _validator_session() -> dict:
    contract = build_role_contract(
        profession="doctor",
        scenario_id=(
            "doctor_follow_up_explanation"
        ),
        persona_name="Laura",
        counterpart_role="patient",
    )

    return {
        "profession": "doctor",
        "level": "B1-B2",
        "persona_name": "Laura",
        "scenario": {
            "scenario_id": (
                "doctor_follow_up_explanation"
            ),
            "title": "Seurantakäynti",
        },
        "mission": {
            "counterpartRole": "patient",
            "learnerGoal": (
                "Explain the next steps."
            ),
        },
        "role_contract": contract,
        "turns": [],
    }


class Spec:
    profession = "doctor"
    scenario_id = (
        "doctor_follow_up_explanation"
    )
    persona_name = "patient"


def verify_semantic_validator() -> None:
    old_urlopen = (
        roleplay_ai_service
        .urllib.request.urlopen
    )

    old_key = os.environ.get(
        "OPENAI_API_KEY"
    )

    os.environ[
        "OPENAI_API_KEY"
    ] = "test-only-key"

    try:
        for verdict in (
            "valid",
            "invalid",
        ):
            roleplay_ai_service.urllib.request.urlopen = (
                lambda request, timeout, v=verdict:
                FakeResponse(v)
            )

            result = (
                roleplay_ai_service
                .validate_ai_roleplay_reply(
                    session=(
                        _validator_session()
                    ),
                    spec=Spec(),
                    ai_text=(
                        "Minua huolestuttaa "
                        "tämä edelleen."
                    ),
                    user_message=(
                        "Kerron suunnitelman."
                    ),
                )
            )

            assert (
                result["status"]
                == verdict
            )

            assert (
                result["source"]
                == "openai"
            )

        def fail(
            request,
            timeout,
        ):
            raise urllib.error.URLError(
                "simulated outage"
            )

        roleplay_ai_service.urllib.request.urlopen = (
            fail
        )

        result = (
            roleplay_ai_service
            .validate_ai_roleplay_reply(
                session=_validator_session(),
                spec=Spec(),
                ai_text=(
                    "Minua huolestuttaa "
                    "tämä edelleen."
                ),
                user_message=(
                    "Kerron suunnitelman."
                ),
            )
        )

        assert (
            result["status"]
            == "unavailable"
        )

    finally:
        roleplay_ai_service.urllib.request.urlopen = (
            old_urlopen
        )

        if old_key is None:
            os.environ.pop(
                "OPENAI_API_KEY",
                None,
            )
        else:
            os.environ[
                "OPENAI_API_KEY"
            ] = old_key


def verify_all_professional_counterparts() -> int:
    professional = (
        "doctor",
        "nurse",
        "practical_nurse",
    )

    peer_patient_markers = (
        "minua huolestuttaa tämä vaiva",
        "minua huolestuttaa tämä oire",
        "minulla on vähän huono olo",
        "vointini on vähän epävarma",
        "voisitko auttaa minua hetken",
        "mikä minua vaivaa",
    )

    checked = 0

    for profession in professional:
        specs = (
            runtime
            ._ROLEPLAY_REGISTRY
            .get(
                profession,
                (),
            )
        )

        for spec in specs:
            for level in runtime.LEVEL_BANDS:
                created = runtime.start_session(
                    profession=profession,
                    level_band=level,
                    scenario_id=(
                        spec.scenario_id
                    ),
                    rotation_user_key=(
                        "role-contract-matrix:"
                        f"{profession}:"
                        f"{spec.scenario_id}:"
                        f"{level}"
                    ),
                )

                raw = runtime.STORE.get_ref(
                    "roleplay_sessions",
                    created["session_id"],
                )

                assert raw is not None

                mission = (
                    raw.get("mission")
                    if isinstance(
                        raw.get("mission"),
                        dict,
                    )
                    else {}
                )

                contract = raw.get(
                    "role_contract"
                )

                assert isinstance(
                    contract,
                    dict,
                )

                expected_role = str(
                    mission.get(
                        "counterpartRole"
                    )
                    or spec.persona_name
                    or ""
                ).strip()

                assert expected_role

                assert (
                    contract[
                        "counterpart_role"
                    ]
                    == expected_role
                )

                expected_contract = (
                    build_role_contract(
                        profession=profession,
                        scenario_id=(
                            spec.scenario_id
                        ),
                        persona_name=(
                            str(
                                raw.get(
                                    "persona_name"
                                )
                                or "AI"
                            )
                        ),
                        counterpart_role=(
                            expected_role
                        ),
                    )
                )

                assert (
                    contract[
                        "counterpart_kind"
                    ]
                    == expected_contract[
                        "counterpart_kind"
                    ]
                )

                fallback = (
                    runtime
                    ._safe_professional_counterpart_fallback(
                        session=raw,
                        spec=spec,
                        user_message="Jatketaan.",
                        terminal_turn=False,
                    )
                )

                assessment = (
                    deterministic_role_contract_assessment(
                        ai_text=fallback,
                        role_contract=contract,
                    )
                )

                assert (
                    assessment["status"]
                    == "valid"
                )

                kind = contract[
                    "counterpart_kind"
                ]

                low = fallback.lower()

                if kind == "professional_peer":
                    assert not any(
                        marker in low
                        for marker
                        in peer_patient_markers
                    )

                    role_low = (
                        expected_role.lower()
                    )

                    if (
                        "recruit" in role_low
                        or "rekrytoija"
                        in role_low
                    ):
                        assert any(
                            marker in low
                            for marker in (
                                "esimerkki",
                                "kokemus",
                                "työ",
                                "haastattel",
                            )
                        )

                    if (
                        "supervisor"
                        in role_low
                        or "esihenkilö"
                        in role_low
                    ):
                        assert any(
                            marker in low
                            for marker in (
                                "havainto",
                                "asiakkaan",
                                "raport",
                                "vuoro",
                            )
                        )

                    if (
                        "senior nurse"
                        in role_low
                        or "colleague"
                        in role_low
                        or "kollega"
                        in role_low
                    ):
                        assert any(
                            marker in low
                            for marker in (
                                "potilaan",
                                "raport",
                                "vuoro",
                                "seurata",
                            )
                        )

                checked += 1

    assert checked >= 21

    return checked


def main() -> None:
    verify_regression_corpus()
    print(
        "ROLEPLAY_ROLE_CONTRACT_CORPUS=PASS"
    )

    verify_frozen_backend_contract()
    print(
        "ROLEPLAY_FROZEN_SESSION_CONTRACT=PASS"
    )

    verify_rejected_candidate_never_enters_history()
    print(
        "ROLEPLAY_REJECTED_HISTORY_ISOLATION=PASS"
    )

    verify_validator_outage_fails_closed()
    print(
        "ROLEPLAY_VALIDATOR_FAIL_CLOSED=PASS"
    )

    verify_second_invalid_falls_back()
    print(
        "ROLEPLAY_SECOND_INVALID_FALLBACK=PASS"
    )

    verify_semantic_validator()
    print(
        "ROLEPLAY_SEMANTIC_VALIDATOR=PASS"
    )

    matrix_count = (
        verify_all_professional_counterparts()
    )

    print(
        "ROLEPLAY_PROFESSIONAL_COUNTERPART_MATRIX="
        f"{matrix_count}_PASS"
    )

    print(
        "ROLEPLAY_CONTRACT_RELIABILITY=PASS"
    )


if __name__ == "__main__":
    main()
