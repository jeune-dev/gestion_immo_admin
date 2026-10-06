import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { archiveModeleBail, createModeleBail, getModeleBail, getVariablesBail, listModelesBail, publishModeleBail, updateModeleBail } from '@/api/admin';
import type { ModeleBail } from '@/api/types';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { FormModal } from '@/components/ui/Modal';
import { ActionMenu } from '@/components/ui/Popover';
import { QueryBoundary } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useReferentiels } from '@/hooks/useReferentiels';
import { date } from '@/lib/format';

/** Création / édition. L'édition recharge le détail : la liste ne renvoie pas le corps du modèle. */
function TemplateForm({ template, open, onClose }: { template: ModeleBail | null; open: boolean; onClose: () => void }) {
  const { options } = useReferentiels();
  const detail = useQuery({ queryKey: ['modele-bail', template?.id], queryFn: () => getModeleBail(template!.id), enabled: open && !!template });
  const vars = useQuery({ queryKey: ['modele-bail-variables'], queryFn: getVariablesBail, enabled: open, staleTime: Infinity });
  const [f, setF] = useState({ lease_type: 'habitation', title: '', body: '', legal_notes: '' });

  useEffect(() => {
    if (!open) return;
    if (!template) setF({ lease_type: 'habitation', title: '', body: '', legal_notes: '' });
    else if (detail.data) setF({ lease_type: detail.data.lease_type, title: detail.data.title, body: detail.data.body ?? '', legal_notes: detail.data.legal_notes ?? '' });
  }, [open, template, detail.data]);

  const mut = useAction(() => {
    const legal_notes = f.legal_notes.trim() || null;
    return template
      ? updateModeleBail(template.id, { title: f.title.trim(), body: f.body, legal_notes })
      : createModeleBail({ lease_type: f.lease_type, title: f.title.trim(), body: f.body, legal_notes });
  }, { invalidate: ['modeles-bail', 'modele-bail'], silentError: true, onSuccess: onClose });

  const invalid = f.title.trim().length < 3 || f.body.trim().length < 20;
  const editing = !!template;

  return (
    <FormModal open={open} onClose={onClose} size="lg" title={editing ? 'Modifier le modèle' : 'Nouveau modèle de bail'}
      description={editing ? `Version ${template.version}` : undefined} submitLabel={editing ? 'Enregistrer' : 'Créer le brouillon'}
      loading={mut.isPending} error={mut.error} disabled={invalid || (editing && !detail.data)} onSubmit={() => mut.mutate()}>
      <QueryBoundary loading={editing && detail.isLoading} error={editing ? detail.error : null} onRetry={() => detail.refetch()}>
        <Select label="Type de bail" value={f.lease_type} disabled={editing} onChange={(e) => setF({ ...f, lease_type: e.target.value })}>
          {options('type_bail').map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
        </Select>
        <Input label="Titre" value={f.title} maxLength={150} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Textarea label="Contenu du contrat" rows={12} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className="font-mono"
          hint="Minimum 20 caractères. Utilisez les variables {{…}} ci-dessous." />
        {!!vars.data?.length && (
          <details className="text-legende text-texte-secondaire">
            <summary className="cursor-pointer font-medium">Variables disponibles ({vars.data.length})</summary>
            <p className="mt-2 flex flex-wrap gap-1.5">{vars.data.map((v) => <code key={v} className="rounded-lg bg-surface-alt px-1.5 py-0.5 text-texte">{`{{${v}}}`}</code>)}</p>
          </details>
        )}
        <Textarea label="Notes juridiques" rows={3} value={f.legal_notes} maxLength={5000} onChange={(e) => setF({ ...f, legal_notes: e.target.value })} hint="Internes : relecture par un juriste avant publication." />
      </QueryBoundary>
    </FormModal>
  );
}

export default function LeaseTemplatesPage() {
  const { options, label } = useReferentiels();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const q = useQuery({ queryKey: ['modeles-bail', type, status], queryFn: () => listModelesBail({ lease_type: type, status }) });
  const [editing, setEditing] = useState<ModeleBail | null>(null);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState<ModeleBail | null>(null);

  const publish = useAction((id: string) => publishModeleBail(id), { invalidate: ['modeles-bail'], silentError: true, onSuccess: () => setPublishing(null) });
  const archive = useAction((id: string) => archiveModeleBail(id), { invalidate: ['modeles-bail'] });

  const columns: Column<ModeleBail>[] = [
    { key: 'title', header: 'Modèle', cell: (t) => <div><p className="font-medium">{t.title}</p><p className="text-legende text-texte-secondaire">{label('type_bail', t.lease_type)}</p></div> },
    { key: 'version', header: 'Version', align: 'right', cell: (t) => <span className="gi-montant">v{t.version}</span> },
    { key: 'status', header: 'Statut', cell: (t) => <StatusBadge famille="modeleBail" enumName="statut_modele_bail" code={t.status} /> },
    { key: 'pub', header: 'Publié le', cell: (t) => date(t.published_at) },
    { key: 'upd', header: 'Modifié le', cell: (t) => date(t.updated_at) },
    {
      key: 'actions', header: '', align: 'right',
      cell: (t) => (
        <ActionMenu actions={[
          { label: 'Modifier', hidden: t.status === 'archive', onClick: () => setEditing(t) },
          { label: 'Publier', hidden: t.status !== 'brouillon', onClick: () => setPublishing(t) },
          { label: 'Archiver', danger: true, hidden: t.status === 'archive', onClick: () => archive.mutate(t.id) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Modèles de bail" description="Trames de contrat conformes OHADA, versionnées. Un brouillon doit être validé avant publication."
        actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Nouveau modèle</Button>} />
      <FilterBar active={Number(!!type) + Number(!!status)} onReset={() => { setType(''); setStatus(''); }}>
        <FilterSelect label="Type" value={type} onChange={setType} options={options('type_bail')} />
        <FilterSelect label="Statut" value={status} onChange={setStatus} options={options('statut_modele_bail')} />
      </FilterBar>
      <DataTable columns={columns} rows={q.data} rowKey={(t) => t.id} loading={q.isLoading} fetching={q.isFetching} error={q.error} onRetry={() => q.refetch()} empty={{ title: 'Aucun modèle de bail' }} />

      <TemplateForm open={creating || !!editing} template={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      <ConfirmDialog
        open={!!publishing} onClose={() => { setPublishing(null); publish.reset(); }} title="Publier ce modèle ?"
        message={`« ${publishing?.title} » (v${publishing?.version}) deviendra la version utilisée pour les nouveaux baux. Assurez-vous qu’un juriste l’a relu.`}
        confirmLabel="Publier" loading={publish.isPending} error={publish.error} onConfirm={() => publishing && publish.mutate(publishing.id)}
      />
    </>
  );
}
