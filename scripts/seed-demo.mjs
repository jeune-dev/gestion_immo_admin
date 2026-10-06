#!/usr/bin/env node
/**
 * Peuple une base de DÉVELOPPEMENT avec des données de démonstration, uniquement
 * via l'API (comme le ferait l'application mobile) : propriétaires, immeubles,
 * appartements, locataires, baux activés et quelques encaissements.
 *
 *   node scripts/seed-demo.mjs [--proprietaires 6] [--depart 1] [--api http://localhost:3000/api/v1]
 *   --depart : numéro du premier compte demo.proprio<N> (pour reprendre après un échec ou ajouter des comptes)
 *
 * Les comptes créés sont des comptes de TEST (e-mails demo.proprio<N>@test.sn).
 * Mot de passe : variable d'environnement DEMO_PASSWORD, ou valeur par défaut ci-dessous.
 * À ne JAMAIS lancer contre une base de production.
 *
 * Limite : la route d'inscription est limitée à AUTH_RATE_LIMIT_MAX essais / 15 min
 * (10 par défaut côté backend). Au-delà, le script s'arrête proprement : relancez-le
 * plus tard ou augmentez cette variable dans le .env du backend de développement.
 */
import { randomUUID } from 'node:crypto';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};

const API = (arg('api', process.env.VITE_API_URL || 'http://localhost:3000/api/v1')).replace(/\/$/, '');
const COUNT = Math.max(1, Number(arg('proprietaires', 6)));
const START = Math.max(1, Number(arg('depart', 1)));
const PASSWORD = process.env.DEMO_PASSWORD || 'DemoProprio-2026';

if (/^https:\/\//.test(API) && !/localhost|127\.0\.0\.1/.test(API)) {
  console.error(`Refus : ${API} ne ressemble pas à un environnement local. Ce script est réservé au développement.`);
  process.exit(1);
}

const PRENOMS = ['Fatou', 'Moussa', 'Aïssatou', 'Cheikh', 'Mariama', 'Ibrahima', 'Awa', 'Ousmane', 'Khady', 'Mamadou'];
const NOMS = ['Ndiaye', 'Diop', 'Fall', 'Sow', 'Ba', 'Sarr', 'Gueye', 'Diallo', 'Faye', 'Thiam'];
const VILLES = [['Dakar', 'Plateau'], ['Dakar', 'Mermoz'], ['Dakar', 'Almadies'], ['Thiès', 'Cité Sonatel'], ['Saint-Louis', 'Sor'], ['Mbour', 'Saly']];
const TYPES = ['studio', 'f1', 'f2', 'f3', 'f4', 'chambre'];
const MODES = ['especes', 'wave', 'orange_money', 'virement'];

class ApiError extends Error {
  constructor(status, body, where) {
    super(`${where} → ${status} ${body?.error?.code ?? ''} ${body?.message ?? ''} ${(body?.error?.details ?? []).join(' · ')}`.trim());
    this.status = status;
    this.code = body?.error?.code;
  }
}

async function call(method, path, { token, body, idempotent } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(idempotent && { 'Idempotency-Key': randomUUID() }),
    },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => { throw new Error(`API injoignable sur ${API}. Le backend est-il démarré ?`); });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json, `${method} ${path}`);
  return json.data;
}

const pick = (list, i) => list[i % list.length];
const pad = (n, w = 2) => String(n).padStart(w, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthsAgo = (n) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n); return d; };

async function seedOwner(i) {
  const email = `demo.proprio${i}@test.sn`;
  const first = pick(PRENOMS, i);
  const last = pick(NOMS, i + 3);

  let session;
  try {
    session = await call('POST', '/auth/inscription', {
      body: {
        first_name: first, last_name: last, email,
        phone: `+22177${pad(5000000 + i, 7)}`,
        password: PASSWORD, password_confirmation: PASSWORD,
        company_name: i % 2 ? `${last} Immobilier` : null, city: pick(VILLES, i)[0],
      },
    });
  } catch (err) {
    if (err.status === 409) { console.log(`  · ${email} existe déjà : ignoré`); return null; }
    throw err;
  }
  const token = session.access_token;
  console.log(`  ✓ ${first} ${last} (${email})`);

  // Par défaut l'API exige un état des lieux d'entrée avant d'activer un bail : on l'assouplit pour la démo.
  await call('PATCH', '/parametres', { token, body: { entry_inspection_policy: 'desactive' } });

  const buildingCount = 1 + (i % 3);
  let leases = 0;
  let payments = 0;

  for (let b = 0; b < buildingCount; b += 1) {
    const [city, district] = pick(VILLES, i + b);
    const building = (await call('POST', '/immeubles', {
      token, body: { name: `Résidence ${pick(NOMS, i + b + 5)} ${b + 1}`, address: `${10 + b * 7} rue ${pick(NOMS, b + i)}`, district, city, floors_count: 3 + b },
    })).building;

    const aptCount = 3 + ((i + b) % 3);
    for (let a = 0; a < aptCount; a += 1) {
      const rent = 60000 + ((i * 7 + b * 3 + a) % 9) * 40000;
      const apartment = (await call('POST', '/appartements', {
        token, body: { building_id: building.id, number: `${b + 1}0${a + 1}`, floor: a, type: pick(TYPES, a + i), rent_amount: rent, charges_amount: 10000 + (a % 3) * 5000 },
      })).apartment;

      // Le dernier appartement de chaque immeuble reste libre (« disponible »).
      if (a === aptCount - 1) continue;

      const tenant = (await call('POST', '/locataires', {
        token, idempotent: true,
        body: { first_name: pick(PRENOMS, a + b + i + 4), last_name: pick(NOMS, a + i + 7), phone: `+22178${pad(i * 1000 + b * 100 + a + 1, 7)}`, whatsapp_consent: a % 2 === 0 },
      })).tenant;

      const lease = (await call('POST', '/baux', {
        token, idempotent: true,
        body: {
          apartment_id: apartment.id, tenant_id: tenant.id, lease_type: 'habitation', start_date: isoDate(monthsAgo(1 + ((a + i) % 5))),
          rent_amount: rent, charges_amount: 10000 + (a % 3) * 5000, deposit_amount: rent * 2, periodicity: 'mensuel', due_day: 5,
        },
      })).lease;
      await call('POST', `/baux/${lease.id}/activer`, { token });
      leases += 1;

      // Encaisse une partie des échéances déjà exigibles (les autres restent « à payer » / « en retard »).
      const due = await call('GET', `/echeances?lease_id=${lease.id}&limit=50`, { token });
      const payable = (due.items ?? []).filter((e) => ['a_payer', 'en_retard'].includes(e.status));
      const toPay = (a + i) % 3 === 0 ? 0 : Math.ceil(payable.length / 2);
      for (const echeance of payable.slice(0, toPay)) {
        await call('POST', '/paiements/especes', {
          token, idempotent: true,
          body: { lease_id: lease.id, rent_schedule_id: echeance.id, amount: echeance.amount_due, method: pick(MODES, a + i), paid_on: isoDate(new Date()) },
        });
        payments += 1;
      }
    }
  }
  console.log(`    ${buildingCount} immeuble(s), ${leases} bail(aux) actif(s), ${payments} encaissement(s)`);
  return { email };
}

console.log(`Peuplement de ${API} avec ${COUNT} propriétaire(s)…`);
let created = 0;
for (let i = START; i < START + COUNT; i += 1) {
  try {
    if (await seedOwner(i)) created += 1;
  } catch (err) {
    if (err.status === 429) {
      console.error(`\n✗ Limite de requêtes atteinte (${err.message}).`);
      console.error('  Relancez dans 15 minutes, ou augmentez AUTH_RATE_LIMIT_MAX dans le .env du backend de développement.');
      break;
    }
    console.error(`\n✗ Échec pour le propriétaire n°${i} : ${err.message}`);
    process.exitCode = 1;
    break;
  }
}
console.log(`\nTerminé : ${created} nouveau(x) propriétaire(s). Mot de passe des comptes : variable DEMO_PASSWORD (défaut dans le script).`);
