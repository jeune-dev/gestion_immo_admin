import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/format';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primaire text-sur-primaire hover:bg-primaire-survol',
  accent: 'bg-secondaire text-sur-secondaire hover:bg-secondaire-survol',
  outline: 'border-primaire text-primaire hover:bg-primaire-teinte bg-transparent',
  ghost: 'text-texte-secondaire hover:bg-surface-alt hover:text-texte bg-transparent',
  danger: 'bg-danger text-white hover:opacity-90',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'outline', size = 'md', loading, icon, children, className, disabled, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        size === 'sm' ? 'min-h-8 px-3 text-legende' : 'min-h-10 px-4 text-petit',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
