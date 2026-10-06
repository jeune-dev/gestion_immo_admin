import { api, apiWithMessage, newIdempotencyKey, type Page } from './client';
import type {
  Abonnement, AuditEntry, Categorie, Dashboard, Diffusion, Immeuble, Locataire, LoyersStats, ModeleBail, ModeleWhatsapp,
  Notification, PaiementAbonnement, Parametre, Plan, Proprietaire, ProprietaireDetail, Referentiels, Role, Signalement,
  SignalementStats, Utilisateur,
} from './types';

export type Params = Record<string, string | number | boolean | undefined>;

/** Retire les filtres vides pour ne pas envoyer `?q=&status=` (rejeté par la validation). */
const clean = (p?: Params) => Object.fromEntries(Object.entries(p ?? {}).filter(([, v]) => v !== undefined && v !== ''));
const list = <T>(url: string, params?: Params) => api<Page<T>>({ method: 'GET', url, params: clean(params) });
const post = <T = unknown>(url: string, data: unknown = {}, headers?: Record<string, string>) =>
  apiWithMessage<T>({ method: 'POST', url, data, headers });

export const getReferentiels = () => api<Referentiels>({ method: 'GET', url: '/referentiels' });

export const getDashboard = () => api<{ dashboard: Dashboard }>({ method: 'GET', url: '/admin/dashboard' }).then((r) => r.dashboard);

// Propriétaires
export const listProprietaires = (p?: Params) => list<Proprietaire>('/admin/proprietaires', p);
export const getProprietaire = (id: string) => api<{ owner: ProprietaireDetail }>({ method: 'GET', url: `/admin/proprietaires/${id}` }).then((r) => r.owner);
export const suspendProprietaire = (id: string, reason: string) => post(`/admin/proprietaires/${id}/suspendre`, { reason });
export const reactivateProprietaire = (id: string) => post(`/admin/proprietaires/${id}/reactiver`);
export const activateAbonnement = (ownerId: string, body: { plan_code: string; months: number; note?: string; amount?: number }, idempotencyKey = newIdempotencyKey()) =>
  post(`/admin/proprietaires/${ownerId}/abonnement/activer`, body, { 'Idempotency-Key': idempotencyKey });

// Lecture seule
export const listLocataires = (p?: Params) => list<Locataire>('/admin/locataires', p);
export const listImmeubles = (p?: Params) => list<Immeuble>('/admin/immeubles', p);
export const listSignalements = (p?: Params) => list<Signalement>('/admin/signalements', p);
export const getSignalementStats = (p?: Params) => api<{ statistiques: SignalementStats }>({ method: 'GET', url: '/admin/signalements/statistiques', params: clean(p) }).then((r) => r.statistiques);

// Abonnements
export const listAbonnements = (p?: Params) => list<Abonnement>('/admin/abonnements', p);
export const suspendAbonnement = (id: string, reason: string) => post(`/admin/abonnements/${id}/suspendre`, { reason });
export const reactivateAbonnement = (id: string) => post(`/admin/abonnements/${id}/reactiver`);
export const cancelAbonnement = (id: string, reason?: string) => post(`/admin/abonnements/${id}/annuler`, reason ? { reason } : {});

// Paiements
export const listPaiements = (p?: Params) => list<PaiementAbonnement>('/admin/paiements', p);
export const getLoyersStats = (p?: Params) => api<{ statistiques: LoyersStats }>({ method: 'GET', url: '/admin/paiements/loyers/statistiques', params: clean(p) }).then((r) => r.statistiques);

// Utilisateurs
export const listUtilisateurs = (p?: Params) => list<Utilisateur>('/admin/utilisateurs', p);
export const createSuperAdmin = (body: { first_name: string; last_name: string; email: string; phone?: string; password: string; current_password: string }) =>
  post<{ user: Utilisateur }>('/admin/utilisateurs', body, { 'Idempotency-Key': newIdempotencyKey() });
export const deactivateUtilisateur = (id: string, reason: string) => post(`/admin/utilisateurs/${id}/desactiver`, { reason });
export const activateUtilisateur = (id: string) => post(`/admin/utilisateurs/${id}/activer`);
export const unlockUtilisateur = (id: string) => post(`/admin/utilisateurs/${id}/deverrouiller`);
export const resetAccess = (id: string, body: { current_password: string; reason: string }) =>
  post<{ user: Utilisateur; mot_de_passe_provisoire: string }>(`/admin/utilisateurs/${id}/reinitialiser-acces`, body);

// Paramètres
export const listParametres = () => api<{ settings: Parametre[] }>({ method: 'GET', url: '/admin/parametres' }).then((r) => r.settings);
export const updateParametre = (key: string, value: Record<string, unknown>) =>
  apiWithMessage<{ setting: Parametre }>({ method: 'PUT', url: `/admin/parametres/${encodeURIComponent(key)}`, data: value });

// Notifications
export const sendDiffusion = (body: { cible: string; titre: string; corps: string }) =>
  post<{ diffusion: unknown }>('/admin/notifications', body, { 'Idempotency-Key': newIdempotencyKey() });
export const listDiffusions = (p?: Params) => list<Diffusion>('/admin/notifications', p);

// Catégories
export const listCategories = (p?: Params) => api<{ categories: Categorie[] }>({ method: 'GET', url: '/admin/categories', params: clean(p) }).then((r) => r.categories);
export const createCategorie = (body: { code: string; name: string; cash_group: string; sort_order?: number }) => post('/admin/categories', body);
export const updateCategorie = (id: string, body: { name?: string; cash_group?: string; sort_order?: number }) =>
  apiWithMessage({ method: 'PATCH', url: `/admin/categories/${id}`, data: body });
export const setCategorieActive = (id: string, active: boolean) => post(`/admin/categories/${id}/${active ? 'activer' : 'desactiver'}`);
export const deleteCategorie = (id: string) => apiWithMessage<null>({ method: 'DELETE', url: `/admin/categories/${id}` });

// Audit, rôles
export const listAudit = (p?: Params) => list<AuditEntry>('/admin/journal-audit', p);
export const listRoles = () => api<{ roles: Role[]; catalogue: string[] }>({ method: 'GET', url: '/admin/roles' });

// Plans
export const listPlans = (p?: Params) => api<{ plans: Plan[] }>({ method: 'GET', url: '/admin/plans', params: clean(p) }).then((r) => r.plans);
export type PlanInput = Partial<Pick<Plan, 'name' | 'description' | 'price' | 'billing_period' | 'max_buildings' | 'max_apartments' | 'max_whatsapp_per_month' | 'features' | 'sort_order'>>;
export const createPlan = (body: PlanInput & { code: string; currency?: string; status?: string }) => post('/admin/plans', body);
export const updatePlan = (id: string, body: PlanInput) => apiWithMessage({ method: 'PATCH', url: `/admin/plans/${id}`, data: body });
export const setPlanActive = (id: string, active: boolean) => post(`/admin/plans/${id}/${active ? 'activer' : 'desactiver'}`);
export const deletePlan = (id: string) => apiWithMessage<null>({ method: 'DELETE', url: `/admin/plans/${id}` });

// Modèles
export const listModelesBail = (p?: Params) => api<{ templates: ModeleBail[] }>({ method: 'GET', url: '/admin/modeles-bail', params: clean(p) }).then((r) => r.templates);
export const getModeleBail = (id: string) => api<{ template: ModeleBail }>({ method: 'GET', url: `/admin/modeles-bail/${id}` }).then((r) => r.template);
export const getVariablesBail = () => api<{ variables: string[] }>({ method: 'GET', url: '/admin/modeles-bail/variables' }).then((r) => r.variables);
export const createModeleBail = (body: { lease_type: string; title: string; body: string; legal_notes?: string | null }) => post('/admin/modeles-bail', body);
export const updateModeleBail = (id: string, body: { title?: string; body?: string; legal_notes?: string | null }) =>
  apiWithMessage({ method: 'PATCH', url: `/admin/modeles-bail/${id}`, data: body });
export const publishModeleBail = (id: string) => post(`/admin/modeles-bail/${id}/publier`);
export const archiveModeleBail = (id: string) => post(`/admin/modeles-bail/${id}/archiver`);
export const listModelesWhatsapp = () => api<{ templates: ModeleWhatsapp[] }>({ method: 'GET', url: '/admin/modeles-whatsapp' }).then((r) => r.templates);
export const updateModeleWhatsapp = (id: string, body: Partial<Pick<ModeleWhatsapp, 'meta_template_name' | 'language_code' | 'body_preview' | 'variables' | 'is_active'>>) =>
  apiWithMessage({ method: 'PATCH', url: `/admin/modeles-whatsapp/${id}`, data: body });

// Notifications de l'administrateur connecté
export const listNotifications = (p?: Params) => list<Notification>('/notifications', p);
export const getUnreadCount = () => api<{ non_lues: number }>({ method: 'GET', url: '/notifications/compteur' }).then((r) => r.non_lues);
export const markNotificationRead = (id: string) => post(`/notifications/${id}/lue`);
export const markAllNotificationsRead = () => post('/notifications/tout-lire');
