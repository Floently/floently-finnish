# Deployment Readiness Scorecard

| Area | Score | Status | Evidence |
| --- | ---: | --- | --- |
| Reproducibility | 1/10 | Blocked | committed `/node_modules`, inconsistent env contract, broken clean-machine assumptions |
| Source-of-truth discipline | 2/10 | Blocked | multiple backend route stacks, multiple client API/config layers |
| Backend readiness | 3/10 | Blocked | `main.py` mock/dev behavior, permissive CORS, silent route loading faults |
| Engine integrity | 6/10 | At risk | root engine is comparatively strong, but backend-local YKI logic still competes |
| Client readiness | 1/10 | Blocked | TypeScript build fails with many unresolved imports/aliases |
| Learning-product integrity | 5/10 | Partial | real scheduling/confidence concepts exist, but runtime wiring is inconsistent |
| Accessibility | 2/10 | Unverified | broken client build prevents credible WCAG verification |
| Security baseline | 2/10 | Blocked | committed runtime state, unsafe defaults, weak config hygiene |
| CI/supply chain | 2/10 | Blocked | CI suppresses failures; package/workspace metadata under-specified |
| Deployment descriptors | 4/10 | Partial | Docker/compose/render files exist but are under-specified and env-drifted |
| Test realism | 4/10 | At risk | meaningful engine/cards tests exist, but active app mounting is unclear and CI is non-gating |

## Overall score

**32/110**

## Final rating

**Deployment blocked**

## Must-pass exit criteria

1. Clean clone installs without committed local artifacts.
2. Backend has one authoritative mounted API.
3. Client typecheck passes.
4. Runtime state/auth data is removed from source control.
5. CI fails on real backend/client errors.
6. Environment and deployment contracts are aligned and documented.
