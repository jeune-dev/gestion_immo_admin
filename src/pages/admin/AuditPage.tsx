import { useState } from 'react';
import { listAudit } from '@/api/admin';
import type { AuditEntry } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { DateRange } from '@/components/ui/DateRange';
import { FilterBar, SearchBox } from '@/components/ui/FilterBar';
import { Modal } from '@/components/ui/Modal';
import { useListQuery } from '@/hooks/useListQuery';
import { dateTime } from '@/lib/format';

export default function AuditPage() {
  const list = useListQuery('audit', listAudit, { limit: 30 });
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  const columns: Column<AuditEntry>[] = [
    { key: 'date', header: 'Date', cell: (a) => <span className="whitespace-nowrap">{dateTime(a.created_at)}</span> },
    { key: 'action', header: 'Action', cell: (a) => <span className="font-mono text-legende">{a.action}</span> },
    { key: 'entity', header: 'Entité', cell: (a) => a.entity_type ? <span>{a.entity_type}<span className="ml-1 font-mono text-legende text-texte-discret">{a.entity_id?.slice(0, 8)}</span></span> : '—' },
    { key: 'actor', header: 'Acteur', cell: (a) => a.actor_role ? <Badge tone="neutre">{a.actor_role}</Badge> : '—' },
    { key: 'ip', header: 'IP', cell: (a) => <span className="font-mono text-legende text-texte-secondaire">{a.ip ?? '—'}</span> },
  ];

  return (
    <>
      <PageHeader title="Journal d’audit" description="Historique immuable des actions sensibles de la plateforme." />
      <FilterBar active={list.filterCount} onReset={list.reset}>
        <SearchBox value={list.get('action')} onChange={(v) => list.setFilter('action', v)} placeholder="Action (ex. parametres.modification)" />
        <SearchBox value={list.get('entity_type')} onChange={(v) => list.setFilter('entity_type', v)} placeholder="Type d’entité" />
        <DateRange from={list.get('du')} to={list.get('au')} onFrom={(v) => list.setFilter('du', v)} onTo={(v) => list.setFilter('au', v)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={list.data?.items} rowKey={(a) => String(a.id)} loading={list.isLoading} fetching={list.isFetching}
        error={list.error} onRetry={() => list.refetch()} pagination={list.data?.pagination} onPage={list.setPage}
        onRowClick={setSelected} empty={{ title: 'Aucune entrée dans le journal' }}
      />
      <Modal open={!!selected} onClose={() => setSelected(null)} size="lg" title="Détail de l’entrée" description={selected?.action}>
        {selected && (
          <div className="space-y-3 text-petit">
            <p className="text-texte-secondaire">{dateTime(selected.created_at)} · requête <span className="font-mono">{selected.request_id ?? '—'}</span></p>
            <pre className="max-h-80 overflow-auto rounded-lg bg-surface-alt p-3 text-legende">{JSON.stringify(selected.details, null, 2)}</pre>
          </div>
        )}
      </Modal>
    </>
  );
}
