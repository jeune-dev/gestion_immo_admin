import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Skeleton } from '@/components/ui/States';

const page = (loader: () => Promise<{ default: React.ComponentType }>) => lazy(loader);

const LoginPage = page(() => import('@/pages/auth/LoginPage'));
const MfaSetupPage = page(() => import('@/pages/auth/MfaSetupPage'));
const ChangePasswordPage = page(() => import('@/pages/auth/ChangePasswordPage'));

const DashboardPage = page(() => import('@/pages/admin/DashboardPage'));
const OwnersPage = page(() => import('@/pages/admin/OwnersPage'));
const OwnerDetailPage = page(() => import('@/pages/admin/OwnerDetailPage'));
const TenantsPage = page(() => import('@/pages/admin/TenantsPage'));
const BuildingsPage = page(() => import('@/pages/admin/BuildingsPage'));
const IncidentsPage = page(() => import('@/pages/admin/IncidentsPage'));
const SubscriptionsPage = page(() => import('@/pages/admin/SubscriptionsPage'));
const PlansPage = page(() => import('@/pages/admin/PlansPage'));
const PaymentsPage = page(() => import('@/pages/admin/PaymentsPage'));
const UsersPage = page(() => import('@/pages/admin/UsersPage'));
const CategoriesPage = page(() => import('@/pages/admin/CategoriesPage'));
const LeaseTemplatesPage = page(() => import('@/pages/admin/LeaseTemplatesPage'));
const WhatsappTemplatesPage = page(() => import('@/pages/admin/WhatsappTemplatesPage'));
const NotificationsPage = page(() => import('@/pages/admin/NotificationsPage'));
const AuditPage = page(() => import('@/pages/admin/AuditPage'));
const SettingsPage = page(() => import('@/pages/admin/SettingsPage'));
const AccountPage = page(() => import('@/pages/admin/AccountPage'));

export default function App() {
  return (
    <Suspense fallback={<div className="grid h-full place-items-center"><Skeleton className="h-10 w-40" /></div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/configurer-mfa" element={<MfaSetupPage />} />
        <Route path="/changer-mot-de-passe" element={<ChangePasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/proprietaires" element={<OwnersPage />} />
            <Route path="/proprietaires/:id" element={<OwnerDetailPage />} />
            <Route path="/locataires" element={<TenantsPage />} />
            <Route path="/immeubles" element={<BuildingsPage />} />
            <Route path="/signalements" element={<IncidentsPage />} />
            <Route path="/abonnements" element={<SubscriptionsPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/paiements" element={<PaymentsPage />} />
            <Route path="/utilisateurs" element={<UsersPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/modeles-bail" element={<LeaseTemplatesPage />} />
            <Route path="/modeles-whatsapp" element={<WhatsappTemplatesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/journal-audit" element={<AuditPage />} />
            <Route path="/parametres" element={<SettingsPage />} />
            <Route path="/compte" element={<AccountPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
