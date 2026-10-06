import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { FormError, Input } from '@/components/ui/Field';
import { AuthShell } from './AuthShell';

export default function LoginPage() {
  const { status, mfaToken, login, verifyMfa, cancelMfa } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/dashboard';

  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') return <Navigate to={from} replace />;

  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) { setError(e); } finally { setBusy(false); }
  }

  const submitCredentials = (e: FormEvent) => { e.preventDefault(); void run(() => login(identifiant.trim(), password)); };
  const submitMfa = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await verifyMfa(useBackup ? { code_secours: code.trim() } : { code: code.trim() });
      navigate(from, { replace: true });
    });
  };

  if (mfaToken) {
    return (
      <AuthShell
        title="Vérification en deux étapes"
        description={useBackup ? 'Saisissez l’un de vos codes de secours.' : 'Saisissez le code à 6 chiffres de votre application d’authentification.'}
        footer={<button className="font-medium text-primaire hover:underline" onClick={() => { cancelMfa(); setCode(''); setError(null); }}>← Retour à la connexion</button>}
      >
        <form onSubmit={submitMfa} className="flex flex-col gap-4">
          <FormError error={error} />
          <Input
            label={useBackup ? 'Code de secours' : 'Code de vérification'} value={code} autoFocus autoComplete="one-time-code"
            inputMode={useBackup ? 'text' : 'numeric'} maxLength={useBackup ? 20 : 6} onChange={(e) => setCode(useBackup ? e.target.value : e.target.value.replace(/\D/g, ''))}
          />
          <Button type="submit" variant="primary" loading={busy} disabled={useBackup ? !code.trim() : code.length !== 6}>Vérifier</Button>
          <button type="button" className="text-petit font-medium text-primaire hover:underline" onClick={() => { setUseBackup((b) => !b); setCode(''); setError(null); }}>
            {useBackup ? 'Utiliser le code de l’application' : 'Utiliser un code de secours'}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Connexion" description="Accédez à l’espace de super administration.">
      <form onSubmit={submitCredentials} className="flex flex-col gap-4">
        <FormError error={error} />
        <Input label="E-mail ou téléphone" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} autoComplete="username" autoFocus maxLength={254} required />
        <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" maxLength={128} required />
        <Button type="submit" variant="primary" loading={busy} disabled={!identifiant.trim() || !password}>Se connecter</Button>
        <p className="text-center text-legende text-texte-secondaire">
          Mot de passe oublié ? Un autre super administrateur peut réinitialiser votre accès.
        </p>
      </form>
    </AuthShell>
  );
}
