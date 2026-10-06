import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";

export type ClienteEtapa = {
  id: string;
  nome: string;
  done: boolean;
  atual: boolean;
  progresso: number;
};

export type ClienteProjeto = {
  id: string;
  nome: string;
  descricao: string | null;
  escritorio: string;
  iniciadoEm: string | null;
  progressoGeral: number;
  etapas: ClienteEtapa[];
};

export type ClienteData = {
  loading: boolean;
  error: string | null;
  projeto: ClienteProjeto | null;
};

const initial: ClienteData = { loading: true, error: null, projeto: null };

const STATUS_ORDER = ["todo", "in_progress", "review", "done"];

export function useClienteData(): ClienteData {
  const [state, setState] = useState<ClienteData>(initial);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: u } = await externalSupabase.auth.getUser();
        const user = u?.user;
        if (!user) {
          if (alive) setState({ loading: false, error: "Sessão expirada", projeto: null });
          return;
        }

        const { data: links } = await externalSupabase
          .from("client_users")
          .select("client_id")
          .eq("user_id", user.id);

        let clientIds = (links ?? []).map((l: any) => l.client_id);
        if (clientIds.length === 0 && user.email) {
          const { data: clientsByEmail } = await externalSupabase
            .from("clients")
            .select("id")
            .ilike("email", user.email.trim());
          clientIds = (clientsByEmail ?? []).map((c: any) => c.id);
        }
        if (clientIds.length === 0) {
          if (alive) setState({ loading: false, error: null, projeto: null });
          return;
        }

        const { data: projects } = await externalSupabase
          .from("projects")
          .select("id, name, description, status, office_id, created_at, started_at")
          .in("client_id", clientIds)
          .order("created_at", { ascending: false })
          .limit(1);

        const project = projects?.[0];
        if (!project) {
          if (alive) setState({ loading: false, error: null, projeto: null });
          return;
        }

        const [stagesRes, officeRes] = await Promise.all([
          externalSupabase
            .from("project_stages")
            .select("id, title, status, progress, order_index")
            .eq("project_id", project.id)
            .order("order_index", { ascending: true }),
          externalSupabase
            .from("offices")
            .select("name")
            .eq("id", project.office_id)
            .maybeSingle(),
        ]);

        const stages = stagesRes.data ?? [];
        const currentIdx = stages.findIndex(
          (s: any) => s.status !== "done" && s.status !== "completed",
        );
        const etapas: ClienteEtapa[] = stages.map((s: any, i: number) => ({
          id: s.id,
          nome: s.title,
          done: s.status === "done" || s.status === "completed",
          atual: i === currentIdx,
          progresso: s.progress ?? 0,
        }));

        const progressoGeral =
          etapas.length > 0
            ? Math.round(etapas.reduce((a, e) => a + (e.done ? 100 : e.progresso), 0) / etapas.length)
            : 0;

        if (!alive) return;
        setState({
          loading: false,
          error: null,
          projeto: {
            id: project.id,
            nome: project.name,
            descricao: project.description,
            escritorio: officeRes.data?.name ?? "—",
            iniciadoEm: project.started_at ?? project.created_at,
            progressoGeral,
            etapas,
          },
        });
      } catch (e: any) {
        if (!alive) return;
        setState({ loading: false, error: e?.message ?? "Erro", projeto: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export function formatMonthYear(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}
