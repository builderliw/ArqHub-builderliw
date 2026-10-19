// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Métricas do escritório (telas Financeiro e Métricas), calculadas a partir de
// getProfissionalDashboard.
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { getProfissionalDashboard } from "@/lib/profissional-project-data.functions";
import {
  STATUS_LABEL_PT,
  formatBRLCents,
  isProjectActive,
  parseDateSafe,
  todayISO,
} from "@/hooks/use-profissional-data";

export { formatBRLCents };

export type RevenueMonth = { month: string; label: string; cents: number };
export type StatusSlice = { status: string; label: string; count: number };
export type OverdueProject = { id: string; name: string; client: string; daysOverdue: number };
export type UpcomingStage = { id: string; title: string; project: string; daysLeft: number };

export type OfficeMetrics = {
  loading: boolean;
  error: string | null;
  officeId: string | null;
  totals: {
    projetos: number;
    ativos: number;
    concluidos: number;
    clientes: number;
    receitaTotalCents: number;
    receitaAtivosCents: number;
    ticketMedioCents: number;
    progressoMedio: number;
  };
  revenueByMonth: RevenueMonth[];
  statusBreakdown: StatusSlice[];
  overdue: OverdueProject[];
  upcoming: UpcomingStage[];
  approvals: { total: number; approved: number; changes: number; rejected: number; pending: number };
  refresh: () => Promise<void>;
};

const MONTHS = 6;
const UPCOMING_DAYS = 30;
const DONE_STAGE = new Set(["done", "completed"]);
const DAY = 24 * 60 * 60 * 1000;

function daysBetween(fromISO: string, toISO: string) {
  const a = parseDateSafe(fromISO.slice(0, 10));
  const b = parseDateSafe(toISO.slice(0, 10));
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

function lastMonths(n: number): RevenueMonth[] {
  const now = new Date();
  const out: RevenueMonth[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    out.push({ month, label, cents: 0 });
  }
  return out;
}

const EMPTY: Omit<OfficeMetrics, "refresh"> = {
  loading: true,
  error: null,
  officeId: null,
  totals: {
    projetos: 0,
    ativos: 0,
    concluidos: 0,
    clientes: 0,
    receitaTotalCents: 0,
    receitaAtivosCents: 0,
    ticketMedioCents: 0,
    progressoMedio: 0,
  },
  revenueByMonth: lastMonths(MONTHS),
  statusBreakdown: [],
  overdue: [],
  upcoming: [],
  approvals: { total: 0, approved: 0, changes: 0, rejected: 0, pending: 0 },
};

export function useOfficeMetrics(): OfficeMetrics {
  const fetchDashboard = useServerFn(getProfissionalDashboard);
  const [state, setState] = useState<Omit<OfficeMetrics, "refresh">>(EMPTY);

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
      const approvals: any[] = r.approvals ?? [];
      const today = todayISO();

      const clientName = new Map(clients.map((c) => [c.id, c.name ?? "—"]));
      const projectName = new Map(projects.map((p) => [p.id, p.name ?? "Projeto"]));
      const ativos = projects.filter((p) => isProjectActive(p.status));
      const ativosIds = new Set(ativos.map((p) => p.id));
      const concluidos = projects.filter((p) => p.status === "completed").length;
      const budget = (p: any) => Number(p.budget_cents) || 0;
      const receitaTotalCents = projects.reduce((a, p) => a + budget(p), 0);
      const receitaAtivosCents = ativos.reduce((a, p) => a + budget(p), 0);
      const comOrcamento = projects.filter((p) => budget(p) > 0);
      const ticketMedioCents = comOrcamento.length ? Math.round(receitaTotalCents / comOrcamento.length) : 0;

      // Progresso médio dos projetos ativos (média das etapas de cada projeto).
      const progressos = ativos.map((p) => {
        const ss = stages.filter((s) => s.project_id === p.id);
        return ss.length ? ss.reduce((a, s) => a + (Number(s.progress) || 0), 0) / ss.length : 0;
      });
      const progressoMedio = progressos.length
        ? Math.round(progressos.reduce((a, x) => a + x, 0) / progressos.length)
        : 0;

      // Receita (soma de orçamentos) pelo mês de criação do projeto.
      const revenueByMonth = lastMonths(MONTHS);
      const idx = new Map(revenueByMonth.map((m, i) => [m.month, i]));
      for (const p of projects) {
        const key = String(p.created_at ?? "").slice(0, 7);
        const i = idx.get(key);
        if (i !== undefined) revenueByMonth[i].cents += budget(p);
      }

      const counts = new Map<string, number>();
      for (const p of projects) {
        const st = String(p.status ?? "outro");
        counts.set(st, (counts.get(st) ?? 0) + 1);
      }
      const statusBreakdown: StatusSlice[] = Array.from(counts.entries())
        .map(([status, count]) => ({ status, label: STATUS_LABEL_PT[status] ?? status, count }))
        .sort((a, b) => b.count - a.count);

      const overdue: OverdueProject[] = ativos
        .filter((p) => p.deadline && String(p.deadline).slice(0, 10) < today)
        .map((p) => ({
          id: p.id,
          name: p.name ?? "Projeto",
          client: clientName.get(p.client_id) ?? "—",
          daysOverdue: daysBetween(String(p.deadline), today),
        }))
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

      const upcoming: UpcomingStage[] = stages
        .filter((s) => ativosIds.has(s.project_id) && s.end_at && !DONE_STAGE.has(s.status))
        .map((s) => ({
          id: s.id,
          title: s.title ?? "Etapa",
          project: projectName.get(s.project_id) ?? "Projeto",
          daysLeft: daysBetween(today, String(s.end_at)),
        }))
        .filter((s) => s.daysLeft >= 0 && s.daysLeft <= UPCOMING_DAYS)
        .sort((a, b) => a.daysLeft - b.daysLeft);

      // Situação de aprovação por etapa: vale a última resposta do cliente.
      const latestByStage = new Map<string, string>();
      for (const a of approvals) {
        if (!latestByStage.has(a.stage_id)) latestByStage.set(a.stage_id, a.status);
      }
      let approved = 0, changes = 0, rejected = 0;
      for (const st of latestByStage.values()) {
        if (st === "approved") approved++;
        else if (st === "changes_requested") changes++;
        else if (st === "rejected") rejected++;
      }
      const total = stages.length;

      setState({
        loading: false,
        error: null,
        officeId: r.officeId ?? null,
        totals: {
          projetos: projects.length,
          ativos: ativos.length,
          concluidos,
          clientes: clients.length,
          receitaTotalCents,
          receitaAtivosCents,
          ticketMedioCents,
          progressoMedio,
        },
        revenueByMonth,
        statusBreakdown,
        overdue,
        upcoming,
        approvals: { total, approved, changes, rejected, pending: Math.max(0, total - approved - changes - rejected) },
      });
    } catch (e: any) {
      setState({ ...EMPTY, loading: false, error: e?.message ?? "Erro ao carregar métricas" });
    }
  }, [fetchDashboard]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
