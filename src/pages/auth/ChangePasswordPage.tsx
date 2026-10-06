import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import * as authApi from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { FormError, Input } from '@/components/ui/Field';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { AuthShell } from './AuthShell';

/** Écran imposé quand l'API signale `must_change_password` (mot de passe provisoire). */
export default function ChangePasswordPage() {
  const { status, user, setToken, reload, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'anonymous') return <Navigate to="/login" replace />;
  if (status === 'authenticated' && user && !user.must_change_password) return <Navigate to="/dashboard" replace />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const mismatch = !!form.password_confirmation && form.password !== form.password_confirmation;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const { data, message } = await authApi.changePassword(form);
      setToken(data.access_token);
      await reload();
      toast.success(message);
      navigate('/dashboard', { replace: true });
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <AuthShell
      title="Choisissez un nouveau mot de passe" description="Votre mot de passe est provisoire : vous devez le remplacer avant de continuer."
      footer={<button className="font-medium text-primaire hover:underline" onClick={() => void logout()}>Se déconnecter</button>}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormError error={error} />
        <Input label="Mot de passe actuel" type="password" value={form.current_password} onChange={set('current_password')} autoComplete="current-password" required />
        <Input label="Nouveau mot de passe" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" minLength={8} hint="8 caractères minimum, avec majuscule, minuscule et chiffre." required />
        <Input label="Confirmation" type="password" value={form.password_confirmation} onChange={set('password_confirmation')} autoComplete="new-password" error={mismatch ? 'Les mots de passe ne correspondent pas.' : undefined} required />
        <Button type="submit" variant="primary" loading={busy} disabled={!form.current_password || form.password.length < 8 || mismatch || !form.password_confirmation}>Enregistrer</Button>
      </form>
    </AuthShell>
  );
}
