import { nextExamState, type ExamViewState } from './examRuntimeStateMachine';
export function createExamRuntimeController(initial: ExamViewState = 'intro') {
  let state = initial;
  return {
    getState: () => state,
    advance: () => { state = nextExamState(state); return state; },
    reset: () => { state = 'intro'; return state; },
  };
}
