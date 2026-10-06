import {
  LayoutDashboard,
  Users,
  CreditCard,
  Shield,
  Activity,
  AlertCircle,
  FileText,
  Bell,
  Building2,
  MessageSquare,
  Sparkles,
  BookOpen,
  Settings,
  Download,
  Mail,
} from "lucide-react";
import type { NavGroup } from "@/components/app-shell";

export const adminNav: NavGroup[] = [
  {
    items: [{ to: "/app/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Plataforma",
    items: [
      { to: "/app/admin/usuarios", label: "Usuários", icon: Users },
      { to: "/app/admin/empresas", label: "Empresas", icon: Building2 },
      { to: "/app/admin/planos", label: "Planos & Assinaturas", icon: CreditCard },
      { to: "/app/admin/enterprise", label: "Pedidos Enterprise", icon: Building2 },
      { to: "/app/admin/suporte", label: "Mensagens de Suporte", icon: MessageSquare },
      { to: "/app/admin/emails", label: "E-mails", icon: Mail },
      { to: "/app/admin/permissoes", label: "Permissões", icon: Shield },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { to: "/app/admin/recursos-premium", label: "Recursos Premium", icon: Sparkles },
      { to: "/app/admin/materiais", label: "Materiais Seu Negócio", icon: BookOpen },
      { to: "/app/admin/base-conhecimento", label: "Base de Conhecimento (IA)", icon: Sparkles },
    ],
  },
  {
    label: "Operação",
    items: [
      { to: "/app/admin/downloads", label: "Downloads", icon: Download },
      { to: "/app/admin/pagamentos", label: "Log de pagamentos", icon: Activity },
      { to: "/app/admin/logs", label: "Logs & Auditoria", icon: FileText },
      { to: "/app/admin/alertas", label: "Alertas", icon: Bell },
      { to: "/app/admin/trial-alertas", label: "Alertas de teste", icon: AlertCircle },
      { to: "/app/admin/erros", label: "Erros", icon: AlertCircle },
      { to: "/app/admin/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];
