import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { toApiError } from '@/api/client';

type Kind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: Kind; message: string }

interface ToastApi {
  success: (message: string) => void;
  error: (err: unknown) => void;
  info: (message: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

const STYLE: Record<Kind, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'text-succes' },
  error: { icon: AlertCircle, cls: 'text-danger' },
  info: { icon: Info, cls: 'text-info' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Kind, message: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4500);
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    success: (m) => push('success', m),
    info: (m) => push('info', m),
    error: (e) => {
      const err = toApiError(e);
      push('error', err.details.length ? `${err.message} ${err.details.join(' · ')}` : err.message);
    },
  }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" role="region" aria-label="Notifications">
        {toasts.map((t) => {
          const { icon: Icon, cls } = STYLE[t.kind];
          return (
            <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className="flex items-start gap-3 rounded-carte border border-bordure bg-surface p-3 shadow-lg">
              <Icon className={`mt-0.5 size-5 shrink-0 ${cls}`} aria-hidden />
              <p className="flex-1 text-petit text-texte">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Fermer" className="rounded-petit p-0.5 text-texte-secondaire hover:bg-surface-alt"><X className="size-4" /></button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return ctx;
}
