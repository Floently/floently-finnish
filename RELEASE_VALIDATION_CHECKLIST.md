# Floently Release Validation Checklist

This checklist must be reviewed before every EAS build, TestFlight/App Store submission, Android release build, or production publication.

Do not treat TypeScript success alone as release readiness.

## 1. Build-credit protection

- Do not run EAS until automated tests pass.
- Do not run EAS until the repo state is clean and understood.
- Do not run EAS with unclassified untracked files.
- Do not run EAS with accidental deleted tracked files.
- Do not run EAS from a dirty release worktree.
- Do not use git add .
- Use targeted git add only.

## 2. When a new mobile build is required

Backend-only changes do not normally require a new EAS build. Restart/deploy backend and test web plus installed apps.

Web-only changes do not require a new iOS/Android package. Deploy web and test desktop/iPhone/Android browsers.

Native app JS/TS changes require installed-app testing and usually a new EAS build because Expo updates are disabled.

Native config, assets, permissions, Expo plugins, RevenueCat config, bundle ID, package name, icon, or splash changes require a new EAS build.

## 3. Required repo safety checks

Run before every build:

cd /root/floently-finnish
git branch --show-current
git log --oneline -8
git status --short
git ls-files -d
git ls-files --others --exclude-standard | sed -n "1,240p"

Hard fail: thousands of deleted files, generated banks, archives, unreviewed assets, dirty release worktree, or unclassified card-bank files.

## 4. Required automated checks

cd /root/floently-finnish/apps/client
npx tsc -p tsconfig.json --noEmit
echo "TSC_EXIT=$?"

cd /root/floently-finnish
python3 scripts/regression/guard_public_pages_full_i18n.py
scripts/regression/guard_yki_exam_runtime_fallback.sh

Required: TSC_EXIT=0 and all guards PASS.

## 5. Public page validation

Test landing, For Organizations, and Contact on desktop browser, iPhone browser, Android browser, native iOS app, and native Android app.

Required: new landing page, organization page exists, language picker works, all visible text changes language, login/register opens, no crash.

Hard fail: old landing page, missing organization page, English fallback in non-English UI, language switch not working, sign-in crash.

## 6. Auth/session validation

Test fresh install or cleared storage, login, logout, login again, expired session handling, sign-in/register navigation.

Known test accounts: learn@obum.floently.com and testuser.

## 7. Roleplay validation

Test roleplay separately on desktop web, iPhone browser, Android browser, native iOS app, and native Android app.

Reason: web uses browser MediaRecorder, native app uses Expo native audio recorder. Browser success does not prove native recording success.

Required tests: start roleplay, record valid answer, transcript appears, AI responds, audio reply works, short recording gives clear error, "I don't know" continues naturally.

Doctor track: learner is doctor. AI must stay patient/family/counterpart. AI must not say "Mikä toi sinut vastaanotolle?", "Avaa suu", "Hengitä syvään", "Tutkin sinut", or "Määrään lääkkeen".

Nurse track: learner is nurse. AI must not say "Tarkistan lääkityksen", "Annan injektion", or "Seuraan vointiasi".

Practical nurse track: learner is practical nurse. AI must not say "Autan sinua peseytymään", "Vaihdan vaipan", or "Nostan sinut".

Hard fail: patient becomes professional, valid native recording says too short, transcript hallucinated from silence, coaching appears inside ai_text, real medical advice is given.

## 8. Card practice validation

Test vocabulary, sentences/phrases, YKI cards, and professional cards on web browsers and native apps.

Required: long text readable, long options readable, card can scroll, answer options not clipped, audio works, options are shuffled, correct answer still matches.

Grammar must stay hidden/disabled until V4 rebuild is complete.

Hard fail: clipped text, unreadable options, wrong answer/options mismatch, duplicate options, grammar visible before V4.

## 9. Grammar release rule

Old grammar is disabled. Do not re-enable grammar until V4 generation, validators, physical review, overlays, and mobile display all pass.

Hard fail: old repeated prompt appears: "Valitse, mitä kielioppitehtävää..."

## 10. Payments validation

Web: pricing opens, login required where expected, subscription status works.

Native iOS/Android: RevenueCat initializes, products load, YKI/Professional/Combined load, restore purchases works, entitlement unlocks, Stripe checkout is not shown inside mobile app.

Entitlements: yki_access, professional_access, combined_access.

Hard fail: missing products, wrong IDs, purchase crash, entitlement not applied.

## 11. Backend/API validation

cd /root/floently-finnish
docker compose ps
docker compose logs --tail=300 backend | grep -Ei "error|traceback|exception|500|launch_overlay|roleplay|voice|cards" || true
curl -s http://127.0.0.1:8000/api/v1/auth/session | head -c 300 && echo

AUTH_REQUIRED is acceptable for unauthenticated auth check.

Hard fail: 500 errors, tracebacks, missing module, card deck errors, valid roleplay audio decode failure, roleplay crash.

## 12. Card-bank safety validation

cd /root/floently-finnish
find apps/backend/card_bank/canonical_bank apps/backend/card_bank/ready_bank -type f -path "*/grammar/*" \( -name "*.json" -o -name "*.jsonl" \) -print 2>/dev/null | sort
git diff --stat -- apps/backend/card_bank | sed -n "1,240p"
git ls-files --others --exclude-standard apps/backend/card_bank | sed -n "1,240p"

Hard fail: accidental mass deletion, accidental mass rewrite, unclassified untracked card-bank files, old grammar visible.

## 13. iOS/Android config validation

Before EAS, confirm app name Floently, ios.bundleIdentifier com.vitusidi.floently, android.package com.vitusidi.floently, correct runtimeVersion, correct EAS profile, and intentional build number increment.

Android subscriptions: YKI monthly/three-months/yearly, Professional monthly/three-months/annual, Combined monthly/three-months/yearly. Do not use inactive Professional yearly.

## 14. Final release worktree rule

Do not build from dirty main worktree.

After final commit is pushed, create a clean release worktree from the exact commit and build only from that clean worktree.

Required: clean status, exact intended commit, dependencies install cleanly, TypeScript passes, Expo config correct.

## 15. Final manual acceptance

Before production submission confirm: web landing works, native landing works, organization page works in app, language switch works, login/logout works, cards load, text readable, grammar hidden, YKI practice works, professional cards work, roleplay recording works on native iOS and Android, professional roleplay does not flip roles, payments open, RevenueCat products load, no startup crash, no backend 500 errors, no English leakage in non-English UI.
