import { useEffect, useState } from 'react';
import { FormModal } from './Modal';
import { Textarea } from './Field';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  /** Si défini, un motif est exigé (la longueur minimale suit le contrat de l'API). */
  reason?: { label?: string; minLength?: number; required?: boolean };
  loading?: boolean;
  error?: unknown;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, danger, reason, loading, error, onClose, onConfirm }: Props) {
  const [text, setText] = useState('');
  useEffect(() => { if (open) setText(''); }, [open]);

  const min = reason?.minLength ?? 3;
  const invalid = !!reason && ((reason.required ?? true) ? text.trim().length < min : !!text.trim() && text.trim().length < min);

  return (
    <FormModal
      open={open} title={title} onClose={onClose} submitLabel={confirmLabel} danger={danger}
      loading={loading} error={error} disabled={invalid}
      onSubmit={() => onConfirm(reason ? text.trim() || undefined : undefined)}
    >
      <p className="text-petit text-texte-secondaire">{message}</p>
      {reason && (
        <Textarea
          label={reason.label ?? 'Motif'} rows={3} value={text} onChange={(e) => setText(e.target.value)}
          hint={`${(reason.required ?? true) ? 'Obligatoire, ' : ''}${min} caractères minimum.`} autoFocus
        />
      )}
    </FormModal>
  );
}
