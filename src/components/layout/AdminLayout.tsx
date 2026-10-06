import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/States';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const KEY = 'gi-sidebar-collapsed';
const readCollapsed = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

export function AdminLayout() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  const toggle = () => setCollapsed((c) => {
    try { localStorage.setItem(KEY, c ? '0' : '1'); } catch { /* préférence non persistée */ }
    return !c;
  });

  return (
    <div className="flex h-full bg-fond">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onLogout={() => void logout()} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar collapsed={collapsed} onToggleCollapse={toggle} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-64" /></div>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
