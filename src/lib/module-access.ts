// Mapeamento central de módulos x rota x label de nav.
// Usado para gates de papéis customizados (Premium/Enterprise) e filtragem do nav.

export type ModuleKey =
  | "projetos"
  | "clientes"
  | "cronograma"
  | "mensagens"
  | "escritorio"
  | "ia";

/** Prefixo de rota -> módulo exigido. */
export const MODULE_BY_PATH: { prefix: string; module: ModuleKey }[] = [
  { prefix: "/app/profissional/projetos", module: "projetos" },
  { prefix: "/app/profissional/clientes", module: "clientes" },
  { prefix: "/app/profissional/cronograma", module: "cronograma" },
  { prefix: "/app/profissional/mensagens", module: "mensagens" },
  { prefix: "/app/profissional/escritorio", module: "escritorio" },
  { prefix: "/app/profissional/ia", module: "ia" },
];

/** Label do nav -> módulo exigido. */
export const MODULE_BY_NAV_LABEL: Record<string, ModuleKey> = {
  "Projetos": "projetos",
  "Clientes": "clientes",
  "Cronogramas": "cronograma",
  "Mensagens": "mensagens",
  "Escritório": "escritorio",
  "IA ArqHub": "ia",
};

/** Resolve módulo exigido por uma rota. */
export function moduleForPath(pathname: string): ModuleKey | null {
  const hit = MODULE_BY_PATH.find((m) => pathname.startsWith(m.prefix));
  return hit?.module ?? null;
}

/**
 * Checa se o módulo está permitido para o membro.
 * - allowedModules null/undefined => sem papel customizado: liberado.
 * - allowedModules array => deve estar contido na lista.
 */
export function memberCanAccess(
  allowedModules: string[] | null | undefined,
  mod: ModuleKey | null,
): boolean {
  if (!mod) return true;
  if (!allowedModules) return true;
  return allowedModules.includes(mod);
}
