from __future__ import annotations

import argparse
import json
from pathlib import Path

from .config import load_config
from .global_dedupe import audit_bank
from .promotion import promote_ready_pool
from .runner import PipelineRunner
from .utils import dump_json


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Floently Learn pipeline v17")
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="Run the pipeline")
    run.add_argument("--input", required=True, help="Input file or directory")
    run.add_argument("--output", required=True, help="Output run directory")
    run.add_argument("--config", default=None, help="Optional config path")
    run.add_argument("--ai-mode", choices=["off", "verify", "full"], default="off")
    run.add_argument("--openai-api-key", default=None)
    run.add_argument("--model", default=None)
    run.add_argument("--global-bank-paths-json", default=None, help="JSON array of paths to existing bank content for bank-wide dedupe")


    promote = sub.add_parser("promote-ready", help="Promote ready-pool batches into the canonical bank")
    promote.add_argument("--ready-root", required=True, help="Ready pool root to scan recursively")
    promote.add_argument("--canonical-root", required=True, help="Canonical bank root inside the repo")

    audit = sub.add_parser("audit-bank", help="Audit an existing bank for duplicates")
    audit.add_argument("--input", required=True, action="append", help="One or more files/directories to audit")
    audit.add_argument("--output", required=True, help="Output directory for audit reports")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    if args.command == "run":
        config = load_config(args.config)
        global_bank_paths = []
        if args.global_bank_paths_json:
            global_bank_paths = json.loads(args.global_bank_paths_json)
        runner = PipelineRunner(
            config=config,
            ai_mode=args.ai_mode,
            openai_api_key=args.openai_api_key,
            model=args.model,
            global_bank_paths=global_bank_paths,
        )
        summary = runner.run(args.input, args.output)
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return

    if args.command == "promote-ready":
        summary = promote_ready_pool(args.ready_root, args.canonical_root)
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return

    if args.command == "audit-bank":
        output = Path(args.output)
        output.mkdir(parents=True, exist_ok=True)
        report = audit_bank(args.input)
        dump_json(output / "bank_audit_summary.json", {
            "paths": report["paths"],
            "unique_signature_count": report["unique_signature_count"],
            "total_occurrence_count": report["total_occurrence_count"],
            "duplicate_cluster_count": report["duplicate_cluster_count"],
        })
        dump_json(output / "duplicate_clusters.json", report["duplicate_clusters"])
        print(json.dumps({
            "output": str(output),
            "duplicate_cluster_count": report["duplicate_cluster_count"],
            "unique_signature_count": report["unique_signature_count"],
        }, ensure_ascii=False, indent=2))
        return


if __name__ == "__main__":
    main()
