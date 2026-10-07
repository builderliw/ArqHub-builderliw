import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, RefreshCw, Send, Clock, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listTrialAlerts, sendTrialReminder, type TrialAlertRow } from "@/lib/trial-alerts.functions";

export const Route = createFileRoute("/app/admin/trial-alertas")({
  head: () => ({ meta: [{ title: "Alertas de teste — Admin" }] }),
  component: Page,
});

function formatRemaining(days: number, hours: number) {
  if (days <= 0 && hours <= 0) return "Expirando";
  if (days <= 0) return `${hours}h`;
  return `${days}d ${hours}h`;
}

function Page() {
  const [rows, setRows] = useState<TrialAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "d1" | "d7" | "d14">("all");

  const listFn = useServerFn(listTrialAlerts);
  const sendFn = useServerFn(sendTrialReminder);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada.");
      const res = await listFn({ data: { accessToken } });
      setRows(res.items);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar alertas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function handleSend(row: TrialAlertRow) {
    const target = row.fullName || row.email || "este usuário";
    if (!confirm(`Enviar lembrete de teste grátis para ${target}?`)) return;
    setSendingId(row.userId);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada.");
      const res = await sendFn({ data: { accessToken, userId: row.userId } });
      if ((res as any).reason === "email_suppressed") {
        toast.warning("E-mail está na lista de suprimidos", { description: row.email ?? "" });
      } else {
        toast.success("Lembrete enviado", { description: row.email ?? "" });
      }
      await load();
    } catch (e: any) {
      toast.error("Falha ao enviar lembrete", { description: e?.message ?? "" });
    } finally {
      setSendingId(null);
    }
  }

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.bucket === filter);
  }, [rows, filter]);

  const d1Count = rows.filter((r) => r.bucket === "d1").length;
  const d7Count = rows.filter((r) => r.bucket === "d7").length;
  const d14Count = rows.filter((r) => r.bucket === "d14").length;

  return (
    <AppShell role="admin" nav={adminNav} title="Alertas de teste">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Alertas de teste</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Usuários com teste grátis · envie lembretes manuais por e-mail
          </p>
        </div>
        <button onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button onClick={() => setFilter("all")} className={`text-left bg-white border rounded-xl p-4 transition ${filter === "all" ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40"}`}>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</div>
          <div className="text-2xl font-semibold text-ink mt-1">{rows.length}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">testes ativos (≤ 14 dias)</div>
        </button>
        <button onClick={() => setFilter("d1")} className={`text-left bg-white border rounded-xl p-4 transition ${filter === "d1" ? "border-red-500 ring-1 ring-red-200" : "border-border hover:border-red-300"}`}>
          <div className="text-[11px] uppercase tracking-wider text-red-600 inline-flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Crítico · 1 dia
          </div>
          <div className="text-2xl font-semibold text-red-700 mt-1">{d1Count}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">expiram em até 24h</div>
        </button>
        <button onClick={() => setFilter("d7")} className={`text-left bg-white border rounded-xl p-4 transition ${filter === "d7" ? "border-amber-500 ring-1 ring-amber-200" : "border-border hover:border-amber-300"}`}>
          <div className="text-[11px] uppercase tracking-wider text-amber-700 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> Atenção · 7 dias
          </div>
          <div className="text-2xl font-semibold text-amber-700 mt-1">{d7Count}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">expiram em 2 a 7 dias</div>
        </button>
        <button onClick={() => setFilter("d14")} className={`text-left bg-white border rounded-xl p-4 transition ${filter === "d14" ? "border-emerald-500 ring-1 ring-emerald-200" : "border-border hover:border-emerald-300"}`}>
          <div className="text-[11px] uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> Recente · 14 dias
          </div>
          <div className="text-2xl font-semibold text-emerald-700 mt-1">{d14Count}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">expiram em 8 a 14 dias</div>
        </button>
      </div>

      {err && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-[13px] border border-red-100">
          {err}
        </div>
      )}

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="bg-secondary/40 border-b border-border">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Usuário</th>
                <th className="px-4 py-2.5 font-medium">Escritório</th>
                <th className="px-4 py-2.5 font-medium">Expira</th>
                <th className="px-4 py-2.5 font-medium">Restante</th>
                <th className="px-4 py-2.5 font-medium">Último lembrete</th>
                <th className="px-4 py-2.5 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground inline-flex-none">
                  <div className="inline-flex items-center gap-2 justify-center w-full">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Nenhum teste expirando na janela selecionada.
                  </div>
                </td></tr>
              ) : filtered.map((r) => {
                const tone = r.bucket === "d1" ? "text-red-700 bg-red-50 border-red-200" : r.bucket === "d7" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200";
                return (
                  <tr key={r.userId} className="hover:bg-secondary/30">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-ink truncate">{r.fullName || "—"}</div>
                      <div className="text-[11.5px] text-muted-foreground truncate inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {r.email ?? "sem e-mail"}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.officeName || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(r.trialExpiresAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[11.5px] font-medium ${tone}`}>
                        {formatRemaining(r.daysLeft, r.hoursLeft)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-[12px]">
                      {r.lastReminderAt
                        ? `${new Date(r.lastReminderAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · ${r.lastReminderStatus}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleSend(r)}
                        disabled={!r.email || sendingId === r.userId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary-dark disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {sendingId === r.userId ? "Enviando…" : "Enviar lembrete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
