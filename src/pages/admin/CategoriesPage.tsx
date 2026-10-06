import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createCategorie, deleteCategorie, listCategories, setCategorieActive, updateCategorie } from '@/api/admin';
import type { Categorie } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input, Select } from '@/components/ui/Field';
import { FormModal } from '@/components/ui/Modal';
import { ActionMenu } from '@/components/ui/Popover';
import { useAction } from '@/hooks/useAction';
import { useReferentiels } from '@/hooks/useReferentiels';

function CategoryForm({ category, open, onClose }: { category: Categorie | null; open: boolean; onClose: () => void }) {
  const { options } = useReferentiels();
  const [f, setF] = useState({ code: '', name: '', cash_group: 'autre', sort_order: '0' });
  useEffect(() => {
    if (open) setF(category ? { code: category.code, name: category.name, cash_group: category.cash_group, sort_order: String(category.sort_order) } : { code: '', name: '', cash_group: 'autre', sort_order: '0' });
  }, [open, category]);

  const mut = useAction(() => {
    const body = { name: f.name.trim(), cash_group: f.cash_group, sort_order: Number(f.sort_order) || 0 };
    return category ? updateCategorie(category.id, body) : createCategorie({ ...body, code: f.code.trim() });
  }, { invalidate: ['categories'], silentError: true, onSuccess: onClose });

  const invalid = !f.name.trim() || (!category && !/^[a-z][a-z0-9_]{1,39}$/.test(f.code));

  return (
    <FormModal open={open} onClose={onClose} title={category ? 'Modifier la catégorie' : 'Nouvelle catégorie'} submitLabel={category ? 'Enregistrer' : 'Créer'}
      loading={mut.isPending} error={mut.error} disabled={invalid} onSubmit={() => mut.mutate()}>
      <Input label="Code" value={f.code} disabled={!!category} onChange={(e) => setF({ ...f, code: e.target.value.toLowerCase() })} hint="Minuscules, chiffres et _ (ex. jardinage). Non modifiable." />
      <Input label="Nom" value={f.name} maxLength={100} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <Select label="Groupe de caisse" value={f.cash_group} onChange={(e) => setF({ ...f, cash_group: e.target.value })}>
        {options('groupe_caisse_sortie').map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
      </Select>
      <Input label="Ordre d’affichage" type="number" min={0} max={10000} value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} />
    </FormModal>
  );
}

export default function CategoriesPage() {
  const { label } = useReferentiels();
  const q = useQuery({ queryKey: ['categories'], queryFn: () => listCategories() });
  const [editing, setEditing] = useState<Categorie | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Categorie | null>(null);

  const toggle = useAction(({ id, active }: { id: string; active: boolean }) => setCategorieActive(id, active), { invalidate: ['categories'] });
  const remove = useAction((id: string) => deleteCategorie(id), { invalidate: ['categories'], silentError: true, successMessage: 'Catégorie supprimée', onSuccess: () => setDeleting(null) });

  const columns: Column<Categorie>[] = [
    { key: 'name', header: 'Catégorie', cell: (c) => <div><p className="font-medium">{c.name}</p><p className="font-mono text-legende text-texte-secondaire">{c.code}</p></div> },
    { key: 'group', header: 'Groupe de caisse', cell: (c) => label('groupe_caisse_sortie', c.cash_group) },
    { key: 'exp', header: 'Dépenses', align: 'right', cell: (c) => <span className="gi-montant">{c.expenses_count ?? 0}</span> },
    { key: 'order', header: 'Ordre', align: 'right', cell: (c) => <span className="gi-montant">{c.sort_order}</span> },
    { key: 'status', header: 'Statut', cell: (c) => <Badge tone={c.is_active ? 'succes' : 'neutre'}>{c.is_active ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '', align: 'right',
      cell: (c) => (
        <ActionMenu actions={[
          { label: 'Modifier', onClick: () => setEditing(c) },
          { label: c.is_active ? 'Désactiver' : 'Activer', onClick: () => toggle.mutate({ id: c.id, active: !c.is_active }) },
          { label: 'Supprimer', danger: true, onClick: () => setDeleting(c) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Catégories de dépenses" description="Catalogue commun proposé aux propriétaires pour classer leurs dépenses." actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Nouvelle catégorie</Button>} />
      <DataTable columns={columns} rows={q.data} rowKey={(c) => c.id} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} empty={{ title: 'Aucune catégorie' }} />
      <CategoryForm open={creating || !!editing} category={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      <ConfirmDialog
        open={!!deleting} onClose={() => { setDeleting(null); remove.reset(); }} danger title="Êtes-vous sûr de vouloir supprimer cette catégorie ?"
        message={`« ${deleting?.name} » sera supprimée. Si elle est déjà utilisée par des dépenses, la suppression sera refusée : désactivez-la plutôt.`}
        confirmLabel="Supprimer" loading={remove.isPending} error={remove.error} onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
