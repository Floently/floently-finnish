from __future__ import annotations


def evaluate_writing(text: str, *, prompt: str = "") -> dict[str, float | str]:
    normalized = str(text or "").strip()
    word_count = len([part for part in normalized.split() if part.strip()])
    prompt_tokens = {token for token in str(prompt).lower().split() if token}
    text_tokens = {token for token in normalized.lower().split() if token}
    prompt_overlap = len(prompt_tokens & text_tokens)
    content = min(100.0, word_count * 4.0)
    task_completion = min(100.0, 40.0 + prompt_overlap * 10.0) if normalized else 0.0
    language = min(100.0, 30.0 + word_count * 3.0) if normalized else 0.0
    overall = round((content + task_completion + language) / 3.0, 2)
    return {
        "overall": overall,
        "content": round(content, 2),
        "task_completion": round(task_completion, 2),
        "language": round(language, 2),
        "word_count": float(word_count),
    }
