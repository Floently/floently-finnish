export type AppMode = 'learn' | 'yki_practice' | 'yki_exam' | 'professional' | 'speaking_lab';

let activeMode: AppMode = 'learn';
const listeners = new Set<() => void>();

export function getActiveMode(): AppMode {
  return activeMode;
}

export function setActiveMode(mode: AppMode) {
  activeMode = mode;
  listeners.forEach((listener) => listener());
}

export function subscribeActiveMode(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
