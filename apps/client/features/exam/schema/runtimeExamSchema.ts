export type ExamTask = {
  id: string;
  type: 'mcq' | 'boolean' | 'writing' | 'speaking';
  prompt: string;
  choices?: string[];
  audioUrl?: string;
};

export type ExamSession = {
  sessionId: string;
  level: string;
  section: 'reading' | 'listening' | 'writing' | 'speaking';
  tasks: ExamTask[];
  elapsedSeconds: number;
};
