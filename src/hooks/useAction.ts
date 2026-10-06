import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';

/**
 * Action d'écriture : affiche le message de succès de l'API tel quel, invalide
 * les caches concernés, et laisse l'erreur au formulaire (via `error`) ou à un toast.
 */
export function useAction<TVars, TRes extends { message: string } | unknown>(
  fn: (vars: TVars) => Promise<TRes>,
  opts: { invalidate?: readonly string[]; successMessage?: string; silentError?: boolean; onSuccess?: (res: TRes, vars: TVars) => void } = {},
) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (res, vars) => {
      const msg = opts.successMessage ?? (res as { message?: string } | undefined)?.message;
      if (msg) toast.success(msg);
      opts.invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      opts.onSuccess?.(res, vars);
    },
    onError: (err) => { if (!opts.silentError) toast.error(err); },
  });
}
