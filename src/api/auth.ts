import { api, apiWithMessage, http, type SessionUser, type TokenPayload } from './client';
import type { SessionAppareil } from './types';

const noRetry = { skipAuthRetry: true } as const;

export type LoginResult =
  | { mfa_requis: true; mfa_token: string; expires_in: number }
  | ({ mfa_requis?: false } & TokenPayload & { user: SessionUser });

export const login = (identifiant: string, password: string) =>
  api<LoginResult>({ method: 'POST', url: '/auth/connexion', data: { identifiant, password, platform: 'web', device_name: 'Back-office web' }, ...noRetry });

export const verifyMfa = (mfa_token: string, payload: { code?: string; code_secours?: string }) =>
  api<TokenPayload & { user: SessionUser }>({ method: 'POST', url: '/auth/mfa', data: { mfa_token, platform: 'web', device_name: 'Back-office web', ...payload }, ...noRetry });

export const logout = () => http.post('/auth/deconnexion', {}, noRetry).catch(() => undefined);

export const getAccount = () => api<{ user: SessionUser & { role_code: string; totp_enabled_at: string | null } }>({ method: 'GET', url: '/compte' });

export const changePassword = (data: { current_password: string; password: string; password_confirmation: string }) =>
  apiWithMessage<{ access_token: string }>({ method: 'POST', url: '/compte/mot-de-passe', data });

export const updateProfile = (data: { first_name?: string; last_name?: string; email?: string | null; language?: string; current_password?: string }) =>
  apiWithMessage<{ user: SessionUser }>({ method: 'PATCH', url: '/compte', data });

export const listSessions = () => api<{ sessions: SessionAppareil[] }>({ method: 'GET', url: '/compte/sessions' });
export const revokeSession = (id: string) => apiWithMessage<null>({ method: 'DELETE', url: `/compte/sessions/${id}` });
export const revokeAllSessions = () => apiWithMessage<null>({ method: 'POST', url: '/compte/sessions/revoquer-toutes', data: {} });

export const mfaInit = (current_password: string) =>
  api<{ secret: string; otpauth_url: string }>({ method: 'POST', url: '/compte/mfa/initialiser', data: { current_password } });
export const mfaActivate = (code: string) =>
  api<{ access_token: string; codes_secours: string[] }>({ method: 'POST', url: '/compte/mfa/activer', data: { code } });
export const mfaBackupCodes = (current_password: string, code: string) =>
  api<{ codes_secours: string[] }>({ method: 'POST', url: '/compte/mfa/codes-secours', data: { current_password, code } });
