# MANUAL_E2E_TEST_MATRIX

Use this as the operator checklist. Mark `Pass/Fail` and add notes for every row.

| Screen / function | Prerequisite | Exact action | Expected result | Backend endpoint involved | Pass/Fail | Notes |
|---|---|---|---|---|---|---|
| Launch / splash / bootstrap | Backend + Expo running | Open app from Expo Go / emulator / web | App loads without fatal crash and lands on Home or Auth | none on first paint, then auth hydration |  |  |
| Home | App launched | Observe landing screen | Home renders with primary modes and utility drawer access | none required on render |  |  |
| Auth status | Backend running | Trigger hydration with no stored session | App resolves to signed-out state or mock session | `POST /api/v1/auth/mock-login` if mock auth is enabled |  |  |
| Login screen | App on Auth | Open `/auth/login` and submit email/password | Successful login returns to app without crash | `POST /api/v1/auth/login/password` |  |  |
| Register screen | App on Auth | Open `/auth/register` and create account | Account created and redirected without crash | `POST /api/v1/auth/register/password` |  |  |
| Sign out | Authenticated session exists | Trigger logout flow | Session cleared and app returns to auth-gated state | local persistence today; backend logout if wired later |  |  |
| Onboarding index | App reachable | Open onboarding start | Screen renders and navigation works | none or local routing |  |  |
| Onboarding intent | Onboarding started | Select intent | Next onboarding step opens | none or local routing |  |  |
| Onboarding profession | Profession step active | Choose profession | Next onboarding step opens | none or local routing |  |  |
| Onboarding frequency | Frequency step active | Choose frequency | Next onboarding step opens | none or local routing |  |  |
| Onboarding plan | Plan step active | Confirm plan | Flow completes without crash | none or local routing |  |  |
| Learn landing | Signed in | Open Learn from Home | Learn screen renders with planner / phrase bank / confidence / revision choices | `GET /api/v1/learning/system` via guarded flow |  |  |
| Learning planner | Learn screen | Open planner | Planner content renders | `GET /api/v1/learning/planner` |  |  |
| Phrase bank | Learn screen | Open phrase bank | Phrase bank content renders | `GET /api/v1/learning/phrase-bank` |  |  |
| Confidence | Learn screen | Open confidence | Confidence content renders | `GET /api/v1/learning/confidence` |  |  |
| Revision vault | Learn screen | Open revision vault | Revision queue renders | `GET /api/v1/learning/revision-vault` |  |  |
| Cards | Signed in | Open cards and request a session | Card items load and answer submission works | `GET /cards/session`, `POST /cards/answer` |  |  |
| YKI Practice landing | Signed in | Open Home → YKI | Practice screen renders | `GET /api/v1/yki-practice/overview` |  |  |
| YKI mock cycle | Signed in | Open mock cycle | Mock cycle content renders | `GET /api/v1/yki-exam/mock-cycle` |  |  |
| YKI exam intro | Signed in | Open YKI Exam | Exam intro renders | route shell + exam endpoints as wired |  |  |
| YKI exam runtime | Signed in | Advance into runtime flow as far as safely possible | No blank screen; guarded failures are controlled | YKI session endpoints under `/api/v1/yki/*` |  |  |
| YKI results | YKI exam path active | Open results | Results screen renders without crash | depends on current exam flow state |  |  |
| YKI certificate | YKI exam path active | Open certificate screen | Certificate screen renders without crash | `GET /api/v1/yki/sessions/{id}/certificate` if session exists |  |  |
| Speaking lab | Signed in | Open Speak from Home | Speaking lab renders | `GET /api/v1/speaking-lab/overview` |  |  |
| Speaking audio action | Device with mic | Start a speaking-related action | No fatal crash; controlled error acceptable if provider unavailable | `/api/v1/voice/*` |  |  |
| Professional Finnish landing | Signed in | Open Work from Home | Professional screen renders | `GET /api/v1/professional/overview` |  |  |
| Workplace incident lab | Professional area open | Open incident lab | Incident content renders | `GET /api/v1/learning/workplace-incident/{track}` |  |  |
| Progress | Signed in | Open utility drawer → Progress | Progress route renders and deep-links to core areas work | none required on first render |  |  |
| Settings | Signed in | Open utility drawer → Settings | Settings route renders and secondary links work | none required on first render |  |  |
| Help | Signed in | Open utility drawer → Help | Help route renders and deep-links work | none required on first render |  |  |
| Billing status | Signed in | Open utility drawer → Billing | Billing route renders current plan state | `GET /api/v1/subscription/status` |  |  |
| Billing checkout | Signed in | Tap a plan card | Checkout URL is returned and launch is attempted | `POST /api/v1/subscription/checkout` |  |  |
| Billing portal | Signed in | Tap manage subscription | Portal URL is returned and launch is attempted | `POST /api/v1/subscription/portal` |  |  |
| Persistence after restart | Existing session | Fully restart app | Auth/session data restores without crash | AsyncStorage-backed client persistence |  |  |
| Web route `/` | Backend + web client running | Open `http://localhost:19006/` or Expo web URL | Home route renders | same as app root |  |  |
| Web route `/read` | Web client available | Open `/read` | Expected product surface resolves or explicit gap is noted | web routing layer |  |  |
| Web route `/learn` | Web client available | Open `/learn` | Learn product surface resolves | learning endpoints if data-backed |  |  |

## Notes for operator

- A controlled `401 AUTH_REQUIRED` is a pass for protected endpoints when no auth token is present.
- A blank screen, red screen, unhandled crash, or plain-text `500 Internal Server Error` is a fail.
- For audio and billing, controlled “provider unavailable” or dev stub behavior is acceptable in local readiness if the app stays stable.
