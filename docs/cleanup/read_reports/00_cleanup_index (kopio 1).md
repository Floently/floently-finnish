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
  - `cleanup_agent_prompt_pass_final.md`

## Report Locations

- historical Pass 1-5 reports and prior final ledgers live under `docs/cleanup/read_reports/`
- current Pass 6 and current final ledgers live directly under `docs/cleanup/`

## Path Drift Notes

- the pre-existing worktree moved Pass 5 and prior final ledgers into `docs/cleanup/read_reports/`
- Pass 6 preserves that history and recreates current final ledgers at the top level of `docs/cleanup/`
- executed prompts are normalized under `docs/cleanup/executed_prompts/`, including the final residue-cleanup prompt

## Current Final Cleanup Files

- `docs/cleanup/pass_6_residue_cleanup_report.md`
- `docs/cleanup/pass_6_residue_inventory.md`
- `docs/cleanup/pass_6_merge_and_move_log.md`
- `docs/cleanup/pass_6_quarantine_manifest.md`
- `docs/cleanup/pass_6_verification_results.md`
- `docs/cleanup/pass_6_repo_tree_after.txt`
- `docs/cleanup/pass_6_keep_justification.md`
- `docs/cleanup/pass_6_final_verdict.md`
- `docs/cleanup/04_group_by_group_merge_log.md`
- `docs/cleanup/05_quarantine_manifest.md`
- `docs/cleanup/07_verification_results.md`
- `docs/cleanup/09_final_repo_tree.txt`
- `docs/cleanup/10_final_verdict.md`
- `docs/cleanup/11_change_inventory.csv`
- `docs/cleanup/12_change_inventory.json`
