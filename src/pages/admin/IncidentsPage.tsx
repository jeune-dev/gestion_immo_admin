import { Link } from 'react-router-dom';
import { listSignalements } from '@/api/admin';
import type { Signalement } from '@/api/types';
import { StatusBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { DateRange } from '@/components/ui/DateRange';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { useListQuery } from '@/hooks/useListQuery';
import { useReferentiels } from '@/hooks/useReferentiels';
import { dateTime } from '@/lib/format';

const unit = (s: Signalement) => s.apartment?.label ?? s.apartment?.name ?? s.apartment?.number ?? '';

export default function IncidentsPage() {
  const { options, label } = useReferentiels();
  const list = useListQuery('signalements', listSignalements, { defaultSort: '-created_at' });

  const columns: Column<Signalement>[] = [
    { key: 'ref', header: 'Référence', cell: (s) => <span className="font-mono text-legende">{s.reference}</span> },
    { key: 'title', header: 'Signalement', cell: (s) => <div className="min-w-0 max-w-xs"><p className="truncate font-medium">{s.title}</p><p className="text-legende text-texte-secondaire">{label('categorie_incident', s.category)}</p></div> },
    { key: 'place', header: 'Lieu', cell: (s) => [s.building?.name, unit(s)].filter(Boolean).join(' · ') || '—' },
    { key: 'owner', header: 'Propriétaire', cell: (s) => s.owner_name ? <Link to={`/proprietaires/${s.owner_id}`} className="text-primaire hover:underline">{s.owner_name}</Link> : '—' },
    { key: 'status', header: 'Statut', cell: (s) => <StatusBadge famille="incident" enumName="statut_incident" code={s.status} /> },
    { key: 'created', header: 'Signalé le', cell: (s) => dateTime(s.created_at) },
  ];

  return (
    <>
      <PageHeader title="Signalements" description="Incidents signalés par les locataires (lecture seule)." />
      <FilterBar active={list.filterCount} onReset={list.reset}>
        <FilterSelect label="Statut" value={list.get('status')} onChange={(v) => list.setFilter('status', v)} options={options('statut_incident')} />
        <FilterSelect label="Catégorie" value={list.get('category')} onChange={(v) => list.setFilter('category', v)} options={options('categorie_incident')} />
        <DateRange from={list.get('du')} to={list.get('au')} onFrom={(v) => list.setFilter('du', v)} onTo={(v) => list.setFilter('au', v)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={list.data?.items} rowKey={(s) => s.id} loading={list.isLoading} fetching={list.isFetching}
        error={list.error} onRetry={() => list.refetch()} pagination={list.data?.pagination} onPage={list.setPage}
        empty={{ title: 'Aucun signalement trouvé' }}
      />
    </>
  );
}
