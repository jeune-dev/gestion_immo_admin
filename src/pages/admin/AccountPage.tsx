import { useQuery } from '@tanstack/react-query';
import { Copy, Laptop, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { changePassword, listSessions, mfaBackupCodes, revokeAllSessions, revokeSession, updateProfile } from '@/api/auth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormError, Input } from '@/components/ui/Field';
import { FormModal, Modal } from '@/components/ui/Modal';
import { QueryBoundary } from '@/components/ui/States';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAction } from '@/hooks/useAction';
import { dateTime } from '@/lib/format';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

function Profile() {
  const { user, reload } = useAuth();
  const [f, setF] = useState({ first_name: user?.first_name ?? '', last_name: user?.last_name ?? '', email: user?.email ?? '', current_password: '' });
  const emailChanged = f.email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase();
  const dirty = f.first_name !== user?.first_name || f.last_name !== user?.last_name || emailChanged;

  const mut = useAction(() => updateProfile({
    first_name: f.first_name.trim(), last_name: f.last_name.trim(), email: f.email.trim() || null, ...(emailChanged && { current_password: f.current_password }),
  }), { silentError: true, onSuccess: () => { setF((s) => ({ ...s, current_password: '' })); void reload(); } });

  return (
    <Card>
      <CardHeader title="Profil" />
      <form className="grid gap-4 p-5" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
        <FormError error={mut.error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Prénom" value={f.first_name} maxLength={80} onChange={(e) => setF({ ...f, first_name: e.target.value })} />
          <Input label="Nom" value={f.last_name} maxLength={80} onChange={(e) => setF({ ...f, last_name: e.target.value })} />
        </div>
        <Input label="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        {emailChanged && <Input label="Mot de passe actuel" type="password" autoComplete="current-password" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} hint="Requis pour changer l’adresse e-mail." />}
        <div><Button type="submit" variant="primary" loading={mut.isPending} disabled={!dirty || !f.first_name.trim() || !f.last_name.trim() || (emailChanged && !f.current_password)}>Enregistrer</Button></div>
      </form>
    </Card>
  );
}

function Password() {
  const { setToken } = useAuth();
  const [f, setF] = useState({ current_password: '', password: '', password_confirmation: '' });
  const mismatch = !!f.password_confirmation && f.password !== f.password_confirmation;
  const mut = useAction(() => changePassword(f), { silentError: true, onSuccess: (res) => { setToken((res as { data: { access_token: string } }).data.access_token); setF({ current_password: '', password: '', password_confirmation: '' }); } });

  return (
    <Card>
      <CardHeader title="Mot de passe" description="Les autres appareils seront déconnectés après le changement." />
      <form className="grid gap-4 p-5" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
        <FormError error={mut.error} />
        <Input label="Mot de passe actuel" type="password" autoComplete="current-password" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nouveau mot de passe" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })}
            error={f.password && !PASSWORD_RULE.test(f.password) ? '8 caractères minimum, avec majuscule, minuscule et chiffre.' : undefined} />
          <Input label="Confirmation" type="password" autoComplete="new-password" value={f.password_confirmation} onChange={(e) => setF({ ...f, password_confirmation: e.target.value })} error={mismatch ? 'Les mots de passe ne correspondent pas.' : undefined} />
        </div>
        <div><Button type="submit" variant="primary" loading={mut.isPending} disabled={!f.current_password || !PASSWORD_RULE.test(f.password) || mismatch || !f.password_confirmation}>Changer le mot de passe</Button></div>
      </form>
    </Card>
  );
}

function Security() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ current_password: '', code: '' });
  const [codes, setCodes] = useState<string[] | null>(null);
  const mut = useAction(() => mfaBackupCodes(f.current_password, f.code), { silentError: true, successMessage: '', onSuccess: (res) => { setCodes(res.codes_secours); setF({ current_password: '', code: '' }); } });
  const close = () => { setOpen(false); setCodes(null); mut.reset(); };
  const copy = async () => { try { await navigator.clipboard.writeText((codes ?? []).join('\n')); toast.success('Codes copiés.'); } catch { toast.info('Copie impossible : notez-les manuellement.'); } };

  return (
    <Card>
      <CardHeader title="Double authentification" action={<Badge tone="succes"><ShieldCheck className="size-3" aria-hidden />Active</Badge>} description="Obligatoire pour les super administrateurs : elle ne peut pas être désactivée." />
      <div className="p-5"><Button variant="outline" onClick={() => setOpen(true)}>Régénérer les codes de secours</Button></div>

      {codes ? (
        <Modal open={open} onClose={close} title="Nouveaux codes de secours" description="Les anciens ne sont plus valables. Ils ne seront plus affichés.">
          <ul className="grid grid-cols-2 gap-2 rounded-lg border border-bordure bg-surface-alt p-3 font-mono text-petit">{codes.map((c) => <li key={c}>{c}</li>)}</ul>
          <div className="mt-4 flex justify-end gap-2"><Button variant="outline" icon={<Copy className="size-4" />} onClick={copy}>Copier</Button><Button variant="primary" onClick={close}>Terminé</Button></div>
        </Modal>
      ) : (
        <FormModal open={open} onClose={close} title="Régénérer les codes de secours" submitLabel="Régénérer" loading={mut.isPending} error={mut.error} disabled={!f.current_password || f.code.length !== 6} onSubmit={() => mut.mutate()}>
          <Input label="Mot de passe actuel" type="password" autoComplete="current-password" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} />
          <Input label="Code de l’application (6 chiffres)" inputMode="numeric" maxLength={6} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, '') })} />
        </FormModal>
      )}
    </Card>
  );
}

function Sessions() {
  const q = useQuery({ queryKey: ['sessions'], queryFn: listSessions });
  const revoke = useAction((id: string) => revokeSession(id), { invalidate: ['sessions'] });
  const [confirmAll, setConfirmAll] = useState(false);
  const { logout } = useAuth();
  const revokeAll = useAction(() => revokeAllSessions(), { silentError: true, onSuccess: () => { setConfirmAll(false); void logout(); } });

  return (
    <Card>
      <CardHeader title="Sessions actives" action={<Button variant="outline" size="sm" onClick={() => setConfirmAll(true)}>Déconnecter tous les appareils</Button>} />
      <QueryBoundary loading={q.isLoading} error={q.error} onRetry={() => q.refetch()}>
        <ul className="divide-y divide-bordure">
          {q.data?.sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-5 py-3">
              <Laptop className="size-5 shrink-0 text-texte-secondaire" aria-hidden />
              <div className="min-w-0 flex-1 text-petit">
                <p className="font-medium">{s.device_name ?? 'Appareil inconnu'} {s.current && <Badge tone="info">Cette session</Badge>}</p>
                <p className="text-legende text-texte-secondaire">{s.platform ?? '—'} · {s.ip ?? '—'} · dernière activité {dateTime(s.last_used_at)}</p>
              </div>
              {!s.current && <Button size="sm" variant="ghost" onClick={() => revoke.mutate(s.id)}>Fermer</Button>}
            </li>
          ))}
        </ul>
      </QueryBoundary>
      <ConfirmDialog open={confirmAll} onClose={() => { setConfirmAll(false); revokeAll.reset(); }} danger title="Déconnecter tous les appareils ?"
        message="Toutes les sessions, y compris celle-ci, seront fermées. Vous devrez vous reconnecter." confirmLabel="Tout déconnecter"
        loading={revokeAll.isPending} error={revokeAll.error} onConfirm={() => revokeAll.mutate()} />
    </Card>
  );
}

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Mon compte" description="Profil, sécurité et sessions de votre compte super administrateur." />
      <div className="grid max-w-3xl gap-4">
        <Profile />
        <Password />
        <Security />
        <Sessions />
      </div>
    </>
  );
}
