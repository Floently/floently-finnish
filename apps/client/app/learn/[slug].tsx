import { useEffect, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import LegalPage from '../../features/legal/LegalPage';

function normalizeSlug(slug: string | string[] | undefined): string {
  if (Array.isArray(slug)) return slug.join('/').trim().toLowerCase();
  return String(slug ?? '').trim().toLowerCase();
}

export default function LearnAliasRoute() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = params.slug;
  const normalized = normalizeSlug(slug);

  const page = useMemo(() => {
    switch (normalized) {
      case 'privacy':
      case 'privacy-policy':
        return 'privacy-policy' as const;
      case 'terms':
      case 'terms-of-use':
      case 'teams':
        return 'terms-of-use' as const;
      case 'support':
        return 'support' as const;
      case 'delete-account':
      case 'account-deletion':
        return 'account-deletion' as const;
      default:
        return null;
    }
  }, [normalized]);

  useEffect(() => {
    if (!page) {
      router.replace('/' as never);
    }
  }, [page]);

  return page ? <LegalPage page={page} /> : null;
}
