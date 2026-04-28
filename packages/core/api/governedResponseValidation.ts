export type ControlledUiErrorCode =
  | "CONTRACT_VIOLATION"
  | "GOVERNANCE_MISSING"
  | "TRANSPORT_ERROR";

export const REQUIRED_BACKEND_VERSION = "2026-04-01.backend-lock.v1";
export const REQUIRED_CONTRACT_VERSION = "2026-04-01.contract-lock.v1";

export type GovernanceStatus = "governed" | "legacy_uncontrolled";

type Schema =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "enum"; values: readonly string[] }
  | { kind: "nullable"; value: Schema }
  | { kind: "array"; item: Schema }
  | { kind: "record"; value: Schema }
  | { kind: "unknownRecord" }
  | {
      kind: "object";
      required: Record<string, Schema>;
      optional?: Record<string, Schema>;
    };

const stringSchema: Schema = { kind: "string" };
const numberSchema: Schema = { kind: "number" };
const booleanSchema: Schema = { kind: "boolean" };

function enumSchema(values: readonly string[]): Schema {
  return { kind: "enum", values };
}

function nullableSchema(value: Schema): Schema {
  return { kind: "nullable", value };
}

function arraySchema(item: Schema): Schema {
  return { kind: "array", item };
}

function recordSchema(value: Schema): Schema {
  return { kind: "record", value };
}

function unknownRecordSchema(): Schema {
  return { kind: "unknownRecord" };
}

function objectSchema(
  required: Record<string, Schema>,
  optional: Record<string, Schema> = {},
): Schema {
  return {
    kind: "object",
    required,
    optional,
  };
}

const metaSchema = objectSchema({
  version: stringSchema,
  contract_version: stringSchema,
  timestamp: stringSchema,
  trace_id: stringSchema,
  event_id: nullableSchema(stringSchema),
});

const apiErrorSchema = objectSchema({
  code: stringSchema,
  message: stringSchema,
  retryable: booleanSchema,
  trace_id: nullableSchema(stringSchema),
  event_id: nullableSchema(stringSchema),
});

export class ControlledUiValidationError extends Error {
  code: Exclude<ControlledUiErrorCode, "TRANSPORT_ERROR">;
  path: string;

  constructor(
    path: string,
    code: Exclude<ControlledUiErrorCode, "TRANSPORT_ERROR">,
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "ControlledUiValidationError";
    this.path = path;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDevRuntime() {
  if (typeof globalThis === "object" && globalThis && "__DEV__" in globalThis) {
    return Boolean((globalThis as { __DEV__?: unknown }).__DEV__);
  }

  return process.env.NODE_ENV !== "production";
}

function validateSchema(value: unknown, schema: Schema, path: string): void {
  switch (schema.kind) {
    case "string":
      if (typeof value !== "string") {
        throw new ControlledUiValidationError(path, "CONTRACT_VIOLATION", `${path} must be a string.`);
      }
      return;
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new ControlledUiValidationError(path, "CONTRACT_VIOLATION", `${path} must be a number.`);
      }
      return;
    case "boolean":
      if (typeof value !== "boolean") {
        throw new ControlledUiValidationError(path, "CONTRACT_VIOLATION", `${path} must be a boolean.`);
      }
      return;
    case "enum":
      if (typeof value !== "string" || !schema.values.includes(value)) {
        throw new ControlledUiValidationError(
          path,
          "CONTRACT_VIOLATION",
          `${path} must be one of ${schema.values.join(", ")}.`,
        );
      }
      return;
    case "nullable":
      if (value === null) {
        return;
      }
      validateSchema(value, schema.value, path);
      return;
    case "array":
      if (!Array.isArray(value)) {
        throw new ControlledUiValidationError(path, "CONTRACT_VIOLATION", `${path} must be an array.`);
      }
      value.forEach((entry, index) => validateSchema(entry, schema.item, `${path}[${index}]`));
      return;
    case "record":
      if (!isRecord(value)) {
        throw new ControlledUiValidationError(path, "CONTRACT_VIOLATION", `${path} must be an object map.`);
      }
      Object.entries(value).forEach(([key, entry]) =>
        validateSchema(entry, schema.value, `${path}.${key}`),
      );
      return;
    case "unknownRecord":
      if (!isRecord(value)) {
        throw new ControlledUiValidationError(path, "CONTRACT_VIOLATION", `${path} must be an object.`);
      }
      return;
    case "object": {
      if (!isRecord(value)) {
        throw new ControlledUiValidationError(path, "CONTRACT_VIOLATION", `${path} must be an object.`);
      }

      const allowedKeys = new Set([
        ...Object.keys(schema.required),
        ...Object.keys(schema.optional ?? {}),
      ]);

      Object.keys(value).forEach((key) => {
        if (!allowedKeys.has(key)) {
          throw new ControlledUiValidationError(
            path,
            "CONTRACT_VIOLATION",
            `${path} contains unexpected field ${key}.`,
          );
        }
      });

      Object.entries(schema.required).forEach(([key, childSchema]) => {
        if (!(key in value)) {
          throw new ControlledUiValidationError(
            path,
            "CONTRACT_VIOLATION",
            `${path}.${key} is required.`,
          );
        }
        validateSchema(value[key], childSchema, `${path}.${key}`);
      });

      Object.entries(schema.optional ?? {}).forEach(([key, childSchema]) => {
        if (key in value && value[key] !== undefined) {
          validateSchema(value[key], childSchema, `${path}.${key}`);
        }
      });
      return;
    }
  }
}

function readOptionalString(record: Record<string, unknown>, key: string, path: string) {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ControlledUiValidationError(
      path,
      "CONTRACT_VIOLATION",
      `${path}.${key} must be a string or null.`,
    );
  }

  return value;
}

function enforceGovernance(
  record: Record<string, unknown>,
  path: string,
  keys: {
    governanceKey: string;
    policyKey: string;
    changeReferenceKey: string;
  },
  allowLegacyUncontrolled: boolean,
) {
  const governanceValue = readOptionalString(record, keys.governanceKey, path);
  const policyValue = readOptionalString(record, keys.policyKey, path);
  const changeReferenceValue = readOptionalString(record, keys.changeReferenceKey, path) ?? null;

  if (typeof governanceValue === "string" && typeof policyValue === "string") {
    return {
      governanceStatus: "governed" as const,
      governanceVersion: governanceValue,
      policyVersion: policyValue,
      changeReference: changeReferenceValue,
    };
  }

  if (allowLegacyUncontrolled) {
    return {
      governanceStatus: "legacy_uncontrolled" as const,
      governanceVersion:
        typeof governanceValue === "string" ? governanceValue : "legacy_uncontrolled",
      policyVersion: typeof policyValue === "string" ? policyValue : "legacy_uncontrolled",
      changeReference: changeReferenceValue,
    };
  }

  throw new ControlledUiValidationError(
    path,
    "GOVERNANCE_MISSING",
    `${path} is missing required governance metadata.`,
  );
}

const learningUnitSchema = objectSchema({
  id: stringSchema,
  kind: stringSchema,
  level: stringSchema,
  difficultyLevel: enumSchema(["easy", "medium", "hard"]),
  title: stringSchema,
  summary: stringSchema,
  example: stringSchema,
  details: recordSchema(stringSchema),
  moduleIds: arraySchema(stringSchema),
  relatedUnitIds: arraySchema(stringSchema),
});

const signalHistorySchema = objectSchema({
  user_id: stringSchema,
  module_id: stringSchema,
  unit_id: stringSchema,
  signal_source: stringSchema,
  is_correct: booleanSchema,
  task_type: nullableSchema(stringSchema),
  task_section: nullableSchema(stringSchema),
  difficulty_level: nullableSchema(stringSchema),
  recorded_at: stringSchema,
  previous_mastery_score: numberSchema,
  updated_mastery_score: numberSchema,
  improvement_delta: numberSchema,
  effectiveness_score: numberSchema,
  stagnated: booleanSchema,
  impact_label: stringSchema,
});

const learningUnitProgressSummarySchema = objectSchema({
  user_id: stringSchema,
  unit_id: stringSchema,
  attempts: numberSchema,
  correct_attempts: numberSchema,
  last_attempt_at: nullableSchema(stringSchema),
  last_practiced_at: nullableSchema(stringSchema),
  next_review_at: nullableSchema(stringSchema),
  review_interval_days: numberSchema,
  streak_correct: numberSchema,
  mastery_score: numberSchema,
  mastery_level: enumSchema(["weak", "improving", "mastered"]),
  due_for_review: booleanSchema,
  urgency: enumSchema(["scheduled", "due_now", "overdue"]),
  days_overdue: numberSchema,
  recent_mistake: booleanSchema,
  regression_detected: booleanSchema,
  stagnated: booleanSchema,
  stagnation_reason: nullableSchema(stringSchema),
  stagnation_detected_at: nullableSchema(stringSchema),
  previous_mastery_score: numberSchema,
  yki_influence_count: numberSchema,
  signal_history: arraySchema(signalHistorySchema),
  policy_version: stringSchema,
});

const weightedFactorSchema = objectSchema({
  factor_score: numberSchema,
  weight: numberSchema,
  weighted_score: numberSchema,
});

const adaptiveWeightModifierSchema = objectSchema({
  weights: recordSchema(numberSchema),
  adjustments: recordSchema(numberSchema),
  rawAdjustments: recordSchema(numberSchema),
  averageEffectiveness: numberSchema,
  averageImprovementDelta: numberSchema,
  attemptHistoryDepth: numberSchema,
  measuredOutcomeCount: numberSchema,
  stagnatedUnitIds: arraySchema(stringSchema),
  retryLogic: nullableSchema(stringSchema),
  variationUnitIds: arraySchema(stringSchema),
  rejectionReasons: arraySchema(stringSchema),
  reasoning: arraySchema(stringSchema),
  moduleOutcomeStatuses: arraySchema(
    objectSchema({
      unitId: stringSchema,
      status: stringSchema,
      effectivenessScore: numberSchema,
      improvementDelta: numberSchema,
    }),
  ),
  ykiInfluenceCount: numberSchema,
  policyVersion: stringSchema,
  appliedConstraints: arraySchema(stringSchema),
  clampedValues: arraySchema(stringSchema),
  rejectedAdaptiveChanges: arraySchema(stringSchema),
  ykiInfluenceBonus: numberSchema,
});

const selectionReasonSchema = objectSchema({
  decision_version: stringSchema,
  policy_version: stringSchema,
  decision_policy_version: stringSchema,
  governance_version: stringSchema,
  change_reference: nullableSchema(stringSchema),
  weak_patterns_used: arraySchema(stringSchema),
  mastery_score_used: objectSchema({
    module_mastery_score: numberSchema,
    low_mastery_unit_ids: arraySchema(stringSchema),
  }),
  due_review_used: objectSchema({
    unit_ids: arraySchema(stringSchema),
    count: numberSchema,
  }),
  regression_flag: booleanSchema,
  regression_unit_ids: arraySchema(stringSchema),
  stagnated_unit_ids: arraySchema(stringSchema),
  difficulty_adjustment: stringSchema,
  weights_used: recordSchema(numberSchema),
  base_weights: recordSchema(numberSchema),
  adaptive_weight_modifier: adaptiveWeightModifierSchema,
  policy_constraints: arraySchema(stringSchema),
  clamped_values: arraySchema(stringSchema),
  rejected_adaptive_changes: arraySchema(stringSchema),
});

const scoreBreakdownSchema = objectSchema({
  weak_pattern: weightedFactorSchema,
  low_mastery: weightedFactorSchema,
  due_review: weightedFactorSchema,
  regression: weightedFactorSchema,
  difficulty_alignment: weightedFactorSchema,
  final_score: numberSchema,
});

const learningModuleSchema = objectSchema(
  {
    id: stringSchema,
    title: stringSchema,
    description: stringSchema,
    level: stringSchema,
    focusTags: arraySchema(stringSchema),
    unitIds: arraySchema(stringSchema),
    unitCount: numberSchema,
    units: arraySchema(learningUnitSchema),
  },
  {
    matchedWeaknesses: arraySchema(stringSchema),
    lowMasteryUnitIds: arraySchema(stringSchema),
    dueReviewUnitIds: arraySchema(stringSchema),
    recentMistakeUnitIds: arraySchema(stringSchema),
    regressionUnitIds: arraySchema(stringSchema),
    stagnatedUnitIds: arraySchema(stringSchema),
    suggested: booleanSchema,
    suggestionReason: nullableSchema(stringSchema),
    recommendationRejectedBecause: arraySchema(stringSchema),
    whyThisWasSelected: selectionReasonSchema,
    scoreBreakdown: scoreBreakdownSchema,
  },
);

const dueReviewUnitSchema = objectSchema({
  unit: learningUnitSchema,
  progress: learningUnitProgressSummarySchema,
  urgency: enumSchema(["due_now", "overdue"]),
  reviewPriorityScore: numberSchema,
});

const learningLessonItemSchema = objectSchema({
  id: stringSchema,
  label: stringSchema,
  value: stringSchema,
});

const learningLessonExerciseProgressSchema = objectSchema({
  exerciseId: stringSchema,
  attempted: booleanSchema,
  lastCorrect: nullableSchema(booleanSchema),
  lastSubmittedAnswer: nullableSchema(stringSchema),
});

const learningLessonProgressSchema = objectSchema({
  completed: booleanSchema,
  completedAt: nullableSchema(stringSchema),
  answeredExerciseIds: arraySchema(stringSchema),
  allExercisesCorrect: booleanSchema,
  exerciseProgress: arraySchema(learningLessonExerciseProgressSchema),
});

const learningLessonExerciseSchema = objectSchema({
  id: stringSchema,
  title: stringSchema,
  prompt: stringSchema,
  inputMode: enumSchema(["choice", "text"]),
  options: arraySchema(stringSchema),
  explanation: stringSchema,
  deterministicKey: stringSchema,
});

const structuredLearningLessonSchema = objectSchema({
  id: stringSchema,
  title: stringSchema,
  summary: stringSchema,
  explanation: stringSchema,
  examples: arraySchema(stringSchema),
  items: arraySchema(learningLessonItemSchema),
  exercises: arraySchema(learningLessonExerciseSchema),
  progress: learningLessonProgressSchema,
});

const structuredLearningModuleSchema = objectSchema({
  id: stringSchema,
  title: stringSchema,
  description: stringSchema,
  levelId: stringSchema,
  levelLabel: stringSchema,
  currentLessonId: stringSchema,
  completedLessonCount: numberSchema,
  totalLessonCount: numberSchema,
  progressPercent: numberSchema,
  lessons: arraySchema(structuredLearningLessonSchema),
});

const structuredLearningLevelSchema = objectSchema({
  id: stringSchema,
  title: stringSchema,
  cefr: stringSchema,
  description: stringSchema,
  modules: arraySchema(structuredLearningModuleSchema),
});

const structuredLearningModuleProgressSchema = objectSchema({
  moduleId: stringSchema,
  title: stringSchema,
  completedLessonCount: numberSchema,
  totalLessonCount: numberSchema,
  currentLessonId: stringSchema,
  progressPercent: numberSchema,
});

const learningLatestEvaluationSchema = nullableSchema(
  objectSchema({
    lessonId: stringSchema,
    exerciseId: stringSchema,
    correct: booleanSchema,
    submittedAnswer: stringSchema,
    expectedAnswer: stringSchema,
    explanation: stringSchema,
  }),
);

const learningModulesDataSchema = objectSchema({
  levels: arraySchema(structuredLearningLevelSchema),
  moduleProgress: arraySchema(structuredLearningModuleProgressSchema),
  currentLevelId: nullableSchema(stringSchema),
  currentModuleId: nullableSchema(stringSchema),
  currentLessonId: nullableSchema(stringSchema),
  completedLessonIds: arraySchema(stringSchema),
  completedLessonCount: numberSchema,
  totalLessonCount: numberSchema,
  latestEvaluation: learningLatestEvaluationSchema,
  latestTransition: nullableSchema(stringSchema),
  decisionVersion: stringSchema,
  policyVersion: stringSchema,
  governanceVersion: stringSchema,
  changeReference: nullableSchema(stringSchema),
  governanceStatus: enumSchema(["governed", "legacy_uncontrolled"]),
});

const policyConfigSchema = objectSchema({
  policy_version: stringSchema,
  decision_version: stringSchema,
  decision_policy_version: stringSchema,
  governance_version: stringSchema,
  change_reference: nullableSchema(stringSchema),
  governance_status: stringSchema,
  lastApprovedChange: nullableSchema(
    objectSchema({
      change_id: stringSchema,
      change_type: stringSchema,
      affected_component: stringSchema,
      previous_version: nullableSchema(stringSchema),
      new_version: stringSchema,
      justification: stringSchema,
      actor_id: stringSchema,
      timestamp: stringSchema,
    }),
  ),
  rules: objectSchema({
    adaptation: objectSchema({
      weight_multiplier_min: numberSchema,
      weight_multiplier_max: numberSchema,
      max_weight_adjustment: numberSchema,
      yki_influence_max_bonus: numberSchema,
    }),
    stagnation: objectSchema({
      threshold_attempts: numberSchema,
      improvement_epsilon: numberSchema,
      retry_limit: numberSchema,
      escalation_path: arraySchema(stringSchema),
    }),
    yki: objectSchema({
      exam_mode_locked: booleanSchema,
      max_influence_contribution: numberSchema,
    }),
  }),
});

const learningDebugStateSchema = objectSchema(
  {
    decisionVersion: stringSchema,
    policyVersion: stringSchema,
    decisionPolicyVersion: stringSchema,
    governanceStatus: stringSchema,
    governanceVersion: stringSchema,
    changeReference: nullableSchema(stringSchema),
    currentLevel: nullableSchema(stringSchema),
    weakPatterns: arraySchema(stringSchema),
    unitMastery: arraySchema(
      objectSchema({
        unit: learningUnitSchema,
        progress: learningUnitProgressSummarySchema,
      }),
    ),
    dueReviewUnits: arraySchema(dueReviewUnitSchema),
    stagnationConfig: objectSchema({
      attemptThreshold: numberSchema,
      improvementEpsilon: numberSchema,
      retryLimit: numberSchema,
      policyVersion: stringSchema,
      escalationPath: arraySchema(stringSchema),
    }),
    policyConfig: policyConfigSchema,
    stagnatedUnits: arraySchema(
      objectSchema({
        unitId: stringSchema,
        title: stringSchema,
        attempts: numberSchema,
        masteryScore: numberSchema,
        stagnationReason: nullableSchema(stringSchema),
        retrySuggestion: stringSchema,
        alternativeUnit: nullableSchema(learningUnitSchema),
        switchDifficultyTo: enumSchema(["easy", "medium", "hard"]),
        retryCount: numberSchema,
        policyStage: stringSchema,
        policyVersion: stringSchema,
      }),
    ),
    regressionFlags: arraySchema(
      objectSchema({
        unitId: stringSchema,
        title: stringSchema,
        previousMasteryScore: numberSchema,
        masteryScore: numberSchema,
      }),
    ),
    recommendationReasoning: arraySchema(
      objectSchema({
        moduleId: stringSchema,
        title: stringSchema,
        suggested: booleanSchema,
        suggestionReason: nullableSchema(stringSchema),
        suggestionScore: numberSchema,
        scoreBreakdown: nullableSchema(scoreBreakdownSchema),
        whyThisWasSelected: nullableSchema(selectionReasonSchema),
        recommendationRejectedBecause: arraySchema(stringSchema),
      }),
    ),
    recommendationOutcomes: arraySchema(
      objectSchema({
        user_id: stringSchema,
        module_id: stringSchema,
        unit_id: stringSchema,
        decision_version: stringSchema,
        policy_version: stringSchema,
        recommended_at: stringSchema,
        baseline_mastery_score: numberSchema,
        subsequent_attempts: numberSchema,
        improvement_delta: numberSchema,
        effectiveness_score: numberSchema,
        latest_mastery_score: numberSchema,
        status: stringSchema,
        factors_used: arraySchema(stringSchema),
        weights_used: recordSchema(numberSchema),
        retry_count: numberSchema,
        policy_stage: stringSchema,
        policy_trace: objectSchema({
          policy_version: stringSchema,
          retry_limit: numberSchema,
          retry_count: numberSchema,
          policy_stage: stringSchema,
          signal_source: stringSchema,
        }),
        attempt_history: arraySchema(
          objectSchema({
            attempt_number: numberSchema,
            mastery_score: numberSchema,
            improvement_delta: numberSchema,
            signal_source: stringSchema,
            task_type: nullableSchema(stringSchema),
            task_section: nullableSchema(stringSchema),
            difficulty_level: nullableSchema(stringSchema),
            recorded_at: stringSchema,
          }),
        ),
        impact_label: stringSchema,
      }),
    ),
    recommendationEffectiveness: objectSchema({
      overallAverageEffectiveness: numberSchema,
      measuredOutcomeCount: numberSchema,
      stagnatedOutcomeCount: numberSchema,
      factorAverages: recordSchema(
        objectSchema({
          average_effectiveness: numberSchema,
          average_improvement_delta: numberSchema,
          samples: numberSchema,
          stagnated_count: numberSchema,
          impact_label: stringSchema,
        }),
      ),
      improvementTrends: arraySchema(
        objectSchema({
          unitId: stringSchema,
          moduleId: stringSchema,
          decisionVersion: stringSchema,
          subsequentAttempts: numberSchema,
          improvementDelta: numberSchema,
          effectivenessScore: numberSchema,
          impactLabel: stringSchema,
          status: stringSchema,
        }),
      ),
    }),
    improvementTrends: arraySchema(
      objectSchema({
        unitId: stringSchema,
        moduleId: stringSchema,
        decisionVersion: stringSchema,
        subsequentAttempts: numberSchema,
        improvementDelta: numberSchema,
        effectivenessScore: numberSchema,
        impactLabel: stringSchema,
        status: stringSchema,
      }),
    ),
    ykiInfluenceLogs: arraySchema(signalHistorySchema),
    auditTimeline: arraySchema(
      objectSchema({
        event_id: stringSchema,
        timestamp: stringSchema,
        user_id: stringSchema,
        session_id: nullableSchema(stringSchema),
        event_type: stringSchema,
        trace_id: nullableSchema(stringSchema),
        request_payload_hash: stringSchema,
        response_payload_hash: stringSchema,
        contract_version: stringSchema,
        session_hash: nullableSchema(stringSchema),
        task_sequence_hash: nullableSchema(stringSchema),
        decision_version: stringSchema,
        policy_version: stringSchema,
        governance_version: stringSchema,
        change_reference: nullableSchema(stringSchema),
        previous_event_hash: nullableSchema(stringSchema),
        event_hash: nullableSchema(stringSchema),
        input_snapshot: unknownRecordSchema(),
        output_snapshot: unknownRecordSchema(),
        constraint_metadata: unknownRecordSchema(),
      }),
    ),
    auditReplay: objectSchema({
      userId: nullableSchema(stringSchema),
      sessionId: nullableSchema(stringSchema),
      orderedEventIds: arraySchema(stringSchema),
      eventCounts: recordSchema(numberSchema),
      decisionVersions: arraySchema(stringSchema),
      policyVersions: arraySchema(stringSchema),
      recommendationSequence: arraySchema(unknownRecordSchema()),
      ykiTaskFlow: arraySchema(unknownRecordSchema()),
      unitProgressFlow: arraySchema(unknownRecordSchema()),
      decisionsMade: arraySchema(unknownRecordSchema()),
      responseSequence: arraySchema(unknownRecordSchema()),
      finalSessionHash: nullableSchema(stringSchema),
      finalTaskSequenceHash: nullableSchema(stringSchema),
      trusted: booleanSchema,
      integrity: objectSchema({
        ok: booleanSchema,
        integrityStatus: stringSchema,
        chainLength: numberSchema,
        failureIndex: nullableSchema(numberSchema),
        failureEventId: nullableSchema(stringSchema),
        failureReason: nullableSchema(stringSchema),
        legacyEventCount: numberSchema,
        streamKey: nullableSchema(stringSchema),
      }),
    }),
    auditVerification: objectSchema(
      {
        ok: booleanSchema,
        issues: arraySchema(stringSchema),
        trusted: booleanSchema,
        integrity: objectSchema({
          ok: booleanSchema,
          integrityStatus: stringSchema,
          chainLength: numberSchema,
          failureIndex: nullableSchema(numberSchema),
          failureEventId: nullableSchema(stringSchema),
          failureReason: nullableSchema(stringSchema),
          legacyEventCount: numberSchema,
          streamKey: nullableSchema(stringSchema),
        }),
      },
      {
        sessionChecks: arraySchema(
          objectSchema({
            sessionId: nullableSchema(stringSchema),
            ok: booleanSchema,
            issues: arraySchema(stringSchema),
            trusted: booleanSchema,
            integrity: objectSchema({
              ok: booleanSchema,
              integrityStatus: stringSchema,
              chainLength: numberSchema,
              failureIndex: nullableSchema(numberSchema),
              failureEventId: nullableSchema(stringSchema),
              failureReason: nullableSchema(stringSchema),
              legacyEventCount: numberSchema,
              streamKey: nullableSchema(stringSchema),
            }),
          }),
        ),
      },
    ),
    weightsUsed: recordSchema(numberSchema),
  },
  {},
);

const relatedUnitsSchema = objectSchema({
  unit: learningUnitSchema,
  relatedUnits: arraySchema(learningUnitSchema),
});

const dueReviewUnitsDataSchema = objectSchema({
  units: arraySchema(dueReviewUnitSchema),
});

const linkedLearningUnitSchema = objectSchema({
  id: stringSchema,
  title: stringSchema,
  kind: stringSchema,
  difficultyLevel: enumSchema(["easy", "medium", "hard"]),
});

const auditEventRangeSchema = objectSchema({
  event_count: numberSchema,
  first_event_id: stringSchema,
  last_event_id: stringSchema,
});

const certificationVerificationSchema = objectSchema({
  ok: booleanSchema,
  status: stringSchema,
  issues: arraySchema(stringSchema),
  integrity: objectSchema({
    ok: booleanSchema,
    integrityStatus: stringSchema,
    chainLength: numberSchema,
    failureIndex: nullableSchema(numberSchema),
    failureEventId: nullableSchema(stringSchema),
    failureReason: nullableSchema(stringSchema),
    legacyEventCount: numberSchema,
    streamKey: nullableSchema(stringSchema),
  }),
  recomputed: objectSchema({
    session_hash: nullableSchema(stringSchema),
    task_sequence_hash: nullableSchema(stringSchema),
    audit_event_range: nullableSchema(auditEventRangeSchema),
    final_result_hash: nullableSchema(stringSchema),
  }),
});

const certificationExportSchema = objectSchema({
  certification_record: objectSchema({
    session_id: stringSchema,
    user_id: nullableSchema(stringSchema),
    completion_timestamp: stringSchema,
    final_score: numberSchema,
    session_hash: stringSchema,
    task_sequence_hash: stringSchema,
    audit_event_range: auditEventRangeSchema,
    contract_version: stringSchema,
    certification_version: stringSchema,
  }),
  final_result_hash: stringSchema,
  replay_reference: objectSchema({
    session_id: stringSchema,
    audit_event_range: auditEventRangeSchema,
    contract_version: stringSchema,
  }),
  verification_instructions: arraySchema(stringSchema),
  hash_algorithm: stringSchema,
}, {
  verification: certificationVerificationSchema,
});

const ykiPracticeEvaluationSchema = objectSchema({
  score: numberSchema,
  maxScore: numberSchema,
  isCorrect: booleanSchema,
  explanation: stringSchema,
  whyWrong: stringSchema,
  ruleApplies: nullableSchema(stringSchema),
  relatedLearningUnitId: stringSchema,
  linkedLearningUnit: nullableSchema(linkedLearningUnitSchema),
});

const ykiPracticeTaskSchema = objectSchema(
  {
    id: stringSchema,
    section: enumSchema(["reading", "listening", "writing", "speaking"]),
    type: stringSchema,
    title: stringSchema,
    prompt: stringSchema,
    timeLimitSeconds: numberSchema,
    relatedLearningUnitId: stringSchema,
    relatedModuleId: stringSchema,
  },
  {
    question: stringSchema,
    options: arraySchema(stringSchema),
    correctAnswer: stringSchema,
    guidance: stringSchema,
    keywords: arraySchema(stringSchema),
    ttsPrompt: stringSchema,
    submittedAnswer: nullableSchema(stringSchema),
    evaluation: nullableSchema(ykiPracticeEvaluationSchema),
  },
);

const ykiPracticeResultSchema = objectSchema(
  {
    taskId: stringSchema,
    section: stringSchema,
    score: numberSchema,
    explanation: stringSchema,
    whyWrong: stringSchema,
    ruleApplies: nullableSchema(stringSchema),
    relatedLearningUnitId: stringSchema,
    linkedLearningUnit: nullableSchema(linkedLearningUnitSchema),
  },
  {
    learningProgress: nullableSchema(
      objectSchema({
        unitProgress: objectSchema({
          mastery_level: stringSchema,
          review_interval_days: numberSchema,
          regression_detected: booleanSchema,
          stagnated: booleanSchema,
        }),
      }),
    ),
    learningSignal: nullableSchema(
      objectSchema({
        signal_source: stringSchema,
        task_type: nullableSchema(stringSchema),
        task_section: nullableSchema(stringSchema),
        difficulty_level: nullableSchema(stringSchema),
        improvement_delta: numberSchema,
        effectiveness_score: numberSchema,
        stagnated: booleanSchema,
        impact_label: stringSchema,
      }),
    ),
  },
);

const ykiTraceTaskSchema = objectSchema({
  taskId: stringSchema,
  section: stringSchema,
  relatedLearningUnitId: stringSchema,
  task_selection_reason: stringSchema,
  difficulty_level: stringSchema,
  user_performance: nullableSchema(
    objectSchema({
      score: numberSchema,
      maxScore: numberSchema,
      isCorrect: booleanSchema,
    }),
  ),
  feedback_generated: nullableSchema(
    objectSchema({
      explanation: stringSchema,
      whyWrong: stringSchema,
      ruleApplies: nullableSchema(stringSchema),
      linkedLearningUnitId: stringSchema,
    }),
  ),
  learning_influence: nullableSchema(
    objectSchema({
      signal_source: stringSchema,
      task_type: nullableSchema(stringSchema),
      task_section: nullableSchema(stringSchema),
      difficulty_level: nullableSchema(stringSchema),
      improvement_delta: numberSchema,
      effectiveness_score: numberSchema,
      stagnated: booleanSchema,
      impact_label: stringSchema,
    }),
  ),
});

const ykiPracticeSessionSchema = objectSchema(
  {
    session_id: stringSchema,
    user_id: stringSchema,
    level: stringSchema,
    focus_areas: arraySchema(stringSchema),
    examMode: booleanSchema,
    tasks: arraySchema(ykiPracticeTaskSchema),
    current_task_index: numberSchema,
    next_allowed_action: enumSchema(["advance", "complete", "submit_only"]),
    completion_state: objectSchema({
      completed_task_count: numberSchema,
      status: enumSchema(["active", "awaiting_advance", "completed"]),
      total_task_count: numberSchema,
    }),
    session_hash: stringSchema,
    task_sequence_hash: stringSchema,
    results: arraySchema(ykiPracticeResultSchema),
    currentTask: nullableSchema(ykiPracticeTaskSchema),
    completedTaskCount: numberSchema,
    isComplete: booleanSchema,
    sessionSummary: objectSchema({
      strengths: arraySchema(stringSchema),
      weaknesses: arraySchema(stringSchema),
      improvement_trend: stringSchema,
      recommended_focus: arraySchema(stringSchema),
      averageScore: numberSchema,
    }),
    precomputedPlan: objectSchema({
      task_ids: arraySchema(stringSchema),
      decision_version: stringSchema,
      policy_version: stringSchema,
      decision_policy_version: stringSchema,
      governance_version: stringSchema,
      change_reference: nullableSchema(stringSchema),
      exam_mode: booleanSchema,
      deterministic_seed: stringSchema,
    }),
    sessionTrace: objectSchema({
      decision_version: stringSchema,
      policy_version: stringSchema,
      decision_policy_version: stringSchema,
      governance_version: stringSchema,
      change_reference: nullableSchema(stringSchema),
      exam_mode: booleanSchema,
      adaptiveContext: unknownRecordSchema(),
      tasks: arraySchema(ykiTraceTaskSchema),
    }),
    policyVersion: stringSchema,
    decisionVersion: stringSchema,
    governanceVersion: stringSchema,
    changeReference: nullableSchema(stringSchema),
    auditTimeline: arraySchema(
      objectSchema({
        event_id: stringSchema,
        timestamp: stringSchema,
        user_id: nullableSchema(stringSchema),
        session_id: nullableSchema(stringSchema),
        event_type: stringSchema,
        trace_id: nullableSchema(stringSchema),
        request_payload_hash: stringSchema,
        response_payload_hash: stringSchema,
        contract_version: stringSchema,
        session_hash: nullableSchema(stringSchema),
        task_sequence_hash: nullableSchema(stringSchema),
        decision_version: stringSchema,
        policy_version: stringSchema,
        governance_version: stringSchema,
        change_reference: nullableSchema(stringSchema),
        previous_event_hash: nullableSchema(stringSchema),
        event_hash: nullableSchema(stringSchema),
        input_snapshot: unknownRecordSchema(),
        output_snapshot: unknownRecordSchema(),
        constraint_metadata: unknownRecordSchema(),
      }),
    ),
    auditReplay: objectSchema({
      orderedEventIds: arraySchema(stringSchema),
      eventCounts: recordSchema(numberSchema),
      ykiTaskFlow: arraySchema(unknownRecordSchema()),
      responseSequence: arraySchema(unknownRecordSchema()),
      finalSessionHash: nullableSchema(stringSchema),
      finalTaskSequenceHash: nullableSchema(stringSchema),
      trusted: booleanSchema,
      integrity: objectSchema({
        ok: booleanSchema,
        integrityStatus: stringSchema,
        chainLength: numberSchema,
        failureIndex: nullableSchema(numberSchema),
        failureEventId: nullableSchema(stringSchema),
        failureReason: nullableSchema(stringSchema),
        legacyEventCount: numberSchema,
        streamKey: nullableSchema(stringSchema),
      }),
    }),
    auditVerification: objectSchema({
      ok: booleanSchema,
      issues: arraySchema(stringSchema),
      trusted: booleanSchema,
      integrity: objectSchema({
        ok: booleanSchema,
        integrityStatus: stringSchema,
        chainLength: numberSchema,
        failureIndex: nullableSchema(numberSchema),
        failureEventId: nullableSchema(stringSchema),
        failureReason: nullableSchema(stringSchema),
        legacyEventCount: numberSchema,
        streamKey: nullableSchema(stringSchema),
      }),
    }),
  },
  {
    certification: nullableSchema(certificationExportSchema),
  },
);

const ykiExamActionSchema = nullableSchema(
  objectSchema({
    enabled: booleanSchema,
    kind: stringSchema,
    label: stringSchema,
  }),
);

const ykiExamCurrentViewSchema = objectSchema(
  {
    view_key: stringSchema,
    kind: stringSchema,
    title: stringSchema,
    prompt: stringSchema,
    input_mode: enumSchema(["none", "choice", "text", "audio"]),
    instructions: arraySchema(stringSchema),
    answer_status: stringSchema,
    response_locked: booleanSchema,
    section: nullableSchema(stringSchema),
    options: arraySchema(stringSchema),
    actions: objectSchema({
      next: ykiExamActionSchema,
      play_prompt: ykiExamActionSchema,
      submit: ykiExamActionSchema,
    }),
  },
  {
    passage: nullableSchema(stringSchema),
    playback: nullableSchema(
      objectSchema({
        count: numberSchema,
        limit: numberSchema,
        remaining: numberSchema,
        ready: booleanSchema,
        audio: nullableSchema(
          objectSchema({
            id: stringSchema,
            url: stringSchema,
            content_type: stringSchema,
            duration_ms: numberSchema,
            ready: booleanSchema,
          }),
        ),
      }),
    ),
    question: nullableSchema(stringSchema),
    recording: nullableSchema(
      objectSchema({
        max_duration_seconds: numberSchema,
      }),
    ),
    submitted_answer: nullableSchema(stringSchema),
    submitted_audio: nullableSchema(stringSchema),
  },
);

const ykiExamSessionSchema = objectSchema({
  session_id: stringSchema,
  user_id: stringSchema,
  status: stringSchema,
  state_source: objectSchema({
    mode: stringSchema,
    path: stringSchema,
  }),
  section_order: arraySchema(stringSchema),
  current_section: nullableSchema(stringSchema),
  current_view: ykiExamCurrentViewSchema,
  navigation: objectSchema({
    back_allowed: booleanSchema,
    can_next: booleanSchema,
    forward_only: booleanSchema,
    interaction_locked: booleanSchema,
    next_label: nullableSchema(stringSchema),
    read_only: booleanSchema,
    skip_allowed: booleanSchema,
    state_locked: booleanSchema,
  }),
  timing_manifest: objectSchema({
    server_now: stringSchema,
    exam_started_at: stringSchema,
    exam_expires_at: stringSchema,
    exam_remaining_seconds: numberSchema,
    current_section_started_at: nullableSchema(stringSchema),
    current_section_expires_at: nullableSchema(stringSchema),
    current_section_remaining_seconds: numberSchema,
    warning_threshold_seconds: numberSchema,
    sections: recordSchema(
      objectSchema({
        duration_minutes: numberSchema,
        expires_at: nullableSchema(stringSchema),
        started_at: nullableSchema(stringSchema),
        remaining_seconds: numberSchema,
      }),
    ),
  }),
  completion_state: objectSchema({
    completed_section_count: numberSchema,
    completed_step_count: numberSchema,
    status: stringSchema,
    total_section_count: numberSchema,
    total_step_count: numberSchema,
  }),
  section_progress: arraySchema(
    objectSchema({
      section: stringSchema,
      status: stringSchema,
      current_step_index: numberSchema,
      total_steps: numberSchema,
      completed_step_count: numberSchema,
      started_at: nullableSchema(stringSchema),
      expires_at: nullableSchema(stringSchema),
    }),
  ),
  certificate: nullableSchema(
    objectSchema({
      overall_score: numberSchema,
      level: stringSchema,
      passed: booleanSchema,
      section_scores: recordSchema(numberSchema),
      evaluation_mode: nullableSchema(stringSchema),
    }),
  ),
  learning_feedback: nullableSchema(
    objectSchema({
      weak_areas: arraySchema(stringSchema),
      suggestions: arraySchema(stringSchema),
    }),
  ),
  progress_history: objectSchema({
    sessions: arraySchema(unknownRecordSchema()),
    progression: arraySchema(numberSchema),
    current_level: nullableSchema(stringSchema),
    trend: stringSchema,
    weak_patterns: arraySchema(stringSchema),
    strong_patterns: arraySchema(stringSchema),
  }),
  runtime: unknownRecordSchema(),
});

const dailyPracticeExerciseSchema = objectSchema({
  id: stringSchema,
  type: enumSchema([
    "vocabulary_selection",
    "sentence_completion",
    "grammar_selection",
  ]),
  title: stringSchema,
  prompt: stringSchema,
  options: arraySchema(stringSchema),
  input_mode: enumSchema(["choice", "text"]),
  answer_status: enumSchema(["pending", "answered"]),
});

const dailyPracticeResultSchema = nullableSchema(
  objectSchema({
    exercise_id: stringSchema,
    type: stringSchema,
    correct: booleanSchema,
    submitted_answer: stringSchema,
    expected_answer: stringSchema,
    explanation: nullableSchema(stringSchema),
  }),
);

const dailyPracticeSessionSchema = objectSchema({
  session_id: stringSchema,
  user_id: stringSchema,
  status: enumSchema(["active", "completed"]),
  current_exercise_index: numberSchema,
  current_exercise: nullableSchema(dailyPracticeExerciseSchema),
  latest_result: dailyPracticeResultSchema,
  completion_state: objectSchema({
    completed_count: numberSchema,
    total_count: numberSchema,
    accuracy: numberSchema,
    session_complete: booleanSchema,
  }),
  actions: objectSchema({
    submit: booleanSchema,
    next: booleanSchema,
  }),
});

const speakingPromptAudioSchema = objectSchema({
  asset_id: stringSchema,
  url: stringSchema,
  duration_ms: numberSchema,
  ready: booleanSchema,
});

const speakingPromptSchema = objectSchema({
  id: stringSchema,
  title: stringSchema,
  prompt_text: stringSchema,
  response_guidance: stringSchema,
  answer_status: enumSchema(["pending", "answered"]),
  prompt_audio: speakingPromptAudioSchema,
});

const speakingLatestResultSchema = nullableSchema(
  objectSchema({
    prompt_id: stringSchema,
    correct: booleanSchema,
    submitted_transcript: stringSchema,
    expected_response: stringSchema,
    difference: nullableSchema(stringSchema),
    evaluation_mode: stringSchema,
    recording_captured: booleanSchema,
    capture_mode: enumSchema(["recording_with_transcript", "transcript_only"]),
  }),
);

const speakingPracticeSessionSchema = objectSchema({
  session_id: stringSchema,
  user_id: stringSchema,
  status: enumSchema(["active", "completed"]),
  current_prompt_index: numberSchema,
  current_prompt: nullableSchema(speakingPromptSchema),
  latest_result: speakingLatestResultSchema,
  completion_state: objectSchema({
    prompts_served: numberSchema,
    attempts: numberSchema,
    correct_count: numberSchema,
    total_count: numberSchema,
    accuracy: numberSchema,
    session_complete: booleanSchema,
  }),
  actions: objectSchema({
    play_prompt: booleanSchema,
    submit: booleanSchema,
    next: booleanSchema,
  }),
});

const authStatusSchema = objectSchema({
  isAuthenticated: booleanSchema,
});

const homePayloadSchema = objectSchema({
  message: stringSchema,
});

type ApiEnvelopeOptions<TOutput> = {
  allowNullData?: boolean;
  validateData?: (payload: Record<string, unknown>) => TOutput;
};

type ApiEnvelope<TOutput> = {
  ok: boolean;
  data: TOutput | null;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    trace_id: string | null;
    event_id: string | null;
  } | null;
  meta: {
    version: string;
    contract_version: string;
    timestamp: string;
    trace_id: string;
    event_id: string | null;
  };
};

function validateEnvelopeMeta(meta: Record<string, unknown>, path: string) {
  validateSchema(meta, metaSchema, `${path}.meta`);

  if (meta.version !== REQUIRED_BACKEND_VERSION) {
    throw new ControlledUiValidationError(
      `${path}.meta.version`,
      "CONTRACT_VIOLATION",
      `${path}.meta.version must match ${REQUIRED_BACKEND_VERSION}.`,
    );
  }

  if (meta.contract_version !== REQUIRED_CONTRACT_VERSION) {
    throw new ControlledUiValidationError(
      `${path}.meta.contract_version`,
      "CONTRACT_VIOLATION",
      `${path}.meta.contract_version must match ${REQUIRED_CONTRACT_VERSION}.`,
    );
  }
}

export function validateApiEnvelope<TOutput>(
  payload: unknown,
  path: string,
  options: ApiEnvelopeOptions<TOutput> = {},
): ApiEnvelope<TOutput> {
  if (!isRecord(payload)) {
    throw new ControlledUiValidationError(
      path,
      "CONTRACT_VIOLATION",
      `${path} must be a transport envelope object.`,
    );
  }

  validateSchema(
    payload,
    objectSchema({
      ok: booleanSchema,
      data: nullableSchema(unknownRecordSchema()),
      error: nullableSchema(apiErrorSchema),
      meta: metaSchema,
    }),
    path,
  );

  validateEnvelopeMeta(payload.meta as Record<string, unknown>, path);

  if (payload.ok) {
    if (payload.error !== null) {
      throw new ControlledUiValidationError(
        `${path}.error`,
        "CONTRACT_VIOLATION",
        `${path}.error must be null when ok is true.`,
      );
    }

    if (payload.data === null) {
      if (!options.allowNullData) {
        throw new ControlledUiValidationError(
          `${path}.data`,
          "CONTRACT_VIOLATION",
          `${path}.data must not be null when ok is true.`,
        );
      }

      return payload as ApiEnvelope<TOutput>;
    }

    if (!options.validateData) {
      throw new ControlledUiValidationError(
        `${path}.data`,
        "CONTRACT_VIOLATION",
        `${path}.data is missing a governed validator.`,
      );
    }

    return {
      ...payload,
      data: options.validateData(payload.data as Record<string, unknown>),
    } as ApiEnvelope<TOutput>;
  }

  if (payload.data !== null) {
    throw new ControlledUiValidationError(
      `${path}.data`,
      "CONTRACT_VIOLATION",
      `${path}.data must be null when ok is false.`,
    );
  }

  if (payload.error === null) {
    throw new ControlledUiValidationError(
      `${path}.error`,
      "CONTRACT_VIOLATION",
      `${path}.error must be present when ok is false.`,
    );
  }

  return payload as ApiEnvelope<TOutput>;
}

export function validateLearningUnitPayload<T extends Record<string, unknown>>(payload: T) {
  validateSchema(payload, learningUnitSchema, "learningUnit");
  return payload;
}

export function validateAuthStatusPayload<T extends Record<string, unknown>>(payload: T) {
  validateSchema(payload, authStatusSchema, "authStatus");
  return payload;
}

export function validateHomePayload<T extends Record<string, unknown>>(payload: T) {
  validateSchema(payload, homePayloadSchema, "homePayload");
  return payload;
}

export function validateRelatedUnitsPayload<T extends Record<string, unknown>>(payload: T) {
  validateSchema(payload, relatedUnitsSchema, "relatedUnits");
  return payload;
}

export function validateDueReviewUnitsPayload<T extends Record<string, unknown>>(payload: T) {
  validateSchema(payload, dueReviewUnitsDataSchema, "dueReviewUnits");
  return payload;
}

export function validateYkiCertificationPayload<T extends Record<string, unknown>>(payload: T) {
  validateSchema(payload, certificationExportSchema, "ykiCertification");
  return payload;
}

export function validateLearningModulesPayload<
  T extends Record<string, unknown> & {
    changeReference?: string | null;
    governanceVersion?: string;
    policyVersion?: string;
  },
>(
  payload: T,
  options: { allowLegacyUncontrolled?: boolean } = {},
) {
  validateSchema(payload, learningModulesDataSchema, "learningModules");
  const metadata = enforceGovernance(
    payload,
    "learningModules",
    {
      governanceKey: "governanceVersion",
      policyKey: "policyVersion",
      changeReferenceKey: "changeReference",
    },
    options.allowLegacyUncontrolled ?? isDevRuntime(),
  );

  return {
    ...payload,
    changeReference: metadata.changeReference,
    governanceStatus: metadata.governanceStatus,
    governanceVersion: metadata.governanceVersion,
    policyVersion: metadata.policyVersion,
  };
}

export function validateLearningDebugStatePayload<
  T extends Record<string, unknown> & {
    changeReference?: string | null;
    governanceStatus?: string;
    governanceVersion?: string;
    policyVersion?: string;
  },
>(
  payload: T,
  options: { allowLegacyUncontrolled?: boolean } = {},
) {
  validateSchema(payload, learningDebugStateSchema, "learningDebugState");
  const metadata = enforceGovernance(
    payload,
    "learningDebugState",
    {
      governanceKey: "governanceVersion",
      policyKey: "policyVersion",
      changeReferenceKey: "changeReference",
    },
    options.allowLegacyUncontrolled ?? isDevRuntime(),
  );

  return {
    ...payload,
    changeReference: metadata.changeReference,
    governanceStatus:
      metadata.governanceStatus === "legacy_uncontrolled"
        ? metadata.governanceStatus
        : (payload.governanceStatus as string),
    governanceVersion: metadata.governanceVersion,
    policyVersion: metadata.policyVersion,
  };
}

export function validateYkiPracticeSessionPayload<
  T extends Record<string, unknown> & {
    changeReference?: string | null;
    decisionVersion?: string;
    governanceVersion?: string;
    policyVersion?: string;
    precomputedPlan: Record<string, unknown>;
    sessionTrace: Record<string, unknown>;
  },
>(
  payload: T,
  options: { allowLegacyUncontrolled?: boolean } = {},
) {
  validateSchema(payload, ykiPracticeSessionSchema, "ykiPracticeSession");

  const traceMetadata = enforceGovernance(
    payload.sessionTrace,
    "ykiPracticeSession.sessionTrace",
    {
      governanceKey: "governance_version",
      policyKey: "policy_version",
      changeReferenceKey: "change_reference",
    },
    options.allowLegacyUncontrolled ?? isDevRuntime(),
  );

  const planMetadata = enforceGovernance(
    payload.precomputedPlan,
    "ykiPracticeSession.precomputedPlan",
    {
      governanceKey: "governance_version",
      policyKey: "policy_version",
      changeReferenceKey: "change_reference",
    },
    options.allowLegacyUncontrolled ?? isDevRuntime(),
  );

  const governanceStatus =
    traceMetadata.governanceStatus === "legacy_uncontrolled" ||
    planMetadata.governanceStatus === "legacy_uncontrolled"
      ? "legacy_uncontrolled"
      : "governed";

  const governanceVersion =
    payload.governanceVersion ?? traceMetadata.governanceVersion ?? planMetadata.governanceVersion;
  const policyVersion =
    payload.policyVersion ?? traceMetadata.policyVersion ?? planMetadata.policyVersion;
  const changeReference =
    payload.changeReference ?? traceMetadata.changeReference ?? planMetadata.changeReference;
  const decisionVersion =
    payload.decisionVersion ??
    (typeof payload.sessionTrace.decision_version === "string"
      ? payload.sessionTrace.decision_version
      : undefined);

  if (!decisionVersion) {
    throw new ControlledUiValidationError(
      "ykiPracticeSession",
      "CONTRACT_VIOLATION",
      "ykiPracticeSession is missing decision metadata.",
    );
  }

  return {
    ...payload,
    changeReference: changeReference ?? null,
    decisionVersion,
    governanceStatus,
    governanceVersion,
    policyVersion,
    precomputedPlan: {
      ...payload.precomputedPlan,
      change_reference:
        payload.precomputedPlan.change_reference === undefined
          ? planMetadata.changeReference
          : payload.precomputedPlan.change_reference,
      governance_version: planMetadata.governanceVersion,
      policy_version: planMetadata.policyVersion,
    },
    sessionTrace: {
      ...payload.sessionTrace,
      change_reference:
        payload.sessionTrace.change_reference === undefined
          ? traceMetadata.changeReference
          : payload.sessionTrace.change_reference,
      governance_version: traceMetadata.governanceVersion,
      policy_version: traceMetadata.policyVersion,
    },
  };
}

export function validateYkiExamSessionPayload<T extends Record<string, unknown>>(payload: T) {
  validateSchema(payload, ykiExamSessionSchema, "ykiExamSession");
  return payload;
}

export function validateDailyPracticeSessionPayload<T extends Record<string, unknown>>(payload: T) {
  validateSchema(payload, dailyPracticeSessionSchema, "dailyPracticeSession");
  return payload;
}

export function validateSpeakingPracticeSessionPayload<T extends Record<string, unknown>>(payload: T) {
  validateSchema(payload, speakingPracticeSessionSchema, "speakingPracticeSession");
  return payload;
}
