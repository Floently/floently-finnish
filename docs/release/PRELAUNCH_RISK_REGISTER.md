# Prelaunch Risk Register

Last updated: 2026-04-23

| ID | Risk | Severity | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R-01 | External digital subscription checkout in mobile app | Critical | Apple/Google rejection likely | Replace with StoreKit + Google Play Billing compliant flows | Product + Mobile |
| R-02 | No in-app account deletion path | Critical | Store rejection for account-based app | Implement in-app delete entry + backend deletion endpoint + external deletion page | Product + Backend + Mobile |
| R-03 | Privacy policy/support URLs not finalized | High | Submission blocks and trust loss | Publish legal pages and wire URLs in app/store listings | Product + Legal |
| R-04 | Production env/secrets not fully provisioned | High | Runtime auth/voice outages | Use production env template; validate all required secrets before deploy | Backend/DevOps |
| R-05 | SQLite default production DB | Medium | Durability and scaling risk | Move to managed Postgres; add backup/restore drills | Backend/DevOps |
| R-06 | Cleartext-friendly Android config posture | Medium | Security posture concern | Use HTTPS-only release config and validate network security config | Mobile |
| R-07 | Incomplete observability for incident response | Medium | Slower outage diagnosis | Centralize logs + retention + alerting on health and error rates | DevOps |
| R-08 | Reviewer confusion around voice/AI behavior | Medium | Review delays/rejections | Add reviewer notes + test account + explicit microphone disclosure | Release manager |
| R-09 | Release signing process not finalized | Medium | Build/submission delays | Lock keystore strategy + App Store Connect/Play credentials | Mobile/Release |
| R-10 | Host-level misconfiguration (TLS/firewall/proxy) | Medium | Availability and security incidents | Follow runbook, enforce firewall, verify TLS and proxy headers | DevOps |

## Top 3 Launch Blockers

1. Payments compliance for digital subscriptions.
2. Account deletion compliance.
3. Legal/public URL completion (privacy/support/terms).

