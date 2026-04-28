from __future__ import annotations

VOCABULARY_CARD_PAYLOAD = {
    "id": "card.vocab.koti",
    "version": 1,
    "content_type": "vocabulary_card",
    "path": "general",
    "domain": "general_finnish",
    "profession": {"track": "none", "slug": None, "label": None},
    "level_band": "A1_A2",
    "difficulty": "intro",
    "language": "fi",
    "source": {
        "source_id": "source.curated.general.core",
        "kind": "manual_curated",
        "origin_path": "practice/general/vocabulary/core.csv",
        "authoring_note": "starter deck",
    },
    "quality": {
        "status": "approved",
        "reviewer": "curriculum-team",
        "validation_checks": ["schema", "language_review"],
        "quality_score": 0.98,
    },
    "tags": ["home", "everyday"],
    "publication": {
        "state": "published",
        "version_tag": "cards_2026_03",
        "manifest_ref": "manifest.general.a1a2",
        "validation_passed": True,
        "published_at": "2026-03-18T09:00:00Z",
        "archived_at": None,
    },
    "content": {
        "front": {"term": "koti", "lemma": "koti", "part_of_speech": "noun"},
        "back": {
            "recall_prompt": "Which word did you just see?",
            "gloss": "home",
            "example_sentence": "Minun koti on Helsingissa.",
        },
        "prompt_family": "vocabulary_memory",
        "follow_ups": [
            {
                "variant_type": "recognition_mcq",
                "prompt": "Which word did you just see?",
                "options": [
                    {"option_id": "o1", "text": "koti"},
                    {"option_id": "o2", "text": "koulu"},
                    {"option_id": "o3", "text": "kauppa"},
                ],
                "answer_key": "o1",
                "accepted_variants": [],
                "evaluation_mode": "option_id",
            },
            {
                "variant_type": "typed_recall",
                "prompt": "Type the word you just saw.",
                "answer_key": "koti",
                "accepted_variants": ["koti."],
                "evaluation_mode": "normalized_text",
            },
        ],
        "explanation": {"summary": "Basic everyday noun for home.", "example": "Tama on minun koti."},
        "audio": None,
        "validation": {
            "case_sensitive": False,
            "normalize_whitespace": True,
            "allow_partial_credit": False,
        },
    },
}

GENERAL_SENTENCE_CARD_PAYLOAD = {
    "id": "card.sentence.mina_asun",
    "version": 1,
    "content_type": "sentence_card",
    "path": "general",
    "domain": "general_finnish",
    "profession": {"track": "none", "slug": None, "label": None},
    "level_band": "A1_A2",
    "difficulty": "core",
    "language": "fi",
    "source": {
        "source_id": "source.curated.sentences.a1a2",
        "kind": "manual_curated",
        "origin_path": "practice/general/sentences/a1a2.jsonl",
        "authoring_note": None,
    },
    "quality": {
        "status": "reviewed",
        "reviewer": "curriculum-team",
        "validation_checks": ["schema", "content_review"],
        "quality_score": 0.9,
    },
    "tags": ["housing", "sentence_recall"],
    "publication": {
        "state": "validated",
        "version_tag": "cards_sentence_2026_03",
        "manifest_ref": "manifest.sentences.a1a2",
        "validation_passed": True,
        "published_at": None,
        "archived_at": None,
    },
    "content": {
        "front": {"sentence": "Mina asun Espoossa.", "translation_hint": "I live in Espoo."},
        "back": {
            "recall_prompt": "Which sentence did you just see?",
            "expected_sentence": "Mina asun Espoossa.",
            "grammar_focus": ["verb_person_1", "inessive_place"],
        },
        "prompt_family": "sentence_memory",
        "follow_ups": [
            {
                "variant_type": "context_mcq",
                "prompt": "Choose the sentence you just saw.",
                "context_text": "Someone is telling where they live.",
                "options": [
                    {"option_id": "o1", "text": "Mina asun Espoossa."},
                    {"option_id": "o2", "text": "Mina tyonnan ovea."},
                    {"option_id": "o3", "text": "Mina syon aamupalaa."},
                ],
                "answer_key": "o1",
                "accepted_variants": [],
                "evaluation_mode": "option_id",
            },
            {
                "variant_type": "typed_recall",
                "prompt": "Type the sentence you just saw.",
                "answer_key": "Mina asun Espoossa.",
                "accepted_variants": ["mina asun espoossa.", "Mina asun espoossa."],
                "evaluation_mode": "normalized_text",
            },
        ],
        "explanation": {
            "summary": "This sentence practices first-person residence statements.",
            "example": "Asun Vantaalla.",
        },
        "audio": None,
        "validation": {
            "case_sensitive": False,
            "normalize_whitespace": True,
            "allow_partial_credit": False,
        },
    },
}

GRAMMAR_CARD_PAYLOAD = {
    "id": "card.grammar.missa",
    "version": 1,
    "content_type": "grammar_card",
    "path": "general",
    "domain": "yki_support",
    "profession": {"track": "none", "slug": None, "label": None},
    "level_band": "B1_B2",
    "difficulty": "core",
    "language": "fi",
    "source": {
        "source_id": "source.curated.grammar.locative",
        "kind": "manual_curated",
        "origin_path": "practice/general/grammar/missa.yaml",
        "authoring_note": "YKI support grammar set",
    },
    "quality": {
        "status": "approved",
        "reviewer": "grammar-team",
        "validation_checks": ["schema", "grammar_review", "yki_alignment"],
        "quality_score": 0.95,
    },
    "tags": ["missa", "cases", "locative"],
    "publication": {
        "state": "published",
        "version_tag": "cards_grammar_2026_03",
        "manifest_ref": "manifest.grammar.b1b2",
        "validation_passed": True,
        "published_at": "2026-03-18T09:30:00Z",
        "archived_at": None,
    },
    "content": {
        "front": {
            "rule_label": "Missa-form",
            "pattern": "talossa, koulussa, kaupungissa",
            "example": "Opiskelijat ovat luokassa.",
        },
        "back": {
            "recall_prompt": "Apply the missa-form to the noun in context.",
            "rule_summary": "Use the inessive form when something is inside a place.",
            "target_form": "talossa",
        },
        "prompt_family": "grammar_memory",
        "follow_ups": [
            {
                "variant_type": "grammar_application",
                "prompt": "Write the correct missa-form.",
                "stimulus_text": "Kirja on ___ (talo).",
                "evaluation_basis": {
                    "rule_id": "rule.inessive.missa",
                    "expected_feature": "inessive_case",
                    "evaluation_notes": "Assess correct case suffix.",
                },
                "answer_key": "talossa",
                "accepted_variants": ["TALOSSA"],
                "evaluation_mode": "normalized_text",
            }
        ],
        "explanation": {
            "summary": "The missa-form often ends in -ssa or -ssa/ssa variants depending on the stem.",
            "example": "Kirja on laukussa.",
        },
        "audio": None,
        "validation": {
            "case_sensitive": False,
            "normalize_whitespace": True,
            "allow_partial_credit": False,
        },
    },
}

PROFESSIONAL_VOCABULARY_CARD_PAYLOAD = {
    "id": "card.vocab.nurse.potilas",
    "version": 1,
    "content_type": "vocabulary_card",
    "path": "professional",
    "domain": "healthcare",
    "profession": {"track": "nurse", "slug": "nurse", "label": "Nurse"},
    "level_band": "B1_B2",
    "difficulty": "core",
    "language": "fi",
    "source": {
        "source_id": "source.workspace.nurse.cards",
        "kind": "imported_workspace",
        "origin_path": "apps/backend/card_bank/ready_bank/imported/nurse_cards.json",
        "authoring_note": "migrated professional card prototype",
    },
    "quality": {
        "status": "reviewed",
        "reviewer": "professional-finnish-team",
        "validation_checks": ["schema", "profession_review"],
        "quality_score": 0.87,
    },
    "tags": ["healthcare", "patient", "nurse"],
    "publication": {
        "state": "validated",
        "version_tag": "cards_nurse_2026_03",
        "manifest_ref": "manifest.professional.nurse",
        "validation_passed": True,
        "published_at": None,
        "archived_at": None,
    },
    "content": {
        "front": {"term": "potilas", "lemma": "potilas", "part_of_speech": "noun"},
        "back": {
            "recall_prompt": "Which healthcare word did you just see?",
            "gloss": "patient",
            "example_sentence": "Potilas odottaa vastaanotolla.",
        },
        "prompt_family": "vocabulary_memory",
        "follow_ups": [
            {
                "variant_type": "recognition_mcq",
                "prompt": "Pick the word you just saw.",
                "options": [
                    {"option_id": "o1", "text": "potilas"},
                    {"option_id": "o2", "text": "keuhko"},
                    {"option_id": "o3", "text": "laakari"},
                ],
                "answer_key": "o1",
                "accepted_variants": [],
                "evaluation_mode": "option_id",
            },
            {
                "variant_type": "fill_in",
                "prompt": "Complete the missing healthcare word.",
                "blank_template": "___ odottaa vastaanotolla.",
                "answer_key": "potilas",
                "accepted_variants": ["Potilas"],
                "evaluation_mode": "normalized_text",
            },
        ],
        "explanation": {
            "summary": "Core healthcare noun for the person receiving care.",
            "example": "Potilaalla on aika laakarille.",
        },
        "audio": None,
        "validation": {
            "case_sensitive": False,
            "normalize_whitespace": True,
            "allow_partial_credit": False,
        },
    },
}

MODULE_PAYLOAD = {
    "id": "module.general.a1_basics",
    "version": 1,
    "kind": "module",
    "title": "A1 Basics",
    "description": "Core general Finnish recall cards for beginners.",
    "path": "general",
    "domain": "general_finnish",
    "profession": {"track": "none", "slug": None, "label": None},
    "level_band": "A1_A2",
    "tags": ["starter"],
    "focus_tags": ["vocabulary", "sentence"],
    "publication": {
        "state": "validated",
        "version_tag": "module_general_a1",
        "manifest_ref": "manifest.module.general.a1",
        "validation_passed": True,
        "published_at": None,
        "archived_at": None,
    },
    "lesson_refs": [
        {"lesson_id": "lesson.general.a1.words", "lesson_version": 1, "ordinal": 1},
    ],
    "card_refs": [
        {"card_id": "card.vocab.koti", "card_version": 1, "ordinal": 1},
        {"card_id": "card.sentence.mina_asun", "card_version": 1, "ordinal": 2},
    ],
}

DECK_PAYLOAD = {
    "id": "deck.general.a1_everyday",
    "version": 1,
    "kind": "deck",
    "title": "Everyday A1 Finnish",
    "description": "Starter deck for everyday Finnish recall.",
    "path": "general",
    "domain": "general_finnish",
    "profession": {"track": "none", "slug": None, "label": None},
    "level_band": "A1_A2",
    "tags": ["starter", "everyday"],
    "focus_tags": ["vocabulary", "sentences"],
    "publication": {
        "state": "published",
        "version_tag": "deck_general_a1",
        "manifest_ref": "manifest.deck.general.a1",
        "validation_passed": True,
        "published_at": "2026-03-18T10:00:00Z",
        "archived_at": None,
    },
    "module_refs": [
        {"module_id": "module.general.a1_basics", "module_version": 1, "ordinal": 1},
    ],
    "counts": {"card_total": 12, "module_total": 1, "lesson_total": 1},
    "manifest_ref": "manifest.deck.general.a1",
}

REVIEW_QUEUE_PAYLOAD = {
    "id": "review.nurse.week1_weak_area",
    "version": 1,
    "kind": "review_queue",
    "title": "Nurse Weak Areas",
    "description": "Professional review queue for weak healthcare vocabulary.",
    "path": "professional",
    "domain": "healthcare",
    "profession": {"track": "nurse", "slug": "nurse", "label": "Nurse"},
    "level_band": "B1_B2",
    "tags": ["review"],
    "focus_tags": ["healthcare", "weak_area"],
    "publication": {
        "state": "draft",
        "version_tag": "review_nurse_week1",
        "manifest_ref": "manifest.review.nurse",
        "validation_passed": False,
        "published_at": None,
        "archived_at": None,
    },
    "queue_kind": "weak_area",
    "source_refs": [
        {"kind": "deck", "source_id": "deck.professional.nurse_core", "source_version": 1},
    ],
    "card_refs": [
        {"card_id": "card.vocab.nurse.potilas", "card_version": 1, "ordinal": 1},
    ],
    "manifest_ref": "manifest.review.nurse",
}

SESSION_PAYLOAD = {
    "session_id": "session.cards.general.a1.001",
    "user_id": "user.demo.001",
    "target": {"kind": "deck", "target_id": "deck.general.a1_everyday", "target_version": 1},
    "selected_card_ids": ["card.vocab.koti", "card.sentence.mina_asun"],
    "current_card_index": 0,
    "status": "active",
    "served_variant_history": [
        {
            "card_id": "card.vocab.koti",
            "variant_type": "recognition_mcq",
            "sequence_index": 0,
            "served_at": "2026-03-18T10:15:00Z",
        }
    ],
    "created_at": "2026-03-18T10:15:00Z",
    "updated_at": "2026-03-18T10:16:00Z",
}

REVIEW_STATE_PAYLOAD = {
    "card_id": "card.vocab.koti",
    "user_id": "user.demo.001",
    "status": "review",
    "last_seen_at": "2026-03-18T10:15:00Z",
    "last_answered_at": "2026-03-18T10:15:12Z",
    "last_outcome": "correct",
    "streak": 3,
    "ease_score": 2.8,
    "interval_days": 4,
    "due_at": "2026-03-22T08:00:00Z",
    "error_count": 1,
    "weak_area_tags": ["housing"],
    "last_variant_type": "typed_recall",
}
