import type { SubmitYkiExamResult, YkiEvaluationReport } from '@core/api/ykiExam';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXAM_RESULTS_KEY = 'floently:yki_exam_results';

export type StoredExamTaskResult = {
  sectionTitle: string;
  taskType: string;
  prompt: string;
  taskId?: string | null;
  questionId?: string | null;
  selectedOption?: number | null;
  correctOption?: number | null;
  options?: string[];
  writingAnswer?: string;
  speakingTranscript?: string | null;
  speakingDurationSec?: number | null;
};

export type StoredExamResults = {
  sessionId?: string;
  completedAt: string;
  levelBand: string;
  totalTasks: number;
  objectiveTasks: number;
  objectiveCorrect: number;
  objectiveIncorrect: number;
  sectionBreakdown: Array<{
    sectionTitle: string;
    totalTasks: number;
    objectiveTasks: number;
    objectiveCorrect: number;
  }>;
  tasks: StoredExamTaskResult[];
  backendSubmitted?: boolean;
  submission?: SubmitYkiExamResult | null;
  evaluationReport?: YkiEvaluationReport | null;
};

export async function saveExamResults(payload: StoredExamResults) {
  await AsyncStorage.setItem(EXAM_RESULTS_KEY, JSON.stringify(payload));
}

export async function loadExamResults(): Promise<StoredExamResults | null> {
  const raw = await AsyncStorage.getItem(EXAM_RESULTS_KEY);
  return raw ? (JSON.parse(raw) as StoredExamResults) : null;
}

export async function clearExamResults() {
  await AsyncStorage.removeItem(EXAM_RESULTS_KEY);
}
