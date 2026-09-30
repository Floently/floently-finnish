# Floently Read / KieliValmis release and reading-quality handoff — 2026-09-29

> **Mandatory first read for any AI or human continuing this work.**
>
> Before changing code, report the current state using the reporting template at the end of this file. After changing code, update this ledger with the new status, commit SHA, validation performed, and release/deployment state.

## Authoritative product architecture

Floently mobile is a **native React Native application**.

- KieliValmis / Learn remains the existing native Learn product.
- Floently Read Home, Library, Import, Reader, Settings, AI/study tools, account/subscription surfaces remain native React Native.
- The dedicated Browser Reader may use a WebView because browsing/rendering websites is the feature itself.
- The main Read application must **never** become a WebView/web-workspace shell.
- The web product is a visual/product reference, not the mobile runtime.
- The native Browser Reader previously provided a better mobile experience than the ordinary web Reader; preserve and improve that behavior instead of replacing it for visual parity.

## Active release candidate

- Repository: `Floently/floently-finnish`
- Release branch: `agent/build-48-native-read-release-20260929`
- Current release SHA: `00c9d6d34a773ca5d0b8ffeb3c71b2bc55c9d119`
- Main release PR: #75 — `Build 48 native Read release candidate`
- Expo OTA runtime: **1.0.4**
- Expo Updates: enabled; checks on app load.
- Latest release-branch CI run: **36607738539 — PASS**
- iOS TestFlight workflow run: **36607732079**
- As of 2026-09-29 21:58 Europe/Helsinki: release preflight steps passed and `Build and auto-submit to TestFlight` was in progress.
- Android testing build: **not yet qualified in this stabilization pass**.

## Native Reader defect ledger

| ID | Finding / defect | Severity | Status | Fix / evidence |
|---|---|---:|---|---|
| NR-01 | TTS URL was prefetched, but upcoming audio was not truly preloaded/decoded, allowing audible chunk gaps. | High | **FIXED in release branch** | Upcoming chunks now use Expo Audio `preload`, `downloadFirst`, and a 30s preferred forward buffer. |
| NR-02 | Saved document progress selected the correct large chunk but restarted that chunk at 0:00, repeating narration. | High | **FIXED in release branch** | `chunkPositionForProgress` reconstructs the fraction inside the chunk; playback seeks inside the loaded clip before starting. |
| NR-03 | Resume depended on TTS duration metadata being present. | High | **FIXED in release branch** | Reader waits for loaded player duration and has a safe speech-rate duration fallback before seeking. |
| NR-04 | Native UI exposed 2.25x–3x although Expo Audio mobile playback support is capped at 2x. | High | **FIXED in release branch** | Native player/store/settings clamp and expose supported rates only through 2x. |
| NR-05 | Background playback was disabled in Expo native configuration. | High | **FIXED; requires new binary** | `expo-audio.enableBackgroundPlayback=true`; audio session enables `shouldPlayInBackground`; lock-screen controls/metadata enabled. |
| NR-06 | Background-audio native capability changed while old OTA runtime identity was 1.0.3. | High | **FIXED** | Runtime bumped to **1.0.4** so old binaries cannot receive updates that assume the new native capability. |
| NR-07 | Progress/highlighting polled every 500 ms and used coarse character/paragraph estimates. | Medium | **FIXED / improved** | Playback status now updates every 100 ms; native TTS timing metadata is normalized and used for chunk progress; paragraph selection is length-weighted. |
| NR-08 | Parallel progress requests could finish out of order and persist an older resume point after a newer one. | Medium | **FIXED** | Per-document `progressSyncChains` serialize progress/speed/voice persistence. |
| NR-09 | Exact progress might not be persisted at pause/background transition. | Medium | **FIXED** | Progress is persisted on Pause and when AppState leaves active state. |
| NR-10 | Reader visually rendered only the first 24 paragraphs while narration continued through the whole document. | High | **FIXED** | 24-paragraph display truncation removed; complete document is rendered. |
| NR-11 | Browser V2 URL could lose `?embed=react-native` when an EAS/environment URL override was supplied. | High | **FIXED** | Native URL normalization always restores `embed=react-native`. |
| NR-12 | React Native Browser Reader could be misclassified into desktop native-RFB input because Browser V2 relied on pointer media-query inference. | High | **WEB-SIDE FIX PREPARED; see flowreader handoff** | Browser V2 treats React Native embed as authoritative mobile touch/IME owner-channel mode. |
| NR-13 | Transient Browser V2 load errors could destroy WebView/session state in older implementations. | High | **FIXED in release branch** | WebView stays mounted; transient failure is an overlay; in-place reload/recovery retained. |
| NR-14 | Device-only audio continuity, interruption handling, lock-screen behavior, and actual perceived gaplessness require physical-device listening. | High | **OPEN VALIDATION** | Must be verified on the new TestFlight binary before declaring listening quality production-ready. |
| NR-15 | Android install/playback/background behavior has not been qualified in this pass. | Medium | **OPEN VALIDATION** | Produce Android test build after iOS release qualification or in parallel if credentials/build capacity allow. |

## Native playback defaults after stabilization

These are intentional defaults/contracts until explicitly revised:

- Reader audio status update interval: **100 ms while player is active**.
- Preferred forward buffer: **30 seconds**.
- Upcoming narration: preload at least the next chunk; current implementation also warms another lookahead chunk when available.
- Native speed choices: **0.8x, 1.0x, 1.2x, 1.5x, 1.8x, 2.0x**.
- Native maximum playback speed: **2.0x**.
- Progress: document-wide and serialized to backend.
- Resume: restore inside the active TTS chunk, not just at chunk boundary.
- Background audio: enabled in native binary.
- Lock-screen controls: enabled while Read narration owns playback.
- OTA runtime for this binary family: **1.0.4**.

## OTA rules — do not break these

1. **JS/TS/UI/logic-only changes** that do not alter native modules/capabilities/config may be delivered by EAS Update to binaries on runtime 1.0.4.
2. **Native capability/config/plugin/dependency changes** require a new binary and normally a new compatible runtime identity before using OTA features that depend on them.
3. Never publish an OTA that assumes native capability absent from the installed runtime.
4. The production OTA workflow must continue verifying runtime, update URL, and check-on-load behavior before publish.

## What still needs physical release validation

On the new TestFlight build, explicitly test:

1. 20+ minute document narration with several TTS chunk transitions.
2. Listen for gaps, repeated words/sentences, skipped words/sentences, or unexpected 1x resets.
3. Pause mid-chunk, close/reopen Reader, confirm resume is near the exact point.
4. Background the app and lock the iPhone for several minutes; audio should continue.
5. Use lock-screen pause/resume and return to the app; position should remain coherent.
6. Switch 0.8x → 1x → 1.5x → 2x across multiple chunks; rate must persist.
7. Change voice mid-document; position must remain stable and new voice applies safely.
8. Confirm full long document remains visible beyond paragraph 24.
9. Confirm highlight/progress stays plausibly synchronized at 1x and 2x.
10. Open Browser Reader inside app; test touch, scroll, keyboard input, narration, speed changes, reconnect, background/resume.

## CI/release evidence

The exact native stabilization head `7eb830d5e333be4f4e0f86a927636f0a4edfe98c` passed app CI before promotion.

After promotion, release SHA `00c9d6d34a773ca5d0b8ffeb3c71b2bc55c9d119` passed:

- TypeScript
- backend deployable test suite
- EAS workflow validation
- native Read architecture invariants
- OTA runtime identity
- iOS OTA export
- navigation invariants
- account deletion invariants
- RevenueCat identity
- store-billing preflight
- iOS release identity

Do not infer device audio quality solely from these source/build gates.

## Known external/web dependency

The dedicated Browser Reader loads Browser V2 from the separate private repository `Floently/flowreader`.

Current web work:
- branch: `agent/browser-reader-controller-continuity-20260929`
- PR: #165
- web handoff: `docs/browser-v2/READING_QUALITY_HANDOFF_20260929.md`
- PR remains draft until the web frontend receives a meaningful build/test gate.

The app-side React Native embed fix is already in Build 48; the corresponding Browser V2 web fix must be deployed before the app can benefit from the full input-mode correction.

## Parallel development lane rule

This branch is now the **React Native stabilization/release lane**. A separate AI is developing fully native Swift/iOS and Kotlin/Android implementations in parallel.

For this branch:
- continue React Native product stabilization, Browser Reader integration, CI repair, TestFlight readiness, and production bug fixes;
- do not refactor the React Native release candidate around unfinished Swift/Kotlin architecture;
- do not delete, replace, or rewrite the separate native implementations;
- keep shared API/data contracts backward compatible so React Native, Swift, and Kotlin can coexist;
- only touch native platform files when required by the existing React Native/Expo release itself (for example current Expo configuration/runtime capability), not to advance the separate rewrite;
- report any shared-contract change that the native-app AI must know about in this handoff/issue before handing off.

The goal of this lane is a usable, stable React Native app while the separate native apps continue independently.

## Mandatory continuation protocol

Every AI or human continuing this release must do all of the following:

1. **Read this file first.**
2. Fetch current branch heads, PR states, CI runs, TestFlight/EAS status, and web Reader PR status. Do not rely on stale chat summaries.
3. Before changing code, publish a short status report using the template below.
4. Do not mark a defect FIXED merely because code was written. Record:
   - commit/PR,
   - validation performed,
   - whether it is merged,
   - whether it is deployed/built,
   - whether physical-device validation is still pending.
5. After every meaningful stabilization change, update this ledger.
6. Preserve the native architecture. WebView is allowed only for the Browser Reader feature.
7. If changing native capabilities/config/plugins, review OTA runtime compatibility before release.
8. If changing Reader playback, explicitly test continuity across chunk/sentence boundaries and pause/resume.
9. If a CI system is failing before tests execute, report it as infrastructure failure; do not describe the code as CI-verified.
10. Before handing off or stopping, leave a final report in the active PR/issue or update this file.

## Required status report template

```text
FLOENTLY READ HANDOFF REPORT
Date/time:
Operator/AI:
Repository + branch:
Current SHA:
Release/TestFlight/OTA state:

VERIFIED FIXED
- [ID] change — evidence (commit/test/build/device)

PARTIALLY FIXED / NEEDS VALIDATION
- [ID] current state — exact remaining validation

OPEN FAULTS
- [ID] symptom — next concrete action

CHANGES THIS SESSION
- commit/PR — what changed

TESTS / BUILDS
- command/workflow/run — PASS/FAIL/BLOCKED
- if blocked: exact infrastructure reason

DEPLOYMENT STATE
- merged to release branch? yes/no
- web deployed? yes/no
- TestFlight submitted? yes/no
- Android test build? yes/no
- OTA published? channel/runtime/message or no

NEXT ACTIONS
1.
2.
3.
```

## Definition of done for this stabilization

Do not call the reading-quality stabilization complete until:

- native release CI is green;
- new native binary containing runtime 1.0.4/background audio is available to test;
- TestFlight device listening validates continuity/resume/background behavior;
- Browser V2 web changes have a real frontend build/test validation and are deployed;
- Browser Reader is tested inside the native app against that deployed Browser V2;
- remaining open ledger entries are either fixed or explicitly accepted with rationale;
- this handoff document and tracking issue are updated with final evidence.

## 2026-09-30 iPhone/TestFlight playback architecture update

Fresh iPhone screenshots and screen recordings added NR-16 through NR-19 to issue #77.

### Corrected release state

- iOS TestFlight workflow run `36607732079` is **completed / cancelled**, not still building. Its preflight steps passed, but step **Build and auto-submit to TestFlight** was cancelled. A new successful submission is still required before any new-binary device claim.

### New device-proven defects

- **NR-16 — wrong lock-screen timeline:** the iPhone Now Playing surface shows the duration of the current short TTS clip rather than the logical document. The supplied screenshot showed a roughly 21-second media timeline for a reading that is materially longer.
- **NR-17 — chunk model leaks into product behavior:** current `ReadReaderScreen` splits text with `readerAudioChunks(..., 3600)`, swaps the source on one Expo `AudioPlayer`, and advances only after `didJustFinish`. Preloading upcoming sources reduces stalls but does not turn those clips into one logical reading session.
- **NR-19 — document-wide media session required:** the app must expose one document elapsed/remaining timeline and one resume cursor to the UI and iOS Now Playing layer. Segment index/current-clip duration are implementation details only.

### Architecture direction

Create a complete `ReadingManifest` from the extracted text immediately. It should contain document identity/revision, word/character counts, an estimated whole-document duration, ordered hidden TTS segments with logical start/end offsets, and a document cursor. Start narration as soon as the first segment is ready while a time-horizon queue prepares later segments.

Expo Audio SDK 55 provides `AudioPlaylist` with gapless-playback support, so it is worth using for segment handoff experiments. However, SDK 55 documents playlist `duration` as the **current track duration** and exposes lock-screen activation on `AudioPlayer`, not a document-wide virtual duration. Therefore a gapless playlist alone does not satisfy NR-16/NR-19. The final iOS media session must explicitly publish logical document duration/elapsed time and map remote seek commands back into manifest segment + offset; that may require a native iOS bridge or a later Expo runtime with sufficient playlist lock-screen control.

Do not “fix” the screenshot by merely hiding the lock-screen progress bar. The product requirement is accurate whole-reading progress with working pause/resume/seek.

### 2026-09-30 implementation progress

- Added `readingPlaybackManifest.ts` (`c78cfcc`) to index the complete reading immediately, calculate word/character counts, produce ordered hidden segment offsets, estimate whole-document source/playback duration, map document progress ↔ segment position, format multi-hour clocks, and choose a time-horizon prefetch queue.
- Integrated the manifest into `ReadMobileScreens.tsx` (`69bc208`): the Reader time display is now based on whole-document estimated playback duration, resume/progress use logical manifest mapping, and prefetch now targets roughly 120 seconds ahead (up to four hidden segments) instead of a hard-coded next-two-chunk policy.
- Updated native Read verification (`2e5f40e`) so the logical manifest and document-wide duration/progress contract are explicit source invariants.
- CI run `36653722128` then failed only because `.github/workflows/ci.yml` still grepped for the removed legacy `readerAudioChunks` function. TypeScript passed and backend passed. The stale CI invariant was replaced with logical-manifest checks and the full `verify:read-live-browser` script in commit `1ada3b5`.
- A later CI run `36653966716` exposed a second stale verifier: `verify-read-live-browser.mjs` still expected the removed `NativeReadPreviewScreen` landing even though the current route intentionally renders `FloentlyReadLandingScreen`. The verifier was aligned to the current public Floently web-parity surfaces in commit `72d318f`. CI run `36686539309` was queued from that head and must be checked before release claims.

**Important:** this is the document-timeline foundation, not the complete NR-16/NR-19 fix. The physical native player still swaps bounded audio sources. Whole-document iOS Now Playing duration/elapsed/seek and truly seamless native segment handoff remain open and require the media-session/queue phase.


## 2026-09-30 React Native release stabilization continuation

### Verified source progress

- `48988c8`: verifier aligned with the current `/read/reader` authentication destination. CI run `36688317776` PASS.
- `222a012` + `4b4bce7`: Reader ±10 second controls now seek on the logical whole-document timeline and can cross hidden TTS segment boundaries; obsolete segment-level Replay control removed. CI runs `36688498983` and `36688527741` PASS.
- `575fddb` + `c858335`: Browser Reader reconnect/reload now hard-remounts the outer React Native WebView/auth bridge while preserving the private server-side Chromium profile. CI run `36689009989` PASS.
- `f63a6ef`: CI no longer invokes authenticated EAS workflow validation without credentials; it checks deterministic release-workflow source contracts instead. CI run `36689065942` PASS.
- Exact release-candidate source head `0e42b5a` passed complete CI in run `36689294460` (client + backend).

### TestFlight workflow repair

- The old 120-minute cancellation was diagnosed: build 49 had actually completed, but GitHub waited for the App Store submission until the job timeout.
- `0e42b5a` changed the release job to queue EAS build + auto-submit with `--no-wait` so GitHub does not remain attached to a long Apple-processing wait.
- Run `36689287138` passed every release gate and created EAS build **50**, build ID `7d241869-c2a3-413f-adc1-257eb86f9081`, but auto-submit scheduling failed because `--what-to-test` maps to an Enterprise-only changelog submission parameter.
- `ba72ab4` removed that Enterprise-only flag while retaining `--no-wait` + auto-submit. Replacement TestFlight run `36689786344` **PASS**: all release gates passed, EAS build **51** was queued with build ID `f7b1c882-27c6-4bbe-8174-0d9a7a4d6651`, and iOS submission `98b2e827-1fb6-464e-96bc-3d7641770ab6` was successfully scheduled. Because the workflow now uses `--no-wait`, this proves server-side build/submission scheduling, not that Apple processing/TestFlight availability has already completed.

### Remaining React Native limitations

- The React Native UI now has one logical document duration/progress/seek model, but Expo Audio still swaps bounded physical audio sources. iOS Now Playing can therefore still expose the current physical source duration. The separate Swift/Kotlin native-app lane owns the deeper OS-level media-session/queue architecture; do not destabilize this RN release lane by folding that rewrite into PR #75.
- Browser V2 production deployment and physical iPhone Browser Reader validation are still required before WR-15/16/17 can be called device-fixed.
