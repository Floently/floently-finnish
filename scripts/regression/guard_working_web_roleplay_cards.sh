#!/usr/bin/env bash
set -euo pipefail

cd /root/floently-finnish

echo "=== Guard 1: required roleplay web-audio fixes exist ==="
grep -q "web.keepUnlockedAudioElement" apps/client/features/shared/services/audioSession.ts
grep -q "primeWebPlayback" apps/client/features/shared/services/audioSession.ts
grep -q "activeWebAudioContext" apps/client/features/shared/services/audioSession.ts
grep -q "primeRoleplayAudioPlayback" apps/client/features/speaking/services/roleplayAudio.ts
grep -q "primeRoleplayAudioPlayback" apps/client/features/speaking/screens/RoleplayConversationScreen.tsx
grep -q "for (const delayMs of \[0, 180, 420, 800\])" apps/client/features/speaking/services/roleplayAudio.ts

echo "=== Guard 2: roleplay must not contain manual Play reply audio button ==="
if grep -R "Play reply audio\|replayAudioButton\|replyAudioUrl\|playRoleplayAudioUrl" \
  apps/client/features/speaking/screens/RoleplayConversationScreen.tsx \
  apps/client/features/speaking/services/roleplayAudio.ts; then
  echo "ERROR: Manual roleplay audio button code found. Roleplay audio must be automatic."
  exit 1
fi

echo "=== Guard 3: card menu belongs in CardPracticeScreen, not CardPracticeSession ==="
grep -q "openMenu=1" apps/client/features/cards/screens/CardPracticeScreen.tsx
grep -q "menuButton" apps/client/features/cards/screens/CardPracticeScreen.tsx

if grep -q "openMenu=1\|floatingMenuButton\|neoMenuButton\|headerMenuButton" apps/client/features/cards/components/CardPracticeSession.tsx; then
  echo "ERROR: Menu code found inside CardPracticeSession. It must stay in CardPracticeScreen top bar."
  exit 1
fi

echo "=== Guard 4: TypeScript ==="
cd /root/floently-finnish/apps/client
npx tsc -p tsconfig.json --noEmit

echo "=== PASS: working web roleplay/cards guard ==="
