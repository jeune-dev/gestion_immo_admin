import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cx } from '@/lib/format';

const CONTROL = 'w-full min-h-10 rounded-lg border border-bordure-champ bg-surface px-3 text-texte placeholder:text-texte-discret focus:border-primaire disabled:opacity-60 aria-[invalid=true]:border-danger';

interface FieldProps { label?: string; hint?: string; error?: string; className?: string }

function Wrapper({ id, label, hint, error, className, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      {label && <label htmlFor={id} className="text-petit font-medium text-texte">{label}</label>}
      {children}
      {error ? <p id={`${id}-err`} role="alert" className="text-legende text-danger">{error}</p> : hint && <p className="text-legende text-texte-secondaire">{hint}</p>}
    </div>
  );
}

export function Input({ label, hint, error, className, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cx(CONTROL, 'text-petit')} {...rest} />
    </Wrapper>
  );
}

export function Textarea({ label, hint, error, className, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <textarea id={id} aria-invalid={!!error} className={cx(CONTROL, 'py-2 text-petit')} {...rest} />
    </Wrapper>
  );
}

export function Select({ label, hint, error, className, children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <select id={id} aria-invalid={!!error} className={cx(CONTROL, 'text-petit')} {...rest}>{children}</select>
    </Wrapper>
  );
}

/** Message d'erreur global d'un formulaire (réponse API : message + détails de champs). */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error as { message?: string; details?: string[] };
  return (
    <div role="alert" className="rounded-lg border border-danger/30 bg-danger-fond px-3 py-2 text-petit text-danger">
      <p>{e.message ?? 'Une erreur est survenue.'}</p>
      {!!e.details?.length && <ul className="mt-1 list-inside list-disc text-legende">{e.details.map((d) => <li key={d}>{d}</li>)}</ul>}
    </div>
  );
}
