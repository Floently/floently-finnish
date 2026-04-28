# CARD_OPTIONS_PAYLOAD_EXAMPLES

## Post-fix live runtime samples
Source path: `apps/backend/app/runtime/cards_logic.py` session serving.

### vocabulary_card sample
- `card_id`: `card.vocab.yki_exam.sade.14e3e3`
- `answer_key`: `o4`
- `answer_index`: `3`
- `options`:
  1. `o2` -> `evaluation`
  2. `o1` -> `conversation`
  3. `o3` -> `application`
  4. `o4` -> `rain`
- evaluation checks:
  - submit `o4` => `correct=true`
  - submit wrong option id => `correct=false`

### sentence_card sample
- `card_id`: `card.phrase.yki_exam.han-opastaa-vanhassa-kaupungissa.4d9764`
- `answer_key`: `o4`
- `answer_index`: `2`
- `options`:
  1. `o3` -> `He/She is at work.`
  2. `o1` -> `I am happy.`
  3. `o4` -> `He/She guides in the old town.`
  4. `o2` -> `You are at home.`
- evaluation checks:
  - submit `o4` => `correct=true`
  - submit wrong option id => `correct=false`

### grammar_card sample
- `card_id`: `card.grammar.yki.infinitive-iii-abessive.bc75fb`
- `answer_key`: `o4`
- `answer_index`: `2`
- `options`:
  1. `o3` -> `Has been talked.`
  2. `o2` -> `It was done.`
  3. `o4` -> `without eating`
  4. `o1` -> `We talk / One talks.`
- evaluation checks:
  - submit `o4` => `correct=true`
  - submit wrong option id => `correct=false`

## Position distribution evidence

### Canonical published bank (post-fix)
- total MCQ cards (4 options): `50956`
- positions: `{0:12689, 1:12792, 2:12686, 3:12789}`

### Live served runtime sessions (post-fix)
- `vocabulary_card` (n=120): `{0:29, 1:31, 2:34, 3:26}`
- `sentence_card` (n=120): `{0:35, 1:28, 2:25, 3:32}`
- `grammar_card` (n=120): `{0:29, 1:31, 2:24, 3:36}`

These distributions confirm correct answers are not systematically last.
