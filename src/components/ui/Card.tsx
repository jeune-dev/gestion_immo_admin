import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/format';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rounded-carte border border-bordure bg-surface shadow-carte', className)} {...rest} />;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-bordure px-5 py-4">
      <div>
        <h2 className="text-sous-titre font-semibold text-texte">{title}</h2>
        {description && <p className="mt-0.5 text-petit text-texte-secondaire">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-titre font-semibold text-texte">{title}</h1>
        {description && <p className="mt-1 text-petit text-texte-secondaire">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Paires libellé / valeur d'une fiche détail. */
export function DefList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-legende font-medium uppercase tracking-wide text-texte-secondaire">{i.label}</dt>
          <dd className="mt-0.5 break-words text-petit text-texte">{i.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
