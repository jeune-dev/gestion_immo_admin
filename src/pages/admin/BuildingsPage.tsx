import { Link } from 'react-router-dom';
import { listImmeubles } from '@/api/admin';
import type { Immeuble } from '@/api/types';
import { PageHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FilterBar, SearchBox } from '@/components/ui/FilterBar';
import { useListQuery } from '@/hooks/useListQuery';
import { date } from '@/lib/format';

export default function BuildingsPage() {
  const list = useListQuery('immeubles', listImmeubles, { defaultSort: '-created_at' });

  const columns: Column<Immeuble>[] = [
    {
      key: 'name', header: 'Immeuble',
      cell: (b) => (<div><p className="font-medium">{b.name}</p><p className="text-legende text-texte-secondaire">{[b.address, b.district].filter(Boolean).join(', ') || '—'}</p></div>),
    },
    { key: 'city', header: 'Ville', cell: (b) => b.city ?? '—' },
    { key: 'owner', header: 'Propriétaire', cell: (b) => b.owner ? <Link to={`/proprietaires/${b.owner.id}`} className="text-primaire hover:underline">{b.owner.display_name}</Link> : '—' },
    { key: 'apts', header: 'Appartements', align: 'right', cell: (b) => <span className="gi-montant">{b.apartments_count}</span> },
    { key: 'occ', header: 'Occupés', align: 'right', cell: (b) => <span className="gi-montant">{b.occupied_count}</span> },
    { key: 'avail', header: 'Disponibles', align: 'right', cell: (b) => <span className="gi-montant">{b.available_count}</span> },
    { key: 'created', header: 'Créé le', cell: (b) => date(b.created_at) },
  ];

  return (
    <>
      <PageHeader title="Immeubles" description="Patrimoine de tous les propriétaires (lecture seule)." />
      <FilterBar active={list.filterCount} onReset={list.reset}>
        <SearchBox value={list.get('q')} onChange={(v) => list.setFilter('q', v)} placeholder="Nom, adresse…" />
        <SearchBox value={list.get('city')} onChange={(v) => list.setFilter('city', v)} placeholder="Ville" />
      </FilterBar>
      <DataTable
        columns={columns} rows={list.data?.items} rowKey={(b) => b.id} loading={list.isLoading} fetching={list.isFetching}
        error={list.error} onRetry={() => list.refetch()} pagination={list.data?.pagination} onPage={list.setPage}
        empty={{ title: 'Aucun immeuble trouvé' }}
      />
    </>
  );
}
