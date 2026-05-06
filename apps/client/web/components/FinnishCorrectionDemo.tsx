/**
 * FinnishCorrectionDemo — animated demo of the core Floently loop.
 *
 * Sequence (8 phases, ~14s total before loop):
 *   1. CURSOR        — blinking cursor in an empty input
 *   2. TYPING        — sentence types in character-by-character with the
 *                      common case error "apteekkiin" (should be "apteekissa")
 *   3. PAUSE         — full sentence visible, brief settle
 *   4. ERROR_FLAG    — "apteekkiin" gets a red wavy underline
 *   5. TOOLTIP       — small floating card explains the rule and the fix
 *   6. CORRECTING    — wrong word fades out, correct word fades in
 *   7. SUCCESS       — green checkmark + brief subtle glow
 *   8. RESET         — fade everything to start state, loop
 *
 * Design rules:
 *   - Pure React + CSS. No external animation libraries.
 *   - Respects prefers-reduced-motion: animation pauses, shows the
 *     final-state corrected sentence with a static checkmark.
 *   - Uses the Floently palette via inline CSS variables so the same
 *     component can theme into dark (landing hero) or light (auth) contexts.
 *   - Self-cleaning: clears all timers on unmount to avoid React 18
 *     strict-mode double-fire bleed.
 *
 * Usage in landing hero:    <FinnishCorrectionDemo theme="dark" />
 * Usage in auth split half:  <FinnishCorrectionDemo theme="dark" compact />
 */

import React, { useEffect, useRef, useState } from 'react';

type Phase =
  | 'cursor'
  | 'typing'
  | 'pause'
  | 'error_flag'
  | 'tooltip'
  | 'correcting'
  | 'success'
  | 'reset';

type Theme = 'dark' | 'light';

// ── Demo content ────────────────────────────────────────────────────────────
// Sentence chosen to be:
//   1. B1-band — accessible to most learners visiting the site
//   2. Healthcare-adjacent enough to feel relevant ("went to the pharmacy")
//   3. Uses a single classic Finnish error (past participle ending) that's
//      cleanly demonstrable with one word swap
const SENTENCE = 'Kävin apteekkiin eilen.';
const WRONG_WORD = 'apteekkiin';
const RIGHT_WORD = 'apteekissa';
const SENTENCE_CORRECT = SENTENCE.replace(WRONG_WORD, RIGHT_WORD);

// ── Phase timings (ms) ──────────────────────────────────────────────────────
const TIMINGS: Record<Phase, number> = {
  cursor: 700,
  typing: 2400,        // ~80ms per char × ~30 chars
  pause: 600,
  error_flag: 800,
  tooltip: 2400,
  correcting: 700,
  success: 1500,
  reset: 600,
};

// Order of phases in the loop
const PHASE_ORDER: Phase[] = [
  'cursor',
  'typing',
  'pause',
  'error_flag',
  'tooltip',
  'correcting',
  'success',
  'reset',
];

// ── Component ───────────────────────────────────────────────────────────────

type Props = {
  theme?: Theme;
  compact?: boolean;
};

export default function FinnishCorrectionDemo({ theme = 'dark', compact = false }: Props) {
  const [phase, setPhase] = useState<Phase>('cursor');
  const [typedChars, setTypedChars] = useState(0);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect reduced-motion preference. If set, we skip the animation and
  // show the final corrected state with a static checkmark — still
  // communicates the product without forcing motion on people who can't
  // process it.
  const reducedMotion = useReducedMotion();

  // ── Phase machine ─────────────────────────────────────────────────────
  useEffect(() => {
    if (reducedMotion) {
      // Skip animation: lock to the success state.
      setPhase('success');
      setTypedChars(SENTENCE.length);
      return;
    }

    let phaseIndex = 0;
    const advance = () => {
      const current = PHASE_ORDER[phaseIndex];
      setPhase(current);

      // Special handling for the typing phase — start a typing interval
      // that fires faster than the main phase tick.
      if (current === 'typing') {
        setTypedChars(0);
        const charInterval = TIMINGS.typing / SENTENCE.length;
        let i = 0;
        typeTimerRef.current = setInterval(() => {
          i += 1;
          setTypedChars(i);
          if (i >= SENTENCE.length && typeTimerRef.current) {
            clearInterval(typeTimerRef.current);
            typeTimerRef.current = null;
          }
        }, charInterval);
      } else if (current === 'reset') {
        setTypedChars(0);
      } else if (current !== 'cursor') {
        // For all post-typing phases, ensure the full sentence is shown
        setTypedChars(SENTENCE.length);
      }

      phaseTimerRef.current = setTimeout(() => {
        phaseIndex = (phaseIndex + 1) % PHASE_ORDER.length;
        advance();
      }, TIMINGS[current]);
    };

    advance();

    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    };
  }, [reducedMotion]);

  // ── Render helpers ────────────────────────────────────────────────────
  const showWrongWord = phase !== 'correcting' && phase !== 'success' && phase !== 'reset';
  const showRightWord = phase === 'correcting' || phase === 'success';
  const flaggedAsError = phase === 'error_flag' || phase === 'tooltip';
  const showTooltip = phase === 'tooltip';
  const showCheck = phase === 'success';

  // Compute the typed portion of the sentence
  const visibleText = typedChars >= SENTENCE.length ? SENTENCE : SENTENCE.slice(0, typedChars);

  // Theme-aware colors via CSS variables on the root
  const themeVars: React.CSSProperties = theme === 'dark'
    ? {
        // dark theme — sits on #0A1838 hero
        ['--demo-bg' as string]: 'rgba(17, 35, 70, 0.65)',
        ['--demo-border' as string]: 'rgba(90, 133, 255, 0.18)',
        ['--demo-input-bg' as string]: '#0A1838',
        ['--demo-input-border' as string]: 'rgba(90, 133, 255, 0.25)',
        ['--demo-text' as string]: '#F5F9FF',
        ['--demo-text-muted' as string]: '#A8BAD6',
        ['--demo-cursor' as string]: '#5A85FF',
        ['--demo-error' as string]: '#FF8B9C',
        ['--demo-success' as string]: '#3EC5A8',
        ['--demo-tooltip-bg' as string]: '#1B2C5D',
        ['--demo-tooltip-border' as string]: 'rgba(62, 197, 168, 0.25)',
        ['--demo-tooltip-text' as string]: '#F5F9FF',
        ['--demo-label' as string]: '#7A8CAE',
        ['--demo-glow' as string]: 'rgba(62, 197, 168, 0.18)',
      }
    : {
        // light theme — sits on white/cream surfaces (auth)
        ['--demo-bg' as string]: '#F6F8FD',
        ['--demo-border' as string]: 'rgba(31, 71, 232, 0.10)',
        ['--demo-input-bg' as string]: '#FFFFFF',
        ['--demo-input-border' as string]: 'rgba(31, 71, 232, 0.18)',
        ['--demo-text' as string]: '#0A1838',
        ['--demo-text-muted' as string]: '#5C7299',
        ['--demo-cursor' as string]: '#1F47E8',
        ['--demo-error' as string]: '#D93B4D',
        ['--demo-success' as string]: '#0E9F7E',
        ['--demo-tooltip-bg' as string]: '#FFFFFF',
        ['--demo-tooltip-border' as string]: 'rgba(14, 159, 126, 0.30)',
        ['--demo-tooltip-text' as string]: '#0A1838',
        ['--demo-label' as string]: '#7B8AA3',
        ['--demo-glow' as string]: 'rgba(14, 159, 126, 0.10)',
      };

  // Container size depends on compact flag
  const minHeight = compact ? 280 : 380;

  return (
    <div className="floently-demo-root" style={{ ...themeVars, minHeight }}>
      <DemoStyles />

      {/* Top label — gives it document-feel */}
      <div className="floently-demo-label">
        <span className="floently-demo-dot" />
        <span>Floently · Live correction</span>
      </div>

      {/* Input pane */}
      <div className={`floently-demo-input ${showCheck ? 'is-success' : ''}`}>
        <div className="floently-demo-prompt">Your answer in Finnish</div>
        <div className="floently-demo-text">
          {/* Render the sentence with the wrong word in a span we can style.
              When typing, we show character-by-character.
              After correction, the wrong word fades out and the right word fades in. */}
          {phase === 'cursor' ? (
            <span className="floently-demo-cursor-only">
              <span className="floently-demo-cursor">|</span>
            </span>
          ) : (
            <>
              {renderSentenceWithWord({
                visible: visibleText,
                wrongWord: WRONG_WORD,
                rightWord: RIGHT_WORD,
                showWrongWord,
                showRightWord,
                flaggedAsError,
                isTyping: phase === 'typing',
              })}
            </>
          )}
        </div>

        {/* Inline tooltip explaining the correction */}
        <div
          className="floently-demo-tooltip"
          style={{ opacity: showTooltip ? 1 : 0, transform: showTooltip ? 'translateY(0)' : 'translateY(6px)' }}
          aria-live="polite"
        >
          <div className="floently-demo-tooltip-arrow" />
          <div className="floently-demo-tooltip-title">Location case: <strong>apteekissa</strong>, not apteekkiin</div>
          <div className="floently-demo-tooltip-body">
            After käydä, use the inessive (-ssa/-ssä) to say where you visited: apteekissa, kaupassa, töissä.
          </div>
        </div>

        {/* Success ribbon */}
        <div
          className="floently-demo-success-ribbon"
          style={{ opacity: showCheck ? 1 : 0 }}
          aria-live="polite"
        >
          <span className="floently-demo-check">✓</span>
          <span>Looks right now. One step closer to YKI.</span>
        </div>
      </div>
    </div>
  );
}

// ── Sentence renderer ───────────────────────────────────────────────────────
// Renders the sentence with the wrong-word span treated specially so we can
// crossfade between the wrong and right word, and apply error / success
// styling to it without re-rendering the whole text.
function renderSentenceWithWord({
  visible,
  wrongWord,
  rightWord,
  showWrongWord,
  showRightWord,
  flaggedAsError,
  isTyping,
}: {
  visible: string;
  wrongWord: string;
  rightWord: string;
  showWrongWord: boolean;
  showRightWord: boolean;
  flaggedAsError: boolean;
  isTyping: boolean;
}) {
  // Find the wrong word position in the sentence
  const idx = SENTENCE.indexOf(wrongWord);
  if (idx < 0) {
    return <span>{visible}</span>;
  }

  // What portion of "before / wrong / after" has been typed so far?
  const before = visible.slice(0, Math.min(idx, visible.length));
  const wrongTyped = visible.length > idx
    ? visible.slice(idx, Math.min(idx + wrongWord.length, visible.length))
    : '';
  const afterTyped = visible.length > idx + wrongWord.length
    ? visible.slice(idx + wrongWord.length)
    : '';

  return (
    <>
      <span>{before}</span>
      <span className={`floently-demo-target ${flaggedAsError ? 'is-error' : ''}`}>
        <span className="floently-demo-target-wrong" style={{
          opacity: showWrongWord ? 1 : 0,
          display: showWrongWord ? 'inline-block' : 'none',
        }}>{wrongTyped}</span>
        <span className="floently-demo-target-right" style={{
          opacity: showRightWord ? 1 : 0,
          display: showRightWord ? 'inline-block' : 'none',
        }}>{rightWord}</span>
      </span>
      <span>{afterTyped}</span>
      {isTyping && <span className="floently-demo-cursor">|</span>}
    </>
  );
}

// ── Reduced-motion hook ─────────────────────────────────────────────────────
function useReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return prefers;
}

// ── Stylesheet (CSS-in-JS via <style> for keyframes + class rules) ──────────
function DemoStyles() {
  return (
    <style>{`
      .floently-demo-root {
        position: relative;
        border-radius: 24px;
        background: var(--demo-bg);
        border: 1px solid var(--demo-border);
        padding: 22px;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
        overflow: hidden;
      }
      .floently-demo-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        color: var(--demo-label);
        margin-bottom: 14px;
      }
      .floently-demo-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: var(--demo-success);
        box-shadow: 0 0 0 0 var(--demo-success);
        animation: floently-pulse 2.4s ease-in-out infinite;
      }
      @keyframes floently-pulse {
        0%, 100% { box-shadow: 0 0 0 0 var(--demo-success); opacity: 1; }
        50%      { box-shadow: 0 0 0 6px transparent; opacity: 0.6; }
      }
      .floently-demo-input {
        position: relative;
        background: var(--demo-input-bg);
        border: 1px solid var(--demo-input-border);
        border-radius: 18px;
        padding: 18px 18px 14px;
        transition: border-color 400ms ease, box-shadow 400ms ease;
      }
      .floently-demo-input.is-success {
        border-color: var(--demo-success);
        box-shadow: 0 0 0 4px var(--demo-glow);
      }
      .floently-demo-prompt {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--demo-text-muted);
        margin-bottom: 10px;
      }
      .floently-demo-text {
        font-size: 22px;
        font-weight: 600;
        letter-spacing: -0.2px;
        line-height: 1.45;
        color: var(--demo-text);
        min-height: 32px;
      }
      .floently-demo-cursor {
        display: inline-block;
        margin-left: 2px;
        color: var(--demo-cursor);
        animation: floently-blink 0.95s steps(2, start) infinite;
        font-weight: 400;
      }
      @keyframes floently-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      .floently-demo-cursor-only {
        font-size: 22px;
      }
      /* Target word — the focus of the correction */
      .floently-demo-target {
        position: relative;
        display: inline-block;
        transition: color 250ms ease;
      }
      .floently-demo-target.is-error .floently-demo-target-wrong {
        color: var(--demo-error);
        text-decoration: underline wavy var(--demo-error);
        text-underline-offset: 4px;
        animation: floently-shake 350ms ease-in-out;
      }
      .floently-demo-target-wrong, .floently-demo-target-right {
        transition: opacity 350ms ease;
      }
      .floently-demo-target-right {
        color: var(--demo-success);
        font-weight: 700;
      }
      @keyframes floently-shake {
        0%, 100% { transform: translateX(0); }
        25%      { transform: translateX(-2px); }
        75%      { transform: translateX(2px); }
      }
      /* Tooltip */
      .floently-demo-tooltip {
        position: absolute;
        left: 50%;
        bottom: -72px;
        transform: translateX(-50%);
        background: var(--demo-tooltip-bg);
        color: var(--demo-tooltip-text);
        border: 1px solid var(--demo-tooltip-border);
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 13px;
        line-height: 1.45;
        max-width: 320px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        transition: opacity 280ms ease, transform 280ms ease;
        pointer-events: none;
        z-index: 2;
      }
      .floently-demo-tooltip-arrow {
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 10px;
        height: 10px;
        background: var(--demo-tooltip-bg);
        border-top: 1px solid var(--demo-tooltip-border);
        border-left: 1px solid var(--demo-tooltip-border);
      }
      .floently-demo-tooltip-title {
        font-weight: 700;
        margin-bottom: 4px;
      }
      .floently-demo-tooltip-body {
        font-size: 12px;
        color: var(--demo-text-muted);
        line-height: 1.5;
      }
      /* Success ribbon */
      .floently-demo-success-ribbon {
        margin-top: 14px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--demo-success);
        transition: opacity 300ms ease;
      }
      .floently-demo-check {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: var(--demo-success);
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
      }
      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .floently-demo-cursor,
        .floently-demo-dot,
        .floently-demo-target.is-error .floently-demo-target-wrong {
          animation: none !important;
        }
      }
    `}</style>
  );
}
