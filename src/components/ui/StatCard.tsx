import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './Card';
import { Skeleton } from './States';

export function StatCard({ label, value, unit, hint, icon: Icon, loading, accent }: {
  label: string; value: ReactNode; unit?: string; hint?: ReactNode; icon: LucideIcon; loading?: boolean; accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-petit font-medium text-texte-secondaire">{label}</p>
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${accent ? 'bg-secondaire-teinte text-avertissement' : 'bg-primaire-teinte text-primaire'}`}>
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="gi-montant mt-2 flex flex-wrap items-baseline gap-x-1.5 break-words font-semibold leading-tight text-texte">
          <span className="text-chiffre-cle">{value}</span>
          {unit && <span className="text-petit font-medium text-texte-secondaire">{unit}</span>}
        </p>}
      {hint && !loading && <p className="mt-1 text-legende text-texte-secondaire">{hint}</p>}
    </Card>
  );
}
