// Sessão local simulada (sem backend).
// Quando uma integração real for ativada, substituir por auth real.
export type Role = "profissional" | "cliente" | "admin";
export type Plan = "trial" | "basico" | "premium" | "enterprise";

const KEY = "arqhub.session";

export type Session = {
  role: Role;
  name?: string;
  email?: string;
  onboardingDone?: boolean;
  /** Apenas para role="profissional". Default: "trial". */
  plan?: Plan;
  /** true quando o profissional é membro convidado (não dono do escritório). */
  isMember?: boolean;
  /** Office ao qual o profissional pertence (dono ou membro). */
  officeId?: string;
  /**
   * Módulos liberados pelo papel customizado (Premium/Enterprise).
   * null/undefined => membro sem papel: acesso padrão de membro
   * (todas as áreas, menos as bloqueadas para membros).
   */
  allowedModules?: string[] | null;
};

export const PLAN_LABELS: Record<Plan, string> = {
  trial: "Teste grátis",
  basico: "Básico",
  premium: "Premium",
  enterprise: "Enterprise",
};

export function planHasFeature(plan: Plan | undefined, feature: "ia"): boolean {
  // trial (14 dias) libera tudo do Premium
  if (feature === "ia") return plan !== "basico";
  return false;
}


export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export const rolePermissions: Record<Role, string[]> = {
  profissional: [
    "projetos.gerenciar",
    "tarefas.gerenciar",
    "financeiro.gerenciar",
    "equipe.gerenciar",
    "clientes.gerenciar",
    "relatorios.ver",
  ],
  cliente: ["projeto.ver", "documentos.ver", "mensagens.enviar"],
  admin: [
    "usuarios.gerenciar",
    "planos.gerenciar",
    "financeiro.plataforma",
    "logs.ver",
    "permissoes.gerenciar",
  ],
};

export function hasPermission(role: Role | undefined | null, perm: string) {
  if (!role) return false;
  return rolePermissions[role].includes(perm);
}
