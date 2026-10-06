import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

/** Erreur normalisée : l'interface se branche sur `code`, jamais sur `message`. */
export class ApiError extends Error {
  status: number;
  code: string;
  details: string[];
  requestId?: string;
  retryAfter?: number;

  constructor(init: { status: number; code: string; message: string; details?: string[]; requestId?: string; retryAfter?: number }) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? [];
    this.requestId = init.requestId;
    this.retryAfter = init.retryAfter;
  }
}

export interface Envelope<T> { success: boolean; message: string; data: T }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface Page<T> { items: T[]; pagination: Pagination }

export interface SessionUser {
  id: string;
  role?: string;
  role_code?: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone?: string | null;
  status: string;
  must_change_password?: boolean;
  mfa_active?: boolean;
  mfa_a_configurer?: boolean;
  totp_enabled_at?: string | null;
}

export interface TokenPayload { access_token: string; user?: SessionUser }

let accessToken: string | null = null;
let refreshing: Promise<TokenPayload | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => { accessToken = token; },
};
export const setSessionExpiredHandler = (fn: (() => void) | null) => { onSessionExpired = fn; };

export const http = axios.create({ baseURL: BASE_URL, withCredentials: true, timeout: 30_000 });

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
});

const MESSAGES_PAR_DEFAUT: Record<number, string> = {
  400: 'La requête est invalide.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  402: 'Abonnement requis : l’espace est en lecture seule.',
  403: 'Accès refusé.',
  404: 'Élément introuvable.',
  409: 'Cette action est impossible dans l’état actuel.',
  413: 'Le fichier ou la requête est trop volumineux.',
  422: 'Certaines données sont invalides.',
  429: 'Trop de requêtes. Veuillez patienter quelques instants.',
  500: 'Une erreur interne est survenue. Veuillez réessayer.',
  503: 'Service momentanément indisponible. Veuillez réessayer.',
};

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ message?: string; error?: { code?: string; message?: string; details?: unknown }; requestId?: string }>;
    if (!e.response) {
      const timeout = e.code === 'ECONNABORTED';
      return new ApiError({
        status: 0,
        code: timeout ? 'DELAI_DEPASSE' : 'ERREUR_RESEAU',
        message: timeout ? 'Le serveur met trop de temps à répondre. Veuillez réessayer.' : 'Impossible de joindre le serveur. Vérifiez votre connexion.',
      });
    }
    const { status, data, headers } = e.response;
    const details = Array.isArray(data?.error?.details) ? (data.error!.details as unknown[]).map(String) : [];
    const retry = Number(headers?.['retry-after']);
    return new ApiError({
      status,
      code: data?.error?.code ?? `HTTP_${status}`,
      message: data?.error?.message ?? data?.message ?? MESSAGES_PAR_DEFAUT[status] ?? 'Une erreur est survenue.',
      details,
      requestId: data?.requestId ?? (headers?.['x-request-id'] as string | undefined),
      retryAfter: Number.isFinite(retry) ? retry : undefined,
    });
  }
  return new ApiError({ status: 0, code: 'ERREUR_INCONNUE', message: 'Une erreur inattendue est survenue.' });
}

/** Une seule requête de rafraîchissement en vol (le refresh token tourne à chaque usage). */
export function refreshSession(): Promise<TokenPayload | null> {
  if (!refreshing) {
    refreshing = http
      .post<Envelope<TokenPayload>>('/auth/refresh', undefined, { skipAuthRetry: true } as AxiosRequestConfig)
      .then((r) => { accessToken = r.data.data.access_token; return r.data.data; })
      .catch(() => { accessToken = null; return null; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

declare module 'axios' {
  interface AxiosRequestConfig { skipAuthRetry?: boolean }
}

http.interceptors.response.use(
  (r) => r,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config && !error.config.skipAuthRetry
      && (error.response.data as { error?: { code?: string } })?.error?.code !== 'IDENTIFIANTS_INVALIDES') {
      const cfg = error.config;
      cfg.skipAuthRetry = true;
      const session = await refreshSession();
      if (session) return http(cfg);
      onSessionExpired?.();
    }
    return Promise.reject(toApiError(error));
  },
);

/** Appel typé : renvoie directement `data` de l'enveloppe. */
export async function api<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await http.request<Envelope<T>>(config);
  return res.data.data;
}

/** Variante qui conserve aussi le message de succès (à afficher tel quel). */
export async function apiWithMessage<T>(config: AxiosRequestConfig): Promise<{ data: T; message: string }> {
  const res = await http.request<Envelope<T>>(config);
  return { data: res.data.data, message: res.data.message };
}

export const newIdempotencyKey = () => crypto.randomUUID();
