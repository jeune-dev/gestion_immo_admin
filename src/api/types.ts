/** Types de réponse, alignés sur CONTRAT-API-ADMIN.md (champs en snake_case). */

export interface OwnerRef { id: string; display_name: string; status?: string }
export interface PlanRef { id?: string; code: string; name: string; price?: number; billing_period?: string }

export interface Titulaire {
  id: string; first_name: string; last_name: string; email: string | null; phone: string | null;
  status: string; last_login_at: string | null; created_at: string;
}

export interface Proprietaire {
  id: string; user_id: string; display_name: string; company_name: string | null;
  phone: string | null; email: string | null; address: string | null; city: string | null;
  country: string; currency: string; status: string; created_at: string;
  buildings_count: number; apartments_count: number; tenants_count: number;
  subscription_status: string | null; plan_code: string | null; current_period_end: string | null;
  titulaire?: Titulaire;
}

export interface Abonnement {
  id: string; owner_id: string; plan_id: string; status: string; started_at: string;
  current_period_start: string; current_period_end: string; trial_ends_at: string | null;
  cancelled_at: string | null; suspended_reason: string | null; created_at: string;
  plan?: PlanRef; owner?: OwnerRef;
}

export interface ProprietaireDetail extends Proprietaire {
  settings_customized: boolean;
  subscription: (Abonnement & { plan: PlanRef }) | null;
  members: { id: string; role_code: string; status: string; created_at: string; user: { id: string; first_name: string; last_name: string; status: string } }[];
  activity: { apartments_occupied: number; active_leases: number; open_incidents: number };
}

export interface Locataire {
  id: string; owner_id: string; first_name: string; last_name: string; phone: string | null;
  whatsapp_consent: boolean; created_at: string; has_account: boolean; active_leases: number; owner?: OwnerRef;
}

export interface Immeuble {
  id: string; owner_id: string; name: string; address: string | null; district: string | null; city: string | null;
  floors_count: number | null; declared_apartments_count: number | null; created_at: string;
  apartments_count: number; occupied_count: number; available_count: number; owner?: OwnerRef;
}

export interface Signalement {
  id: string; owner_id: string; reference: string; category: string; title: string; status: string; created_at: string;
  owner_name?: string; building?: { id?: string; name?: string } | null; apartment?: { id?: string; label?: string; name?: string; number?: string } | null;
}

export interface SignalementStats {
  total: number; by_status: Record<string, number>; by_category: Record<string, number>;
}

export interface PaiementAbonnement {
  id: string; owner_id: string; amount: number; currency: string; months: number; provider: string;
  reference: string; status: string; paid_at: string | null; note: string | null; created_at: string;
  plan?: PlanRef; owner?: OwnerRef;
}

export interface LoyersStats {
  period: { start: string; end: string };
  rent_payments: {
    by_month: { month: string; count: number; amount: number; by_method: Record<string, { count: number; amount: number }> }[];
    by_method: Record<string, { count: number; amount: number }>;
  };
  transactions: { status: string; provider: string; count: number; amount: number }[];
}

export interface Dashboard {
  period: { start: string; end: string };
  owners: { total: number; suspended: number };
  tenants: number;
  buildings: number;
  apartments: { total: number; occupied: number; available: number; occupancy_rate: number };
  rent: { due: number; collected: number };
  payments: { count: number; amount: number; by_method: { method: string; count: number; amount: number }[] };
  subscriptions: { by_status: Record<string, number>; by_plan: { code: string; name: string; count: number }[]; mrr: number };
  generated_at: string;
}

export interface Utilisateur {
  id: string; role_code: string; first_name: string; last_name: string; email: string | null; phone: string | null;
  status: string; email_verified_at: string | null; must_change_password: boolean; last_login_at: string | null;
  language: string; created_at: string; totp_enabled_at: string | null; is_locked?: boolean;
}

export interface Plan {
  id: string; code: string; name: string; description: string | null; price: number; currency: string;
  billing_period: 'mensuel' | 'annuel'; max_buildings: number | null; max_apartments: number | null;
  max_whatsapp_per_month: number | null; features: string[]; status: 'actif' | 'inactif'; sort_order: number;
  subscribers_count?: number;
}

export interface Categorie {
  id: string; owner_id: string | null; code: string; name: string; cash_group: string; is_active: boolean;
  sort_order: number; expenses_count?: number;
}

export interface ModeleBail {
  id: string; lease_type: string; version: number; title: string; status: 'brouillon' | 'publie' | 'archive';
  legal_notes: string | null; published_at: string | null; created_at: string; updated_at: string; body?: string;
}

export interface ModeleWhatsapp {
  id: string; event_code: string; meta_template_name: string; language_code: string; body_preview: string;
  variables: string[]; is_active: boolean; updated_at: string;
}

export interface Parametre {
  key: string; value: Record<string, unknown>; default: Record<string, unknown>; customized: boolean;
  description: string; updated_at: string;
}

export interface Diffusion { id: number; user_id: string; details: { cible: string; titre: string; corps: string; destinataires: number }; created_at: string }

export interface AuditEntry {
  id: number | string; user_id: string | null; owner_id: string | null; actor_role: string | null; action: string;
  entity_type: string | null; entity_id: string | null; details: unknown; ip: string | null; request_id: string | null; created_at: string;
}

export interface Role { code: string; label: string; description: string | null; permissions: string[]; is_system: boolean }

export interface Notification {
  id: string; type: string; title: string; body: string; data: Record<string, unknown> | null; read_at: string | null; created_at: string;
}

export interface SessionAppareil {
  id: string; device_name: string | null; platform: string | null; ip: string | null; last_used_at: string; created_at: string; expires_at: string; current: boolean;
}

export interface Referentiels {
  enumerations: Record<string, { code: string; label: string }[]>;
  correspondances: Record<string, Record<string, unknown>>;
}
