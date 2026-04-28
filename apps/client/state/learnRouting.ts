import { router } from 'expo-router';

export const LEARN_HOST = 'learn.floently.com';
export const LEARN_ORIGIN = `https://${LEARN_HOST}`;

export function isLearnHost() {
  return typeof window !== 'undefined' && window.location.hostname === LEARN_HOST;
}

export function goToLearn(path = '/') {
  if (typeof window === 'undefined') {
    return;
  }

  if (!isLearnHost()) {
    window.location.replace(`${LEARN_ORIGIN}${path}`);
    return;
  }

  router.push(path as never);
}
