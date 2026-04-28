export type PlacementTrack = 'everyday_yki' | 'workplace_professional' | 'both';
export type PlacementBand = 'A0' | 'A1-A2' | 'B1-B2' | 'C1-C2';

/** Refined CEFR for display — not used for routing/startLevel which still uses PlacementBand. */
export type RefinedCefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type PlacementSkillProfile = {
  reading: PlacementBand;
  listening: PlacementBand;
  vocabulary: PlacementBand;
  grammar: PlacementBand;
  speakingConfidence: PlacementBand;
};

export type PlacementRecommendation = {
  startTrack: PlacementTrack;
  startLevel: PlacementBand;
  confidence: 'light' | 'good' | 'high';
  rationale: string;
  nextStep: string;
};

/**
 * New adaptive metadata. All fields are optional so existing persisted results
 * stay backward-compatible. The UI can display refined CEFR and diagnostics when
 * present; otherwise it falls back to the legacy `adaptiveScore` / band.
 */
export type PlacementAdaptiveMeta = {
  theta: number;                // final ability estimate (logit scale)
  stdError: number;             // uncertainty of the estimate
  refinedCefr: RefinedCefr;     // A1/A2/B1/B2/C1/C2 single-letter CEFR
  itemsAdministered: number;
  itemsCorrect: number;
  averageLatencyMs: number;
  itemsUsed: string[];          // item ids in order shown; useful for auditing/retakes
};

export type PlacementResult = {
  track: PlacementTrack;
  selfAssessmentScore: number;
  adaptiveScore: number;
  optionalSpeakingCompleted: boolean;
  profile: PlacementSkillProfile;
  recommendation: PlacementRecommendation;
  /** New adaptive diagnostics. Absent on results persisted before the adaptive engine shipped. */
  adaptive?: PlacementAdaptiveMeta;
};

export type OnboardingState = {
  acceptedTermsAt?: string | null;
  placementDismissed?: boolean;
  placementResult?: PlacementResult | null;
};
