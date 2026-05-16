import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { getCanonicalLegalPath, resolveLegalPageFromPath } from '../../config/legalRoutes';

function normalizeSlug(slug: string | string[] | undefined): string {
  if (Array.isArray(slug)) return slug.join('/').trim().toLowerCase();
  return String(slug ?? '').trim().toLowerCase();
}

export default function LearnAliasRoute() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const normalized = normalizeSlug(params.slug);
  const route = resolveLegalPageFromPath(`/learn/${normalized}`);

  useEffect(() => {
    if (!route) {
      router.replace('/' as never);
    }
  }, [route]);

  return route ? <Redirect href={getCanonicalLegalPath(route.page) as never} /> : null;
}
