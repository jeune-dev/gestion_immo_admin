import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '@/lib/format';

/** Menu flottant : se ferme au clic extérieur et à Échap. */
export function Popover({ button, children, align = 'right', fixed }: {
  button: (p: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'right' | 'left';
  /** Position fixe (à utiliser dans un conteneur qui défile, ex. un tableau). */
  fixed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  // Mesure avant l'ouverture : une fois le menu rendu, il fausserait la taille du conteneur.
  const toggle = () => {
    if (!open && fixed && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    if (fixed) window.addEventListener('scroll', onScroll, true);
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey);
      if (fixed) window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, fixed]);

  return (
    <div ref={ref} className="relative">
      {button({ open, toggle })}
      {open && (!fixed || pos) && (
        <div
          style={fixed && pos ? { position: 'fixed', top: pos.top, right: pos.right } : undefined}
          className={cx('z-50 rounded-carte border border-bordure bg-surface shadow-xl', !fixed && 'absolute top-full mt-2', !fixed && (align === 'right' ? 'right-0' : 'left-0'))}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export interface MenuAction { label: string; onClick: () => void; danger?: boolean; hidden?: boolean }

/** Menu « ⋮ » d'actions de ligne (ne déclenche pas le clic de la ligne). */
export function ActionMenu({ actions }: { actions: MenuAction[] }) {
  const visible = actions.filter((a) => !a.hidden);
  if (!visible.length) return null;
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover fixed button={({ open, toggle }) => (
        <button onClick={toggle} aria-expanded={open} aria-label="Actions" className="grid size-8 place-items-center rounded-lg text-texte-secondaire hover:bg-surface-alt"><MoreVertical className="size-4" /></button>
      )}>
        {(close) => (
          <ul className="w-48 p-1.5">
            {visible.map((a) => (
              <li key={a.label}>
                <button
                  onClick={() => { close(); a.onClick(); }}
                  className={cx('flex min-h-9 w-full items-center rounded-lg px-3 text-left text-petit', a.danger ? 'text-danger hover:bg-danger-fond' : 'hover:bg-surface-alt')}
                >{a.label}</button>
              </li>
            ))}
          </ul>
        )}
      </Popover>
    </div>
  );
}
