import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/States';

/**
 * Garde des routes admin. Le backend impose aussi ces étapes (403 MFA_REQUISE,
 * 403 CHANGEMENT_MOT_DE_PASSE_REQUIS) : l'interface oriente simplement vers le bon écran.
 */
export function ProtectedRoute() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="grid h-full place-items-center bg-fond"><Skeleton className="h-10 w-40" /></div>;
  }
  if (status === 'anonymous' || !user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.must_change_password) return <Navigate to="/changer-mot-de-passe" replace />;
  if (!(user.mfa_active ?? !!user.totp_enabled_at)) return <Navigate to="/configurer-mfa" replace />;
  return <Outlet />;
}
