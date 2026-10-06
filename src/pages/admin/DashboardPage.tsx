import { useQuery } from '@tanstack/react-query';
import { Banknote, Building2, DoorOpen, Home, LifeBuoy, TrendingUp, Users, UsersRound, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ReactNode } from 'react';
import { getDashboard, getLoyersStats, getSignalementStats } from '@/api/admin';
import { Card, CardHeader, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { StatCard } from '@/components/ui/StatCard';
import { useReferentiels } from '@/hooks/useReferentiels';
import { date, fcfa, monthLabel, nombre } from '@/lib/format';

const SERIES = ['var(--gi-primaire)', 'var(--gi-secondaire)', 'var(--gi-succes)', 'var(--gi-info)', 'var(--gi-avertissement)', 'var(--gi-danger)', 'var(--gi-neutre)'];
const AXIS = { fontSize: 12, fill: 'var(--gi-texte-secondaire)' };

const tooltipStyle = {
  contentStyle: { background: 'var(--gi-surface)', border: '1px solid var(--gi-bordure)', borderRadius: 8, color: 'var(--gi-texte)', fontSize: 13 },
  cursor: { fill: 'var(--gi-surface-alt)' },
};

function ChartCard({ title, description, loading, error, onRetry, empty, children }: {
  title: string; description?: string; loading: boolean; error: unknown; onRetry: () => void; empty?: boolean; children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="p-5">
        {loading ? <Skeleton className="h-64" /> : error ? <ErrorState error={error} onRetry={onRetry} />
          : empty ? <EmptyState title="Aucune donnée" description="Rien à afficher pour la période." />
          : <div className="h-64">{children}</div>}
      </div>
    </Card>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex h-full items-center gap-4">
      <ResponsiveContainer width="55%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="var(--gi-surface)">
            {data.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5 text-petit">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} /><span className="truncate">{d.name}</span></span>
            <span className="gi-montant text-texte-secondaire">{nombre(d.value)} <span className="text-texte-discret">({total ? Math.round((d.value / total) * 100) : 0} %)</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimpleBars({ data, horizontal, money }: { data: { name: string; value: number }[]; horizontal?: boolean; money?: boolean }) {
  const fmt = (v: number) => (money ? fcfa(v) : nombre(v));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 8 : 0, right: 12 }}>
        <CartesianGrid stroke="var(--gi-bordure)" strokeDasharray="3 3" horizontal={!horizontal} vertical={!!horizontal} />
        {horizontal
          ? (<><XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => (money ? compact(v) : String(v))} /><YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={110} /></>)
          : (<><XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} /><YAxis tick={AXIS} tickLine={false} axisLine={false} width={money ? 56 : 36} tickFormatter={(v) => (money ? compact(v) : String(v))} /></>)}
        <Tooltip {...tooltipStyle} formatter={(v) => fmt(Number(v))} />
        <Bar dataKey="value" fill="var(--gi-primaire)" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const compact = (v: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export default function DashboardPage() {
  const { label } = useReferentiels();
  const dash = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const loyers = useQuery({ queryKey: ['loyers-stats'], queryFn: () => getLoyersStats() });
  const incidents = useQuery({ queryKey: ['signalements-stats'], queryFn: () => getSignalementStats() });
  const d = dash.data;

  const collectedPct = d && d.rent.due > 0 ? Math.round((d.rent.collected / d.rent.due) * 100) : null;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={d ? `Mois en cours : du ${date(d.period.start)} au ${date(d.period.end)} · données de ${date(d.generated_at)}` : 'Vue d’ensemble de la plateforme'}
      />

      {dash.isError ? <Card><ErrorState error={dash.error} onRetry={() => dash.refetch()} /></Card> : (
        <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard loading={dash.isLoading} icon={UsersRound} label="Propriétaires" value={nombre(d?.owners.total)} hint={`${nombre(d?.owners.suspended)} suspendu(s)`} />
          <StatCard loading={dash.isLoading} icon={Users} label="Locataires" value={nombre(d?.tenants)} />
          <StatCard loading={dash.isLoading} icon={Building2} label="Immeubles" value={nombre(d?.buildings)} />
          <StatCard loading={dash.isLoading} icon={Home} label="Appartements" value={nombre(d?.apartments.total)} hint={d && `${nombre(d.apartments.occupied)} occupés · ${nombre(d.apartments.available)} disponibles · ${d.apartments.occupancy_rate} %`} />
          <StatCard loading={dash.isLoading} icon={Banknote} label="Loyers dus" value={nombre(d?.rent.due)} unit="FCFA" />
          <StatCard loading={dash.isLoading} icon={Wallet} label="Loyers encaissés" value={nombre(d?.rent.collected)} unit="FCFA" hint={collectedPct != null ? `${collectedPct} % des loyers dus` : undefined} />
          <StatCard loading={dash.isLoading} icon={DoorOpen} label="Paiements du mois" value={nombre(d?.payments.amount)} unit="FCFA" hint={d && `${nombre(d.payments.count)} paiement(s)`} />
          <StatCard loading={dash.isLoading} icon={TrendingUp} accent label="Revenu mensuel récurrent" value={nombre(d?.subscriptions.mrr)} unit="FCFA" hint="Abonnements actifs" />
        </section>
      )}

      <section aria-label="Graphiques" className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Loyers encaissés par mois" description={loyers.data && `Du ${date(loyers.data.period.start)} au ${date(loyers.data.period.end)}`}
          loading={loyers.isLoading} error={loyers.error} onRetry={() => loyers.refetch()} empty={!loyers.data?.rent_payments.by_month.length}>
          <SimpleBars money data={(loyers.data?.rent_payments.by_month ?? []).map((m) => ({ name: monthLabel(m.month), value: m.amount }))} />
        </ChartCard>

        <ChartCard title="Abonnements par statut" loading={dash.isLoading} error={dash.error} onRetry={() => dash.refetch()} empty={!Object.keys(d?.subscriptions.by_status ?? {}).length}>
          <Donut data={Object.entries(d?.subscriptions.by_status ?? {}).map(([k, v]) => ({ name: label('statut_abonnement', k), value: v }))} />
        </ChartCard>

        <ChartCard title="Abonnements par plan" loading={dash.isLoading} error={dash.error} onRetry={() => dash.refetch()} empty={!d?.subscriptions.by_plan.length}>
          <SimpleBars horizontal data={(d?.subscriptions.by_plan ?? []).map((p) => ({ name: p.name, value: p.count }))} />
        </ChartCard>

        <ChartCard title="Paiements par mode" description="Mois en cours" loading={dash.isLoading} error={dash.error} onRetry={() => dash.refetch()} empty={!d?.payments.by_method.length}>
          <SimpleBars money data={(d?.payments.by_method ?? []).map((m) => ({ name: label('mode_paiement', m.method), value: m.amount }))} />
        </ChartCard>

        <ChartCard title="Signalements par statut" description={incidents.data && `${nombre(incidents.data.total)} au total`}
          loading={incidents.isLoading} error={incidents.error} onRetry={() => incidents.refetch()} empty={!incidents.data?.total}>
          <Donut data={Object.entries(incidents.data?.by_status ?? {}).map(([k, v]) => ({ name: label('statut_incident', k), value: v }))} />
        </ChartCard>

        <ChartCard title="Signalements par catégorie" loading={incidents.isLoading} error={incidents.error} onRetry={() => incidents.refetch()} empty={!incidents.data?.total}>
          <SimpleBars horizontal data={Object.entries(incidents.data?.by_category ?? {}).map(([k, v]) => ({ name: label('categorie_incident', k), value: v }))} />
        </ChartCard>
      </section>

      <p className="mt-4 flex items-center gap-2 text-legende text-texte-secondaire"><LifeBuoy className="size-3.5" aria-hidden /> Les statistiques de signalements couvrent toute la période (sans filtre).</p>
    </>
  );
}
