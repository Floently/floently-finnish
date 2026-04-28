from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any


@dataclass
class AIResult:
    ok: bool
    kind: str
    payload: dict[str, Any]
    raw_text: str | None = None
    error: str | None = None


class OpenAIHelper:
    def __init__(self, api_key: str | None = None, model: str = "gpt-4o-mini", timeout_seconds: float = 12.0) -> None:
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model
        self.timeout_seconds = timeout_seconds
        self.client = None
        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key, timeout=self.timeout_seconds)
            except Exception:
                self.client = None

    @property
    def enabled(self) -> bool:
        return self.client is not None

    def verify_batch_manifest(self, manifest: dict[str, Any], items: list[Any]) -> AIResult:
        if not self.enabled:
            return AIResult(False, "batch_verify", {}, error="AI disabled")
        prompt = {
            "manifest": manifest,
            "sample_items": items[:8],
            "task": (
                "Return JSON only. Verify whether the manifest matches the items. "
                "Do not invent missing facts. Suggest only minimal corrections. "
                "Use this object shape: "
                '{"is_coherent": boolean, "confidence": number, "notes": [string], '
                '"suggested_manifest_patch": {"content_type": string|null, "language": string|null, '
                '"path": string|null, "domain": string|null, "profession": string|null, '
                '"level_band": string|null, "source_id": string|null, "authoring_note": string|null}}'
            )
        }
        payload = self._freeform_json(kind="batch_verify", prompt_obj=prompt)
        return self._normalize_batch_verify_result(payload)

    def recover_uncertain_item(self, manifest: dict[str, Any], raw_fragment: Any) -> AIResult:
        if not self.enabled:
            return AIResult(False, "item_recover", {}, error="AI disabled")
        prompt = {
            "manifest_context": manifest,
            "raw_fragment": raw_fragment,
            "task": (
                "Return JSON only. Recover the smallest trustworthy MGI fields and any useful AID hints. "
                "Do not invent unsupported facts. Use this object shape: "
                '{"content_type_guess": string, "mgi": object, "aid_hints": object, '
                '"confidence": number, "needs_human_review": boolean, "notes": [string]}'
            )
        }
        payload = self._freeform_json(kind="item_recover", prompt_obj=prompt)
        return self._normalize_item_recover_result(payload)

    def recover_uncertain_items(self, manifest: dict[str, Any], raw_fragments: list[Any]) -> AIResult:
        if not self.enabled:
            return AIResult(False, "items_recover", {}, error="AI disabled")
        prompt = {
            "manifest_context": manifest,
            "raw_fragments": raw_fragments,
            "task": (
                "Return JSON only. For each raw fragment, recover the smallest trustworthy MGI fields and any useful AID hints. "
                "Do not invent unsupported facts. Return an object with key 'items' as a list with the same length and order as raw_fragments. "
                "Each entry must use this shape: "
                '{"content_type_guess": string, "mgi": object, "aid_hints": object, '
                '"confidence": number, "needs_human_review": boolean, "notes": [string]}'
            )
        }
        result = self._freeform_json(kind="items_recover", prompt_obj=prompt)
        if not result.ok:
            return result
        payload = result.payload if isinstance(result.payload, dict) else {}
        items = payload.get("items") if isinstance(payload.get("items"), list) else []
        norm_items = []
        for obj in items:
            r = AIResult(True, "item_recover", obj if isinstance(obj, dict) else {}, raw_text=result.raw_text)
            norm_items.append(self._normalize_item_recover_result(r).payload)
        return AIResult(True, "items_recover", {"items": norm_items}, raw_text=result.raw_text)

    def _freeform_json(self, kind: str, prompt_obj: dict[str, Any]) -> AIResult:
        try:
            response = self.client.responses.create(
                model=self.model,
                input=[
                    {
                        "role": "system",
                        "content": (
                            "You are a strict extraction and verification assistant. "
                            "Return only valid JSON. Do not wrap it in markdown. "
                            "Do not invent unsupported facts."
                        )
                    },
                    {
                        "role": "user",
                        "content": json.dumps(prompt_obj, ensure_ascii=False)
                    }
                ],
            )
            text = getattr(response, "output_text", None)
            if not text:
                text = str(response)
            payload = self._parse_json_object(text)
            return AIResult(True, kind, payload, raw_text=text)
        except Exception as exc:
            return AIResult(False, kind, {}, error=str(exc))

    def _parse_json_object(self, text: str) -> dict[str, Any]:
        stripped = text.strip()
        try:
            payload = json.loads(stripped)
            if not isinstance(payload, dict):
                raise ValueError("Top-level JSON is not an object")
            return payload
        except Exception:
            start = stripped.find("{")
            end = stripped.rfind("}")
            if start == -1 or end == -1 or end <= start:
                raise ValueError("Model did not return a JSON object")
            payload = json.loads(stripped[start:end + 1])
            if not isinstance(payload, dict):
                raise ValueError("Top-level JSON is not an object")
            return payload

    def _normalize_batch_verify_result(self, result: AIResult) -> AIResult:
        if not result.ok:
            return result
        p = result.payload if isinstance(result.payload, dict) else {}
        patch = p.get("suggested_manifest_patch")
        if not isinstance(patch, dict):
            patch = {}
        allowed_patch_keys = [
            "content_type", "language", "path", "domain", "profession",
            "level_band", "source_id", "authoring_note"
        ]
        normalized_patch = {k: patch.get(k) for k in allowed_patch_keys if k in patch}
        payload = {
            "is_coherent": bool(p.get("is_coherent", False)),
            "confidence": self._coerce_confidence(p.get("confidence", 0.0)),
            "notes": self._coerce_string_list(p.get("notes")),
            "suggested_manifest_patch": normalized_patch,
        }
        return AIResult(True, result.kind, payload, raw_text=result.raw_text)

    def _normalize_item_recover_result(self, result: AIResult) -> AIResult:
        if not result.ok:
            return result
        p = result.payload if isinstance(result.payload, dict) else {}
        mgi = p.get("mgi") if isinstance(p.get("mgi"), dict) else {}
        aid_hints = p.get("aid_hints") if isinstance(p.get("aid_hints"), dict) else {}
        allowed_hint_keys = [
            "content_type", "language", "path", "domain", "profession",
            "level_band", "source_id", "authoring_note"
        ]
        payload = {
            "content_type_guess": str(p.get("content_type_guess", "unknown")),
            "mgi": mgi,
            "aid_hints": {k: aid_hints.get(k) for k in allowed_hint_keys if k in aid_hints},
            "confidence": self._coerce_confidence(p.get("confidence", 0.0)),
            "needs_human_review": bool(p.get("needs_human_review", True)),
            "notes": self._coerce_string_list(p.get("notes")),
        }
        return AIResult(True, result.kind, payload, raw_text=result.raw_text)

    def _coerce_string_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(v) for v in value][:20]
        if value is None:
            return []
        return [str(value)]

    def _coerce_confidence(self, value: Any) -> float:
        try:
            out = float(value)
        except Exception:
            out = 0.0
        if out < 0.0:
            return 0.0
        if out > 1.0:
            return 1.0
        return out
