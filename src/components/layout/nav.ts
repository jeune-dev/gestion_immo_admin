import {
  BadgeDollarSign, Bell, Building2, CreditCard, FileText, History, LayoutDashboard, Layers, LifeBuoy, MessageSquareText,
  Settings, Tag, UserCog, Users, UsersRound, Wallet, type LucideIcon,
} from 'lucide-react';

export interface NavItem { to: string; label: string; icon: LucideIcon }
export interface NavGroup { title?: string; items: NavItem[] }

/** Une entrée par écran réellement couvert par une route de l'API (CONTRAT-API-ADMIN.md). */
export const NAV: NavGroup[] = [
  { items: [{ to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard }] },
  {
    title: 'Clients',
    items: [
      { to: '/proprietaires', label: 'Propriétaires', icon: UsersRound },
      { to: '/locataires', label: 'Locataires', icon: Users },
      { to: '/immeubles', label: 'Immeubles', icon: Building2 },
      { to: '/signalements', label: 'Signalements', icon: LifeBuoy },
    ],
  },
  {
    title: 'Facturation',
    items: [
      { to: '/abonnements', label: 'Abonnements', icon: BadgeDollarSign },
      { to: '/plans', label: 'Plans tarifaires', icon: Layers },
      { to: '/paiements', label: 'Paiements', icon: CreditCard },
    ],
  },
  {
    title: 'Plateforme',
    items: [
      { to: '/utilisateurs', label: 'Utilisateurs', icon: UserCog },
      { to: '/categories', label: 'Catégories', icon: Tag },
      { to: '/modeles-bail', label: 'Modèles de bail', icon: FileText },
      { to: '/modeles-whatsapp', label: 'Modèles WhatsApp', icon: MessageSquareText },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/journal-audit', label: 'Journal d’audit', icon: History },
      { to: '/parametres', label: 'Paramètres', icon: Settings },
    ],
  },
];

export const ALL_ITEMS: NavItem[] = [...NAV.flatMap((g) => g.items), { to: '/compte', label: 'Mon compte', icon: Wallet }];

export function titleFor(pathname: string) {
  return ALL_ITEMS.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))?.label ?? 'Administration';
}
