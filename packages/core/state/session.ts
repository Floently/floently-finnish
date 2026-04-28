export type AppSession = {
  userId: string | null;
  currentMode: 'learn' | 'yki_practice' | 'yki_exam' | 'professional' | 'speaking_lab';
};
