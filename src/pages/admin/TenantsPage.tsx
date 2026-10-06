import { Check, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listLocataires } from '@/api/admin';
import type { Locataire } from '@/api/types';
import { PageHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FilterBar, SearchBox } from '@/components/ui/FilterBar';
import { useListQuery } from '@/hooks/useListQuery';
import { date, fullName } from '@/lib/format';

const yesNo = (v: boolean) => v
  ? <span className="inline-flex items-center gap-1 text-succes"><Check className="size-4" aria-hidden />Oui</span>
  : <span className="inline-flex items-center gap-1 text-texte-secondaire"><Minus className="size-4" aria-hidden />Non</span>;

export default function TenantsPage() {
  const list = useListQuery('locataires', listLocataires, { defaultSort: '-created_at' });

  const columns: Column<Locataire>[] = [
    { key: 'name', header: 'Locataire', cell: (t) => <span className="font-medium">{fullName(t)}</span> },
    { key: 'phone', header: 'Téléphone', cell: (t) => t.phone ?? '—' },
    { key: 'owner', header: 'Propriétaire', cell: (t) => t.owner ? <Link to={`/proprietaires/${t.owner.id}`} className="text-primaire hover:underline">{t.owner.display_name}</Link> : '—' },
    { key: 'leases', header: 'Baux actifs', align: 'right', cell: (t) => <span className="gi-montant">{t.active_leases}</span> },
    { key: 'account', header: 'Compte activé', cell: (t) => yesNo(t.has_account) },
    { key: 'wa', header: 'Consent. WhatsApp', cell: (t) => yesNo(t.whatsapp_consent) },
    { key: 'created', header: 'Créé le', cell: (t) => date(t.created_at) },
  ];

  return (
    <>
      <PageHeader title="Locataires" description="Consultation des locataires de tous les propriétaires (lecture seule)." />
      <FilterBar active={list.filterCount} onReset={list.reset}>
        <SearchBox value={list.get('q')} onChange={(v) => list.setFilter('q', v)} placeholder="Nom ou téléphone…" />
      </FilterBar>
      <DataTable
        columns={columns} rows={list.data?.items} rowKey={(t) => t.id} loading={list.isLoading} fetching={list.isFetching}
        error={list.error} onRetry={() => list.refetch()} pagination={list.data?.pagination} onPage={list.setPage}
        empty={{ title: 'Aucun locataire trouvé' }}
      />
    </>
  );
}
