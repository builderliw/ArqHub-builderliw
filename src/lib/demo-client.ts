/**
 * Cliente e projeto imaginários — aparecem para todo escritório
 * para o usuário explorar as funções do painel sem cadastrar dados reais.
 * IDs fixos (não existem no banco); a UI deve tratar `isDemo: true`.
 */

export const DEMO_CLIENT_ID = "00000000-0000-4000-8000-democlient01";
export const DEMO_PROJECT_ID = "00000000-0000-4000-8000-demoproject1";

export type DemoClient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  cidade: string;
  uf: string;
  rua: string;
  numero: string;
  cep: string;
  bairro: string;
  complemento: string | null;
  has_portal: boolean;
  isDemo: true;
};

export type DemoProject = {
  id: string;
  name: string;
  status: string;
  client_id: string;
  location: string;
  city: string;
  area_m2: number;
  created_at: string;
  description: string;
  budget_cents: number;
  deadline: string;
  client_email: string;
  isDemo: true;
};

export const DEMO_CLIENT: DemoClient = {
  id: DEMO_CLIENT_ID,
  name: "Maria Silva (Demo)",
  email: "maria.silva.demo@arqhub.example",
  phone: "(11) 98765-4321",
  status: "ativo",
  created_at: "2026-01-15T12:00:00.000Z",
  cidade: "São Paulo",
  uf: "SP",
  rua: "Rua das Flores",
  numero: "120",
  cep: "01310-100",
  bairro: "Bela Vista",
  complemento: "Apto 42",
  has_portal: true,
  isDemo: true,
};

export const DEMO_PROJECT: DemoProject = {
  id: DEMO_PROJECT_ID,
  name: "Residência Jardins (Demo)",
  status: "em_andamento",
  client_id: DEMO_CLIENT_ID,
  location: "São Paulo, SP",
  city: "São Paulo",
  area_m2: 280,
  created_at: "2026-02-01T12:00:00.000Z",
  description:
    "Projeto residencial de demonstração — use este cliente para explorar etapas, documentos, mensagens e o portal.",
  budget_cents: 45000000,
  deadline: "2026-12-15",
  client_email: DEMO_CLIENT.email,
  isDemo: true,
};

export function isDemoId(id: string | null | undefined): boolean {
  return id === DEMO_CLIENT_ID || id === DEMO_PROJECT_ID;
}

/** Injeta cliente/projeto demo no início das listas (sem gravar no banco). */
export function withDemoClient<T extends { id: string }>(clientes: T[]): (T | DemoClient)[] {
  if (clientes.some((c) => c.id === DEMO_CLIENT_ID)) return clientes as (T | DemoClient)[];
  return [DEMO_CLIENT, ...clientes];
}

export function withDemoProject<T extends { id: string }>(projetos: T[]): (T | DemoProject)[] {
  if (projetos.some((p) => p.id === DEMO_PROJECT_ID)) return projetos as (T | DemoProject)[];
  return [DEMO_PROJECT, ...projetos];
}
