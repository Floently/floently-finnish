export type ExamViewState = 'intro' | 'active' | 'review' | 'submitted' | 'results';
export function nextExamState(current: ExamViewState): ExamViewState {
  const flow: ExamViewState[] = ['intro', 'active', 'review', 'submitted', 'results'];
  const index = flow.indexOf(current);
  return flow[Math.min(index + 1, flow.length - 1)];
}
