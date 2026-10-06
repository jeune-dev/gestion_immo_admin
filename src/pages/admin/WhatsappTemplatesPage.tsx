import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { listModelesWhatsapp, updateModeleWhatsapp } from '@/api/admin';
import type { ModeleWhatsapp } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input, Textarea } from '@/components/ui/Field';
import { FormModal } from '@/components/ui/Modal';
import { useAction } from '@/hooks/useAction';
import { date } from '@/lib/format';

function TemplateForm({ template, onClose }: { template: ModeleWhatsapp | null; onClose: () => void }) {
  const [f, setF] = useState({ meta_template_name: '', language_code: '', body_preview: '', is_active: false });
  useEffect(() => {
    if (template) setF({ meta_template_name: template.meta_template_name, language_code: template.language_code, body_preview: template.body_preview, is_active: template.is_active });
  }, [template]);

  const mut = useAction(() => updateModeleWhatsapp(template!.id, { ...f, meta_template_name: f.meta_template_name.trim(), body_preview: f.body_preview.trim() }),
    { invalidate: ['modeles-whatsapp'], silentError: true, onSuccess: onClose });

  const invalid = !/^[a-z0-9_]{1,100}$/.test(f.meta_template_name) || !/^[a-z]{2,3}(_[A-Z]{2})?$/.test(f.language_code) || !f.body_preview.trim();

  return (
    <FormModal open={!!template} onClose={onClose} size="lg" title="Modifier le modèle WhatsApp" description={template?.event_code}
      submitLabel="Enregistrer" loading={mut.isPending} error={mut.error} disabled={invalid} onSubmit={() => mut.mutate()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nom du modèle Meta" value={f.meta_template_name} onChange={(e) => setF({ ...f, meta_template_name: e.target.value })} hint="Minuscules, chiffres et _ — identique à celui approuvé par Meta." />
        <Input label="Langue" value={f.language_code} onChange={(e) => setF({ ...f, language_code: e.target.value })} hint="Ex. fr ou fr_FR." />
      </div>
      <Textarea label="Aperçu du message" rows={4} value={f.body_preview} maxLength={1024} onChange={(e) => setF({ ...f, body_preview: e.target.value })} />
      {!!template?.variables.length && (
        <p className="text-legende text-texte-secondaire">Variables, dans l’ordre : {template.variables.map((v, i) => <code key={v} className="mr-1 rounded-lg bg-surface-alt px-1.5 py-0.5 text-texte">{`{{${i + 1}}} ${v}`}</code>)}</p>
      )}
      <label className="flex items-center gap-2 text-petit"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Modèle actif (envoi autorisé)</label>
    </FormModal>
  );
}

export default function WhatsappTemplatesPage() {
  const q = useQuery({ queryKey: ['modeles-whatsapp'], queryFn: listModelesWhatsapp });
  const [editing, setEditing] = useState<ModeleWhatsapp | null>(null);

  const columns: Column<ModeleWhatsapp>[] = [
    { key: 'event', header: 'Événement', cell: (t) => <span className="font-mono text-legende">{t.event_code}</span> },
    { key: 'meta', header: 'Modèle Meta', cell: (t) => <div><p className="font-medium">{t.meta_template_name}</p><p className="text-legende text-texte-secondaire">{t.language_code}</p></div> },
    { key: 'preview', header: 'Aperçu', cell: (t) => <span className="line-clamp-2 max-w-md text-texte-secondaire">{t.body_preview}</span> },
    { key: 'active', header: 'Statut', cell: (t) => <Badge tone={t.is_active ? 'succes' : 'neutre'}>{t.is_active ? 'Actif' : 'Inactif'}</Badge> },
    { key: 'upd', header: 'Modifié le', cell: (t) => date(t.updated_at) },
    { key: 'edit', header: '', align: 'right', cell: (t) => <Button size="sm" variant="outline" onClick={() => setEditing(t)}>Modifier</Button> },
  ];

  return (
    <>
      <PageHeader title="Modèles WhatsApp" description="Correspondance entre les événements de la plateforme et les modèles approuvés par Meta." />
      <DataTable columns={columns} rows={q.data} rowKey={(t) => t.id} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} empty={{ title: 'Aucun modèle WhatsApp' }} />
      <TemplateForm template={editing} onClose={() => setEditing(null)} />
    </>
  );
}
