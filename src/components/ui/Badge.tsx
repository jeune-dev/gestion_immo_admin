import { AlertTriangle, CheckCircle2, Circle, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { tonDe, type FamilleStatut, type TonStatut } from '@/theme/statuts';
import { useReferentiels } from '@/hooks/useReferentiels';

const ICONS = { succes: CheckCircle2, avertissement: AlertTriangle, danger: XCircle, info: Info, neutre: Circle } as const;

const TONE_CLS: Record<TonStatut, string> = {
  succes: 'bg-succes-fond text-succes',
  avertissement: 'bg-avertissement-fond text-avertissement',
  danger: 'bg-danger-fond text-danger',
  info: 'bg-info-fond text-info',
  neutre: 'bg-neutre-fond text-neutre',
};

/** Pastille de ton : icône + libellé (un statut n'est jamais une couleur seule). */
export function Badge({ tone = 'neutre', children }: { tone?: TonStatut; children: ReactNode }) {
  const Icon = ICONS[tone];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-pilule px-2.5 py-0.5 text-legende font-semibold ${TONE_CLS[tone]}`}>
      <Icon className="size-3" aria-hidden />
      {children}
    </span>
  );
}

/**
 * Badge de statut : ton issu de la charte, libellé issu de /referentiels.
 * `enumName` est la clé de l'énumération côté API (ex. `statut_abonnement`).
 */
export function StatusBadge({ famille, enumName, code }: { famille: FamilleStatut; enumName: string; code: string | null | undefined }) {
  const { label } = useReferentiels();
  if (!code) return <span className="text-texte-discret">—</span>;
  return <Badge tone={tonDe(famille, code)}>{label(enumName, code)}</Badge>;
}
