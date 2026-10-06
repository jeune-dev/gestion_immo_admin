import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { activateAbonnement, listPlans } from '@/api/admin';
import { newIdempotencyKey } from '@/api/client';
import { FormModal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { useAction } from '@/hooks/useAction';
import { fcfa } from '@/lib/format';

/**
 * Activation manuelle d'un abonnement (virement, espèces…). La clé d'idempotence est
 * créée à l'ouverture et réutilisée à chaque nouvelle tentative : un double clic ou un
 * réessai après coupure réseau ne facture pas deux fois.
 */
export function ActivateSubscriptionModal({ ownerId, ownerName, open, onClose }: { ownerId: string; ownerName: string; open: boolean; onClose: () => void }) {
  const plans = useQuery({ queryKey: ['plans', 'actif'], queryFn: () => listPlans({ status: 'actif' }), enabled: open });
  const [planCode, setPlanCode] = useState('');
  const [months, setMonths] = useState('1');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [key, setKey] = useState(newIdempotencyKey);

  useEffect(() => {
    if (open) { setPlanCode(''); setMonths('1'); setAmount(''); setNote(''); setKey(newIdempotencyKey()); }
  }, [open]);

  const mutation = useAction(
    () => activateAbonnement(ownerId, {
      plan_code: planCode, months: Number(months),
      ...(amount !== '' && { amount: Number(amount) }), ...(note.trim() && { note: note.trim() }),
    }, key),
    { invalidate: ['proprietaires', 'proprietaire', 'abonnements', 'paiements', 'dashboard'], silentError: true, onSuccess: onClose },
  );

  const plan = plans.data?.find((p) => p.code === planCode);
  const m = Number(months);
  const invalid = !planCode || !Number.isInteger(m) || m < 1 || m > 24;

  return (
    <FormModal
      open={open} onClose={onClose} title="Activer un abonnement" description={`Propriétaire : ${ownerName}`}
      submitLabel="Activer" loading={mutation.isPending} error={mutation.error} disabled={invalid} onSubmit={() => mutation.mutate(undefined)}
    >
      <Select label="Plan" value={planCode} onChange={(e) => setPlanCode(e.target.value)} required>
        <option value="">Choisir un plan…</option>
        {plans.data?.map((p) => <option key={p.code} value={p.code}>{p.name} — {fcfa(p.price)} / {p.billing_period === 'annuel' ? 'an' : 'mois'}</option>)}
      </Select>
      <Input label="Durée (mois)" type="number" min={1} max={24} value={months} onChange={(e) => setMonths(e.target.value)} hint="Entre 1 et 24 mois." required />
      <Input
        label="Montant encaissé (FCFA)" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)}
        hint={plan ? `Laissez vide pour le tarif du plan (${fcfa(plan.price * (Number(months) || 1))}).` : 'Facultatif : le tarif du plan est appliqué par défaut.'}
      />
      <Textarea label="Note" rows={2} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} hint="Ex. : virement reçu le 27/09." />
    </FormModal>
  );
}
