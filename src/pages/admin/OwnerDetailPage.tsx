import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProprietaire, reactivateProprietaire, suspendProprietaire } from '@/api/admin';
import { ActivateSubscriptionModal } from '@/components/owners/ActivateSubscriptionModal';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, DefList, PageHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QueryBoundary } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useReferentiels } from '@/hooks/useReferentiels';
import { date, dateTime, fcfa, fullName, nombre } from '@/lib/format';

export default function OwnerDetailPage() {
  const { id = '' } = useParams();
  const { label } = useReferentiels();
  const q = useQuery({ queryKey: ['proprietaire', id], queryFn: () => getProprietaire(id) });
  const o = q.data;

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const refresh = { invalidate: ['proprietaire', 'proprietaires', 'dashboard'], silentError: true } as const;
  const suspend = useAction((reason: string) => suspendProprietaire(id, reason), { ...refresh, onSuccess: () => setSuspendOpen(false) });
  const reactivate = useAction(() => reactivateProprietaire(id), { invalidate: ['proprietaire', 'proprietaires', 'dashboard'] });

  return (
    <>
      <Link to="/proprietaires" className="mb-3 inline-flex items-center gap-1 text-petit text-texte-secondaire hover:text-texte"><ArrowLeft className="size-4" /> Propriétaires</Link>
      <QueryBoundary loading={q.isLoading} error={q.error} onRetry={() => q.refetch()}>
        {o && (
          <>
            <PageHeader
              title={o.display_name}
              description={o.company_name ?? undefined}
              actions={
                <>
                  <StatusBadge famille="proprietaire" enumName="statut_proprietaire" code={o.status} />
                  <Button variant="accent" onClick={() => setActivateOpen(true)}>Activer un abonnement</Button>
                  {o.status === 'suspendu'
                    ? <Button variant="outline" loading={reactivate.isPending} onClick={() => reactivate.mutate()}>Réactiver</Button>
                    : <Button variant="outline" onClick={() => setSuspendOpen(true)}>Suspendre</Button>}
                </>
              }
            />

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader title="Informations" />
                <DefList items={[
                  { label: 'E-mail', value: o.email }, { label: 'Téléphone', value: o.phone },
                  { label: 'Adresse', value: [o.address, o.city].filter(Boolean).join(', ') || '—' },
                  { label: 'Pays / devise', value: `${o.country} · ${o.currency}` },
                  { label: 'Inscrit le', value: dateTime(o.created_at) },
                  { label: 'Réglages personnalisés', value: o.settings_customized ? 'Oui' : 'Non' },
                ]} />
              </Card>

              <Card>
                <CardHeader title="Activité" />
                <DefList items={[
                  { label: 'Immeubles', value: nombre(o.buildings_count) }, { label: 'Appartements', value: nombre(o.apartments_count) },
                  { label: 'Occupés', value: nombre(o.activity.apartments_occupied) }, { label: 'Locataires', value: nombre(o.tenants_count) },
                  { label: 'Baux actifs', value: nombre(o.activity.active_leases) }, { label: 'Incidents ouverts', value: nombre(o.activity.open_incidents) },
                ]} />
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader title="Abonnement" />
                {o.subscription ? (
                  <DefList items={[
                    { label: 'Plan', value: `${o.subscription.plan.name} — ${fcfa(o.subscription.plan.price)} / ${label('periode_facturation', o.subscription.plan.billing_period).toLowerCase()}` },
                    { label: 'Statut', value: <StatusBadge famille="abonnement" enumName="statut_abonnement" code={o.subscription.status} /> },
                    { label: 'Période en cours', value: `${date(o.subscription.current_period_start)} → ${date(o.subscription.current_period_end)}` },
                    { label: 'Fin d’essai', value: date(o.subscription.trial_ends_at) },
                    ...(o.subscription.suspended_reason ? [{ label: 'Motif de suspension', value: o.subscription.suspended_reason }] : []),
                  ]} />
                ) : <p className="px-5 py-6 text-petit text-texte-secondaire">Aucun abonnement.</p>}
              </Card>

              <Card>
                <CardHeader title="Titulaire et membres" />
                <ul className="divide-y divide-bordure">
                  {o.members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 px-5 py-3 text-petit">
                      <div>
                        <p className="font-medium">{fullName(m.user)}</p>
                        <p className="text-legende text-texte-secondaire">{label('roles', m.role_code)}</p>
                      </div>
                      <StatusBadge famille="utilisateur" enumName="statut_utilisateur" code={m.user.status} />
                    </li>
                  ))}
                  {!o.members.length && <li className="px-5 py-6 text-petit text-texte-secondaire">Aucun membre.</li>}
                </ul>
                {o.titulaire && <p className="border-t border-bordure px-5 py-3 text-legende text-texte-secondaire">Dernière connexion : {dateTime(o.titulaire.last_login_at)}</p>}
              </Card>
            </div>

            <ConfirmDialog
              open={suspendOpen} onClose={() => { setSuspendOpen(false); suspend.reset(); }} danger title="Suspendre cet espace propriétaire ?"
              message="Le propriétaire perdra l’accès à son espace jusqu’à sa réactivation." confirmLabel="Suspendre"
              reason={{ minLength: 3 }} loading={suspend.isPending} error={suspend.error} onConfirm={(r) => suspend.mutate(r ?? '')}
            />
            {activateOpen && <ActivateSubscriptionModal open ownerId={o.id} ownerName={o.display_name} onClose={() => setActivateOpen(false)} />}
          </>
        )}
      </QueryBoundary>
    </>
  );
}
