/**
 * Scenario alternatives for the "try another scenario" CTA at session end.
 *
 * Mirrors the backend's _ROLEPLAY_REGISTRY from apps/backend/app/runtime/roleplay.py —
 * if the backend adds or renames scenarios, update this map. Kept client-side so the
 * "next scenario" pick can happen instantly at session end without a round trip.
 *
 * Each entry lists the scenario's human-readable title (shown in the CTA preview)
 * and the profession it belongs to. The picker rotates to an unused-or-less-recent
 * scenario for the same profession.
 */

import type { RoleplayProfession } from '../types';

export type ScenarioOption = {
  id: string;
  title: string;
  profession: string;
};

export const SCENARIOS_BY_PROFESSION: Record<string, ScenarioOption[]> = {
  general: [
    { id: 'general_supervisor_instruction', title: 'Clarify a work task', profession: 'general' },
    { id: 'general_issue_report', title: 'Report a workplace issue', profession: 'general' },
  ],
  nurse: [
    { id: 'nurse_shift_handover', title: 'Shift handover', profession: 'nurse' },
    { id: 'nurse_patient_update', title: 'Patient update', profession: 'nurse' },
    { id: 'nurse_interview_beta', title: 'Nurse interview', profession: 'nurse' },
  ],
  doctor: [
    { id: 'doctor_patient_interview', title: 'Patient interview', profession: 'doctor' },
    { id: 'doctor_follow_up_explanation', title: 'Explain next steps', profession: 'doctor' },
  ],
  practical_nurse: [
    { id: 'practical_nurse_daily_care', title: 'Daily care update', profession: 'practical_nurse' },
    { id: 'practical_nurse_interview', title: 'Practical nurse interview', profession: 'practical_nurse' },
  ],
};

/**
 * Pick the next scenario for a user who just completed one.
 * Strategy: rotate to the next scenario in the profession's list (cyclic). If the
 * profession only has one scenario, return null — caller should show "restart same
 * scenario" as the CTA instead of "try another."
 */
export function pickAlternativeScenario(params: {
  profession: RoleplayProfession | string;
  justCompletedScenarioId: string | null | undefined;
}): ScenarioOption | null {
  const list = SCENARIOS_BY_PROFESSION[params.profession] ?? [];
  if (list.length <= 1) return null;

  const currentIdx = params.justCompletedScenarioId
    ? list.findIndex((s) => s.id === params.justCompletedScenarioId)
    : -1;
  const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % list.length;
  // Avoid returning the same scenario as current (can happen if currentIdx < 0 and list[0] === current)
  const candidate = list[nextIdx];
  if (candidate.id === params.justCompletedScenarioId && list.length > 1) {
    return list[(nextIdx + 1) % list.length];
  }
  return candidate;
}
