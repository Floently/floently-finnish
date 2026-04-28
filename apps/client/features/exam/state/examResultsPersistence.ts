import AsyncStorage from '@react-native-async-storage/async-storage';

const EXAM_RESULTS_KEY = 'floently:yki_exam_results';

export type StoredExamTaskResult = {
  sectionTitle: string;
  taskType: string;
  prompt: string;
  selectedOption?: number | null;
  correctOption?: number | null;
  options?: string[];
  writingAnswer?: string;
};

export type StoredExamResults = {
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
