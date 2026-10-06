import { useQuery } from '@tanstack/react-query';
import { getReferentiels } from '@/api/admin';

/**
 * Libellés des énumérations, lus dans GET /referentiels (jamais réécrits côté client).
 * Tant que la requête n'a pas abouti, le code brut sert de libellé.
 */
export function useReferentiels() {
  const { data } = useQuery({ queryKey: ['referentiels'], queryFn: getReferentiels, staleTime: 60 * 60 * 1000 });

  const options = (nom: string) => data?.enumerations[nom] ?? [];
  const label = (nom: string, code: string | null | undefined) =>
    (code && data?.enumerations[nom]?.find((e) => e.code === code)?.label) || code || '—';

  return { ready: !!data, options, label };
}
