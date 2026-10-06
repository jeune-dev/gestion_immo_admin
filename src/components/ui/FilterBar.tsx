import { Search, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useDebounced } from '@/hooks/useDebounced';
import { Button } from './Button';

/** Recherche texte (anti-rebond) qui alimente un filtre d'URL. */
export function SearchBox({ value, onChange, placeholder = 'Rechercher…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [text, setText] = useState(value);
  const debounced = useDebounced(text);
  useEffect(() => { setText(value); }, [value]);
  useEffect(() => { if (debounced !== value) onChange(debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative min-w-52 flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texte-discret" aria-hidden />
      <input
        type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="min-h-10 w-full rounded-lg border border-bordure-champ bg-surface pl-9 pr-3 text-petit text-texte placeholder:text-texte-discret focus:border-primaire"
      />
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options, allLabel = 'Tous' }: {
  label: string; value: string; onChange: (v: string) => void; options: { code: string; label: string }[]; allLabel?: string;
}) {
  return (
    <select
      aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
      className="min-h-10 rounded-lg border border-bordure-champ bg-surface px-3 text-petit text-texte focus:border-primaire"
    >
      <option value="">{label} : {allLabel.toLowerCase()}</option>
      {options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
    </select>
  );
}

export function FilterBar({ children, active, onReset }: { children: ReactNode; active?: number; onReset?: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {children}
      {!!active && onReset && <Button variant="ghost" size="sm" icon={<X className="size-4" />} onClick={onReset}>Réinitialiser</Button>}
    </div>
  );
}
