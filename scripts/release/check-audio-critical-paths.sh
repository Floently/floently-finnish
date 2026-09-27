#!/usr/bin/env bash
set -euo pipefail

echo "=== AUDIO CRITICAL PATH STATIC GATE ==="

RING="apps/client/features/speaking/components/WaveformMicRing.tsx"
RECORDER="apps/client/features/speaking/hooks/useRoleplayRecorder.ts"
ROLEPLAY="apps/client/features/speaking/screens/RoleplayConversationScreen.tsx"
RECORDED="apps/client/features/speaking/screens/RecordedResponseScreen.tsx"
YKI_PRACTICE="apps/client/state/YkiPracticeRoute.tsx"
APP_SHELL="apps/client/state/AppShell.tsx"

fail() {
  echo "FAIL: $*"
  exit 1
}

[ -f "$RING" ] || fail "Missing $RING"
[ -f "$RECORDER" ] || fail "Missing $RECORDER"
[ -f "$ROLEPLAY" ] || fail "Missing $ROLEPLAY"
[ -f "$RECORDED" ] || fail "Missing $RECORDED"
[ -f "$YKI_PRACTICE" ] || fail "Missing $YKI_PRACTICE"
[ -f "$APP_SHELL" ] || fail "Missing $APP_SHELL"

if grep -n "onPressIn\\|onPressOut" "$RING"; then
  fail "WaveformMicRing still contains press-hold recording hooks. Roleplay must be tap-to-toggle only."
fi

grep -q "waitForNativeDurationAtLeast" "$RECORDER" || fail "Recorder does not wait for native duration."
grep -q "Native file metadata was not reliable; attempting STT upload anyway" "$RECORDER" || fail "Recorder file metadata fallback is missing."
grep -q "The recording was not saved correctly. Try once more" "$RECORDER" && fail "Old hard-blocking recorder error returned."
grep -q "The recorder only saved" "$RECORDER" || fail "Native short-audio diagnostic message missing."

grep -q "submitRoleplayTurn" "$ROLEPLAY" || fail "Roleplay turn submission missing."
grep -q "speakRoleplayText" "$ROLEPLAY" || fail "Roleplay TTS playback path missing."
grep -q "useRoleplayRecorder" "$ROLEPLAY" || fail "Roleplay recorder hook missing."
grep -q "stopRoleplayAudioPlayback" "$ROLEPLAY" || fail "Roleplay audio cleanup missing."

grep -q "useRoleplayRecorder" "$RECORDED" || fail "Recorded speaking recorder hook missing."

grep -q "roleplay_config" "$YKI_PRACTICE" || fail "YKI Practice speaking roleplay handoff missing."
grep -q "audioPlayer.stopAsync" "$YKI_PRACTICE" || fail "YKI Practice audio cleanup guard missing."
grep -q "onOpenSpeakingRecording" "$APP_SHELL" || fail "YKI recorded speaking route missing."
grep -q "onOpenSpeakingConversation" "$APP_SHELL" || fail "YKI conversation speaking route missing."

echo "PASS: AUDIO_CRITICAL_PATH_STATIC_GATE"
