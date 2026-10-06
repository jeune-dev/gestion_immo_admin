import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getUnreadCount, listNotifications, markNotificationRead } from '@/api/admin';
import { useAuth } from '@/contexts/AuthContext';
import { Popover } from '@/components/ui/Popover';
import { useAction } from '@/hooks/useAction';
import { dateTime, fullName, initials } from '@/lib/format';
import { titleFor } from './nav';

function NotificationBell() {
  const { data: unread = 0 } = useQuery({ queryKey: ['notifications', 'unread'], queryFn: getUnreadCount, refetchInterval: 60_000 });
  const latest = useQuery({ queryKey: ['notifications', 'latest'], queryFn: () => listNotifications({ limit: 5 }), refetchInterval: 60_000 });
  const read = useAction(markNotificationRead, { invalidate: ['notifications'], successMessage: '' });

  return (
    <Popover button={({ open, toggle }) => (
      <button onClick={toggle} aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} non lues` : ''}`} className="relative grid size-10 place-items-center rounded-lg text-texte-secondaire hover:bg-surface-alt">
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-pilule bg-secondaire px-1 text-[10px] font-bold leading-4 text-sur-secondaire">{unread > 99 ? '99+' : unread}</span>}
      </button>
    )}>
      {(close) => (
        <div className="w-[min(22rem,calc(100vw-2rem))]">
          <p className="border-b border-bordure px-4 py-3 font-semibold">Notifications</p>
          <ul className="max-h-80 divide-y divide-bordure overflow-y-auto">
            {latest.data?.items.map((n) => (
              <li key={n.id}>
                <button onClick={() => !n.read_at && read.mutate(n.id)} className="w-full px-4 py-3 text-left hover:bg-surface-alt">
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="mt-1.5 size-2 shrink-0 rounded-pilule bg-secondaire" aria-label="Non lue" />}
                    <div className="min-w-0">
                      <p className="truncate text-petit font-medium">{n.title}</p>
                      <p className="line-clamp-2 text-legende text-texte-secondaire">{n.body}</p>
                      <p className="mt-0.5 text-legende text-texte-discret">{dateTime(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {latest.isError && <li className="px-4 py-6 text-center text-petit text-danger">Impossible de charger les notifications.</li>}
            {latest.data && !latest.data.items.length && <li className="px-4 py-6 text-center text-petit text-texte-secondaire">Aucune notification.</li>}
          </ul>
          <Link to="/notifications" onClick={close} className="block border-t border-bordure px-4 py-3 text-center text-petit font-semibold text-primaire hover:bg-surface-alt">Tout voir</Link>
        </div>
      )}
    </Popover>
  );
}

interface Props { collapsed: boolean; onToggleCollapse: () => void; onOpenMobile: () => void }

export function Topbar({ collapsed, onToggleCollapse, onOpenMobile }: Props) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const Collapse = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-bordure bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onOpenMobile} aria-label="Ouvrir le menu" className="grid size-10 place-items-center rounded-lg text-texte-secondaire hover:bg-surface-alt lg:hidden"><Menu className="size-5" /></button>
      <button onClick={onToggleCollapse} aria-label={collapsed ? 'Déplier le menu' : 'Réduire le menu'} className="hidden size-10 place-items-center rounded-lg text-texte-secondaire hover:bg-surface-alt lg:grid"><Collapse className="size-5" /></button>
      <p className="truncate text-sous-titre font-semibold">{titleFor(pathname)}</p>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <Popover button={({ open, toggle }) => (
          <button onClick={toggle} aria-expanded={open} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-surface-alt">
            <span className="grid size-8 place-items-center rounded-pilule bg-primaire text-legende font-semibold text-sur-primaire">{initials(user)}</span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-petit font-medium">{fullName(user)}</span>
              <span className="block text-legende text-texte-secondaire">Super admin</span>
            </span>
            <ChevronDown className="size-4 text-texte-secondaire" aria-hidden />
          </button>
        )}>
          {(close) => (
            <div className="w-56 p-1.5">
              <p className="truncate px-3 py-2 text-legende text-texte-secondaire">{user?.email}</p>
              <Link to="/compte" onClick={close} className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-petit hover:bg-surface-alt"><UserRound className="size-4" /> Mon compte</Link>
              <button onClick={() => { close(); void logout(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-petit text-danger hover:bg-danger-fond"><LogOut className="size-4" /> Déconnexion</button>
            </div>
          )}
        </Popover>
      </div>
    </header>
  );
}
