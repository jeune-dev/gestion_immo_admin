import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPlan, deletePlan, listPlans, setPlanActive, updatePlan, type PlanInput } from '@/api/admin';
import type { Plan } from '@/api/types';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { FormModal } from '@/components/ui/Modal';
import { ActionMenu } from '@/components/ui/Popover';
import { useAction } from '@/hooks/useAction';
import { useReferentiels } from '@/hooks/useReferentiels';
import { fcfa, nombre } from '@/lib/format';

const limit = (v: number | null) => (v == null ? 'Illimité' : nombre(v));
const toNullableInt = (s: string) => (s.trim() === '' ? null : Number(s));

interface FormState {
  code: string; name: string; description: string; price: string; billing_period: 'mensuel' | 'annuel';
  max_buildings: string; max_apartments: string; max_whatsapp_per_month: string; features: string[]; sort_order: string;
}
const EMPTY: FormState = { code: '', name: '', description: '', price: '', billing_period: 'mensuel', max_buildings: '', max_apartments: '', max_whatsapp_per_month: '', features: [], sort_order: '0' };
const fromPlan = (p: Plan): FormState => ({
  code: p.code, name: p.name, description: p.description ?? '', price: String(p.price), billing_period: p.billing_period,
  max_buildings: p.max_buildings?.toString() ?? '', max_apartments: p.max_apartments?.toString() ?? '',
  max_whatsapp_per_month: p.max_whatsapp_per_month?.toString() ?? '', features: p.features, sort_order: String(p.sort_order),
});

function PlanForm({ plan, open, onClose }: { plan: Plan | null; open: boolean; onClose: () => void }) {
  const { options } = useReferentiels();
  const [f, setF] = useState<FormState>(EMPTY);
  useEffect(() => { if (open) setF(plan ? fromPlan(plan) : EMPTY); }, [open, plan]);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const mut = useAction(
    (input: PlanInput & { code?: string }) => (plan ? updatePlan(plan.id, input) : createPlan({ ...input, code: input.code! })),
    { invalidate: ['plans'], silentError: true, onSuccess: onClose },
  );

  const submit = () => {
    const body: PlanInput = {
      name: f.name.trim(), description: f.description.trim() || null, price: Number(f.price), billing_period: f.billing_period,
      max_buildings: toNullableInt(f.max_buildings), max_apartments: toNullableInt(f.max_apartments),
      max_whatsapp_per_month: toNullableInt(f.max_whatsapp_per_month), features: f.features, sort_order: Number(f.sort_order) || 0,
    };
    mut.mutate(plan ? body : { ...body, code: f.code.trim() });
  };

  const features = options('fonctionnalite');
  const tooMany = f.features.length > 6;
  const invalid = !f.name.trim() || f.price === '' || Number(f.price) < 0 || tooMany || (!plan && !/^[A-Z][A-Z0-9_]{1,29}$/.test(f.code));

  return (
    <FormModal
      open={open} onClose={onClose} size="lg" title={plan ? `Modifier « ${plan.name} »` : 'Nouveau plan'}
      submitLabel={plan ? 'Enregistrer' : 'Créer le plan'} loading={mut.isPending} error={mut.error} disabled={invalid} onSubmit={submit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Code" value={f.code} disabled={!!plan} onChange={(e) => set('code', e.target.value.toUpperCase())} hint="Majuscules, chiffres et _ (ex. STARTER). Non modifiable." />
        <Input label="Nom" value={f.name} maxLength={80} onChange={(e) => set('name', e.target.value)} />
        <Input label="Prix (FCFA)" type="number" min={0} value={f.price} onChange={(e) => set('price', e.target.value)} />
        <Select label="Facturation" value={f.billing_period} onChange={(e) => set('billing_period', e.target.value as 'mensuel' | 'annuel')}>
          <option value="mensuel">Mensuelle</option><option value="annuel">Annuelle</option>
        </Select>
        <Input label="Immeubles max." type="number" min={1} value={f.max_buildings} onChange={(e) => set('max_buildings', e.target.value)} hint="Vide = illimité." />
        <Input label="Appartements max." type="number" min={1} value={f.max_apartments} onChange={(e) => set('max_apartments', e.target.value)} hint="Vide = illimité." />
        <Input label="Messages WhatsApp / mois" type="number" min={0} value={f.max_whatsapp_per_month} onChange={(e) => set('max_whatsapp_per_month', e.target.value)} hint="Vide = illimité." />
        <Input label="Ordre d’affichage" type="number" min={0} value={f.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
      </div>
      <Textarea label="Description" rows={2} value={f.description} maxLength={2000} onChange={(e) => set('description', e.target.value)} />
      <fieldset>
        <legend className="mb-1 text-petit font-medium">Fonctionnalités incluses</legend>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {features.map((o) => (
            <label key={o.code} className="flex items-center gap-2 text-petit">
              <input type="checkbox" checked={f.features.includes(o.code)} onChange={(e) => set('features', e.target.checked ? [...f.features, o.code] : f.features.filter((c) => c !== o.code))} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
    </FormModal>
  );
}

export default function PlansPage() {
  const q = useQuery({ queryKey: ['plans', 'admin'], queryFn: () => listPlans() });
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Plan | null>(null);

  const toggle = useAction(({ id, active }: { id: string; active: boolean }) => setPlanActive(id, active), { invalidate: ['plans'] });
  const remove = useAction((id: string) => deletePlan(id), { invalidate: ['plans'], silentError: true, successMessage: 'Plan supprimé', onSuccess: () => setDeleting(null) });

  const columns: Column<Plan>[] = [
    { key: 'name', header: 'Plan', cell: (p) => <div><p className="font-medium">{p.name}</p><p className="font-mono text-legende text-texte-secondaire">{p.code}</p></div> },
    { key: 'price', header: 'Prix', align: 'right', cell: (p) => <span className="gi-montant font-medium">{fcfa(p.price)} <span className="font-normal text-texte-secondaire">/ {p.billing_period === 'annuel' ? 'an' : 'mois'}</span></span> },
    { key: 'b', header: 'Immeubles', align: 'right', cell: (p) => <span className="gi-montant">{limit(p.max_buildings)}</span> },
    { key: 'a', header: 'Appartements', align: 'right', cell: (p) => <span className="gi-montant">{limit(p.max_apartments)}</span> },
    { key: 'w', header: 'WhatsApp / mois', align: 'right', cell: (p) => <span className="gi-montant">{limit(p.max_whatsapp_per_month)}</span> },
    { key: 'subs', header: 'Abonnés', align: 'right', cell: (p) => <span className="gi-montant">{nombre(p.subscribers_count ?? 0)}</span> },
    { key: 'status', header: 'Statut', cell: (p) => <StatusBadge famille="plan" enumName="statut_plan" code={p.status} /> },
    {
      key: 'actions', header: '', align: 'right',
      cell: (p) => (
        <ActionMenu actions={[
          { label: 'Modifier', onClick: () => setEditing(p) },
          { label: p.status === 'actif' ? 'Désactiver' : 'Activer', onClick: () => toggle.mutate({ id: p.id, active: p.status !== 'actif' }) },
          { label: 'Supprimer', danger: true, onClick: () => setDeleting(p) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Plans tarifaires" description="Prix, limites et fonctionnalités des formules d’abonnement." actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Nouveau plan</Button>} />
      <DataTable columns={columns} rows={q.data} rowKey={(p) => p.id} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} empty={{ title: 'Aucun plan', description: 'Créez votre première formule d’abonnement.' }} />

      <PlanForm open={creating || !!editing} plan={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      <ConfirmDialog
        open={!!deleting} onClose={() => { setDeleting(null); remove.reset(); }} danger title="Êtes-vous sûr de vouloir supprimer ce plan ?"
        message={`Le plan « ${deleting?.name} » sera supprimé définitivement. S’il a des abonnés, la suppression sera refusée : désactivez-le plutôt.`}
        confirmLabel="Supprimer" loading={remove.isPending} error={remove.error} onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
