const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** « 4 250 000 FCFA » (espace insécable entre les milliers, sans décimale). */
export const fcfa = (n: number | null | undefined) =>
  n == null ? '—' : `${nf.format(n).replace(/[  ]/g, ' ')} FCFA`;

export const nombre = (n: number | null | undefined) => (n == null ? '—' : nf.format(n).replace(/[  ]/g, ' '));

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

/** Dates seules (AAAA-MM-JJ) et dates-heures ISO (UTC, soit l'heure de Dakar). */
export function date(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
}
export function dateTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d);
}

export function monthLabel(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export const fullName = (p?: { first_name?: string | null; last_name?: string | null } | null) =>
  [p?.first_name, p?.last_name].filter(Boolean).join(' ') || '—';

export const initials = (p?: { first_name?: string | null; last_name?: string | null } | null) =>
  `${p?.first_name?.[0] ?? ''}${p?.last_name?.[0] ?? ''}`.toUpperCase() || '?';

/** Concatène des classes CSS en ignorant les valeurs fausses. */
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
