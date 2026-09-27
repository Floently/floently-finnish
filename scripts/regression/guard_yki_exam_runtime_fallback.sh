#!/usr/bin/env bash
set -euo pipefail

cd /root/floently-finnish

echo "=== Guard 0: YKI practice audio/options guard ==="
scripts/regression/guard_yki_practice_audio_options.sh

echo
echo "=== Guard 1: YKI exam frontend audio path still exists ==="
grep -q "audioPlayer.playAsync" apps/client/features/exam/screens/ExamRuntimeScreen.tsx
grep -q "audioPlayer.playTextAsync" apps/client/features/exam/screens/ExamRuntimeScreen.tsx
grep -q "▶ Play audio" apps/client/features/exam/screens/ExamRuntimeScreen.tsx
grep -q "Audio transcript" apps/client/features/exam/screens/ExamRuntimeScreen.tsx

echo
echo "=== Guard 2: YKI exam runtime fallback to practice still exists ==="
grep -q "startYkiPracticeSession" apps/client/features/exam/screens/ExamRuntimeScreen.tsx
grep -q "setSections(buildSectionsFromTasks(tasks, storedBand))" apps/client/features/exam/screens/ExamRuntimeScreen.tsx
grep -q "audioText: t.audio_script || t.guidance" apps/client/features/exam/screens/ExamRuntimeScreen.tsx
grep -q "correct: t.correct_index ?? 0" apps/client/features/exam/screens/ExamRuntimeScreen.tsx

echo
echo "=== Guard 3: real YKI engine availability status ==="
docker compose exec -T backend python - <<'PY'
import asyncio
import httpx
from app.core.config import SETTINGS

async def main():
    base = str(getattr(SETTINGS, "yki_engine_base_url", "") or "").rstrip("/")
    print("configured_yki_engine_base_url:", base)

    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(base + "/health")
        print("engine_health_status:", r.status_code)
    except Exception as exc:
        print("engine_health_status: unavailable")
        print("engine_health_error:", type(exc).__name__)

asyncio.run(main())
PY

echo
echo "=== Guard 4: TypeScript ==="
cd /root/floently-finnish/apps/client
npx tsc -p tsconfig.json --noEmit

echo
echo "=== PASS: YKI exam fallback/audio guard ==="
