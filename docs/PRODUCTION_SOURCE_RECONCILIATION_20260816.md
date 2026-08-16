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
