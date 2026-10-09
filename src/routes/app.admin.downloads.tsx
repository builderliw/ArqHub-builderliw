import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPeriodFilter, periodLabel } from "@/components/admin-period-filter";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Download, Crown, Users, CalendarDays, FileDown, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { getDownloadStats } from "@/lib/admin-downloads.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";

export const Route = createFileRoute("/app/admin/downloads")({
  head: () => ({ meta: [{ title: "Downloads — Admin ArqHub" }] }),
  component: AdminDownloads,
});

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function AdminDownloads() {
  const fn = useServerFn(getDownloadStats);
  const [days, setDays] = useState(0);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-downloads", days],
    queryFn: async () => {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");
      return fn({ data: { accessToken, days } });
    },
    refetchInterval: 120000,
  });

  const max = Math.max(1, ...(data?.byItem.slice(0, 10).map((i) => i.count) ?? [1]));

  return (
    <AppShell role="admin" nav={adminNav} title="Downloads">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">Downloads</h1>
          <p className="text-[13px] text-muted-foreground">
            {days === 0 ? "Todos os arquivos baixados no site" : `Downloads dos últimos ${days} dias`}
            {data?.since ? ` · desde ${fmtDate(data.since)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <AdminPeriodFilter value={days} onChange={setDays} />
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-[13px] hover:bg-secondary/60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {(error as Error).message}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label={`Downloads · ${periodLabel(days)}`} value={isLoading ? "—" : fmt(data?.total ?? 0)} icon={Download} />
        <Stat label="Últimos 30 dias" value={isLoading ? "—" : fmt(data?.last30d ?? 0)} icon={CalendarDays} />
        <Stat label="Últimos 7 dias" value={isLoading ? "—" : fmt(data?.last7d ?? 0)} icon={FileDown} />
        <Stat label="Usuários identificados" value={isLoading ? "—" : fmt(data?.uniqueUsers ?? 0)} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-ink mb-1">Mais baixados</h3>
          <p className="text-[11.5px] text-muted-foreground mb-4">Ranking por documento/planilha</p>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-secondary rounded animate-pulse" />
              ))}
            </div>
          ) : data?.byItem.length ? (
            <ul className="space-y-3">
              {data.byItem.slice(0, 10).map((it) => (
                <li key={`${it.kind}-${it.slug}`}>
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="truncate text-ink flex items-center gap-1.5">
                      {it.kind === "premium" && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      {it.title}
                    </span>
                    <span className="tabular-nums font-medium shrink-0">{fmt(it.count)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(it.count / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum download registrado ainda.</p>
          )}
        </div>

        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-ink mb-1">Downloads por dia</h3>
          <p className="text-[11.5px] text-muted-foreground mb-4">Últimos 30 dias com registro</p>
          {data?.byDay.length ? (
            <div className="flex items-end gap-1 h-40">
              {data.byDay.map((d) => {
                const m = Math.max(1, ...data.byDay.map((x) => x.count));
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${d.count}`}>
                    <div
                      className="w-full rounded-t bg-primary/80"
                      style={{ height: `${Math.max(4, (d.count / m) * 130)}px` }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem dados no período.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold text-ink">Histórico recente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[640px]">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Arquivo</th>
                <th className="text-left font-medium px-4 py-2.5">Tipo</th>
                <th className="text-left font-medium px-4 py-2.5">Usuário</th>
                <th className="text-left font-medium px-4 py-2.5">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.rows ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-2.5 text-ink">{r.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {r.access_level === "subscriber" || r.kind === "premium" ? "Assinante" : "Gratuito"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.user_email ?? "anônimo"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
              {!isLoading && !(data?.rows ?? []).length && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum download registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl bg-white border border-border p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
