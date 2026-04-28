You are the release-compliance implementation agent for Floently Finnish.

Repository root:
/home/vitus/floently-finnish

Primary mission:
Implement the remaining launch blockers so the app can move toward compliant Google Play and Apple App Store release while the backend is being deployed to Hetzner.

You must implement all of the following workstreams end to end:

1. In-app account deletion + backend deletion flow
2. Replace external mobile subscription checkout with store-compliant billing paths
3. Publish and wire final privacy policy, terms, support, and deletion URLs
4. Finalize Android signing and prepare EAS build/upload to internal/beta tracks first
5. Tighten any adjacent release-critical compliance/security/config gaps you find, but only where they are clearly needed for store compliance or production readiness

This is an implementation task, not just an audit.
You must patch code, config, docs, and release setup where appropriate.

==================================================
AUTHORITATIVE CONTEXT TO READ FIRST
==================================================

Read these first and use them as the current project truth:
- /home/vitus/floently-finnish/docs/release/APP_STORE_SUBMISSION_CHECKLIST.md
- /home/vitus/floently-finnish/docs/release/GOOGLE_PLAY_SUBMISSION_CHECKLIST.md
- /home/vitus/floently-finnish/docs/release/STORE_POLICY_COMPLIANCE_REPORT.md
- /home/vitus/floently-finnish/docs/release/PRIVACY_AND_TERMS_REQUIREMENTS.md
- /home/vitus/floently-finnish/docs/release/MOBILE_RELEASE_READINESS_AUDIT.md
- /home/vitus/floently-finnish/docs/release/PRELAUNCH_RISK_REGISTER.md
- /home/vitus/floently-finnish/docs/deployment/HETZNER_BACKEND_PRODUCTION_AUDIT.md
- /home/vitus/floently-finnish/docs/deployment/HETZNER_BACKEND_DEPLOYMENT_RUNBOOK.md
- /home/vitus/floently-finnish/docs/release/FINAL_DEPLOYMENT_AND_SUBMISSION_PLAN.md

==================================================
OFFICIAL POLICY BASELINE YOU MUST FOLLOW
==================================================

Use official sources only when checking or refining requirements.

Apple:
- Apps that support account creation must let users initiate account deletion in-app.
- Apple requires a privacy policy URL in App Store Connect and app privacy disclosures.
- Apps requesting microphone access must provide a clear NSMicrophoneUsageDescription.
- Digital goods/features/services sold in-app must use Apple’s in-app purchase model under App Review Guideline 3.1.1.
Sources:
- Apple account deletion guidance
- App Store Connect manage app privacy
- Apple app privacy details
- NSMicrophoneUsageDescription
- App Review Guidelines

Google Play:
- If the app supports account creation, it must provide an in-app account deletion path, and Play requires account deletion handling to be declared through its policy/data safety process.
- Play-distributed apps selling access to in-app digital features/services/content must use Google Play Billing unless a policy exception applies.
- Privacy policy and Data safety disclosures must be completed and accurate.
Sources:
- Google Play account deletion requirement
- Google Play payments policy
- Google Play user data/privacy policy
- Google Play data safety form

Expo/EAS:
- Store distribution requires signed builds.
- EAS Submit can upload to Play/App Store, but Google Play API submissions require the app to be uploaded manually at least once before API submissions work.
- Android signing should use a proper upload keystore / Play App Signing path, not a debug keystore.
Sources:
- Expo app credentials
- EAS Submit

Do not rely on memory for policy language. Verify if needed against the official docs above.

==================================================
IMPLEMENTATION WORKSTREAM 1
ACCOUNT DELETION
==================================================

Implement a complete account deletion flow that satisfies store expectations.

You must implement:
A. Backend deletion capability
- authenticated endpoint to initiate account deletion
- deletion of account-linked personal data unless legally required to retain some data
- safe deletion job/flow for associated voice/transcript/user content where applicable
- clear response model
- audit-safe logging without leaking personal data

B. In-app deletion initiation
- visible Settings/Account entry for “Delete Account”
- clear confirmation flow
- explanatory copy that is not misleading
- if deletion is delayed/manual, user must be informed of timing

C. External deletion page support
- create a public deletion page/URL suitable for Google Play requirements if the app has account creation
- wire it into release docs and metadata

D. Legal/compliance surfaces
- update privacy/terms/support/deletion docs to match the implemented behavior
- do not invent legal claims beyond what the app actually does

Requirements:
- do not implement only “deactivate account”
- do not hide deletion behind customer support unless a clearly justified regulated exception applies
- deletion initiation must be reachable inside the app

==================================================
IMPLEMENTATION WORKSTREAM 2
STORE-COMPLIANT BILLING
==================================================

Replace the current external checkout path for mobile app digital access with compliant platform billing behavior.

You must:
A. Find every current mobile code path that opens external checkout URLs for digital subscriptions/features
B. Remove or gate those flows appropriately on mobile platforms
C. Implement store-compliant billing integration path(s) for:
- iOS: Apple in-app purchase flow
- Android: Google Play Billing flow

If the project currently lacks a billing library:
- choose the most appropriate stable approach for the stack in use
- implement the minimum viable store-compliant billing architecture
- wire it so mobile app users do not hit external digital checkout for in-app digital access

You must also:
- preserve web/external checkout only where policy-safe and platform-appropriate
- clearly separate mobile store billing from any web-only purchase flow
- update release docs and reviewer notes to reflect the new purchase path

Important:
Do not leave a policy-violating external digital purchase path accessible from the released mobile app.

==================================================
IMPLEMENTATION WORKSTREAM 3
PRIVACY / TERMS / SUPPORT / DELETION URLS
==================================================

Create and wire the final public-facing legal/support documents and URLs needed for release.

You must:
A. Create production-ready drafts in the repo for:
- Privacy Policy
- Terms of Use / Terms & Conditions
- Support / Contact page
- Account deletion page

B. Ensure the text matches actual app/backend behavior:
- account data
- voice recordings and transcriptions
- third-party processors used by the app
- deletion/retention behavior
- support path
- subscription/billing behavior

C. Wire these into the app where appropriate:
- Settings
- auth/account surfaces
- any store-facing metadata/config files

D. Prepare final URL placeholders or real publishable paths, depending on current hosting setup.

Important:
- Do not fabricate the company’s legal identity details if they are not already in the repo; instead create clearly marked owner-fill sections where necessary.
- Keep the drafts production-ready and conservative.
- Avoid statements that create legal risk by overpromising.

==================================================
IMPLEMENTATION WORKSTREAM 4
ANDROID SIGNING + EAS INTERNAL/BETA RELEASE PREP
==================================================

Finalize Android signing and release setup properly.

You must:
A. Inspect current Android/EAS configuration
B. Remove any release path that uses a debug keystore
C. Configure the correct release signing path for Play App Signing / upload key
D. Prepare EAS build and submit configuration for internal/beta testing first
E. Document the exact remaining credential-boundary steps if Play Console credentials are required

You must also:
- ensure versioning/build numbering is sane
- ensure production API base URL points to the Hetzner deployment for release builds
- ensure cleartext-traffic posture is production-safe
- ensure no dev-only config leaks into release build

==================================================
IMPLEMENTATION WORKSTREAM 5
ADJACENT RELEASE-CRITICAL IMPROVEMENTS
==================================================

You may also fix tightly related issues if they are clearly needed now and reduce release/legal risk, including:

- support/contact link wiring
- clearer microphone permission rationale copy
- app review/reviewer notes drafts
- better user-facing privacy/account/billing settings labels
- release-safe environment separation
- security-sensitive config cleanup
- app metadata/store config files
- backend endpoint hardening for deletion flows
- deletion confirmation email/logging if already supported by stack

Do NOT widen scope into unrelated product redesign.

==================================================
SPECIFIC WORDING / COMPLIANCE EXPECTATIONS
==================================================

Use wording and UX that aligns with platform expectations:

1. Account deletion
- Must say “Delete Account”
- Must make clear it deletes the account and associated personal data, subject to legal retention requirements
- If not immediate, tell the user how long it takes
- If subscriptions are involved, explain separately how cancellation/billing is handled

2. Microphone permission
- Make usage descriptions plain and specific
- Example intent: practicing spoken Finnish, recording short speaking responses, transcribing responses for roleplay/feedback
- Avoid vague “we need microphone access” wording

3. Privacy policy
- Must clearly mention voice recordings/transcriptions if used
- Must mention third-party processors if they process app data
- Must describe retention/deletion rights accurately
- Must include support/privacy contact path

4. Support
- Must be public and suitable for store listing use
- Must not rely only on a hidden in-app support flow

5. Billing
- Must not imply the user should subscribe on the web from the mobile app for digital access
- Must be explicit and policy-safe

==================================================
FILES / AREAS TO INSPECT
==================================================

At minimum inspect and modify as needed:
- apps/client/app.json
- apps/client/eas.json
- apps/client/android/**
- apps/client/package.json
- apps/client/features/**
- apps/client/state/**
- packages/core/**
- apps/backend/app/**
- backend/account/auth/user/profile/settings/delete flows if present
- store metadata / docs / release config files
- any current checkout/subscription code paths
- any privacy/support/legal links or placeholders

Also inspect any existing:
- subscription screens
- settings screens
- profile/account screens
- auth/account models
- backend user/account deletion services
- web/static/docs hosting paths if used for legal pages

==================================================
VERIFICATION YOU MUST RUN
==================================================

You must verify your implementation with as much certainty as possible.

At minimum:
1. Backend import/start sanity
2. TypeScript sanity for touched files
3. Build/config sanity for touched mobile release files
4. Grep checks to ensure policy-violating external mobile checkout paths are removed or gated
5. Grep checks to ensure Delete Account entry and backend endpoint exist
6. Confirm privacy/support/terms/deletion URLs are wired in the expected places
7. Confirm Android release no longer relies on debug keystore
8. Confirm EAS internal/beta release instructions are concrete and up to date

If some final steps require external credentials or console access:
- prepare everything up to that boundary
- document the exact remaining human action

==================================================
DELIVERABLES
==================================================

Write all outputs into:

/home/vitus/floently-finnish/docs/release/
and
/home/vitus/floently-finnish/docs/deployment/

Create or update at least:
1. ACCOUNT_DELETION_IMPLEMENTATION_REPORT.md
2. BILLING_COMPLIANCE_IMPLEMENTATION_REPORT.md
3. LEGAL_URLS_AND_INAPP_LINKING_REPORT.md
4. ANDROID_SIGNING_AND_EAS_RELEASE_REPORT.md
5. STORE_REVIEWER_NOTES_DRAFT.md
6. UPDATED_PRELAUNCH_BLOCKERS_STATUS.md

If useful, also create:
- legal page markdown/html files
- release env templates
- store config/update files
- submission notes
- deletion API docs
- internal testing checklist

==================================================
SUCCESS CRITERIA
==================================================

This task is complete only if:
- in-app account deletion exists and backend deletion path exists
- mobile external digital subscription checkout is removed or replaced with store-compliant billing
- privacy/terms/support/deletion documents and URLs are created and wired
- Android signing/release path is corrected away from debug signing
- EAS internal/beta release path is concretely prepared
- no new legal/policy issue is introduced by the implementation
- remaining external-account actions are clearly documented

Proceed end to end.
