import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, Users, CreditCard, Shield, Activity, AlertCircle,
  Bell, FileText, RefreshCw, AlertTriangle, ExternalLink, Settings, ChevronDown, Check, X, Play, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { simulateErrorsFn } from "@/lib/simulate.functions";

export const Route = createFileRoute("/app/admin/alertas")({
  head: () => ({ meta: [{ title: "Alertas — Admin" }] }),
  component: Page,
});


type LogRow = {
  id: string;
  created_at: string;
  level: "debug" | "info" | "warn" | "error" | "audit";
  screen: string | null;
  route: string | null;
  action: string | null;
  message: string;
  user_email: string | null;
};

type Bucket = {
  key: string;
  screen: string;
  route: string;
  count: number;
  users: Set<string>;
  lastAt: string;
  lastMessage: string;
  sample: LogRow[];
};

const WINDOWS = [
  { label: "Última hora", value: 1 },
  { label: "Últimas 6h", value: 6 },
  { label: "Últimas 24h", value: 24 },
  { label: "Últimos 7d", value: 168 },
];

const LS_WINDOW = "arqhub.alerts.window";
const LS_THRESHOLD = "arqhub.alerts.threshold";

function loadWindow(): number {
  if (typeof window === "undefined") return 24;
  const raw = localStorage.getItem(LS_WINDOW);
  if (!raw) return 24;
  const v = Number(raw);
  return WINDOWS.some((w) => w.value === v) ? v : 24;
}

function loadThreshold(): number {
  if (typeof window === "undefined") return 5;
  const v = Number(localStorage.getItem(LS_THRESHOLD));
  return Number.isFinite(v) && v >= 1 && v <= 9999 ? v : 5;
}

function saveWindow(v: number) { localStorage.setItem(LS_WINDOW, String(v)); }
function saveThreshold(v: number) { localStorage.setItem(LS_THRESHOLD, String(v)); }

function Page() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [windowH, setWindowH] = useState<number>(loadWindow);
  const [threshold, setThreshold] = useState<number>(loadThreshold);

  const [showConfig, setShowConfig] = useState(false);
  const [draftWindow, setDraftWindow] = useState<number>(windowH);
  const [draftThreshold, setDraftThreshold] = useState<number>(threshold);
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  // Simulação
  const [showSim, setShowSim] = useState(false);
  const [simScreen, setSimScreen] = useState("Simulação Teste");
  const [simRoute, setSimRoute] = useState("/app/simulacao");
  const [simCount, setSimCount] = useState<number>(threshold + 1);
  const [simErrors, setSimErrors] = useState<{ screen?: string; route?: string; count?: string } | null>(null);
  const [simulating, setSimulating] = useState(false);

  async function load() {
    setLoading(true); setErr(null);
    const since = new Date(Date.now() - windowH * 3600 * 1000).toISOString();
    const { data, error } = await externalSupabase
      .from("app_logs")
      .select("id, created_at, level, screen, route, action, message, user_email")
      .eq("level", "error")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) setErr(error.message);
    setRows((data as LogRow[]) ?? []);
    setLoading(false);
  }

  const runSimulate = useServerFn(simulateErrorsFn);

  async function simulateErrors() {
    const clientSchema = z.object({
      screen: z.string().trim().min(1).max(100).regex(/^[\p{L}\p{N}\s\-_()./]+$/u),
      route: z.string().trim().min(1).max(200).regex(/^\/[a-zA-Z0-9\-_/.]*$/),
      count: z.number().int().min(1).max(500),
    });

    const screen = simScreen.trim();
    const route = simRoute.trim();
    const count = Number(simCount);

    const result = clientSchema.safeParse({ screen, route, count });
    if (!result.success) {
      const fieldErrors: { screen?: string; route?: string; count?: string } = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as "screen" | "route" | "count";
        fieldErrors[path] = issue.message;
      }
      setSimErrors(fieldErrors);
      return;
    }
    setSimErrors(null);

    const key = `${screen}\u0001${route}`;
    const before = buckets.find((b) => b.key === key);
    const beforeCount = before?.count ?? 0;
    const wasActive = beforeCount >= threshold;

    setSimulating(true); setErr(null);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");
      await runSimulate({ data: { accessToken, screen, route, count } });
    } catch (e: any) {
      setSimulating(false);
      const msg = e?.message ?? "Erro desconhecido";
      setErr(msg);
      toast.error("Falha ao simular erros", { description: msg });
      return;
    }
    setSimulating(false);

    await load();

    const after = buckets.find((b) => b.key === key);
    const afterCount = after?.count ?? beforeCount + count;
    const isActive = afterCount >= threshold;

    if (!wasActive && isActive) {
      toast.error(`Alerta ATIVADO em ${screen}`, {
        description: `${afterCount} erros · limite atingido (≥ ${threshold}) · rota ${route}`,
        duration: 6000,
      });
    } else if (wasActive && isActive) {
      toast.warning(`Alerta continua ativo em ${screen}`, {
        description: `${afterCount} erros (era ${beforeCount}) · limite ${threshold} · rota ${route}`,
      });
    } else {
      toast.success(`${count} erro(s) simulado(s)`, {
        description: `${afterCount}/${threshold} em ${screen} — alerta ainda não disparou.`,
      });
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [windowH]);

  useEffect(() => {
    setDraftWindow(windowH);
    setDraftThreshold(threshold);
    setThresholdError(null);
  }, [showConfig, windowH, threshold]);

  function applyConfig() {
    const t = Number(draftThreshold);
    if (!Number.isFinite(t) || t < 1 || t > 9999) {
      setThresholdError("O limite deve ser um número entre 1 e 9999.");
      return;
    }
    setThresholdError(null);
    setWindowH(draftWindow);
    setThreshold(t);
    saveWindow(draftWindow);
    saveThreshold(t);
    setShowConfig(false);
  }

  function cancelConfig() {
    setDraftWindow(windowH);
    setDraftThreshold(threshold);
    setThresholdError(null);
    setShowConfig(false);
  }

  const isDirty = draftWindow !== windowH || Number(draftThreshold) !== threshold;

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    for (const r of rows) {
      const screen = r.screen ?? "—";
      const route = r.route ?? "—";
      const key = `${screen}\u0001${route}`;
      let b = map.get(key);
      if (!b) {
        b = { key, screen, route, count: 0, users: new Set(), lastAt: r.created_at, lastMessage: r.message, sample: [] };
        map.set(key, b);
      }
      b.count++;
      if (r.user_email) b.users.add(r.user_email);
      if (new Date(r.created_at) > new Date(b.lastAt)) {
        b.lastAt = r.created_at; b.lastMessage = r.message;
      }
      if (b.sample.length < 3) b.sample.push(r);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [rows]);

  const alerts = buckets.filter((b) => b.count >= threshold);
  const totalErrors = rows.length;

  return (
    <AppShell role="admin" nav={adminNav} title="Alertas">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Alertas</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Erros agrupados por tela e rota · {totalErrors} erro(s) na janela · {alerts.length} alerta(s) ativo(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSim((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary">
            <Play className="h-3.5 w-3.5 text-primary" />
            Simular erros
            <ChevronDown className={`h-3 w-3 transition-transform ${showSim ? "rotate-180" : ""}`} />
          </button>
          <button onClick={() => setShowConfig((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary">
            <Settings className="h-3.5 w-3.5" />
            Configurar
            <ChevronDown className={`h-3 w-3 transition-transform ${showConfig ? "rotate-180" : ""}`} />
          </button>
          <button onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Simulação panel */}
      {showSim && (
        <div className="mb-6 bg-white border border-border rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Tela</label>
              <input
                type="text"
                value={simScreen}
                onChange={(e) => { setSimScreen(e.target.value); setSimErrors(null); }}
                placeholder="Ex: Dashboard"
                className={`w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:ring-2 ${
                  simErrors?.screen ? "border-red-300 focus:ring-red-200 bg-red-50/30" : "border-border bg-surface focus:ring-primary/20"
                }`}
              />
              {simErrors?.screen && <p className="text-[11px] text-red-600 mt-1">{simErrors.screen}</p>}
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Rota</label>
              <input
                type="text"
                value={simRoute}
                onChange={(e) => { setSimRoute(e.target.value); setSimErrors(null); }}
                placeholder="/app/exemplo"
                className={`w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:ring-2 font-mono ${
                  simErrors?.route ? "border-red-300 focus:ring-red-200 bg-red-50/30" : "border-border bg-surface focus:ring-primary/20"
                }`}
              />
              {simErrors?.route && <p className="text-[11px] text-red-600 mt-1">{simErrors.route}</p>}
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Qtd. de erros</label>
              <input
                type="number"
                min={1}
                max={500}
                value={simCount}
                onChange={(e) => { setSimCount(e.target.value === "" ? 0 : Number(e.target.value)); setSimErrors(null); }}
                className={`w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:ring-2 ${
                  simErrors?.count ? "border-red-300 focus:ring-red-200 bg-red-50/30" : "border-border bg-surface focus:ring-primary/20"
                }`}
              />
              {simErrors?.count ? (
                <p className="text-[11px] text-red-600 mt-1">{simErrors.count}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1">Entre 1 e 500. Limite atual: {threshold}.</p>
              )}
            </div>
            <div className="flex items-end">
              <button onClick={simulateErrors}
                disabled={simulating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed">
                <Play className="h-3.5 w-3.5" />
                {simulating ? "Inserindo…" : "Simular agora"}
              </button>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
            Os erros serão inseridos em <code className="font-mono text-ink">app_logs</code> com <code className="font-mono text-ink">level=error</code> e <code className="font-mono text-ink">details.simulated=true</code>.
          </div>
        </div>
      )}

      {/* Config panel */}
      {showConfig && (
        <div className="mb-6 bg-white border border-border rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Janela de análise</label>
              <select value={draftWindow} onChange={(e) => setDraftWindow(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/20">
                {WINDOWS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">Período em que os erros serão contabilizados.</p>
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Limite de alerta</label>
              <input
                type="number"
                min={1}
                max={9999}
                value={draftThreshold}
                onChange={(e) => {
                  setDraftThreshold(e.target.value === "" ? 0 : Number(e.target.value));
                  setThresholdError(null);
                }}
                className={`w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:ring-2 ${
                  thresholdError ? "border-red-300 focus:ring-red-200 bg-red-50/30" : "border-border bg-surface focus:ring-primary/20"
                }`}
              />
              {thresholdError ? (
                <p className="text-[11px] text-red-600 mt-1">{thresholdError}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1">Mínimo de erros por tela/rota para disparar alerta.</p>
              )}
            </div>
            <div className="flex items-end gap-2">
              <button onClick={applyConfig}
                disabled={!isDirty}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isDirty
                    ? "bg-primary text-primary-foreground hover:bg-primary-dark"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}>
                <Check className="h-3.5 w-3.5" /> Aplicar
              </button>
              <button onClick={cancelConfig}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary">
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
            Configuração ativa: <span className="font-medium text-ink">{WINDOWS.find((w) => w.value === windowH)?.label}</span> ·
            Limite <span className="font-medium text-ink">{threshold}</span> erros
          </div>
        </div>
      )}

      {err && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-[13px] border border-red-100">
          {err}
        </div>
      )}

      {/* Active alerts */}
      <section className="mb-6">
        <h3 className="text-[13px] font-semibold text-ink mb-2 inline-flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" /> Ativos
          <span className="text-[11px] font-normal text-muted-foreground">
            (≥ {threshold} erros por tela/rota)
          </span>
        </h3>
        {alerts.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center text-[13px] text-muted-foreground">
            {loading ? "Carregando…" : "Nenhum alerta ativo na janela selecionada."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {alerts.map((b) => (
              <div key={b.key} className="bg-white border border-red-200 ring-1 ring-red-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10.5px] font-medium uppercase tracking-wider bg-red-50 text-red-700">
                        {b.count} erros
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {b.users.size} usuário(s) · último: {new Date(b.lastAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="text-[14px] font-semibold text-ink truncate">{b.screen}</div>
                    <div className="text-[12px] text-muted-foreground truncate">{b.route}</div>
                  </div>
                  <Link to="/app/admin/logs"
                    className="text-[12px] inline-flex items-center gap-1 text-primary hover:underline shrink-0">
                    Ver logs <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="text-[12.5px] text-foreground/80 line-clamp-2 mb-2">
                  {b.lastMessage}
                </div>
                <div className="border-t border-border pt-2 space-y-1">
                  {b.sample.map((s) => (
                    <div key={s.id} className="text-[11.5px] text-muted-foreground truncate">
                      <span className="text-foreground/70">{new Date(s.created_at).toLocaleTimeString("pt-BR")}</span>
                      {" · "}{s.user_email ?? "anônimo"}{" · "}{s.message}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All buckets table */}
      <section>
        <h3 className="text-[13px] font-semibold text-ink mb-2">Todas as agregações</h3>
        <div className="bg-white border border-border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="bg-secondary">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Tela</th>
                <th className="px-4 py-2.5 font-medium">Rota</th>
                <th className="px-4 py-2.5 font-medium text-right">Erros</th>
                <th className="px-4 py-2.5 font-medium text-right">Usuários</th>
                <th className="px-4 py-2.5 font-medium">Último</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {buckets.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum erro na janela.
                </td></tr>
              ) : buckets.map((b) => {
                const active = b.count >= threshold;
                return (
                  <tr key={b.key} className="hover:bg-secondary/30">
                    <td className="px-4 py-2.5 font-medium text-ink">{b.screen}</td>
                    <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[260px]">{b.route}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{b.count}</td>
                    <td className="px-4 py-2.5 text-right">{b.users.size}</td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(b.lastAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2.5">
                      {active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                          <AlertTriangle className="h-3 w-3" /> Alerta
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">ok</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
