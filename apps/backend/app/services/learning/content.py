from __future__ import annotations

from .models import LearningUnit

UNITS = [
    LearningUnit(
        id='unit-a1-home-routine',
        kind='phrase',
        level='A1',
        title='Daily home routine',
        summary='Short Finnish for describing what happens in the morning and evening.',
        example='Herään aamulla kuudelta ja juon kahvia.',
        tags=['routine', 'a1', 'daily-life'],
        difficulty='easy',
    ),
    LearningUnit(
        id='unit-a2-directions',
        kind='phrase',
        level='A2',
        title='Asking and giving directions',
        summary='Finnish for asking where places are and explaining direction clearly.',
        example='Anteeksi, missä kirjasto on?',
        tags=['directions', 'services', 'a2'],
        difficulty='medium',
    ),
    LearningUnit(
        id='unit-b1-work-email',
        kind='workplace_task',
        level='B1',
        title='Rescheduling politely',
        summary='Useful Finnish for moving meetings and explaining availability at work.',
        example='Voinko siirtää kokousta huomiseen?',
        tags=['work', 'email', 'schedule', 'b1'],
        difficulty='medium',
    ),
    LearningUnit(
        id='unit-b1-speaking-intro',
        kind='speaking_prompt',
        level='B1',
        title='Introduce yourself naturally',
        summary='Short spoken introduction with work or study context.',
        example='Olen Vitus ja asun Helsingissä. Opiskelen suomea ja teen projektitöitä.',
        tags=['speaking', 'introduction', 'b1'],
        difficulty='medium',
    ),
    LearningUnit(
        id='unit-b2-shift-handover',
        kind='workplace_task',
        level='B2',
        title='Shift handover clarity',
        summary='Structured Finnish for explaining what happened, what is pending, and what needs attention.',
        example='Asiakas voi paremmin, mutta lääkitys pitää tarkistaa illalla.',
        tags=['healthcare', 'handover', 'clarity', 'b2'],
        difficulty='hard',
    ),
]
