import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy } from 'lucide-react';
import * as authApi from '@/api/auth';
import { tokenStore } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { FormError, Input } from '@/components/ui/Field';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { AuthShell } from './AuthShell';

type Step = 'password' | 'scan' | 'codes';

/** Configuration obligatoire de la double authentification (exigée du super admin par l'API). */
export default function MfaSetupPage() {
  const { status, user, reload, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [secret, setSecret] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [backup, setBackup] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'anonymous') return <Navigate to="/login" replace />;
  if (status === 'authenticated' && user && (user.mfa_active ?? !!user.totp_enabled_at) && step !== 'codes') return <Navigate to="/dashboard" replace />;

  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) { setError(e); } finally { setBusy(false); }
  }

  const init = (e: FormEvent) => { e.preventDefault(); void run(async () => { setSecret(await authApi.mfaInit(password)); setPassword(''); setStep('scan'); }); };
  const activate = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const res = await authApi.mfaActivate(code);
      tokenStore.set(res.access_token);
      setBackup(res.codes_secours);
      setStep('codes');
    });
  };
  const finish = () => void run(async () => { await reload(); navigate('/dashboard', { replace: true }); });
  const copy = async () => {
    try { await navigator.clipboard.writeText(backup.join('\n')); toast.success('Codes copiés dans le presse-papiers.'); } catch { toast.info('Copie impossible : notez les codes manuellement.'); }
  };

  const logoutLink = <button className="font-medium text-primaire hover:underline" onClick={() => void logout()}>Se déconnecter</button>;

  if (step === 'password') {
    return (
      <AuthShell title="Sécurisez votre compte" description="La double authentification est obligatoire pour les super administrateurs." footer={logoutLink}>
        <form onSubmit={init} className="flex flex-col gap-4">
          <FormError error={error} />
          <Input label="Confirmez votre mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus required />
          <Button type="submit" variant="primary" loading={busy} disabled={!password}>Continuer</Button>
        </form>
      </AuthShell>
    );
  }

  if (step === 'scan' && secret) {
    return (
      <AuthShell title="Scannez le QR code" description="Avec Google Authenticator, Authy, 1Password… puis saisissez le code affiché.">
        <form onSubmit={activate} className="flex flex-col gap-4">
          <FormError error={error} />
          <div className="mx-auto rounded-carte border border-bordure bg-white p-3"><QRCodeSVG value={secret.otpauth_url} size={176} /></div>
          <details className="text-legende text-texte-secondaire">
            <summary className="cursor-pointer">Saisir la clé manuellement</summary>
            <code className="mt-1 block break-all rounded-lg bg-surface-alt p-2 text-texte">{secret.secret}</code>
          </details>
          <Input label="Code à 6 chiffres" value={code} inputMode="numeric" maxLength={6} autoComplete="one-time-code" onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
          <Button type="submit" variant="primary" loading={busy} disabled={code.length !== 6}>Activer</Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Codes de secours" description="Conservez-les en lieu sûr : ils ne seront plus affichés.">
      <div className="flex flex-col gap-4">
        <FormError error={error} />
        <ul className="grid grid-cols-2 gap-2 rounded-carte border border-bordure bg-surface p-4 font-mono text-petit">
          {backup.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <Button variant="outline" icon={<Copy className="size-4" />} onClick={copy}>Copier les codes</Button>
        <label className="flex items-start gap-2 text-petit">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1" />
          J’ai conservé ces codes en lieu sûr.
        </label>
        <Button variant="primary" loading={busy} disabled={!saved} onClick={finish}>Accéder au tableau de bord</Button>
      </div>
    </AuthShell>
  );
}
