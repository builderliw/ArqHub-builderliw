import {
  LayoutDashboard, FolderOpen, Users, Calendar,
  MessageSquare, UsersRound, Wallet, FileText,
  Calculator, Ruler, CalendarClock, ClipboardList, FileSignature,
} from "lucide-react";

import type { NavGroup } from "@/components/app-shell";
import type { Plan } from "@/lib/session";

/**
 * Nav do painel profissional, filtrado pelo plano da assinatura.
 */
export function getNavProfissional(plan: Plan | undefined, isMember = false): NavGroup[] {
  const baseItems = [
    { to: "/app/profissional/clientes", label: "Clientes", icon: Users },
    { to: "/app/profissional/cronograma", label: "Agenda da semana", icon: Calendar },
    ...(isMember ? [] : [{ to: "/app/profissional/equipe", label: "Equipe", icon: UsersRound }]),
    ...(isMember ? [] : [{ to: "/app/profissional/financeiro", label: "Financeiro", icon: Wallet }]),
    { to: "/app/profissional/mensagens", label: "Mensagens", icon: MessageSquare },
    { to: "/app/profissional/projetos", label: "Projetos", icon: FolderOpen },
    { to: "/app/profissional/diario-obra", label: "Diário de obra", icon: ClipboardList },
    { to: "/app/profissional/relatorios", label: "Relatórios", icon: FileText },
  ];

  // Ferramentas: visíveis para todos os planos.
  // O gate de "usar" (vs apenas visualizar) é feito dentro da própria página quando aplicável.
  const premiumTools: NavGroup = {
    label: "Ferramentas Premium",
    items: [
      { to: "/app/profissional/ferramentas/laudo", label: "Laudo Técnico", icon: FileSignature },
      { to: "/app/profissional/ferramentas/orcamentos", label: "Orçamentos Inteligentes", icon: Calculator },
      { to: "/app/profissional/ferramentas/levantamento", label: "Levantamento Quantitativo", icon: Ruler },
      { to: "/app/profissional/ferramentas/planejamento", label: "Planejamento de Obra", icon: CalendarClock },
    ],
  };

  const groups: NavGroup[] = [
    { items: [{ to: "/app/profissional", label: "Dashboard", icon: LayoutDashboard }] },
    { items: baseItems },
    premiumTools,
  ];
  return groups;
}

// Mantém export anterior (default premium, dono) para compat — AppShell filtra por plano.
export const navProfissional: NavGroup[] = getNavProfissional("premium", false);
