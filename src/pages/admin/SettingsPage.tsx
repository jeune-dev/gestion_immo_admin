import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { listParametres, listPlans, listRoles, updateParametre } from '@/api/admin';
import type { Parametre } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { FormError, Input, Select } from '@/components/ui/Field';
import { QueryBoundary } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { cx, dateTime } from '@/lib/format';

type Value = Record<string, unknown>;

function ParametreCard({ setting, plans }: { setting: Parametre; plans: { code: string; name: string }[] }) {
  const [draft, setDraft] = useState<Value>(setting.value);
  useEffect(() => setDraft(setting.value), [setting]);

  const mut = useAction((value: Value) => updateParametre(setting.key, value), { invalidate: ['parametres'], silentError: true });
  const dirty = JSON.stringify(draft) !== JSON.stringify(setting.value);
  const isDefault = JSON.stringify(draft) === JSON.stringify(setting.default);

  const field = (k: string, v: unknown) => {
    const label = k.replace(/_/g, ' ');
    const set = (nv: unknown) => setDraft((d) => ({ ...d, [k]: nv }));
    if (k === 'plan_code' && plans.length) {
      return <Select key={k} label="Plan" value={String(v ?? '')} onChange={(e) => set(e.target.value)}>
        {!plans.some((p) => p.code === v) && <option value={String(v ?? '')}>{String(v ?? '—')}</option>}
        {plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
      </Select>;
    }
    if (typeof v === 'number') return <Input key={k} label={label} type="number" value={String(v)} onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))} />;
    if (typeof v === 'boolean') return <label key={k} className="flex items-center gap-2 pt-6 text-petit"><input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} />{label}</label>;
    if (typeof v === 'string') return <Input key={k} label={label} value={v} onChange={(e) => set(e.target.value)} />;
    return <Input key={k} label={label} value={JSON.stringify(v)} readOnly hint="Valeur complexe : non modifiable ici." />;
  };

  return (
    <Card>
      <CardHeader title={setting.key} description={setting.description}
        action={<Badge tone={setting.customized ? 'info' : 'neutre'}>{setting.customized ? 'Personnalisé' : 'Valeur par défaut'}</Badge>} />
      <form className="grid gap-4 p-5" onSubmit={(e) => { e.preventDefault(); mut.mutate(draft); }}>
        <FormError error={mut.error} />
        <div className="grid gap-4 sm:grid-cols-2">{Object.entries(draft).map(([k, v]) => field(k, v))}</div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-legende text-texte-secondaire">Modifié le {dateTime(setting.updated_at)}</p>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={isDefault || mut.isPending} onClick={() => { setDraft(setting.default); }}>Valeurs par défaut</Button>
            <Button type="submit" variant="primary" loading={mut.isPending} disabled={!dirty}>Enregistrer</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Parametres() {
  const q = useQuery({ queryKey: ['parametres'], queryFn: listParametres });
  const plans = useQuery({ queryKey: ['plans', 'actif'], queryFn: () => listPlans({ status: 'actif' }) });
  return (
    <QueryBoundary loading={q.isLoading} error={q.error} onRetry={() => q.refetch()}>
      <div className="grid gap-4">{q.data?.map((s) => <ParametreCard key={s.key} setting={s} plans={plans.data ?? []} />)}</div>
    </QueryBoundary>
  );
}

function Roles() {
  const q = useQuery({ queryKey: ['roles'], queryFn: listRoles });
  return (
    <QueryBoundary loading={q.isLoading} error={q.error} onRetry={() => q.refetch()}>
      <div className="grid gap-4 lg:grid-cols-2">
        {q.data?.roles.map((r) => (
          <Card key={r.code}>
            <CardHeader title={r.label} description={r.description ?? r.code} action={r.is_system ? <Badge tone="neutre">Système</Badge> : undefined} />
            <div className="flex flex-wrap gap-1.5 p-5">
              {r.permissions.map((p) => <code key={p} className="rounded-lg bg-surface-alt px-1.5 py-0.5 text-legende">{p}</code>)}
              {!r.permissions.length && <p className="text-petit text-texte-secondaire">Aucune permission.</p>}
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-legende text-texte-secondaire">Les rôles et permissions sont consultables ; l’API n’expose pas leur modification.</p>
    </QueryBoundary>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'params' | 'roles'>('params');
  return (
    <>
      <PageHeader title="Paramètres" description="Réglages globaux de la plateforme." />
      <div role="tablist" className="mb-5 flex gap-1 border-b border-bordure">
        {([['params', 'Paramètres'], ['roles', 'Rôles et permissions']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cx('-mb-px border-b-2 px-4 py-2.5 text-petit font-medium', tab === id ? 'border-primaire text-primaire' : 'border-transparent text-texte-secondaire hover:text-texte')}>{label}</button>
        ))}
      </div>
      {tab === 'params' ? <Parametres /> : <Roles />}
    </>
  );
}
