import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";

export type AdminMetrics = {
  usuariosAtivos: number;
  assinaturasPagas: number;
  mrrCentavos: number;
  churn30d: number;
  loading: boolean;
  error: string | null;
};

const initial: AdminMetrics = {
  usuariosAtivos: 0,
  assinaturasPagas: 0,
  mrrCentavos: 0,
  churn30d: 0,
  loading: true,
  error: null,
};

export function useAdminMetrics(): AdminMetrics {
  const [state, setState] = useState<AdminMetrics>(initial);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [usuarios, ativas, canceladas30d, planosAll] = await Promise.all([
          externalSupabase.from("profiles").select("*", { count: "exact", head: true }),
          externalSupabase
            .from("subscriptions")
            .select("plan_id, status", { count: "exact" })
            .eq("status", "active"),
          externalSupabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("status", "canceled")
            .gte("updated_at", new Date(Date.now() - 30 * 86400000).toISOString()),
          externalSupabase.from("plans").select("id, code, price_cents"),
        ]);

        const planById = new Map(
          (planosAll.data ?? []).map((p: any) => [p.id, { code: p.code as string, price: p.price_cents as number }]),
        );

        // MRR: somar price_cents dos planos das assinaturas ativas
        let mrr = 0;
        for (const s of (ativas.data ?? []) as any[]) {
          const p = planById.get(s.plan_id);
          if (!p) continue;
          mrr += p.code.includes("yearly") ? Math.round(p.price / 12) : p.price;
        }

        const ativasCount = ativas.count ?? 0;
        const canceladasCount = canceladas30d.count ?? 0;
        const churn =
          ativasCount + canceladasCount > 0
            ? (canceladasCount / (ativasCount + canceladasCount)) * 100
            : 0;

        if (!alive) return;
        setState({
          usuariosAtivos: usuarios.count ?? 0,
          assinaturasPagas: ativasCount,
          mrrCentavos: mrr,
          churn30d: churn,
          loading: false,
          error: null,
        });
      } catch (e: any) {
        if (!alive) return;
        setState((s) => ({ ...s, loading: false, error: e?.message ?? "Erro ao carregar" }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
