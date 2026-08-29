# KieliValmis combined iOS candidate — local source qualification evidence

**Date:** 2026-08-29  
**Repository:** `Floently/floently-finnish`  
**Release branch:** `release/ios-wave1-combined-20260829`  
**Exact qualified SHA:** `13212827d31a82331e3440f55ca31eab9d538288`  
**Parent SHA:** `8b7725b3e775c844d2b0b670b28ec7642dd72903`  
**Qualification host:** Linux  
**Node:** `v22.23.2`  
**pnpm:** `10.34.0`

## Source identity and ancestry

- Authoritative GitHub release branch was verified after push to point exactly to `13212827d31a82331e3440f55ca31eab9d538288`.
- Package 00 source reconciliation had previously passed against the combined release line, including canonical-production and frozen Wave-1 ancestry.
- The final qualified SHA differs from the prior combined candidate only by a test-only publication-lifecycle fixture repair in `apps/backend/tests/test_publication_lifecycle.py`.
- The repair makes that lifecycle regression deterministic by using the repository's current-schema `VOCABULARY_CARD_PAYLOAD` inside an isolated temporary canonical root rather than depending on mutable/legacy checked-in canonical-bank content.
- Runtime source was not changed by the final repair.

## Final exact-SHA qualification results

The full local qualification completed on exact SHA `13212827d31a82331e3440f55ca31eab9d538288` with these results:

```text
TEST_ONLY_FIX_DELTA=PASS
INTEGRATED_RELEASE_PROTECTED_DIFF=PASS
APPSHELL_AUDITED_DELTA_15_0=PASS

Complete deployable backend suite:
70 passed, 3 warnings

Professional Mission contract:
1 passed

ACCOUNT_DELETION_ACCESS_INVARIANTS=PASS
NAVIGATION_INVARIANTS=PASS
REVENUECAT_IDENTITY_INVARIANTS=PASS
STORE_BILLING_PREFLIGHT_INVARIANTS=PASS
IOS_RELEASE_IDENTITY_INVARIANTS=PASS
ROLEPLAY_CONTRACT_RELIABILITY=PASS
ROLEPLAY_MISSION_BANK_VERIFICATION=PASS
VOICE_REGISTRY_INVARIANTS=PASS
ROLEPLAY_VOICE_IDENTITY_INVARIANTS=PASS
YKI_REPORT_CALIBRATION_CONTRACT=PASS
Reading engine verification passed: 16 tests
PRACTICE_COMPOSER_VERIFIER=PASS
LEARNING_EXPERIENCE_SYSTEM=PASS
ROLEPLAY_AUDIO_INVARIANTS=PASS
ROLEPLAY_SCENARIO_ROTATION=PASS
YKI_CLIENT_EVALUATION_INTEGRATION=PASS
WAVE1_AGENT_GOVERNANCE=PASS
WAVE1_SHARED_LEARNING_CONTRACT=PASS
WAVE1_PRODUCTION_FIREWALL=PASS
WAVE1_FEATURE_BRANCH_FIREWALL=PASS
i18n completeness: passed
KIELIVALMIS_NATIVE_DISPLAY_IDENTITY=PASS
KIELIVALMIS_NATIVE_TECHNICAL_IDS_PRESERVED=PASS
KIELIVALMIS_NATIVE_20_LANGUAGES=PASS
KIELIVALMIS_SIGNED_IN_APP_BRAND=PASS
KIELIVALMIS_NATIVE_ASSET_HASHES=PASS
KIELIVALMIS_NATIVE_RELEASE_VERSION_UNCHANGED=PASS

FINAL_LOCAL_CANDIDATE_SHA=13212827d31a82331e3440f55ca31eab9d538288
PROTECTED_INVARIANT_GATES=PASS
APP_REVIEW_REMEDIATION_SOURCE=PASS
WAVE1_RELEASE_SOURCE=PASS
IOS_LOCAL_SOURCE_QUALIFICATION=PASS
```

## Qualification interpretation

`PROTECTED_INVARIANT_GATES=PASS` applies to the deployable production backend (`apps/backend`) plus the protected Wave-1/Roleplay/YKI/client/governance verifiers used by the combined release candidate. The historical root `engine/` tree is not part of the production backend Docker image and is not used to downgrade this exact-candidate release gate. Its previously observed missing-module collection problem remains a legacy repository issue rather than a shipped-runtime regression.

## Remaining release boundary

This evidence proves repository/source qualification only. It does **not** authorize App Store submission or production deployment. Remaining required evidence includes:

- resolved iOS/Expo/EAS build preflight;
- immutable EAS iOS artifact and build number;
- artifact SHA/bundle identity reconciliation;
- physical-device StoreKit/RevenueCat purchase, restore and account-deletion acceptance;
- genuine iOS screenshots;
- physical-device reviewer deletion video and reviewer notes.
