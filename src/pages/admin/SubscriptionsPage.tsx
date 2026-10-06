import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelAbonnement, listAbonnements, listPlans, reactivateAbonnement, suspendAbonnement } from '@/api/admin';
import type { Abonnement } from '@/api/types';
import { StatusBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { ActionMenu } from '@/components/ui/Popover';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useReferentiels } from '@/hooks/useReferentiels';
import { date } from '@/lib/format';

type Pending = { kind: 'suspend' | 'cancel'; sub: Abonnement } | null;

export default function SubscriptionsPage() {
  const { options } = useReferentiels();
  const list = useListQuery('abonnements', listAbonnements, { defaultSort: '-created_at' });
  const plans = useQuery({ queryKey: ['plans', 'all'], queryFn: () => listPlans() });
  const [pending, setPending] = useState<Pending>(null);

  const invalidate = ['abonnements', 'proprietaires', 'proprietaire', 'dashboard'];
  const close = () => { setPending(null); suspend.reset(); cancel.reset(); };
  const suspend = useAction(({ id, reason }: { id: string; reason: string }) => suspendAbonnement(id, reason), { invalidate, silentError: true, onSuccess: () => setPending(null) });
  const cancel = useAction(({ id, reason }: { id: string; reason?: string }) => cancelAbonnement(id, reason), { invalidate, silentError: true, onSuccess: () => setPending(null) });
  const reactivate = useAction((id: string) => reactivateAbonnement(id), { invalidate });

  const columns: Column<Abonnement>[] = [
    { key: 'owner', header: 'Propriétaire', cell: (s) => s.owner ? <Link to={`/proprietaires/${s.owner.id}`} className="font-medium text-primaire hover:underline">{s.owner.display_name}</Link> : '—' },
    { key: 'plan', header: 'Plan', cell: (s) => s.plan?.name ?? '—' },
    { key: 'status', header: 'Statut', cell: (s) => <StatusBadge famille="abonnement" enumName="statut_abonnement" code={s.status} /> },
    { key: 'period', header: 'Période en cours', cell: (s) => <span className="gi-montant">{date(s.current_period_start)} → {date(s.current_period_end)}</span> },
    { key: 'trial', header: 'Fin d’essai', cell: (s) => date(s.trial_ends_at) },
    { key: 'reason', header: 'Motif', cell: (s) => <span className="line-clamp-1 max-w-48 text-texte-secondaire" title={s.suspended_reason ?? undefined}>{s.suspended_reason ?? '—'}</span> },
    {
      key: 'actions', header: '', align: 'right',
      cell: (s) => (
        <ActionMenu actions={[
          { label: 'Suspendre', danger: true, hidden: !['essai', 'actif'].includes(s.status), onClick: () => setPending({ kind: 'suspend', sub: s }) },
          { label: 'Réactiver', hidden: s.status !== 'suspendu', onClick: () => reactivate.mutate(s.id) },
          { label: 'Annuler', danger: true, hidden: ['annule', 'expire'].includes(s.status), onClick: () => setPending({ kind: 'cancel', sub: s }) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Abonnements" description="Suivi des abonnements SaaS des propriétaires." />
      <FilterBar active={list.filterCount} onReset={list.reset}>
        <FilterSelect label="Statut" value={list.get('status')} onChange={(v) => list.setFilter('status', v)} options={options('statut_abonnement')} />
        <FilterSelect label="Plan" value={list.get('plan')} onChange={(v) => list.setFilter('plan', v)} options={(plans.data ?? []).map((p) => ({ code: p.code, label: p.name }))} />
        <label className="flex items-center gap-2 text-petit text-texte-secondaire">Se termine avant le
          <input type="date" value={list.get('fin_avant')} onChange={(e) => list.setFilter('fin_avant', e.target.value)} className="min-h-10 rounded-lg border border-bordure-champ bg-surface px-2 text-texte" />
        </label>
      </FilterBar>

      <DataTable
        columns={columns} rows={list.data?.items} rowKey={(s) => s.id} loading={list.isLoading} fetching={list.isFetching}
        error={list.error} onRetry={() => list.refetch()} pagination={list.data?.pagination} onPage={list.setPage}
        empty={{ title: 'Aucun abonnement trouvé' }}
      />

      <ConfirmDialog
        open={pending?.kind === 'suspend'} onClose={close} danger title="Suspendre cet abonnement ?"
        message={`L’espace de « ${pending?.sub.owner?.display_name ?? 'ce propriétaire'} » passera en lecture seule.`}
        confirmLabel="Suspendre" reason={{ minLength: 3 }} loading={suspend.isPending} error={suspend.error}
        onConfirm={(reason) => pending && suspend.mutate({ id: pending.sub.id, reason: reason ?? '' })}
      />
      <ConfirmDialog
        open={pending?.kind === 'cancel'} onClose={close} danger title="Annuler cet abonnement ?"
        message="Cette action met fin à l’abonnement. Pour le rétablir, il faudra en activer un nouveau."
        confirmLabel="Annuler l’abonnement" reason={{ minLength: 3, required: false, label: 'Motif (facultatif)' }} loading={cancel.isPending} error={cancel.error}
        onConfirm={(reason) => pending && cancel.mutate({ id: pending.sub.id, reason })}
      />
    </>
  );
}
