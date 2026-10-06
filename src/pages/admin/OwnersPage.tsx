import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPlans, listProprietaires, reactivateProprietaire, suspendProprietaire } from '@/api/admin';
import type { Proprietaire } from '@/api/types';
import { ActivateSubscriptionModal } from '@/components/owners/ActivateSubscriptionModal';
import { StatusBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FilterBar, FilterSelect, SearchBox } from '@/components/ui/FilterBar';
import { ActionMenu } from '@/components/ui/Popover';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useReferentiels } from '@/hooks/useReferentiels';
import { date } from '@/lib/format';

export default function OwnersPage() {
  const navigate = useNavigate();
  const { options } = useReferentiels();
  const list = useListQuery('proprietaires', listProprietaires, { defaultSort: '-created_at' });
  const plans = useQuery({ queryKey: ['plans', 'all'], queryFn: () => listPlans() });

  const [suspend, setSuspend] = useState<Proprietaire | null>(null);
  const [activate, setActivate] = useState<Proprietaire | null>(null);

  const suspendMut = useAction(({ id, reason }: { id: string; reason: string }) => suspendProprietaire(id, reason), {
    invalidate: ['proprietaires', 'proprietaire', 'dashboard'], silentError: true, onSuccess: () => setSuspend(null),
  });
  const reactivateMut = useAction((id: string) => reactivateProprietaire(id), { invalidate: ['proprietaires', 'proprietaire', 'dashboard'] });

  const columns: Column<Proprietaire>[] = [
    {
      key: 'name', header: 'Propriétaire',
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{o.display_name}</p>
          <p className="truncate text-legende text-texte-secondaire">{o.company_name ?? o.email ?? o.phone ?? '—'}</p>
        </div>
      ),
    },
    { key: 'city', header: 'Ville', cell: (o) => o.city ?? '—' },
    { key: 'patrimoine', header: 'Patrimoine', cell: (o) => <span className="gi-montant text-texte-secondaire">{o.buildings_count} imm. · {o.apartments_count} apt. · {o.tenants_count} loc.</span> },
    { key: 'plan', header: 'Plan', cell: (o) => o.plan_code ?? '—' },
    { key: 'sub', header: 'Abonnement', cell: (o) => <StatusBadge famille="abonnement" enumName="statut_abonnement" code={o.subscription_status} /> },
    { key: 'end', header: 'Fin de période', cell: (o) => date(o.current_period_end) },
    { key: 'status', header: 'Statut', cell: (o) => <StatusBadge famille="proprietaire" enumName="statut_proprietaire" code={o.status} /> },
    {
      key: 'actions', header: '', align: 'right',
      cell: (o) => (
        <ActionMenu actions={[
          { label: 'Voir la fiche', onClick: () => navigate(`/proprietaires/${o.id}`) },
          { label: 'Activer un abonnement', onClick: () => setActivate(o) },
          { label: 'Suspendre', danger: true, hidden: o.status === 'suspendu', onClick: () => setSuspend(o) },
          { label: 'Réactiver', hidden: o.status !== 'suspendu', onClick: () => reactivateMut.mutate(o.id) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Propriétaires" description="Comptes propriétaires, leur patrimoine et leur abonnement." />
      <FilterBar active={list.filterCount} onReset={list.reset}>
        <SearchBox value={list.get('q')} onChange={(v) => list.setFilter('q', v)} placeholder="Nom, e-mail, téléphone…" />
        <FilterSelect label="Statut" value={list.get('status')} onChange={(v) => list.setFilter('status', v)} options={options('statut_proprietaire')} />
        <FilterSelect label="Abonnement" value={list.get('abonnement')} onChange={(v) => list.setFilter('abonnement', v)}
          options={[...options('statut_abonnement').filter((o) => ['essai', 'actif', 'suspendu'].includes(o.code)), { code: 'aucun', label: 'Aucun' }]} />
        <FilterSelect label="Plan" value={list.get('plan')} onChange={(v) => list.setFilter('plan', v)} options={(plans.data ?? []).map((p) => ({ code: p.code, label: p.name }))} />
      </FilterBar>

      <DataTable
        columns={columns} rows={list.data?.items} rowKey={(o) => o.id} loading={list.isLoading} fetching={list.isFetching}
        error={list.error} onRetry={() => list.refetch()} pagination={list.data?.pagination} onPage={list.setPage}
        onRowClick={(o) => navigate(`/proprietaires/${o.id}`)}
        empty={{ title: 'Aucun propriétaire trouvé', description: list.filterCount ? 'Essayez de modifier ou de réinitialiser les filtres.' : undefined }}
      />

      <ConfirmDialog
        open={!!suspend} onClose={() => { setSuspend(null); suspendMut.reset(); }} danger title="Suspendre cet espace propriétaire ?"
        message={`« ${suspend?.display_name} » n’aura plus accès à son espace tant qu’il n’est pas réactivé.`}
        confirmLabel="Suspendre" reason={{ minLength: 3 }} loading={suspendMut.isPending} error={suspendMut.error}
        onConfirm={(reason) => suspend && suspendMut.mutate({ id: suspend.id, reason: reason ?? '' })}
      />
      {activate && <ActivateSubscriptionModal open ownerId={activate.id} ownerName={activate.display_name} onClose={() => setActivate(null)} />}
    </>
  );
}
