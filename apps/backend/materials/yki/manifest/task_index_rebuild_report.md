# Task Index Rebuild Report

Generated at: 2026-04-11T12:37:18+00:00

## SECTION 1 — Index Schema

The runtime now loads `runtime_index` from `apps/backend/materials/yki/task_banks/task_index_v3_2.json`. Each audited entry also records the atomic classification and source bank used during rebuild.

```json
{
  "version": "3.2.0",
  "generated_at": "2026-03-12T00:00:00+00:00",
  "entry_schema": [
    "level_band",
    "skill",
    "task_type",
    "atomic_task_type",
    "task_id",
    "file_path",
    "bank_label",
    "bank_kind",
    "salvage_source",
    "quality_status",
    "selected_for_runtime"
  ],
  "entries": [
    {
      "level_band": "B1_B2",
      "skill": "reading",
      "task_type": "reading_mcq_set",
      "atomic_task_type": "reading_mcq",
      "task_id": "example-id",
      "file_path": "/abs/path/to/task.json",
      "bank_label": "workspace_certified_bank",
      "bank_kind": "certified",
      "salvage_source": false,
      "quality_status": "unknown",
      "selected_for_runtime": true
    }
  ],
  "runtime_index": {
    "B1_B2": {
      "reading_mcq_set": [
        ["/abs/path/to/task.json", "example-id"]
      ]
    }
  }
}
```

## SECTION 2 — Atomic Task Inventory

| Atomic task type | Count |
| --- | ---: |
| listening_mcq | 618 |
| listening_open_response | 0 |
| listening_true_false | 0 |
| reading_mcq | 2111 |
| reading_open_response | 0 |
| reading_summary | 0 |
| reading_true_false | 0 |
| speaking_interview_discussion | 0 |
| speaking_interview_topic | 0 |
| speaking_micro_situations | 0 |
| speaking_narrative_timed | 0 |
| speaking_opinion_monologue | 0 |
| speaking_simulated_dialogue | 1510 |
| writing_descriptive_short | 792 |
| writing_email_or_request | 1585 |
| writing_formal_complaint | 166 |
| writing_job_application | 469 |
| writing_opinion_argument | 1519 |
| writing_short_message | 0 |
| writing_structured_feedback | 936 |

## SECTION 3 — Bank Salvage Results

| Bank | Accepted usable tasks | Rejected unusable tasks |
| --- | ---: | ---: |
| workspace_certified_bank | 9706 | 0 |
| external_certified_archive | 0 | 0 |
| external_raw_bank | 0 | 0 |

## SECTION 4 — Missing Critical Pools

- `listening_mcq_set`: available `227`, required `4`, satisfied `True`.
- No critical pools are below the blueprint minimum after rebuild.

## SECTION 5 — Blueprint Compatibility

| Blueprint pool | Required | Available | Satisfied |
| --- | ---: | ---: | --- |
| reading_mcq_set | 4 | 965 | True |
| listening_mcq_set | 4 | 227 | True |
| writing_prompt | 2 | 2046 | True |
| speaking_roleplay | 2 | 644 | True |

## SECTION 6 — Runtime Safety Checks

- Validate that `apps/backend/materials/yki/task_banks/task_index_v3_2.json` exists at server startup.
- If the index is missing or malformed, run `build_task_index_v3_2` automatically before serving traffic.
- Reject startup when blueprint pools for `B1_B2` do not meet minimum counts.
- Re-validate the selected task payloads for placeholder markers and empty content during every rebuild.
- Keep explicit `task_index_salvaged_tasks.json` and `task_index_unusable_tasks.json` audit trails so runtime repairs remain explainable.

Rejected unusable task records written: `0`.
Selected salvaged task records written: `0`.
