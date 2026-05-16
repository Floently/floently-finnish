export type LegalPageKind = 'privacy-policy' | 'terms-of-use' | 'support' | 'account-deletion';

const LEARN_ORIGIN = 'https://learn.floently.com';

export const LEGAL_PATHS: Record<LegalPageKind, string> = {
  'privacy-policy': '/legal/privacy-policy',
  'terms-of-use': '/legal/terms-of-use',
  support: '/support',
  'account-deletion': '/legal/account-deletion',
};

const LEGAL_ALIASES: Record<LegalPageKind, string[]> = {
  'privacy-policy': [
    '/privacy',
    '/privacy-policy',
    '/learn/privacy',
    '/learn/privacy-policy',
  ],
  'terms-of-use': [
    '/terms',
    '/terms-of-use',
    '/teams',
    '/learn/terms',
    '/learn/terms-of-use',
    '/learn/teams',
  ],
  support: [
    '/learn/support',
  ],
  'account-deletion': [
    '/account-deletion',
    '/delete-account',
    '/learn/account-deletion',
    '/learn/delete-account',
  ],
};

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed) return '/';
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return normalized.replace(/\/+$/, '') || '/';
}

function toAbsoluteLearnUrl(path: string): string {
  return `${LEARN_ORIGIN}${path}`;
}

export function resolvePublicLearnUrl(value: string | undefined, fallbackPath: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) return toAbsoluteLearnUrl(fallbackPath);
  if (/^[a-z][a-z0-9+.-]*:/i.test(normalized)) return normalized;
  return toAbsoluteLearnUrl(normalizePathname(normalized));
}

export function getCanonicalLegalPath(page: LegalPageKind): string {
  return LEGAL_PATHS[page];
}

export function getCanonicalLegalUrl(page: LegalPageKind): string {
  return toAbsoluteLearnUrl(getCanonicalLegalPath(page));
}

export function resolveLegalPageFromPath(pathname: string): {
  page: LegalPageKind;
  canonicalPath: string;
  isCanonical: boolean;
} | null {
  const normalized = normalizePathname(pathname);

  for (const [page, canonicalPath] of Object.entries(LEGAL_PATHS) as Array<[LegalPageKind, string]>) {
    if (normalized === canonicalPath) {
      return { page, canonicalPath, isCanonical: true };
    }
    if (LEGAL_ALIASES[page].includes(normalized)) {
      return { page, canonicalPath, isCanonical: false };
    }
  }

  return null;
}
