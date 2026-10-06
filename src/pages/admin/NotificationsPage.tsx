import { CheckCheck, Send } from 'lucide-react';
import { useState } from 'react';
import { listDiffusions, listNotifications, markAllNotificationsRead, markNotificationRead, sendDiffusion } from '@/api/admin';
import type { Diffusion, Notification } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { cx, dateTime } from '@/lib/format';

const CIBLES = [{ code: 'proprietaires', label: 'Tous les propriétaires' }, { code: 'locataires', label: 'Tous les locataires' }, { code: 'tous', label: 'Tous les utilisateurs' }];

function Inbox() {
  const list = useListQuery('notifications', listNotifications, { limit: 20 });
  const unreadOnly = list.get('non_lues') === 'true';
  const read = useAction((id: string) => markNotificationRead(id), { invalidate: ['notifications'], successMessage: '' });
  const readAll = useAction(() => markAllNotificationsRead(), { invalidate: ['notifications'] });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Filtre" className="inline-flex rounded-lg border border-bordure bg-surface p-0.5 text-petit">
          {[{ v: '', l: 'Toutes' }, { v: 'true', l: 'Non lues' }].map((t) => (
            <button key={t.l} role="tab" aria-selected={list.get('non_lues') === t.v} onClick={() => list.setFilter('non_lues', t.v)}
              className={cx('rounded-lg px-3 py-1.5 font-medium', list.get('non_lues') === t.v ? 'bg-primaire-teinte text-primaire' : 'text-texte-secondaire')}>{t.l}</button>
          ))}
        </div>
        <Button variant="outline" icon={<CheckCheck className="size-4" />} loading={readAll.isPending} onClick={() => readAll.mutate()}>Tout marquer comme lu</Button>
      </div>

      <Card>
        {list.isLoading ? <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          : list.error ? <ErrorState error={list.error} onRetry={() => list.refetch()} />
          : !list.data?.items.length ? <EmptyState title={unreadOnly ? 'Aucune notification non lue' : 'Aucune notification'} />
          : (
            <>
              <ul className="divide-y divide-bordure">
                {list.data.items.map((n: Notification) => (
                  <li key={n.id} className="flex items-start gap-3 px-5 py-4">
                    <span className={cx('mt-2 size-2 shrink-0 rounded-pilule', n.read_at ? 'bg-bordure-forte' : 'bg-secondaire')} aria-label={n.read_at ? 'Lue' : 'Non lue'} />
                    <div className="min-w-0 flex-1">
                      <p className={cx('text-petit', !n.read_at && 'font-semibold')}>{n.title}</p>
                      <p className="text-petit text-texte-secondaire">{n.body}</p>
                      <p className="mt-1 text-legende text-texte-discret">{dateTime(n.created_at)} · {n.type}</p>
                    </div>
                    {!n.read_at && <Button size="sm" variant="ghost" onClick={() => read.mutate(n.id)}>Marquer comme lue</Button>}
                  </li>
                ))}
              </ul>
              <Pagination data={list.data.pagination} onPage={list.setPage} />
            </>
          )}
      </Card>
    </>
  );
}

function Broadcast() {
  const [f, setF] = useState({ cible: 'proprietaires', titre: '', corps: '' });
  const [confirm, setConfirm] = useState(false);
  const history = useListQuery('diffusions', listDiffusions, { limit: 10 });

  const send = useAction(() => sendDiffusion({ ...f, titre: f.titre.trim(), corps: f.corps.trim() }), {
    invalidate: ['diffusions'], silentError: true, onSuccess: () => { setConfirm(false); setF({ ...f, titre: '', corps: '' }); },
  });
  const invalid = f.titre.trim().length < 3 || f.corps.trim().length < 3;

  const columns: Column<Diffusion>[] = [
    { key: 'date', header: 'Date', cell: (d) => dateTime(d.created_at) },
    { key: 'title', header: 'Message', cell: (d) => <div className="max-w-md"><p className="font-medium">{d.details.titre}</p><p className="line-clamp-1 text-legende text-texte-secondaire">{d.details.corps}</p></div> },
    { key: 'cible', header: 'Cible', cell: (d) => CIBLES.find((c) => c.code === d.details.cible)?.label ?? d.details.cible },
    { key: 'dest', header: 'Destinataires', align: 'right', cell: (d) => <Badge tone="info">{d.details.destinataires}</Badge> },
  ];

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title="Nouvelle diffusion" description="Notification interne envoyée à un groupe d’utilisateurs." />
        <form className="grid gap-4 p-5" onSubmit={(e) => { e.preventDefault(); setConfirm(true); }}>
          <Select label="Destinataires" value={f.cible} onChange={(e) => setF({ ...f, cible: e.target.value })}>
            {CIBLES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </Select>
          <Input label="Titre" value={f.titre} maxLength={150} onChange={(e) => setF({ ...f, titre: e.target.value })} />
          <Textarea label="Message" rows={4} value={f.corps} maxLength={2000} onChange={(e) => setF({ ...f, corps: e.target.value })} hint={`${f.corps.length} / 2000`} />
          <div><Button type="submit" variant="primary" icon={<Send className="size-4" />} disabled={invalid}>Envoyer</Button></div>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sous-titre font-semibold">Historique des envois</h2>
        <DataTable columns={columns} rows={history.data?.items} rowKey={(d) => String(d.id)} loading={history.isLoading} error={history.error} onRetry={() => history.refetch()}
          pagination={history.data?.pagination} onPage={history.setPage} empty={{ title: 'Aucune diffusion envoyée' }} />
      </div>

      <ConfirmDialog open={confirm} onClose={() => { setConfirm(false); send.reset(); }} title="Envoyer cette notification ?"
        message={`Le message sera envoyé à : ${CIBLES.find((c) => c.code === f.cible)?.label.toLowerCase()}. Cette action est irréversible.`}
        confirmLabel="Envoyer" loading={send.isPending} error={send.error} onConfirm={() => send.mutate()} />
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<'inbox' | 'broadcast'>('inbox');
  return (
    <>
      <PageHeader title="Notifications" description="Vos notifications et les messages diffusés aux utilisateurs." />
      <div role="tablist" className="mb-5 flex gap-1 border-b border-bordure">
        {([['inbox', 'Mes notifications'], ['broadcast', 'Diffusions']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cx('-mb-px border-b-2 px-4 py-2.5 text-petit font-medium', tab === id ? 'border-primaire text-primaire' : 'border-transparent text-texte-secondaire hover:text-texte')}>{label}</button>
        ))}
      </div>
      {tab === 'inbox' ? <Inbox /> : <Broadcast />}
    </>
  );
}
