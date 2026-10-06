import { Link } from 'react-router-dom';
import { listPaiements } from '@/api/admin';
import type { PaiementAbonnement } from '@/api/types';
import { StatusBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { DateRange } from '@/components/ui/DateRange';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { useListQuery } from '@/hooks/useListQuery';
import { useReferentiels } from '@/hooks/useReferentiels';
import { dateTime, fcfa } from '@/lib/format';

const PROVIDERS = [{ code: 'paydunya', label: 'PayDunya' }, { code: 'manuel', label: 'Manuel' }];

export default function PaymentsPage() {
  const { options } = useReferentiels();
  const list = useListQuery('paiements', listPaiements, { defaultSort: '-created_at' });

  const columns: Column<PaiementAbonnement>[] = [
    { key: 'ref', header: 'Référence', cell: (p) => <span className="font-mono text-legende">{p.reference}</span> },
    { key: 'owner', header: 'Propriétaire', cell: (p) => p.owner ? <Link to={`/proprietaires/${p.owner.id}`} className="text-primaire hover:underline">{p.owner.display_name}</Link> : '—' },
    { key: 'plan', header: 'Plan', cell: (p) => <span>{p.plan?.name ?? '—'} <span className="text-texte-secondaire">· {p.months} mois</span></span> },
    { key: 'amount', header: 'Montant', align: 'right', cell: (p) => <span className="gi-montant font-medium">{fcfa(p.amount)}</span> },
    { key: 'provider', header: 'Canal', cell: (p) => PROVIDERS.find((x) => x.code === p.provider)?.label ?? p.provider },
    { key: 'status', header: 'Statut', cell: (p) => <StatusBadge famille="paiementAbonnement" enumName="statut_paiement_abonnement" code={p.status} /> },
    { key: 'paid', header: 'Payé le', cell: (p) => dateTime(p.paid_at) },
    { key: 'note', header: 'Note', cell: (p) => <span className="line-clamp-1 max-w-40 text-texte-secondaire" title={p.note ?? undefined}>{p.note ?? '—'}</span> },
  ];

  return (
    <>
      <PageHeader title="Paiements" description="Paiements d’abonnements SaaS (en ligne et enregistrés manuellement)." />
      <FilterBar active={list.filterCount} onReset={list.reset}>
        <FilterSelect label="Statut" value={list.get('status')} onChange={(v) => list.setFilter('status', v)} options={options('statut_paiement_abonnement')} />
        <FilterSelect label="Canal" value={list.get('provider')} onChange={(v) => list.setFilter('provider', v)} options={PROVIDERS} />
        <DateRange from={list.get('du')} to={list.get('au')} onFrom={(v) => list.setFilter('du', v)} onTo={(v) => list.setFilter('au', v)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={list.data?.items} rowKey={(p) => p.id} loading={list.isLoading} fetching={list.isFetching}
        error={list.error} onRetry={() => list.refetch()} pagination={list.data?.pagination} onPage={list.setPage}
        empty={{ title: 'Aucun paiement trouvé' }}
      />
    </>
  );
}
