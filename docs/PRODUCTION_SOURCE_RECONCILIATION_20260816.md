# KieliValmis Production Source Reconciliation Ledger

Date: 2026-08-16

Status: ACTIVE — production reconciliation required before a clean backend
replacement image may be promoted.

## Purpose

This ledger records the production source-lineage problem discovered while
investigating recurring regressions in roleplay, cards, Everyday Finnish,
navigation, YKI, and voice/STT.

The currently running backend must NOT be assumed to correspond to one Git
commit.

The running backend is a composite Docker image containing source from
multiple divergent Git histories.

The objective of this reconciliation is to preserve every valid live
capability while replacing the composite source authority with one canonical,
testable, reproducible Git lineage.

## Current canonical integration authority

Branch:

    integration/canonical-production-20260816

Initial canonical integration head:

    ead056ca084cd871b73ece31d9122dc139e64a18

Forward base incorporated into this line:

    7415b894eb230268fe98904b5a84ffc976515bc5

That base itself contains:

    e92b98e7799c390bc52b42d724c57f197ffd5c0d

The roleplay regression corpus and ANTI-REGRESSION-001 policy were replayed
forward onto this integration line rather than replacing the newer lineage.

## Current deployed backend artifact

Live image ID:

    sha256:57b3ab1ef0986c9e0c84253b7b35482cb15db990b04f115dc33024cbca608bcf

Pinned rollback tag:

    floently-finnish-backend:rollback-20260816-pre-canonical

Do not delete this image/tag until a new canonical image has been deployed,
validated, observed, and explicitly accepted as the new known-good rollback
authority.

## Proven composite-image history

The live backend is not source-identical to a single Git commit.

The image contains a large base backend followed by targeted source overlays,
including YKI-specific overlays.

Therefore a later rebuild from only one historical branch can remove
capabilities that existed only in another overlay lineage.

This is a proven deployment-lineage hazard.

## Forward comparison result

A comparison from the earlier reference Git source into the running backend
found:

    backend_files_checked=35212
    backend_files_matched=35205
    backend_files_mismatched=7
    backend_files_missing=0

The seven divergent tracked files were:

1. apps/backend/.env.example
   Origin:
   386010e6898a31ae4894bcc689768605fea0cc2c
   Classification:
   divergent Git history
   Runtime significance:
   configuration example, not executable production source

2. apps/backend/app/models/api_models.py
   Origin:
   c07b6effa280e843574f6151b67bb5548ae6d6b5
   Classification:
   divergent Git history

3. apps/backend/app/routers/v1_yki.py
   Origin:
   c07b6effa280e843574f6151b67bb5548ae6d6b5
   Classification:
   divergent Git history

4. apps/backend/app/runtime/roleplay.py
   Origin:
   386010e6898a31ae4894bcc689768605fea0cc2c
   Classification:
   divergent Git history

5. apps/backend/app/runtime/yki.py
   Origin:
   7c92b7e65337568944013ad0ff2d73b08c1cfb44
   Classification:
   divergent Git history

6. apps/backend/app/runtime/yki_local_fallback.py
   Origin:
   0e5dc84fa8dcdb0ea746f404c557d8683ce70b75
   Classification:
   divergent Git history

7. apps/backend/app/services/yki_service.py
   Origin:
   d6d1061fc2214b7b62988214deebfd52c0f1c971
   Classification:
   divergent Git history

All seven share divergence from the later reference lineage rather than being
ordinary stale ancestors.

## Reverse comparison result

The reverse comparison from the running backend into canonical Git found:

    live_extra_files_total=8
    live_extra_runtime_files=2
    live_extra_script_files=6
    live_extra_root_files=0
    live_extra_other_files=0

The two live-only runtime source files are:

1. apps/backend/app/services/roleplay_evaluation_service.py

   Proven Git origin:

       386010e6898a31ae4894bcc689768605fea0cc2c

   Capability:

   Structured evidence-based AI roleplay evaluation and feedback.

   The live roleplay runtime imports this service and calls
   evaluate_roleplay_session() when a completed roleplay session is finished.

2. apps/backend/app/services/yki_evaluation_service.py

   Latest live Git origin:

       0e5dc84fa8dcdb0ea746f404c557d8683ce70b75

   Capability:

   Structured YKI evaluation, section scoring, evidence grounding,
   calibration, predicted result reporting, and actionable improvement
   feedback.

Neither runtime service may disappear merely because the future production
image is rebuilt cleanly from canonical Git.

## Live-only verification scripts

The live image also contains these six scripts that are absent from the
initial canonical integration source:

- apps/backend/scripts/verify_roleplay_ai_evaluation.py
- apps/backend/scripts/verify_yki_ai_evaluation.py
- apps/backend/scripts/verify_yki_evaluation_regression_recovery.py
- apps/backend/scripts/verify_yki_final_submit_recovery.py
- apps/backend/scripts/verify_yki_local_fallback_evaluation.py
- apps/backend/scripts/verify_yki_report_calibration.py

They are verification assets rather than request-serving runtime modules, but
their validation knowledge must be reviewed and preserved or replaced by
equivalent or stronger permanent tests before reconciliation is closed.

## Runtime reconciliation set

The minimum runtime reconciliation set therefore contains eight executable
source items:

- apps/backend/app/models/api_models.py
- apps/backend/app/routers/v1_yki.py
- apps/backend/app/runtime/roleplay.py
- apps/backend/app/runtime/yki.py
- apps/backend/app/runtime/yki_local_fallback.py
- apps/backend/app/services/yki_service.py
- apps/backend/app/services/roleplay_evaluation_service.py
- apps/backend/app/services/yki_evaluation_service.py

The configuration example and six verification scripts are separate
reconciliation items.

## Reconciliation rule

DO NOT resolve the reconciliation by copying one divergent branch wholesale.

For each item:

1. identify its user-visible or operational capability;
2. determine whether the capability is still valid;
3. classify it KEEP, MERGE, REPLACE, or DELETE;
4. document evidence for that decision;
5. preserve the capability in canonical source when KEEP or MERGE applies;
6. add a permanent regression test before considering the item reconciled;
7. verify that unrelated newer canonical behavior survives;
8. commit the reconciliation forward onto the canonical integration branch.

DELETE requires explicit evidence that the capability is obsolete, duplicate,
unreachable, unsafe, or intentionally superseded.

## Current roleplay priority

The live roleplay evaluation capability must first be reconciled into canonical
Git because the initial canonical integration source currently lacks the live
evaluation-service integration.

After that preservation is proven, implement the role-contract reliability
architecture:

- immutable learner/counterpart role identity;
- candidate validation before persistence;
- lexical guard plus semantic/action guard;
- rejected candidate never enters conversation history;
- one corrected regeneration attempt;
- deterministic safe counterpart fallback;
- permanent regression coverage for the August 16 production role flips.

## YKI priority

After roleplay reconciliation, reconcile the YKI request, runtime, fallback,
service, and evaluation capabilities as one functional unit.

Do not simply select the newest-looking file independently. The files evolved
together across several targeted recovery/calibration commits.

The final canonical YKI implementation must preserve the intended API,
persistence, fallback, scoring, evaluation, and report behavior through tests.

## Post-release pending improvements

The 13 pending Help/navigation/YKI improvements are intentionally isolated
from this runtime reconciliation.

They are protected remotely at:

    rescue/postrelease-working-tree-20260816-r1

Rescue commit:

    c98cdf45ba8df9f6436c196023f4b3e0559f5c7a

They must later be reviewed and replayed forward onto the final canonical
lineage rather than promoted by replacing production source.

## Closure conditions

This reconciliation remains OPEN until all of the following are true:

    LIVE_RUNTIME_CAPABILITIES_CLASSIFIED=PASS
    LIVE_RUNTIME_CAPABILITIES_RECONCILED=PASS
    ROLEPLAY_INVARIANTS=PASS
    YKI_INVARIANTS=PASS
    CARDS_INVARIANTS=PASS
    EVERYDAY_FINNISH_INVARIANTS=PASS
    NAVIGATION_INVARIANTS=PASS
    AUTH_INVARIANTS=PASS
    BILLING_ENTITLEMENT_INVARIANTS=PASS
    STT_INVARIANTS=PASS
    FORWARD_SOURCE_MATCH=PASS
    REVERSE_SOURCE_MATCH=PASS
    CANDIDATE_ARTIFACT_IDENTITY=PASS
    POST_DEPLOY_CANARY=PASS

No production promotion is allowed before the required gates pass.

## R2B roleplay evaluation reconciliation

Status: RECONCILED IN CANONICAL SOURCE, pending later candidate-artifact and
production validation.

Evidence from the live production audit proved that the running roleplay
evaluation capability comes exactly from Git commit:

    386010e6898a31ae4894bcc689768605fea0cc2c

Decisions:

### apps/backend/app/services/roleplay_evaluation_service.py

Classification: KEEP

Reason:

This is a live learner-facing capability. It produces structured evidence-based
roleplay assessment and includes a deterministic fallback when detailed OpenAI
evaluation is unavailable. Removing it during a clean rebuild would be a
regression.

Action:

Preserved byte-for-byte from the proven live Git origin.

### apps/backend/app/runtime/roleplay.py evaluation integration

Classification: MERGE

Reason:

The canonical runtime and live runtime differed only by the evaluation-service
import and finish_session() evaluation integration.

Action:

Merged only those proven live differences into the current canonical runtime.
No divergent roleplay runtime was copied wholesale.

### apps/backend/scripts/verify_roleplay_ai_evaluation.py

Classification: KEEP

Reason:

This verifier protects the deterministic fallback contract and the response
shape of the evaluation feature.

Action:

Preserved from the proven live Git origin.

### .github/workflows/roleplay-ai-evaluation.yml

Classification: KEEP

Reason:

The workflow provides permanent CI protection for compilation and deterministic
fallback evaluation behavior.

Action:

Preserved from the proven historical capability.

### apps/backend/.env.example evaluation settings

Classification: MERGE

Reason:

The historical capability documented explicit evaluation enablement, model,
timeout, and token settings. Replacing the current .env.example wholesale would
risk discarding newer configuration documentation.

Action:

Merged only the evaluation configuration documentation into the current file.

The default remains:

    OPENAI_EVALUATION_ENABLED=false

This reconciliation does not enable production OpenAI evaluation.

### Role-contract reliability

Classification: NOT CLOSED BY R2B

R2B preserves existing live roleplay evaluation only.

The August 16 semantic role-flip regression remains a separate required repair.
The role-contract regression corpus must remain red until the semantic/action
guard is implemented and then must become permanently green.

## R2C role-contract reliability repair

Status: REPAIRED IN CANONICAL SOURCE — production promotion and post-deploy
validation remain pending.

The August 16 production incident proved that lexical phrase blocking alone was
not sufficient to protect professional role identity. Semantically equivalent
AI replies could take over the learner's doctor role and then enter conversation
history.

### Role authority

The backend now owns an explicit role contract.

For professional scenarios:

- the learner role is immutable for the session;
- the AI counterpart role is taken first from a selected mission when one
  exists;
- when professional scenarios have no selected mission, ScenarioSpec.persona_name
  is the semantic counterpart role;
- the resolved Finnish display persona name is presentation identity and is not
  used as role authority.

This distinction is required because names such as Laura Heikkinen, Jari
Lahtinen, and Aino Nieminen identify the presented persona, while semantic roles
include Patient, Senior Nurse, Recruiter, and Supervisor.

### Candidate acceptance architecture

Before an AI candidate can be persisted as an AI turn:

1. deterministic role/action validation runs;
2. protected professional tracks also receive semantic validation;
3. an invalid first candidate is discarded;
4. exactly one corrected regeneration is attempted;
5. the corrected candidate is validated again;
6. unavailable, uncertain, or second-invalid validation fails closed to a
   deterministic counterpart-aware reply;
7. rejected candidates are never appended to conversation history.

### Deterministic Finnish protection

The deterministic layer includes Finnish professional-action/process detection
and morphological handling needed for forms such as:

- tutkimus / tutkimuksen;
- hoito / hoidon;
- arvio / arvioinnin;
- toimenpide / toimenpiteen.

The repair is structural and is not implemented as an exact blacklist of only
the production incident sentences.

### Professional scenario matrix

The permanent verifier exercises all currently registered professional
scenario/level combinations:

    doctor: 2 scenarios x 3 level bands
    nurse: 3 scenarios x 3 level bands
    practical_nurse: 2 scenarios x 3 level bands

Total:

    PROFESSIONAL_COUNTERPART_MATRIX=21

Verified semantic counterparts include:

    Patient
    Senior Nurse
    Recruiter
    Supervisor

Evidence before commit:

    ROLEPLAY_ROLE_CONTRACT_CORPUS=PASS
    ROLEPLAY_FROZEN_SESSION_CONTRACT=PASS
    ROLEPLAY_REJECTED_HISTORY_ISOLATION=PASS
    ROLEPLAY_VALIDATOR_FAIL_CLOSED=PASS
    ROLEPLAY_SECOND_INVALID_FALLBACK=PASS
    ROLEPLAY_SEMANTIC_VALIDATOR=PASS
    ROLEPLAY_PROFESSIONAL_COUNTERPART_MATRIX=21_PASS
    ROLEPLAY_CONTRACT_RELIABILITY=PASS
    AUGUST16_ROLE_CONTRACT_CORPUS=7_OF_7_PASS
    ROLEPLAY_AI_EVALUATION_FALLBACK=PASS
    INVALID_RUNTIME_SCENARIO_VALUE_REFERENCES=0

### Beginner-path defect

The pre-existing beginner response mutation defect using:

    parsed["ai_text"]

against a parser result stored as:

    data

was corrected to use the actual parser object.

### Permanent protection

The GitHub roleplay workflow now protects both:

- the previously reconciled roleplay evaluation capability; and
- the role-contract reliability architecture.

The workflow watches the runtime, AI service, role-contract service, mission
source, regression fixture/test, reliability verifier, relevant configuration,
and its own workflow definition.

The role-contract verifier is intentionally no-network. Semantic-validator
success, invalid verdict, and outage behavior are tested with controlled
provider substitutes.

### Reconciliation classifications

apps/backend/app/services/roleplay_contract.py

    Classification: KEEP / NEW CANONICAL AUTHORITY

apps/backend/app/services/roleplay_ai_service.py

    Classification: MERGE

apps/backend/app/runtime/roleplay.py

    Classification: MERGE

apps/backend/scripts/verify_roleplay_role_contract_reliability.py

    Classification: KEEP / NEW PERMANENT VERIFIER

apps/backend/tests/test_roleplay_role_contract_regressions.py

    Classification: KEEP / STRENGTHEN

.github/workflows/roleplay-ai-evaluation.yml

    Classification: MERGE / STRENGTHEN

apps/backend/.env.example role-validator settings

    Classification: MERGE

### Remaining production status

Source-level roleplay reliability is green.

This does NOT by itself close production reconciliation.

The currently running backend remains the pinned pre-canonical composite image.
No source overlay, restart, or production promotion occurred during R2C.

Before a clean canonical backend replacement may be promoted, the remaining
runtime reconciliation and protected release gates must still pass.

Current roleplay markers:

    ROLEPLAY_SOURCE_INVARIANTS=PASS
    ROLEPLAY_PRODUCTION_DEPLOYMENT=PENDING
    ROLEPLAY_POST_DEPLOY_CANARY=PENDING

## 2026-08-16 YKI R3B2 / R3C1 runtime-foundation checkpoint

### R3B2 live known-good baseline

R3B2 completed as a read-only live-production audit.

Authority remained:

    canonical branch:
    integration/canonical-production-20260816

    canonical pre-R3C1 HEAD:
    3ebbfb1c5a0ab732c0b64a72d232fd41065d94a0

    live backend image:
    sha256:57b3ab1ef0986c9e0c84253b7b35482cb15db990b04f115dc33024cbca608bcf

The live YKI fallback evaluation report proved:

    reportVersion = 1.2
    evaluationKind = yki_practice
    officialResult = false
    pronunciationAssessed = false
    provider = deterministic_fallback

The historical live verifier:

    apps/backend/scripts/verify_yki_ai_evaluation.py

still asserts:

    reportVersion == 1.0

The mismatch was isolated to that stale version assertion. After substituting
only the historical expected version in an ephemeral diagnostic copy, every
remaining assertion in that verifier passed.

Therefore:

    LIVE_YKI_REPORT_VERSION_1_2=PRESERVE
    LEGACY_VERIFIER_REPORT_VERSION_1_0=STALE

Do not downgrade current behavior to report version 1.0.

The later live report-calibration verifier passed and confirmed the version
1.2 behavior together with:

- evidence isolation;
- subjective score calibration;
- predicted grades;
- balanced productive-task counts;
- difficulty spread;
- report calibration contract.

The remaining live YKI protection scripts also passed:

    YKI_REGRESSION_SECTION_IMPROVEMENTS=PASS
    YKI_REGRESSION_GROUNDED_SALVAGE=PASS
    YKI_REGRESSION_EXACT_CORRECTIONS=PASS
    YKI_REGRESSION_RETRY_CONTRACT=PASS
    YKI_FINAL_SUBMIT_IDEMPOTENT_RECOVERY=PASS
    YKI_LOCAL_FALLBACK_PUBLIC_RUNTIME_ANSWERS_HIDDEN=PASS
    YKI_LOCAL_FALLBACK_RUNTIME_AND_EVALUATION=PASS
    YKI_REPORT_CALIBRATION_CONTRACT=PASS

The canonical client recovery gap was also reconfirmed:

    CANONICAL_FINAL_SUBMIT_RECOVERY=ABSENT
    CANONICAL_FINAL_SUBMIT_DEDUP=ABSENT
    CANONICAL_PERSISTED_RESULT_CONTRACT=ABSENT
    CANONICAL_EVALUATION_REPORT_CONTRACT=ABSENT

Those client capabilities remain assigned to R3C5.

No source write, staging, commit, restart, image change, or production
deployment occurred during R3B2.

### R3C1 source evidence

The canonical/live/donor comparison proved:

1. `apps/backend/app/runtime/yki.py` in the live image is source-identical to
   donor commit:

       7c92b7e65337568944013ad0ff2d73b08c1cfb44

   for the complete file.

2. The proven runtime capability adds/preserves:

   - engine session token across runtime refresh;
   - runtime schema version across refresh;
   - learner-scoped evaluation evidence;
   - persisted submission result;
   - persisted evaluation report;
   - submitted timestamp;
   - deep-copy isolation on stored/read mutable structures;
   - answer-key/private-field sanitization;
   - learner ownership enforcement.

3. The following runtime functions are part of that capability:

       record_yki_evaluation_evidence
       store_yki_evaluation_result
       read_yki_evaluation_evidence

4. The existing functions materially strengthened by the live capability are:

       store_yki_session
       sanitize_runtime_for_client
       get_yki_session_record

The canonical candidate was patched using the exact proven runtime donor delta,
not by replacing a broad workspace or cherry-picking a historical branch.

The resulting candidate was verified to be byte-for-byte identical to the
proven live `runtime/yki.py`.

R3C1 contract validation passed:

    R3C1_SESSION_INITIAL_STATE=PASS
    R3C1_EVIDENCE_WRITE_DEEPCOPY=PASS
    R3C1_EVIDENCE_READ_DEEPCOPY=PASS
    R3C1_EVALUATION_RESULT_PERSISTENCE=PASS
    R3C1_RUNTIME_REFRESH_PRESERVES_STATE=PASS
    R3C1_SESSION_READ_DEEPCOPY=PASS
    R3C1_LEARNER_OWNERSHIP=PASS
    R3C1_ANSWER_KEY_SANITIZATION=PASS
    R3C1_RUNTIME_PERSISTENCE_FOUNDATION=PASS

### R3C1 / R3C2 dependency-boundary correction

Current-code inspection disproved one assumption in the original package
boundary.

The canonical:

    apps/backend/app/services/yki_service.py

does not yet accept `transcript_text` in `submit_yki_speaking()`.

The proven live service implementation from both:

    c07b6effa280e843574f6151b67bb5548ae6d6b5
    d6d1061fc2214b7b62988214deebfd52c0f1c971

has the same speaking implementation and couples `transcript_text` to
`record_yki_evaluation_evidence()`.

Therefore the safe reconciliation boundary is amended to:

R3C1:
- runtime persistence/evidence foundation;
- `apps/backend/app/runtime/yki.py`.

R3C2:
- YKI service/evaluation integration;
- speaking transcript evidence integration;
- `apps/backend/app/services/yki_service.py`;
- `apps/backend/app/services/yki_evaluation_service.py`;
- `apps/backend/app/models/api_models.py` transcript request field;
- `apps/backend/app/routers/v1_yki.py` transcript forwarding.

This preserves one executable contract and avoids temporarily wiring the router
to a service signature that does not yet accept the argument.

This sequencing amendment does not remove any planned YKI capability.

Production remains the pinned composite backend until the complete
reconciliation and release gates pass.

Current status after R3C1 source validation:

    R3B2_LIVE_YKI_BASELINE=COMPLETE
    R3C1_RUNTIME_FOUNDATION=VALIDATED
    R3C2_SERVICE_API_EVALUATION_INTEGRATION=NEXT
    R3C3_LOCAL_FALLBACK_CALIBRATION=PENDING
    R3C4_PERMANENT_YKI_CI=PENDING
    R3C5_CLIENT_FINAL_SUBMIT_RECOVERY=PENDING
    PRODUCTION_DEPLOYMENT=PENDING

## 2026-08-16 YKI R3C2/R3C3 coherent backend checkpoint

### Dependency-order correction

Current-source inspection proved that the newer YKI service cannot be
integrated safely against the older canonical local fallback.

The proven live service requires:

- `normalize_local_runtime_for_client()`;
- evaluation evidence persistence;
- `local_submit_response()` with `runtime` and `evidence`;
- objective local scoring.

The older canonical fallback does not provide that complete contract.

The dependency-safe reconciliation order is therefore:

1. R3C1 — runtime persistence/evidence foundation;
2. R3C3 — local-fallback prerequisite;
3. R3C2 — service/API/evaluator integration;
4. R3C4 — permanent YKI CI;
5. R3C5 — current-client final-submit recovery.

R3C3 was deliberately not committed as an independently releasable
intermediate state because its richer fallback submission contract requires
the corresponding service integration.

### Isolated reconciliation worktree

Parallel KieliValmis SEO/domain work advanced the canonical branch without
touching the YKI source paths.

YKI reconciliation was therefore isolated at:

    branch:
    reconcile/yki-r3c2-r3c3-20260816

    worktree:
    /root/floently-yki-reconciliation-20260816

    base:
    749ffe3669cc1c6184482a735001af769bc71547

This prevents unrelated domain/SEO work from being mixed with the backend YKI
reconciliation.

### Proven source identities

The coherent candidate preserves the proven live sources:

    apps/backend/app/models/api_models.py
    c07b6effa280e843574f6151b67bb5548ae6d6b5

    apps/backend/app/routers/v1_yki.py
    c07b6effa280e843574f6151b67bb5548ae6d6b5

    apps/backend/app/runtime/yki.py
    7c92b7e65337568944013ad0ff2d73b08c1cfb44

    apps/backend/app/runtime/yki_local_fallback.py
    0e5dc84fa8dcdb0ea746f404c557d8683ce70b75

    apps/backend/app/services/yki_service.py
    d6d1061fc2214b7b62988214deebfd52c0f1c971

    apps/backend/app/services/yki_evaluation_service.py
    0e5dc84fa8dcdb0ea746f404c557d8683ce70b75

`yki_evaluation_service.py` is intentionally added as a new canonical tracked
source file.

### Preserved behavior

The coherent backend candidate preserves:

- speaking transcript request support;
- router transcript forwarding;
- speaking transcript evidence;
- writing evidence;
- objective answer evidence;
- canonical local runtime normalization;
- exact local reading/listening objective scoring;
- answer-key protection;
- persisted final submission;
- persisted evaluation report;
- idempotent completed-result recovery;
- grounded evaluation recovery;
- calibrated subjective scores;
- predicted grades;
- balanced productive task counts;
- productive-task difficulty spread.

Current evaluation contract:

    reportVersion = 1.2
    promptVersion = yki-deep-evaluation-v4
    rubricVersion = floently-yki-practice-v3

The historical verifier requiring report version 1.0 is stale. R3C4 must
repair or replace that verifier rather than downgrading current behavior.

### Validation

The combined candidate passed:

    R3C2_API_TRANSCRIPT_FIELD=PASS
    R3C2_ROUTER_TRANSCRIPT_FORWARDING=PASS
    R3C2_SERVICE_TRANSCRIPT_SUPPORT=PASS
    R3C2_FINAL_SUBMIT_PERSISTENCE_WIRING=PASS
    R3C2_LOCAL_SESSION_PAYLOAD=PASS
    R3C2_WRITING_EVIDENCE=PASS
    R3C2_SPEAKING_TRANSCRIPT_EVIDENCE=PASS
    R3C2_EVALUATION_PERSISTENCE=PASS
    R3C2_COMPLETED_RESULT_RECOVERY=PASS
    YKI_REGRESSION_SECTION_IMPROVEMENTS=PASS
    YKI_REGRESSION_GROUNDED_SALVAGE=PASS
    YKI_REGRESSION_EXACT_CORRECTIONS=PASS
    YKI_REGRESSION_RETRY_CONTRACT=PASS
    YKI_FINAL_SUBMIT_IDEMPOTENT_RECOVERY=PASS
    YKI_LOCAL_FALLBACK_PUBLIC_RUNTIME_ANSWERS_HIDDEN=PASS
    YKI_LOCAL_FALLBACK_RUNTIME_AND_EVALUATION=PASS
    YKI_REPORT_EVIDENCE_ISOLATION=PASS
    YKI_REPORT_SUBJECTIVE_SCORE_CALIBRATION=PASS
    YKI_REPORT_PREDICTED_GRADES=PASS
    YKI_BANK_BALANCED_COUNTS=PASS
    YKI_BANK_DIFFICULTY_SPREAD=PASS
    YKI_REPORT_CALIBRATION_CONTRACT=PASS

Warnings produced while exercising grounded-section salvage and first-attempt
structural validation are expected recovery-path diagnostics; their associated
verification contracts completed with PASS.

No backend overlay, restart, production image change, or deployment occurred.

Current status:

    R3C1_RUNTIME_FOUNDATION=COMPLETE
    R3C2_SERVICE_API_EVALUATOR=VALIDATED
    R3C3_LOCAL_FALLBACK=VALIDATED
    R3C2_R3C3_COHERENT_BACKEND=READY_TO_FREEZE
    R3C4_PERMANENT_YKI_CI=NEXT
    R3C5_CLIENT_FINAL_SUBMIT_RECOVERY=PENDING
    PRODUCTION_DEPLOYMENT=PENDING

## 2026-08-16 YKI R3C4 permanent CI checkpoint

### Missing permanent coverage discovered

After R3C2/R3C3 source reconciliation, the canonical branch had:

- no GitHub workflow referencing YKI;
- three tracked YKI pytest files;
- zero tracked copies of the five protected YKI verifier scripts that had
  already been used successfully against the live production image.

The tracked pytest suite also had no direct assertions for the newly
reconciled contracts including:

- speaking `transcript_text`;
- persisted `evaluation_report`;
- persisted `submission_result`;
- local-runtime normalization;
- local objective scoring;
- evaluation report version;
- final-submit idempotent recovery.

### Verifier provenance

All five protected verifier files were recovered from proven Git history and
were compared byte-for-byte with the corresponding copies in the live backend
image.

All five live/donor comparisons were exact.

Proven sources:

    verify_yki_ai_evaluation.py
    a4563de5fc76bdad287b889e2711d692763124bf

    verify_yki_evaluation_regression_recovery.py
    a1ee2a99fa2d8a6b8194b0b4d61593e8fa9a4d8a

    verify_yki_final_submit_recovery.py
    d6d1061fc2214b7b62988214deebfd52c0f1c971

    verify_yki_local_fallback_evaluation.py
    38ddfe292c3ff940c6eb0b4bd45b09519e92bae9

    verify_yki_report_calibration.py
    0e5dc84fa8dcdb0ea746f404c557d8683ce70b75

Four recovered verifiers remain byte-identical to their proven donors.

The AI evaluation verifier required exactly one compatibility correction:

    reportVersion == "1.0"
        ->
    reportVersion == "1.2"

No production runtime behavior was changed to satisfy the historical test.

### Stale orchestrator pytest

`test_submit_yki_exam_uses_stored_engine_token` originated before the enriched
evaluation response contract and asserted that the complete return value was:

    {"status": "submitted"}

Its actual purpose is stored engine-session-token routing. That behavior was
proved independently to remain correct.

The stale exact-result assertion was therefore replaced with assertions that:

- status remains `submitted`;
- `evaluation` is returned;
- `evaluationReport` is returned;
- the two evaluation views agree;
- a disclaimer is returned;
- the existing exact POST path/payload assertion, including
  `session_token == "stored-token"`, remains intact.

This protects the original routing behavior and the newer evaluation contract
without weakening either one.

### Permanent GitHub Actions gate

A single permanent workflow is now defined at:

    .github/workflows/yki-evaluation.yml

It executes:

1. compile validation for protected YKI source and verifier files;
2. AI evaluation fallback contract;
3. grounded evaluation regression/recovery contract;
4. final-submit idempotent recovery contract;
5. local-fallback and public-answer-protection contract;
6. report calibration and task-balance contract;
7. existing tracked YKI pytest suite.

The workflow disables live OpenAI evaluation for deterministic CI execution.

### Local pre-freeze result

Protected verifier results:

    YKI_AI_EVALUATION_FALLBACK=PASS
    YKI_REGRESSION_SECTION_IMPROVEMENTS=PASS
    YKI_REGRESSION_GROUNDED_SALVAGE=PASS
    YKI_REGRESSION_EXACT_CORRECTIONS=PASS
    YKI_REGRESSION_RETRY_CONTRACT=PASS
    YKI_FINAL_SUBMIT_IDEMPOTENT_RECOVERY=PASS
    YKI_LOCAL_FALLBACK_PUBLIC_RUNTIME_ANSWERS_HIDDEN=PASS
    YKI_LOCAL_FALLBACK_RUNTIME_AND_EVALUATION=PASS
    YKI_REPORT_EVIDENCE_ISOLATION=PASS
    YKI_REPORT_SUBJECTIVE_SCORE_CALIBRATION=PASS
    YKI_REPORT_PREDICTED_GRADES=PASS
    YKI_BANK_BALANCED_COUNTS=PASS
    YKI_BANK_DIFFICULTY_SPREAD=PASS
    YKI_REPORT_CALIBRATION_CONTRACT=PASS

Tracked YKI pytest result:

    5 passed

The same tracked YKI pytest set also passed under the existing general-CI
environment shape.

Current evaluation contract remains:

    reportVersion = 1.2
    promptVersion = yki-deep-evaluation-v4
    rubricVersion = floently-yki-practice-v3

No production image change, source overlay, service restart, or deployment
occurred during R3C4.

Current reconciliation status:

    R3C1_RUNTIME_FOUNDATION=COMPLETE
    R3C2_SERVICE_API_EVALUATOR=COMPLETE
    R3C3_LOCAL_FALLBACK=COMPLETE
    R3C4_PERMANENT_YKI_CI=READY_TO_FREEZE
    R3C5_CLIENT_FINAL_SUBMIT_RECOVERY=NEXT
    PRODUCTION_DEPLOYMENT=PENDING

## 2026-08-16 YKI R3C5 client recovery freeze

### Final client donor authority

The client dependency-closure audit established the final known historical YKI
client authority as:

    cc84c0058bc31d3235c875e9985a6908981b0703
    Save YKI speaking recordings when the timer expires

It descends from the complete July YKI evaluation/recovery chain and no later
descendant commit touches the reconciled R3C5 path set.

The final closed R3C5 source scope contains fourteen YKI-only client/core
paths:

    apps/client/features/exam/screens/ExamRuntimeScreen.tsx
    apps/client/features/exam/screens/ResultsOverviewScreen.tsx
    apps/client/features/exam/state/examResultsPersistence.ts
    apps/client/features/yki-exam/screens/YkiExamScreen.tsx
    apps/client/features/yki-exam/services/ykiExamService.ts
    apps/client/scripts/verify-yki-evaluation-integration.mjs
    apps/client/scripts/verify-yki-final-submit-recovery.mjs
    apps/client/scripts/verify-yki-local-fallback-contract.mjs
    apps/client/scripts/verify-yki-report-calibration.mjs
    apps/client/scripts/verify-yki-report-hardening.mjs
    apps/client/scripts/verify-yki-session-handoff.mjs
    apps/client/scripts/verify-yki-speaking-timer-autosave.mjs
    packages/core/api/voice.ts
    packages/core/api/ykiExam.ts

Roleplay source and the mixed roleplay/YKI detailed-report verifier were
explicitly excluded from R3C5.

### Controlled forward adaptations

Thirteen recovered paths remain functionally identical to their proven donor
behavior except for the specifically documented forward-compatible changes.

ResultsOverviewScreen.tsx received exactly six customer-facing/export rebrand
replacements from Floently to KieliValmis.

The technical AsyncStorage identifiers remain unchanged:

    floently:yki_exam_results
    floently:yki_exam_session_id
    floently:yki_exam_level_band

Those identifiers are intentionally preserved for installed-user/session
compatibility.

ExamRuntimeScreen.tsx received one non-functional lint-only wording repair:

    what you'd say
        ->
    what you would say

The repair removes the donor JSX react/no-unescaped-entities error without
changing YKI behavior.

### Recovered client capability

R3C5 restores and protects:

- authenticated YKI session handoff;
- fail-closed missing-session behavior;
- writing/speaking evaluation evidence;
- secure speaking audio references;
- persisted submission/evaluation recovery;
- final-submit deduplication after indeterminate gateway timeouts;
- no duplicate final-audio upload;
- finalization state freezing;
- persisted detailed evaluation reports;
- calibrated practice prediction;
- speaking recording autosave when the timer expires;
- an explicit recording-saving phase;
- single recorder-stop execution;
- result/export KieliValmis branding;
- existing storage-key compatibility.

### Local validation

The frozen candidate passed:

    R3C5_CLIENT_TYPESCRIPT=PASS
    R3C5_TARGETED_ESLINT=PASS
    R3C5_RUNTIME_ESLINT=PASS
    R3C5_SEVEN_YKI_CLIENT_VERIFIERS=PASS
    R3C5_KIELIVALMIS_REBRAND_REGRESSION=PASS
    R3C5_KIELIVALMIS_VISIBLE_BRAND_AUDIT=PASS
    R3C5_SHARED_VOICE_ROLEPLAY_REGRESSION=PASS
    R3C5_NAVIGATION_REGRESSION=PASS
    R3C5_FINAL_SUBMIT_AND_TIMER_CONTRACTS=PASS
    R3C5_LEGACY_STORAGE_KEYS_PRESERVED=PASS

Targeted ESLint completed with zero R3C5 errors. Warnings remain non-blocking.
A full-client lint probe exposed unrelated pre-existing errors outside the R3C5
scope; those were not changed during YKI source reconciliation.

### R3C4 remote verification

R3C4 was previously committed as:

    ad5fa3f27ba07109d88568068f18c4e374c03df9

The permanent YKI backend workflow completed successfully on GitHub Actions:

    workflow = YKI evaluation contract
    run_id = 31941424866
    job_id = 95151087175
    conclusion = success

### Permanent R3C5 CI extension

The existing YKI workflow now includes a dedicated client job protecting:

- Node 20;
- a pinned pnpm 10 toolchain;
- frozen-lockfile workspace installation;
- TypeScript compilation;
- targeted ESLint over the protected R3C5 source;
- all seven YKI client verifier scripts;
- KieliValmis native/visible-brand contracts;
- shared voice/roleplay audio invariants;
- navigation invariants.

The client job is triggered by YKI client/core source and relevant package,
TypeScript, ESLint, lockfile, and workflow changes.

No source overlay, backend image change, service restart, OTA publication,
mobile build, or production deployment occurred during R3C5 source freeze.

Current reconciliation status:

    R3C1_RUNTIME_FOUNDATION=COMPLETE
    R3C2_SERVICE_API_EVALUATOR=COMPLETE
    R3C3_LOCAL_FALLBACK=COMPLETE
    R3C4_PERMANENT_YKI_BACKEND_CI=COMPLETE
    R3C5_CLIENT_RECOVERY_SOURCE=READY_TO_FREEZE
    R3C5_PERMANENT_CLIENT_CI=READY_TO_VERIFY_REMOTELY
    PRODUCTION_DEPLOYMENT=PENDING
