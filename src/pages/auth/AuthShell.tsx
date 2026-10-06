import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/Sidebar';

export function AuthShell({ title, description, children, footer }: { title: string; description?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-full lg:grid-cols-[1fr_28rem]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primaire p-12 text-sur-primaire lg:flex">
        <div className="absolute -right-24 -top-24 size-96 rounded-pilule bg-white/5" aria-hidden />
        <div className="absolute -bottom-32 left-10 size-[28rem] rounded-pilule bg-secondaire/10" aria-hidden />
        <div className="relative"><Logo inverse /></div>
        <div className="relative max-w-md">
          <h2 className="text-grand-titre font-semibold leading-tight">Pilotez toute la plateforme depuis un seul tableau de bord.</h2>
          <p className="mt-4 opacity-80">Propriétaires, abonnements, paiements et signalements : une vue claire pour agir vite.</p>
        </div>
        <p className="relative flex items-center gap-2 text-petit opacity-80"><ShieldCheck className="size-4" aria-hidden /> Accès protégé par double authentification</p>
      </section>

      <main className="flex items-center justify-center bg-fond px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-titre font-semibold">{title}</h1>
          {description && <p className="mt-1 text-petit text-texte-secondaire">{description}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-petit text-texte-secondaire">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
