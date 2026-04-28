# Go-live trust and procurement guardrails

This patch bundle is aligned to a conservative, institution-friendly release posture.

## Product trust guardrails
- deterministic roleplay scenario routing before AI turn generation
- profession-specific scenario registry
- graceful fallback to typed input when speech fails
- explicit card issue flagging
- card coach hint generation with safe fallback
- separation of placement recommendation from entitlement access

## Security and procurement guardrails
- keep audit-friendly route and scenario contracts
- use explicit API payloads and typed request/response shapes
- avoid silent cross-profession access in paid professional flows
- keep placement skippable and explainable
- keep public-facing AI feedback advisory, not high-stakes automated decision making
- maintain an accessible mobile UI and strong tap targets

## Release blockers to re-check before production
- roleplay STT availability on target production devices
- profession entitlement consistency across all entry points
- card runtime source confirmed on canonical published bank
- empty or malformed card filtering confirmed in production data
- storage, crash logging, and privacy notices reviewed
