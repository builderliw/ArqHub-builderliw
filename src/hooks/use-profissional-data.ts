// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Agrega os dados do painel do profissional a partir de getProfissionalDashboard.
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { getProfissionalDashboard } from "@/lib/profissional-project-data.functions";

export type ProjetoResumo = {
  id: string;
  nome: string;
  cliente: string;
  fase: string;
  progresso: number;
  proximaEntrega: string | null;
  status: string;
  rawStatus: string;
  budgetCents: number;
};

export type Entrega = {
  id: string;
  titulo: string;
  contexto: string;
  data: string | null;
};

export type MensagemRecente = {
  id: string;
  remetente: string;
  projeto: string;
  preview: string;
  quando: string;
};

export type ProfissionalData = {
  loading: boolean;
  error: string | null;
  officeId: string | null;
  officeName: string | null;
  onboarded: boolean;
  isMember: boolean;
  allowedModules: string[] | null;
  projetosAtivos: number;
  clientesAtivos: number;
  receitaPrevistaCents: number;
  tarefasPendentes: number;
  contratosAtivos: number;
  projetosAtrasados: number;
  mensagensNaoLidas: number;
  entregas: Entrega[];
  mensagensRecentes: MensagemRecente[];
  projetos: ProjetoResumo[];
  refresh: () => Promise<void>;
};

export const STATUS_LABEL_PT: Record<string, string> = {
  design: "Em projeto",
  briefing: "Briefing",
  execution: "Execução",
  delivery: "Entrega",
  completed: "Concluído",
  paused: "Pausado",
  archived: "Arquivado",
};

const INACTIVE_PROJECT = new Set(["completed", "archived", "canceled", "cancelled"]);
const INACTIVE_CLIENT = new Set(["inactive", "archived", "inativo", "arquivado"]);
const DONE_STAGE = new Set(["done", "completed"]);

export function isProjectActive(status: string | null | undefined) {
  return !INACTIVE_PROJECT.has(String(status ?? ""));
}

export function todayISO() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const EMPTY: Omit<ProfissionalData, "refresh"> = {
  loading: true,
  error: null,
  officeId: null,
  officeName: null,
  onboarded: false,
  isMember: false,
  allowedModules: null,
  projetosAtivos: 0,
  clientesAtivos: 0,
  receitaPrevistaCents: 0,
  tarefasPendentes: 0,
  contratosAtivos: 0,
  projetosAtrasados: 0,
  mensagensNaoLidas: 0,
  entregas: [],
  mensagensRecentes: [],
  projetos: [],
};

export function useProfissionalData(): ProfissionalData {
  const fetchDashboard = useServerFn(getProfissionalDashboard);
  const [state, setState] = useState<Omit<ProfissionalData, "refresh">>(EMPTY);

  const load = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setState({ ...EMPTY, loading: false });
        return;
      }
      const r: any = await fetchDashboard({ data: { accessToken: token } });
      const projects: any[] = r.projects ?? [];
      const clients: any[] = r.clients ?? [];
      const stages: any[] = r.stages ?? [];
      const messages: any[] = r.messages ?? [];

      const today = todayISO();
      const clientName = new Map(clients.map((c) => [c.id, c.name ?? "—"]));
      const projectName = new Map(projects.map((p) => [p.id, p.name ?? "Projeto"]));
      const stagesByProject = new Map<string, any[]>();
      for (const s of stages) {
        const arr = stagesByProject.get(s.project_id) ?? [];
        arr.push(s);
        stagesByProject.set(s.project_id, arr);
      }

      const projetos: ProjetoResumo[] = projects.map((p) => {
        const ss = stagesByProject.get(p.id) ?? [];
        const progresso = ss.length
          ? Math.round(ss.reduce((a, s) => a + (Number(s.progress) || 0), 0) / ss.length)
          : 0;
        const proxima = ss
          .filter((s) => s.end_at && !DONE_STAGE.has(s.status))
          .sort((a, b) => (a.end_at < b.end_at ? -1 : 1))[0];
        const fase =
          ss.find((s) => s.status === "in_progress")?.title ?? STATUS_LABEL_PT[p.status] ?? "Em andamento";
        const atrasado = !!p.deadline && String(p.deadline).slice(0, 10) < today && isProjectActive(p.status);
        return {
          id: p.id,
          nome: p.name ?? "Projeto",
          cliente: clientName.get(p.client_id) ?? "—",
          fase,
          progresso,
          proximaEntrega: proxima?.end_at ?? p.deadline ?? null,
          status: atrasado ? "Atenção" : STATUS_LABEL_PT[p.status] ?? "No prazo",
          rawStatus: p.status ?? "",
          budgetCents: Number(p.budget_cents) || 0,
        };
      });

      const ativos = projects.filter((p) => isProjectActive(p.status));
      const ativosIds = new Set(ativos.map((p) => p.id));

      const entregas: Entrega[] = stages
        .filter((s) => ativosIds.has(s.project_id) && s.end_at && !DONE_STAGE.has(s.status))
        .filter((s) => String(s.end_at).slice(0, 10) >= today)
        .sort((a, b) => (a.end_at < b.end_at ? -1 : 1))
        .map((s) => ({
          id: s.id,
          titulo: s.title ?? "Etapa",
          contexto: projectName.get(s.project_id) ?? "Projeto",
          data: s.end_at ?? null,
        }));

      const mensagensRecentes: MensagemRecente[] = messages.map((m) => {
        const texto = String(m.content ?? m.body ?? "");
        return {
          id: m.id,
          remetente: m.sender_name ?? "Cliente",
          projeto: projectName.get(m.project_id) ?? "Projeto",
          preview: texto.length > 90 ? texto.slice(0, 90) + "…" : texto,
          quando: m.created_at,
        };
      });

      setState({
        loading: false,
        error: null,
        officeId: r.officeId ?? null,
        officeName: r.officeName ?? null,
        onboarded: !!r.onboarded,
        isMember: !!r.isMember,
        allowedModules: r.allowedModules ?? null,
        projetosAtivos: ativos.length,
        clientesAtivos: clients.filter((c) => !INACTIVE_CLIENT.has(String(c.status ?? ""))).length,
        receitaPrevistaCents: ativos.reduce((a, p) => a + (Number(p.budget_cents) || 0), 0),
        tarefasPendentes: stages.filter((s) => ativosIds.has(s.project_id) && !DONE_STAGE.has(s.status)).length,
        contratosAtivos: ativos.filter((p) => (Number(p.budget_cents) || 0) > 0).length,
        projetosAtrasados: projetos.filter((p) => p.status === "Atenção").length,
        mensagensNaoLidas: Number(r.unreadCount) || 0,
        entregas,
        mensagensRecentes,
        projetos,
      });
    } catch (e: any) {
      setState({ ...EMPTY, loading: false, error: e?.message ?? "Erro ao carregar o painel" });
    }
  }, [fetchDashboard]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}

// ---------- Formatadores ----------

/** Converte "2026-10-20" (só data) em Date local, sem deslocar o dia pelo fuso. */
export function parseDateSafe(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatBRLCents(cents: number | null | undefined) {
  return ((Number(cents) || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Ex.: "20 out" (ou "20 out 2027" se for de outro ano). */
export function formatShortDate(iso: string | null | undefined) {
  const d = parseDateSafe(iso);
  if (!d) return "—";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const day = d.getDate();
  const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return sameYear ? `${day} ${month}` : `${day} ${month} ${d.getFullYear()}`;
}

/** Ex.: "agora", "há 5 min", "há 2 h", "ontem", "há 3 dias", "20 out". */
export function formatRelativeDate(iso: string | null | undefined) {
  const d = parseDateSafe(iso);
  if (!d) return "";
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return formatShortDate(iso);
}
