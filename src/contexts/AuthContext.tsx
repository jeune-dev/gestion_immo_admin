import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import { refreshSession, setSessionExpiredHandler, tokenStore, type SessionUser } from '@/api/client';
import { ApiError } from '@/api/client';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  status: Status;
  user: SessionUser | null;
  /** Étape 2 de la connexion en attente d'un code. */
  mfaToken: string | null;
  login: (identifiant: string, password: string) => Promise<void>;
  verifyMfa: (payload: { code?: string; code_secours?: string }) => Promise<void>;
  cancelMfa: () => void;
  logout: () => Promise<void>;
  /** Recharge le profil (après activation de la double authentification, changement de mot de passe…). */
  reload: () => Promise<void>;
  setToken: (token: string) => void;
}

const Ctx = createContext<AuthState | null>(null);

const isSuperAdmin = (u: SessionUser) => (u.role ?? u.role_code) === 'super_admin';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const qc = useQueryClient();

  const clear = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
    setMfaToken(null);
    setStatus('anonymous');
    qc.clear();
  }, [qc]);

  const accept = useCallback((u: SessionUser) => {
    if (!isSuperAdmin(u)) {
      void authApi.logout();
      clear();
      throw new ApiError({ status: 403, code: 'ROLE_NON_ADMIN', message: 'Cet espace est réservé aux super administrateurs.' });
    }
    setUser(u);
    setStatus('authenticated');
  }, [clear]);

  // Restauration de session : le refresh token est dans un cookie httpOnly.
  useEffect(() => {
    let alive = true;
    (async () => {
      const session = await refreshSession();
      if (!alive) return;
      if (!session) return clear();
      try {
        const { user: u } = await authApi.getAccount();
        if (alive) accept(u);
      } catch { if (alive) clear(); }
    })();
    return () => { alive = false; };
  }, [accept, clear]);

  useEffect(() => {
    setSessionExpiredHandler(clear);
    return () => setSessionExpiredHandler(null);
  }, [clear]);

  const value = useMemo<AuthState>(() => ({
    status, user, mfaToken,
    async login(identifiant, password) {
      const res = await authApi.login(identifiant, password);
      if ('mfa_requis' in res && res.mfa_requis) { setMfaToken(res.mfa_token); return; }
      const ok = res as { access_token: string; user: SessionUser };
      tokenStore.set(ok.access_token);
      accept(ok.user);
    },
    async verifyMfa(payload) {
      if (!mfaToken) throw new ApiError({ status: 401, code: 'JETON_MFA_INVALIDE', message: 'La vérification a expiré. Reconnectez-vous.' });
      const res = await authApi.verifyMfa(mfaToken, payload);
      tokenStore.set(res.access_token);
      setMfaToken(null);
      accept(res.user);
    },
    cancelMfa: () => setMfaToken(null),
    async logout() {
      await authApi.logout();
      clear();
    },
    async reload() {
      const { user: u } = await authApi.getAccount();
      setUser((prev) => ({ ...prev, ...u, mfa_active: !!u.totp_enabled_at, mfa_a_configurer: !u.totp_enabled_at }));
    },
    setToken: (t) => tokenStore.set(t),
  }), [status, user, mfaToken, accept, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
