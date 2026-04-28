Scope: tasks that cannot be safely completed without user-controlled secrets, accounts, or approval.

Handoff items:

1. User secret rotation
- Required because the earlier audit found real secrets in local env and tracked runtime state.
- Next action: rotate the exposed OpenAI key and any related credentials immediately.
- Verification: confirm old credentials are revoked and new secrets are injected only via ignored env/config channels.

2. Android release signing
- Required because release builds now fail closed unless real signing material is supplied.
- Next action: provide `FLOENTLY_UPLOAD_STORE_FILE`, `FLOENTLY_UPLOAD_STORE_PASSWORD`, `FLOENTLY_UPLOAD_KEY_ALIAS`, and `FLOENTLY_UPLOAD_KEY_PASSWORD`.
- Verification: `cd android && ./gradlew assembleRelease`.

3. Billing configuration
- Required because checkout/portal are intentionally non-functional until configured.
- Next action: set `BILLING_CHECKOUT_BASE_URL` and `BILLING_PORTAL_BASE_URL`, or replace those URL shims with real provider-backed server logic.
- Verification: authenticated checkout and portal calls return real URLs.

4. Backend dependency hygiene in the active venv
- Required because full pytest still shows missing `jwt` in the local backend environment even though auth code imports it.
- Next action: reconcile the backend venv with `apps/backend/requirements.txt` and rerun full backend pytest.
- Verification: `apps/backend/.venv/bin/pytest apps/backend/tests -q`.

5. Content-bank/YKI subject-matter remediation
- Required because the audit packet remains `NO-GO` on professional bank integrity and YKI authority integrity.
- Next action: execute the augmentation plan from the audit packet and obtain domain/content signoff.
- Verification: updated coverage metrics plus refreshed integrity audit.
