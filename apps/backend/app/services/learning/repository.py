from __future__ import annotations

from dataclasses import asdict
from .content import UNITS
from .models import LearningProgress, LearningUnit, PhraseBankEntry


class LearningRepository:
    def __init__(self):
        self.units = {unit.id: unit for unit in UNITS}
        self.progress: dict[str, LearningProgress] = {}
        self.phrase_bank: dict[str, PhraseBankEntry] = {}

    def list_units(self) -> list[dict]:
        return [asdict(unit) for unit in self.units.values()]

    def get_unit(self, unit_id: str) -> LearningUnit | None:
        return self.units.get(unit_id)

    def get_progress(self, unit_id: str) -> LearningProgress:
        if unit_id not in self.progress:
            self.progress[unit_id] = LearningProgress(unit_id=unit_id)
        return self.progress[unit_id]

    def due_units(self) -> list[LearningUnit]:
        due = []
        for unit in self.units.values():
            progress = self.get_progress(unit.id)
            if not progress.next_review_at:
                due.append(unit)
            elif progress.next_review_at <= progress.last_seen_at if progress.last_seen_at else True:
                due.append(unit)
        return due

    def add_phrase(self, entry: PhraseBankEntry) -> None:
        self.phrase_bank[entry.id] = entry

    def list_phrase_bank(self) -> list[dict]:
        return [asdict(item) for item in self.phrase_bank.values()]


repository = LearningRepository()
