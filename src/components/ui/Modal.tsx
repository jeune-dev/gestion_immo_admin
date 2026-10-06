import { X } from 'lucide-react';
import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { Button } from './Button';
import { FormError } from './Field';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({ open, title, description, onClose, children, footer, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={`m-auto w-[calc(100vw-2rem)] ${size === 'lg' ? 'max-w-2xl' : 'max-w-md'} rounded-feuille border border-bordure bg-surface p-0 text-texte shadow-2xl backdrop:bg-black/50`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-bordure px-5 py-4">
        <div>
          <h2 className="text-sous-titre font-semibold">{title}</h2>
          {description && <p className="mt-1 text-petit text-texte-secondaire">{description}</p>}
        </div>
        <button onClick={onClose} aria-label="Fermer" className="rounded-petit p-1 text-texte-secondaire hover:bg-surface-alt"><X className="size-5" /></button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-bordure px-5 py-3">{footer}</div>}
    </dialog>
  );
}

/** Modale-formulaire : Annuler / action principale, erreur de l'API affichée en tête. */
export function FormModal({ open, title, description, onClose, onSubmit, submitLabel, loading, error, danger, size, children, disabled }: {
  open: boolean; title: string; description?: string; onClose: () => void; onSubmit: () => void; submitLabel: string;
  loading?: boolean; error?: unknown; danger?: boolean; size?: 'md' | 'lg'; children: ReactNode; disabled?: boolean;
}) {
  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(); };
  return (
    <Modal open={open} title={title} description={description} onClose={onClose} size={size}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormError error={error} />
        {children}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" variant={danger ? 'danger' : 'primary'} loading={loading} disabled={disabled}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
