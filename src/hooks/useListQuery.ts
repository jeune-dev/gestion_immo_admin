import { useCallback, useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { Page } from '@/api/client';
import type { Params } from '@/api/admin';

/**
 * Liste paginée dont la page, les filtres et le tri vivent dans l'URL
 * (lien partageable, bouton « retour » fonctionnel).
 */
export function useListQuery<T>(key: string, fetcher: (p: Params) => Promise<Page<T>>, opts: { limit?: number; defaultSort?: string } = {}) {
  const [search, setSearch] = useSearchParams();
  const limit = opts.limit ?? 20;

  const params = useMemo(() => {
    const p: Params = { page: Number(search.get('page')) || 1, limit };
    search.forEach((v, k) => { if (k !== 'page' && v) p[k] = v; });
    if (opts.defaultSort && !p.tri) p.tri = opts.defaultSort;
    return p;
  }, [search, limit, opts.defaultSort]);

  const query = useQuery({
    queryKey: [key, params],
    queryFn: () => fetcher(params),
    placeholderData: keepPreviousData,
  });

  const setFilter = useCallback((name: string, value: string) => {
    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(name, value); else next.delete(name);
      next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearch]);

  const setPage = useCallback((page: number) => {
    setSearch((prev) => { const next = new URLSearchParams(prev); next.set('page', String(page)); return next; });
  }, [setSearch]);

  const reset = useCallback(() => setSearch({}, { replace: true }), [setSearch]);
  const filterCount = [...search.keys()].filter((k) => k !== 'page' && k !== 'tri').length;

  return { ...query, params, setFilter, setPage, reset, filterCount, get: (n: string) => search.get(n) ?? '' };
}
