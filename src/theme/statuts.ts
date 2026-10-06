/**
 * Ton visuel de chaque statut renvoyé par l'API (charte § 5).
 * Les LIBELLÉS viennent de `GET /referentiels` ; ici seulement la couleur.
 * Un code inconnu s'affiche en « neutre ».
 *
 * Les familles `proprietaire`, `utilisateur`, `plan`, `paiementAbonnement` et
 * `modeleBail` n'existent pas dans la charte : les tons y sont déduits
 * des mêmes règles (succès = sain, danger = bloqué, neutre = inactif).
 */

export type TonStatut = 'succes' | 'avertissement' | 'danger' | 'info' | 'neutre';

export const TONS_DES_STATUTS = {
  echeance: { a_venir: 'neutre', a_payer: 'avertissement', partiellement_paye: 'avertissement', paye: 'succes', en_retard: 'danger', annule: 'neutre' },
  charge: { a_payer: 'avertissement', partiellement_paye: 'avertissement', paye: 'succes', en_retard: 'danger', annule: 'neutre' },
  bail: { brouillon: 'neutre', actif: 'succes', termine: 'neutre', clos: 'neutre', annule: 'neutre' },
  appartement: { disponible: 'info', occupe: 'succes', en_travaux: 'avertissement', indisponible: 'neutre' },
  incident: { signale: 'avertissement', en_analyse: 'info', travaux_planifies: 'info', resolu: 'succes', rejete: 'neutre' },
  travaux: { signale: 'avertissement', a_valider: 'avertissement', valide: 'info', artisan_assigne: 'info', en_cours: 'info', termine: 'succes', annule: 'neutre' },
  transaction: { initiee: 'neutre', en_attente: 'avertissement', confirmee: 'succes', a_rapprocher: 'avertissement', echouee: 'danger', annulee: 'neutre', remboursee: 'neutre' },
  paiement: { valide: 'succes', rembourse: 'neutre' },
  caution: { attendue: 'avertissement', partiellement_versee: 'avertissement', detenue: 'info', restitution_en_cours: 'avertissement', retenue_partielle: 'info', restituee: 'succes', litige: 'danger' },
  abonnement: { essai: 'info', actif: 'succes', expire: 'danger', suspendu: 'danger', annule: 'neutre' },
  etatDesLieux: { brouillon: 'neutre', soumis: 'avertissement', accepte: 'succes', conteste: 'danger', remplace: 'neutre' },
  priorite: { basse: 'neutre', normale: 'info', haute: 'avertissement', urgente: 'danger' },
  // Hors charte
  proprietaire: { actif: 'succes', suspendu: 'danger' },
  utilisateur: { actif: 'succes', inactif: 'neutre' },
  plan: { actif: 'succes', inactif: 'neutre' },
  paiementAbonnement: { initie: 'neutre', confirme: 'succes', echoue: 'danger', annule: 'neutre' },
  modeleBail: { brouillon: 'avertissement', publie: 'succes', archive: 'neutre' },
} as const satisfies Record<string, Record<string, TonStatut>>;

export type FamilleStatut = keyof typeof TONS_DES_STATUTS;

export function tonDe(famille: FamilleStatut, code: string | null | undefined): TonStatut {
  const tons = TONS_DES_STATUTS[famille] as Record<string, TonStatut>;
  return (code && tons[code]) || 'neutre';
}

/** Valeur calculée d'une variable de thème (pour les graphiques). */
export function couleurCalculee(nomVariable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--gi-${nomVariable}`).trim();
}
