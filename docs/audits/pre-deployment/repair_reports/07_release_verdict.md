Scope: final release verdict after this remediation pass.

Release readiness verdict:
- Decision: `NO-GO`

Reasoning:
- PASS: production-truth fixes landed for auth storage, entitlement override behavior, card authz, TTS authority, deploy/env drift, API base URL drift, and Android release-signing safety.
- FAIL: full backend pytest is still red in legacy card/YKI areas.
- FAIL: release signing material is still external and not yet validated in a real release build.
- FAIL: billing provider configuration is still absent.
- FAIL: the original professional-bank and YKI content integrity blockers remain open.

Deployment impact:
- blocks deployment

Owner summary:
- backend: full pytest/test fixture/YKI contract cleanup
- infra/devops: release signing and env injection
- product/content: billing/provider decisions and content-bank remediation
- security/compliance: secret rotation confirmation
