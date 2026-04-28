type LogMeta = Record<string, unknown>;

function formatMeta(meta: LogMeta): string {
  return Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
}

const isDev = typeof __DEV__ !== "undefined" && __DEV__;

export const logger = {
  info(message: string, meta: LogMeta = {}): void {
    if (isDev) {
      console.info(`[floently] ${message}${formatMeta(meta)}`);
    }
  },
  error(message: string, meta: LogMeta = {}): void {
    console.error(`[floently] ${message}${formatMeta(meta)}`);
  },
  warn(message: string, meta: LogMeta = {}): void {
    console.warn(`[floently] ${message}${formatMeta(meta)}`);
  },
  /** Set the current screen name for log context. No-op in production builds. */
  setCurrentScreen(_screen: string): void {
    // no-op unless a crash/analytics SDK is wired up
  },
  /** Record the last user action label for log context. No-op in production builds. */
  setLastUserAction(_action: string): void {
    // no-op unless a crash/analytics SDK is wired up
  },
};
