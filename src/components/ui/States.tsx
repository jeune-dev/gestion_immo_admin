import { AlertCircle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { toApiError } from '@/api/client';
import { cx } from '@/lib/format';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('gi-skeleton h-4', className)} aria-hidden />;
}

export function EmptyState({ title = 'Aucun résultat', description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-pilule bg-surface-alt text-texte-secondaire"><Inbox className="size-6" aria-hidden /></div>
      <p className="font-semibold text-texte">{title}</p>
      {description && <p className="max-w-sm text-petit text-texte-secondaire">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const e = error ? toApiError(error) : null;
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-pilule bg-danger-fond text-danger"><AlertCircle className="size-6" aria-hidden /></div>
      <p className="font-semibold text-texte">Impossible de charger les données</p>
      <p className="max-w-sm text-petit text-texte-secondaire">{e?.message ?? 'Veuillez réessayer.'}</p>
      {e?.requestId && <p className="text-legende text-texte-discret">Référence : {e.requestId}</p>}
      {onRetry && <Button variant="outline" onClick={onRetry} className="mt-2">Réessayer</Button>}
    </div>
  );
}

/** Garde d'écran : squelette → erreur → contenu. */
export function QueryBoundary({ loading, error, onRetry, skeleton, children }: {
  loading: boolean; error: unknown; onRetry?: () => void; skeleton?: ReactNode; children: ReactNode;
}) {
  if (loading) return <>{skeleton ?? <div className="space-y-3 p-5"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}</>;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  return <>{children}</>;
}
