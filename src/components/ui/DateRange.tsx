/** Deux sélecteurs de date (« du » / « au », AAAA-MM-JJ) liés à des filtres d'URL. */
export function DateRange({ from, to, onFrom, onTo }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  const cls = 'min-h-10 rounded-lg border border-bordure-champ bg-surface px-2 text-petit text-texte focus:border-primaire';
  return (
    <>
      <label className="flex items-center gap-2 text-petit text-texte-secondaire">Du
        <input type="date" value={from} max={to || undefined} onChange={(e) => onFrom(e.target.value)} className={cls} />
      </label>
      <label className="flex items-center gap-2 text-petit text-texte-secondaire">au
        <input type="date" value={to} min={from || undefined} onChange={(e) => onTo(e.target.value)} className={cls} />
      </label>
    </>
  );
}
