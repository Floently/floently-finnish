# Floently Pipeline v5

## Main updates
- Unicode-safe `run_pipeline` launcher. Runspec paths containing Finnish characters now stay intact.
- Fails fast when an input path does not exist.
- Adds optional **global bank dedupe**:
  - per-run exact dedupe still happens first
  - then the run can compare kept items against one or more existing bank roots
  - also compares across batches inside the same run
- Adds `audit-bank` command to scan an existing bank and report duplicate clusters without mutating the bank.

## Run with global bank dedupe
Add this to a runspec JSON:

```json
{
  "global_bank_paths": [
    "/path/to/apps/backend/card_bank/canonical_bank",
    "/path/to/apps/backend/card_bank/ready_bank"
  ]
}
```

## Audit an entire bank
```bash
python -m floently_pipeline.cli audit-bank   --input /path/to/apps/backend/card_bank/canonical_bank   --input /path/to/apps/backend/card_bank/ready_bank   --output /path/to/bank_audit_output
```
