import type { Plan } from "@/lib/session";

/**
 * Matriz de vantagens por plano.
 * Regra: o teste grátis (14 dias) libera TUDO do Premium.
 */
export type FeatureKey =
  | "projetos"
  | "cronograma"
  | "financeiro"
  | "portais"
  | "documentos"
  | "modelos"
  | "liw"
  | "suporte"
  | "relatorios"
  | "ia"
  | "levantamento"
  | "compras"
  | "planejamento"
  | "papeis"
  | "suporte24h"
  | "api"
  | "integracoes"
  | "sla"
  | "treinamento";

const BASICO: FeatureKey[] = [
  "projetos",
  "cronograma",
  "financeiro",
  "portais",
  "documentos",
  "modelos",
  "liw",
  "suporte",
];

const PREMIUM: FeatureKey[] = [
  ...BASICO,
  "relatorios",
  "ia",
  "levantamento",
  "compras",
  "planejamento",
  "papeis",
  "suporte24h",
];

const ENTERPRISE: FeatureKey[] = [...PREMIUM, "integracoes", "sla", "treinamento", "api"];

export const PLAN_FEATURE_MAP: Record<Plan, FeatureKey[]> = {
  // Teste grátis = tudo do Premium por 14 dias
  trial: PREMIUM,
  basico: BASICO,
  premium: PREMIUM,
  enterprise: ENTERPRISE,
};

export type PlanLimits = {
  /** Acessos escritório/equipe (inclui o dono). */
  seats: number;
  /** Portais para clientes VIPs. */
  portals: number;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  trial: { seats: 10, portals: 45 },
  basico: { seats: 5, portals: 15 },
  premium: { seats: 10, portals: 45 },
  enterprise: { seats: Infinity, portals: Infinity },
};

export function planFeatures(plan: Plan | undefined): FeatureKey[] {
  return PLAN_FEATURE_MAP[plan ?? "trial"] ?? PLAN_FEATURE_MAP.trial;
}

export function hasFeature(plan: Plan | undefined, feature: FeatureKey): boolean {
  return planFeatures(plan).includes(feature);
}

export function planLimits(plan: Plan | undefined): PlanLimits {
  return PLAN_LIMITS[plan ?? "trial"] ?? PLAN_LIMITS.trial;
}

export function limitLabel(n: number) {
  return Number.isFinite(n) ? String(n) : "Ilimitado";
}

/** Listas exibidas no marketing (home e /planos). */
export const PLAN_MARKETING_FEATURES = {
  basico: [
    "5 acessos escritório/equipe",
    "Projetos e Tarefas",
    "Cronograma e Diário de Obra",
    "Painel financeiro",
    "15 portais para clientes VIPs",
    "Gestão de documentos em nuvem",
    "Modelos de documentos",
    "Assistente Liw",
    "Suporte",
  ],
  premium: [
    "Tudo do Básico",
    "10 acessos escritório/equipe",
    "45 portais para clientes VIPs",
    "Relatórios de projeto e financeiro",
    "Orçamentos Inteligentes (IA)",
    "Levantamento Quantitativo",
    "Planejamento Automático",
    "Suporte 24h",
  ],
  enterprise: [
    "Tudo do Premium",
    "Acessos e portais ilimitados",
    "Integrações customizadas",
    "Integrações com API",
    "SLA dedicado",
    "Suporte prioritário",
    "Treinamento in-company",
  ],
} as const;
