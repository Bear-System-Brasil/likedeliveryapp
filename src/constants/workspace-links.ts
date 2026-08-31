import { Bike, ChefHat, Store, Wallet, type LucideIcon } from "lucide-react";

/**
 * Item de "área de trabalho" do menu da tela inicial — um único slot cujo
 * rótulo e destino mudam por role, em vez de um item por área. Adicionar uma
 * role nova é acrescentar uma linha aqui; roles fora deste mapa (ex.: client)
 * simplesmente não mostram o item.
 */
export interface WorkspaceLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const WORKSPACE_LINK_BY_ROLE: Record<string, WorkspaceLink> = {
  owner: { label: "Gestão", href: "/menu-management", icon: Store },
  admin: { label: "Gestão", href: "/menu-management", icon: Store },
  manager: { label: "Gestão", href: "/menu-management", icon: Store },
  cook: { label: "Cozinha", href: "/kitchen", icon: ChefHat },
  delivery: { label: "Entregas", href: "/delivery-dashboard", icon: Bike },
  financial: {
    label: "Financeiro",
    href: "/financial-management/dashboard",
    icon: Wallet,
  },
};

export function getWorkspaceLink(role?: string): WorkspaceLink | null {
  if (!role) return null;
  return WORKSPACE_LINK_BY_ROLE[role] ?? null;
}
