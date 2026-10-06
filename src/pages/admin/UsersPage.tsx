import { Copy, Lock, Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { activateUtilisateur, createSuperAdmin, deactivateUtilisateur, listUtilisateurs, resetAccess, unlockUtilisateur } from '@/api/admin';
import type { Utilisateur } from '@/api/types';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input, Textarea } from '@/components/ui/Field';
import { FilterBar, FilterSelect, SearchBox } from '@/components/ui/FilterBar';
import { FormModal, Modal } from '@/components/ui/Modal';
import { ActionMenu } from '@/components/ui/Popover';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useReferentiels } from '@/hooks/useReferentiels';
import { dateTime, fullName } from '@/lib/format';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

function CreateAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const empty = { first_name: '', last_name: '', email: '', phone: '', password: '', current_password: '' };
  const [f, setF] = useState(empty);
  useEffect(() => { if (open) setF(empty); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const mut = useAction(() => createSuperAdmin({ ...f, phone: f.phone.trim() || undefined }), { invalidate: ['utilisateurs'], silentError: true, onSuccess: onClose });
  const invalid = !f.first_name.trim() || !f.last_name.trim() || !f.email.trim() || !PASSWORD_RULE.test(f.password) || !f.current_password;

  return (
    <FormModal open={open} onClose={onClose} title="Nouveau super administrateur" description="Il devra changer ce mot de passe provisoire et configurer la double authentification à sa première connexion."
      submitLabel="Créer le compte" loading={mut.isPending} error={mut.error} disabled={invalid} onSubmit={() => mut.mutate()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Prénom" value={f.first_name} maxLength={80} onChange={set('first_name')} />
        <Input label="Nom" value={f.last_name} maxLength={80} onChange={set('last_name')} />
      </div>
      <Input label="E-mail" type="email" value={f.email} maxLength={254} onChange={set('email')} />
      <Input label="Téléphone (facultatif)" value={f.phone} maxLength={25} onChange={set('phone')} />
      <Input label="Mot de passe provisoire" type="password" autoComplete="new-password" value={f.password} onChange={set('password')}
        error={f.password && !PASSWORD_RULE.test(f.password) ? '8 caractères minimum, avec majuscule, minuscule et chiffre.' : undefined} />
      <Input label="Votre mot de passe (confirmation)" type="password" autoComplete="current-password" value={f.current_password} onChange={set('current_password')} hint="Requis pour cette action sensible." />
    </FormModal>
  );
}

function ResetAccessModal({ user, onClose }: { user: Utilisateur | null; onClose: () => void }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<string | null>(null);
  useEffect(() => { if (user) { setPassword(''); setReason(''); setResult(null); } }, [user]);

  const mut = useAction(() => resetAccess(user!.id, { current_password: password, reason: reason.trim() }), {
    invalidate: ['utilisateurs'], silentError: true, onSuccess: (res) => setResult((res as { data: { mot_de_passe_provisoire: string } }).data.mot_de_passe_provisoire),
  });
  const copy = async () => { try { await navigator.clipboard.writeText(result ?? ''); toast.success('Mot de passe copié.'); } catch { toast.info('Copie impossible : notez-le manuellement.'); } };

  if (result) {
    return (
      <Modal open={!!user} onClose={onClose} title="Accès réinitialisé" description="Transmettez ce mot de passe provisoire par un canal sûr. Il ne sera plus affiché.">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-bordure bg-surface-alt p-3">
          <code className="break-all font-mono text-petit">{result}</code>
          <Button size="sm" variant="outline" icon={<Copy className="size-4" />} onClick={copy}>Copier</Button>
        </div>
        <p className="mt-3 text-legende text-texte-secondaire">La double authentification devra être reconfigurée à la prochaine connexion.</p>
        <div className="mt-4 flex justify-end"><Button variant="primary" onClick={onClose}>Terminé</Button></div>
      </Modal>
    );
  }
  return (
    <FormModal open={!!user} onClose={onClose} danger title="Réinitialiser l’accès ?" description={user ? `Compte : ${fullName(user)}` : undefined}
      submitLabel="Réinitialiser" loading={mut.isPending} error={mut.error} disabled={!password || reason.trim().length < 3} onSubmit={() => mut.mutate()}>
      <p className="text-petit text-texte-secondaire">Un mot de passe provisoire sera généré, toutes ses sessions seront fermées et sa double authentification supprimée.</p>
      <Textarea label="Motif" rows={2} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} hint="3 caractères minimum." />
      <Input label="Votre mot de passe (confirmation)" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
    </FormModal>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const { options } = useReferentiels();
  const list = useListQuery('utilisateurs', listUtilisateurs, { defaultSort: '-created_at' });
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState<Utilisateur | null>(null);
  const [resetting, setResetting] = useState<Utilisateur | null>(null);

  const invalidate = { invalidate: ['utilisateurs'] };
  const deactivate = useAction(({ id, reason }: { id: string; reason: string }) => deactivateUtilisateur(id, reason), { ...invalidate, silentError: true, onSuccess: () => setDeactivating(null) });
  const activate = useAction((id: string) => activateUtilisateur(id), invalidate);
  const unlock = useAction((id: string) => unlockUtilisateur(id), invalidate);

  const columns: Column<Utilisateur>[] = [
    { key: 'name', header: 'Utilisateur', cell: (u) => <div><p className="font-medium">{fullName(u)}{u.id === me?.id && <span className="ml-2 text-legende text-texte-secondaire">(vous)</span>}</p><p className="text-legende text-texte-secondaire">{u.email ?? u.phone ?? '—'}</p></div> },
    { key: 'role', header: 'Rôle', cell: (u) => options('roles').find((r) => r.code === u.role_code)?.label ?? u.role_code },
    {
      key: 'status', header: 'Statut',
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge famille="utilisateur" enumName="statut_utilisateur" code={u.status} />
          {u.is_locked && <Badge tone="danger"><Lock className="size-3" aria-hidden />Verrouillé</Badge>}
        </div>
      ),
    },
    { key: 'mfa', header: '2FA', cell: (u) => u.totp_enabled_at ? <span className="inline-flex items-center gap-1 text-succes"><ShieldCheck className="size-4" aria-hidden />Active</span> : <span className="text-texte-secondaire">Non</span> },
    { key: 'login', header: 'Dernière connexion', cell: (u) => dateTime(u.last_login_at) },
    {
      key: 'actions', header: '', align: 'right',
      cell: (u) => (
        <ActionMenu actions={[
          { label: 'Déverrouiller', hidden: !u.is_locked, onClick: () => unlock.mutate(u.id) },
          { label: 'Activer', hidden: u.status === 'actif', onClick: () => activate.mutate(u.id) },
          { label: 'Désactiver', danger: true, hidden: u.status !== 'actif' || u.id === me?.id, onClick: () => setDeactivating(u) },
          { label: 'Réinitialiser l’accès', danger: true, hidden: u.role_code !== 'super_admin' || u.id === me?.id, onClick: () => setResetting(u) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Utilisateurs" description="Tous les comptes de la plateforme." actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Nouveau super admin</Button>} />
      <FilterBar active={list.filterCount} onReset={list.reset}>
        <SearchBox value={list.get('q')} onChange={(v) => list.setFilter('q', v)} placeholder="Nom, e-mail, téléphone…" />
        <FilterSelect label="Rôle" value={list.get('role')} onChange={(v) => list.setFilter('role', v)} options={options('roles')} />
        <FilterSelect label="Statut" value={list.get('status')} onChange={(v) => list.setFilter('status', v)} options={options('statut_utilisateur')} />
        <FilterSelect label="Verrouillage" value={list.get('verrouille')} onChange={(v) => list.setFilter('verrouille', v)} options={[{ code: 'true', label: 'Verrouillés' }, { code: 'false', label: 'Non verrouillés' }]} />
      </FilterBar>
      <DataTable
        columns={columns} rows={list.data?.items} rowKey={(u) => u.id} loading={list.isLoading} fetching={list.isFetching}
        error={list.error} onRetry={() => list.refetch()} pagination={list.data?.pagination} onPage={list.setPage}
        empty={{ title: 'Aucun utilisateur trouvé' }}
      />

      <CreateAdminModal open={creating} onClose={() => setCreating(false)} />
      <ResetAccessModal user={resetting} onClose={() => setResetting(null)} />
      <ConfirmDialog
        open={!!deactivating} onClose={() => { setDeactivating(null); deactivate.reset(); }} danger title="Désactiver ce compte ?"
        message={`« ${fullName(deactivating)} » ne pourra plus se connecter. Le dernier super administrateur actif ne peut pas être désactivé.`}
        confirmLabel="Désactiver" reason={{ minLength: 3 }} loading={deactivate.isPending} error={deactivate.error}
        onConfirm={(reason) => deactivating && deactivate.mutate({ id: deactivating.id, reason: reason ?? '' })}
      />
    </>
  );
}
