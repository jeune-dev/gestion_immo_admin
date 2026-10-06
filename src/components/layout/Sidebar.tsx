import { LogOut, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cx } from '@/lib/format';
import { NAV } from './nav';

export function Logo({ collapsed, inverse }: { collapsed?: boolean; inverse?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill={inverse ? 'var(--gi-sur-primaire)' : 'var(--gi-primaire)'} />
        <path d="M8 24V14l8-6 8 6v10h-5v-6h-6v6z" fill={inverse ? 'var(--gi-primaire)' : 'var(--gi-sur-primaire)'} />
        <rect x="21" y="7" width="3" height="5" rx="1" fill="var(--gi-secondaire)" />
      </svg>
      {!collapsed && (
        <div className="leading-tight">
          <p className={cx('text-petit font-semibold', inverse ? 'text-sur-primaire' : 'text-texte')}>Gestion Immo</p>
          <p className={cx('text-legende', inverse ? 'text-sur-primaire opacity-75' : 'text-texte-secondaire')}>Super administration</p>
        </div>
      )}
    </div>
  );
}

interface Props { collapsed: boolean; mobileOpen: boolean; onCloseMobile: () => void; onLogout: () => void }

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onLogout }: Props) {
  // En drawer (< lg) la barre est toujours étendue.
  const compact = collapsed;
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onCloseMobile} aria-hidden />}
      <aside
        aria-label="Navigation principale"
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-bordure bg-surface transition-transform duration-200 lg:static lg:translate-x-0 lg:transition-[width]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          compact ? 'lg:w-[4.5rem]' : 'lg:w-64',
        )}
      >
        <div className={cx('flex h-16 shrink-0 items-center justify-between border-b border-bordure px-4', compact && 'lg:justify-center lg:px-0')}>
          <span className={cx(compact && 'lg:hidden')}><Logo /></span>
          {compact && <span className="hidden lg:block"><Logo collapsed /></span>}
          <button onClick={onCloseMobile} aria-label="Fermer le menu" className="rounded-petit p-1.5 text-texte-secondaire hover:bg-surface-alt lg:hidden"><X className="size-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group, gi) => (
            <div key={gi} className="mb-4">
              {group.title && (
                <p className={cx('mb-1 px-3 text-legende font-semibold uppercase tracking-wider text-texte-discret', compact && 'lg:hidden')}>{group.title}</p>
              )}
              {group.title && compact && <hr className="mx-2 mb-2 hidden border-bordure lg:block" />}
              <ul className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to} onClick={onCloseMobile} title={compact ? label : undefined}
                      className={({ isActive }) => cx(
                        'group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-petit font-medium transition-colors',
                        compact && 'lg:justify-center lg:px-0',
                        isActive ? 'bg-primaire-teinte text-primaire' : 'text-texte-secondaire hover:bg-surface-alt hover:text-texte',
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-secondaire" aria-hidden />}
                          <Icon className="size-5 shrink-0" aria-hidden />
                          <span className={cx('truncate', compact && 'lg:sr-only')}>{label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-bordure p-3">
          <button
            onClick={onLogout} title={compact ? 'Déconnexion' : undefined}
            className={cx('flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-petit font-medium text-texte-secondaire hover:bg-danger-fond hover:text-danger', compact && 'lg:justify-center lg:px-0')}
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            <span className={cx(compact && 'lg:sr-only')}>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
