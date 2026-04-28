# Cleanup Index

## Governing Matrix

- active matrix: `docs/cleanup/floently_finnish_duplication_cleanup_matrix_v2.md`
- no non-`_v2` matrix file exists in the repo

## Prompt Locations

- executed prompts live under `docs/cleanup/executed_prompts/`
- available executed prompts:
  - `cleanup_agent_prompt_pass_1.md`
  - `cleanup_agent_prompt_pass_2.md`
  - `cleanup_agent_prompt_pass_3.md`
  - `cleanup_agent_prompt_pass_4.md`
  - `cleanup_agent_prompt_pass_5.md`

## Report Locations

- Pass 1-4 historical reports live under `docs/cleanup/read_reports/`
- Pass 5 and the final ledgers live directly under `docs/cleanup/`

## Path Drift Notes

- earlier prompt text expected prior-pass reports at `docs/cleanup/pass_*`; the actual historical report location is `docs/cleanup/read_reports/`
- Pass 5 normalized the executed prompt location by moving `cleanup_agent_prompt_pass_5.md` into `docs/cleanup/executed_prompts/`
- `docs/cleanup/read_reports/pass_2_authority_map.md` still contains a historical statement claiming the non-`_v2` matrix exists; the actual governing file present in the repo is `docs/cleanup/floently_finnish_duplication_cleanup_matrix_v2.md`

## Final Cleanup Files

- `docs/cleanup/pass_5_report.md`
- `docs/cleanup/pass_5_authority_map.md`
- `docs/cleanup/pass_5_merge_log.md`
- `docs/cleanup/pass_5_quarantine_manifest.md`
- `docs/cleanup/pass_5_verification_results.md`
- `docs/cleanup/pass_5_repo_tree_after.txt`
- `docs/cleanup/pass_5_final_open_items.md`
- `docs/cleanup/04_group_by_group_merge_log.md`
- `docs/cleanup/05_quarantine_manifest.md`
- `docs/cleanup/07_verification_results.md`
- `docs/cleanup/09_final_repo_tree.txt`
- `docs/cleanup/10_final_verdict.md`
- `docs/cleanup/11_change_inventory.csv`
- `docs/cleanup/12_change_inventory.json`
