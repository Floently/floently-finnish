#!/usr/bin/env bash
set -euo pipefail

cd /root/floently-finnish

echo "=== Guard 0: existing locked roleplay/card areas ==="
scripts/regression/guard_working_web_roleplay_cards.sh

echo
echo "=== Guard 1: YKI practice listening audio UI exists ==="
grep -q "function ListeningAudioPractice" apps/client/state/YkiPracticeRoute.tsx
grep -q "audioPlayer.playTextAsync(audioScript" apps/client/state/YkiPracticeRoute.tsx
grep -q "audio_script && task.skill === 'listening'" apps/client/state/YkiPracticeRoute.tsx
grep -q "const shouldShowTranscript = transcriptVisible;" apps/client/state/YkiPracticeRoute.tsx
grep -q "Show transcript" apps/client/state/YkiPracticeRoute.tsx

echo
echo "=== Guard 2: YKI practice backend option shuffle exists on host ==="
grep -q "import hashlib" apps/backend/app/routers/yki_practice.py
grep -q "_stable_shuffle_mcq_options" apps/backend/app/routers/yki_practice.py
grep -q "_shuffle_session_mcq_options(tasks, session_id=session_id)" apps/backend/app/routers/yki_practice.py
grep -q "option_shuffle_seed" apps/backend/app/routers/yki_practice.py
python3 -m py_compile apps/backend/app/routers/yki_practice.py

echo
echo "=== Guard 3: YKI practice backend option shuffle exists inside running container ==="
if docker compose ps -q backend >/dev/null 2>&1 && [ -n "$(docker compose ps -q backend)" ]; then
  docker compose exec -T backend sh -lc '
    grep -q "import hashlib" /app/app/routers/yki_practice.py
    grep -q "_stable_shuffle_mcq_options" /app/app/routers/yki_practice.py
    grep -q "_shuffle_session_mcq_options(tasks, session_id=session_id)" /app/app/routers/yki_practice.py
    grep -q "option_shuffle_seed" /app/app/routers/yki_practice.py
    python -m py_compile /app/app/routers/yki_practice.py
  '
else
  echo "Backend container is not running; skipping container-source check."
fi

echo
echo "=== Guard 4: YKI exam listening audio path still exists ==="
grep -q "audioPlayer.playAsync" apps/client/features/exam/screens/ExamRuntimeScreen.tsx
grep -q "audioPlayer.playTextAsync" apps/client/features/exam/screens/ExamRuntimeScreen.tsx
grep -q "▶ Play audio" apps/client/features/exam/screens/ExamRuntimeScreen.tsx
grep -q "Audio transcript" apps/client/features/exam/screens/ExamRuntimeScreen.tsx

echo
echo "=== Guard 5: TypeScript ==="
cd /root/floently-finnish/apps/client
npx tsc -p tsconfig.json --noEmit

echo
echo "=== Guard 6: live YKI practice option distribution ==="
cd /root/floently-finnish

python3 - <<'PY'
import json
import subprocess
from collections import Counter

rows = []

levels = ["A1_A2", "B1_B2", "C1_C2"]
focuses = ["mixed", "reading", "listening"]

for level in levels:
    for focus in focuses:
        for _ in range(8):
            raw = subprocess.check_output([
                "curl", "-sS", "-X", "POST",
                "http://127.0.0.1:8000/api/v1/yki-practice/start",
                "-H", "Content-Type: application/json",
                "-d", json.dumps({"level_band": level, "focus": focus}),
            ], text=True)

            payload = json.loads(raw)
            data = payload.get("data", payload)

            for task in data.get("tasks") or []:
                options = task.get("options")
                correct_index = task.get("correct_index")
                if isinstance(options, list) and isinstance(correct_index, int):
                    rows.append({
                        "correct_index": correct_index,
                        "seed": task.get("option_shuffle_seed"),
                    })

if len(rows) < 50:
    raise SystemExit(f"FAIL: too few objective YKI practice rows sampled: {len(rows)}")

counter = Counter(row["correct_index"] for row in rows)
seed_count = sum(1 for row in rows if row.get("seed"))

print("rows:", len(rows))
print("rows_with_option_shuffle_seed:", seed_count)
print("distribution:", dict(sorted(counter.items())))

if seed_count != len(rows):
    raise SystemExit(f"FAIL: option_shuffle_seed missing on some rows: {seed_count}/{len(rows)}")

if counter == {1: len(rows)}:
    raise SystemExit("FAIL: all correct answers are still B/index 1")

if len(counter) < 3:
    raise SystemExit(f"FAIL: correct answers use too few slots: {dict(counter)}")

most_common_index, most_common_count = counter.most_common(1)[0]
ratio = most_common_count / len(rows)
print("most_common_ratio:", most_common_index, f"{most_common_count}/{len(rows)}", round(ratio, 3))

if ratio >= 0.70:
    raise SystemExit(f"FAIL: correct answer slot too concentrated: {dict(counter)}")

print("PASS: live YKI practice option distribution is varied")
PY

echo
echo "=== PASS: YKI practice listening/audio/options guard ==="
