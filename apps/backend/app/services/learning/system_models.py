from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LearningItem:
    id: str
    label: str
    value: str


@dataclass(frozen=True)
class LearningExercise:
    id: str
    title: str
    prompt: str
    input_mode: str
    options: list[str]
    expected_answer: str
    explanation: str
    deterministic_key: str


@dataclass(frozen=True)
class LearningLesson:
    id: str
    title: str
    summary: str
    explanation: str
    examples: list[str]
    items: list[LearningItem]
    exercises: list[LearningExercise]


@dataclass(frozen=True)
class LearningSystemModule:
    id: str
    title: str
    description: str
    level_id: str
    level_label: str
    lessons: list[LearningLesson]


@dataclass(frozen=True)
class LearningSystemLevel:
    id: str
    title: str
    cefr: str
    description: str
    modules: list[LearningSystemModule]
