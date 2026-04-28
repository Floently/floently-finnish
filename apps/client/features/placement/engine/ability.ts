/**
 * Lightweight IRT ability estimator.
 *
 * Uses an Elo-style online update that approximates the 2-parameter logistic (2PL) IRT model.
 * With a fixed 9-item test we don't need MLE / EAP — the online approximation converges
 * quickly enough for CEFR-band placement and stays simple to reason about.
 *
 * theta: current ability estimate (logit scale, typically -3 to +3)
 * stdError: standard error of the estimate, tightens with each item
 *
 * Per-item update:
 *   expected probability of correct = 1 / (1 + exp(-a * (theta - difficulty)))
 *   theta ← theta + K * a * (correct - expected)
 *
 * K is a learning rate. We start K high (fast convergence early) and decay it so later
 * items contribute less abrupt shifts.
 */

import type { PlacementItem } from '../data/items';
import type { PlacementBand } from '@core/schemas/onboarding';

export type AbilityState = {
  theta: number;
  stdError: number;
  itemsAnswered: number;
  sumSquaredResiduals: number;
};

export const INITIAL_ABILITY: AbilityState = {
  theta: 0.0, // B1-anchor start; research shows mid-range anchors converge faster than A1/mean
  stdError: 2.5,
  itemsAnswered: 0,
  sumSquaredResiduals: 0,
};

/** Probability the learner answers this item correctly given current ability. */
export function probCorrect(theta: number, item: Pick<PlacementItem, 'theta' | 'a'>): number {
  const z = item.a * (theta - item.theta);
  return 1 / (1 + Math.exp(-z));
}

/** Update ability estimate after one item response. */
export function updateAbility(
  state: AbilityState,
  item: Pick<PlacementItem, 'theta' | 'a'>,
  correct: boolean,
  opts: { latencyMs?: number } = {},
): AbilityState {
  const expected = probCorrect(state.theta, item);
  const observed = correct ? 1 : 0;

  // Decaying learning rate: early items move theta more than later ones.
  const n = state.itemsAnswered;
  const K = 0.6 / (1 + n * 0.25);

  // Latency bonus/penalty: very fast correct answers on easy items contribute
  // slightly more certainty; very slow correct answers on hard items count as
  // "probably guessed partially" and contribute slightly less. Keep effect modest
  // (±10% of the update) so it doesn't overpower the correctness signal.
  let latencyMultiplier = 1;
  if (correct && opts.latencyMs != null) {
    if (opts.latencyMs < 3000) latencyMultiplier = 1.1;
    else if (opts.latencyMs > 25000) latencyMultiplier = 0.9;
  }

  const delta = K * item.a * (observed - expected) * latencyMultiplier;
  const newTheta = state.theta + delta;

  // Standard error tightens as informative items accumulate. Use item information
  // under 2PL: I(θ) = a² · p · (1 - p)
  const information = item.a * item.a * expected * (1 - expected);
  // Convert to an SE reduction (monotonically tightening)
  const newSE = Math.max(0.3, state.stdError / Math.sqrt(1 + information * 0.6));

  return {
    theta: newTheta,
    stdError: newSE,
    itemsAnswered: n + 1,
    sumSquaredResiduals: state.sumSquaredResiduals + (observed - expected) ** 2,
  };
}

/** Map final theta to the existing coarse PlacementBand schema. Preserves storage compat. */
export function bandFromTheta(theta: number): PlacementBand {
  if (theta < -1.5) return 'A0';
  if (theta < 0.0) return 'A1-A2';
  if (theta < 1.5) return 'B1-B2';
  return 'C1-C2';
}

/** Refined CEFR for display purposes — not stored in the existing schema. */
export type RefinedCefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export function refinedCefrFromTheta(theta: number): RefinedCefr {
  if (theta < -1.5) return 'A1';
  if (theta < -0.5) return 'A2';
  if (theta < 0.5) return 'B1';
  if (theta < 1.5) return 'B2';
  if (theta < 2.5) return 'C1';
  return 'C2';
}

/** Confidence from standard error — for the UI. */
export function confidenceFromState(state: AbilityState): 'light' | 'good' | 'high' {
  if (state.stdError < 0.55) return 'high';
  if (state.stdError < 0.9) return 'good';
  return 'light';
}
