import { router } from 'expo-router';

export const PRIMARY_LEARN_HOST = 'app.kielivalmis.com';
export const LEGACY_LEARN_HOST = 'learn.floently.com';
export const LEARN_HOST = PRIMARY_LEARN_HOST;
export const LEARN_ORIGIN = `https://${PRIMARY_LEARN_HOST}`;

export function isLearnHost() {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;

  // Keep local web development on the local origin. Without this guard,
  // goToLearn() would redirect localhost development sessions to production.
  if (
    __DEV__ &&
    (hostname === 'localhost' || hostname === '127.0.0.1')
  ) {
    return true;
  }

  return hostname === PRIMARY_LEARN_HOST || hostname === LEGACY_LEARN_HOST;
}

export function goToLearn(path = '/') {
  if (typeof window === 'undefined') return;

  if (!isLearnHost()) {
    window.location.replace(`${LEARN_ORIGIN}${path}`);
    return;
  }

  router.push(path as never);
}
