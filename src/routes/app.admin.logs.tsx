import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, CreditCard, Shield, Activity, AlertCircle,
  ChevronLeft, ChevronRight, Search, RefreshCw, FileText, X, Download, Bell, MessageSquare,
  Smartphone, Monitor, Tablet, Eye, DownloadCloud, CheckCircle2,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import { importLogsFn } from "@/lib/import-logs.functions";
import { listAllAppLogs } from "@/lib/admin-logs.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/app/admin/logs")({
  head: () => ({ meta: [{ title: "Logs & Auditoria — Admin" }] }),
  component: Page,
});


type LogRow = {
  id: string;
  created_at: string;
  level: "debug" | "info" | "warn" | "error" | "audit";
  source: string;
  screen: string | null;
  route: string | null;
  action: string | null;
  message: string;
  details: Record<string, unknown> | null;
  user_id: string | null;
  user_email: string | null;
  office_id: string | null;
  user_agent: string | null;
};

const PAGE_SIZE = 25;

const levelStyles: Record<LogRow["level"], string> = {
  error: "bg-red-50 text-red-700 ring-1 ring-red-100",
  warn:  "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  info:  "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  audit: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  debug: "bg-secondary text-muted-foreground ring-1 ring-border",
};

function Page() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [level, setLevel] = useState<"" | LogRow["level"]>("");
  const [screen, setScreen] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<LogRow | null>(null);

  // Filtros específicos da seção de visitantes
  const [visitorDevice, setVisitorDevice] = useState<"" | "mobile" | "desktop" | "tablet">("");
  const [visitorPage, setVisitorPage] = useState("");
  const [visitorFrom, setVisitorFrom] = useState("");
  const [visitorTo, setVisitorTo] = useState("");

  const listAllFn = useServerFn(listAllAppLogs);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");
      const { rows } = await listAllFn({ data: { accessToken, limit: 50000 } });
      setRows((rows as LogRow[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const screens = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.screen && s.add(r.screen));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() + 24 * 3600 * 1000 : null;
    const emailTerm = userEmail.trim().toLowerCase();
    return rows.filter((r) => {
      if (level && r.level !== level) return false;
      if (screen && r.screen !== screen) return false;
      if (emailTerm && !(r.user_email ?? "").toLowerCase().includes(emailTerm)) return false;
      const t = new Date(r.created_at).getTime();
      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;
      if (term) {
        const hay = `${r.message} ${r.action ?? ""} ${r.route ?? ""} ${r.user_email ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, level, screen, userEmail, from, to]);

  // Base para métricas de visitantes: aplica filtros da própria seção sobre `filtered`
  const visitorFiltered = useMemo(() => {
    const pageTerm = visitorPage.trim().toLowerCase();
    const fromTs = visitorFrom ? new Date(visitorFrom).getTime() : null;
    const toTs = visitorTo ? new Date(visitorTo).getTime() + 24 * 3600 * 1000 : null;
    return filtered.filter((r) => {
      const d = (r.details ?? {}) as Record<string, unknown>;
      if (visitorDevice) {
        const device = (d.device as string) || "desktop";
        if (device !== visitorDevice) return false;
      }
      if (pageTerm && !(r.route ?? "").toLowerCase().includes(pageTerm)) return false;
      const t = new Date(r.created_at).getTime();
      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;
      return true;
    });
  }, [filtered, visitorDevice, visitorPage, visitorFrom, visitorTo]);

  const stats = useMemo(() => {
    const visitors = new Map<string, { anon: boolean; device: string; os: string; browser: string; email: string | null; routes: Set<string>; lastAt: string }>();
    let pageviews = 0;
    let installShown = 0;
    let installClicks = 0;
    let installAccepted = 0;
    let installed = 0;

    for (const r of visitorFiltered) {
      const d = (r.details ?? {}) as Record<string, unknown>;
      const vid = (d.visitor_id as string) || r.user_id || "unknown";
      const device = (d.device as string) || "desconhecido";
      const os = (d.os as string) || "—";
      const browser = (d.browser as string) || "—";
      const prev = visitors.get(vid);
      const routeStr = r.route ?? "";
      if (prev) {
        if (routeStr) prev.routes.add(routeStr);
        if (r.created_at > prev.lastAt) prev.lastAt = r.created_at;
        if (r.user_email && !prev.email) prev.email = r.user_email;
      } else {
        visitors.set(vid, {
          anon: !r.user_id,
          device,
          os,
          browser,
          email: r.user_email,
          routes: new Set(routeStr ? [routeStr] : []),
          lastAt: r.created_at,
        });
      }
      if (r.action === "pageview") pageviews++;
      if (r.action === "pwa.install.shown" || r.action === "pwa.install.prompt") installShown++;
      if (r.action === "pwa.install.click") installClicks++;
      if (r.action === "pwa.install.accepted") installAccepted++;
      if (r.action === "pwa.installed") installed++;
    }

    let mobile = 0, desktop = 0, tablet = 0, anon = 0;
    for (const v of visitors.values()) {
      if (v.device === "mobile") mobile++;
      else if (v.device === "tablet") tablet++;
      else desktop++;
      if (v.anon) anon++;
    }

    const sources = new Map<string, { visitors: Set<string>; pageviews: number; campaigns: Map<string, number> }>();
    for (const r of visitorFiltered) {
      const d = (r.details ?? {}) as Record<string, unknown>;
      const vid = (d.visitor_id as string) || r.user_id || "unknown";
      const src = ((d.source as string) || "direto").toLowerCase();
      let entry = sources.get(src);
      if (!entry) { entry = { visitors: new Set(), pageviews: 0, campaigns: new Map() }; sources.set(src, entry); }
      entry.visitors.add(vid);
      if (r.action === "pageview") entry.pageviews++;
      const camp = (d.utm_campaign as string) || null;
      if (camp) entry.campaigns.set(camp, (entry.campaigns.get(camp) ?? 0) + 1);
    }

    return { sources, visitors, pageviews, installShown, installClicks, installAccepted, installed, mobile, desktop, tablet, anon };
  }, [visitorFiltered]);

  const [showVisitors, setShowVisitors] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function downloadFile(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  }

  function exportJSON() {
    if (filtered.length === 0) return toast.error("Nenhum registro para exportar.");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadFile(`arqhub-logs-${stamp}.json`, JSON.stringify(filtered, null, 2), "application/json");
    toast.success(`${filtered.length} registros exportados (JSON).`);
  }

  function exportCSV() {
    if (filtered.length === 0) return toast.error("Nenhum registro para exportar.");
    const cols: (keyof LogRow)[] = [
      "created_at","level","source","screen","route","action","message",
      "user_email","user_id","office_id","user_agent","details",
    ];
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    };
    const header = cols.join(",");
    const lines = filtered.map((r) => cols.map((c) => esc(r[c])).join(","));
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadFile(`arqhub-logs-${stamp}.csv`, [header, ...lines].join("\n"), "text/csv;charset=utf-8");
    toast.success(`${filtered.length} registros exportados (CSV).`);
  }

  return (
    <AppShell role="admin" nav={adminNav} title="Logs & Auditoria">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Logs & Auditoria</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Erros e eventos por tela e usuário · {filtered.length} de {rows.length} registros
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={exportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary">
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          <button onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary">
            <DownloadCloud className="h-3.5 w-3.5 rotate-180" /> Importar
          </button>
          <button onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-3 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar mensagem, rota, ação, e-mail…"
            className="pl-8 pr-3 py-2 rounded-lg border border-border bg-white text-[13px] w-full"
          />
        </div>
        <select
          value={level}
          onChange={(e) => { setLevel(e.target.value as LogRow["level"] | ""); setPage(1); }}
          className="rounded-lg border border-border bg-white px-3 py-2 text-[13px] w-full sm:w-auto"
        >
          <option value="">Todos os níveis</option>
          <option value="error">Erro</option>
          <option value="warn">Aviso</option>
          <option value="info">Info</option>
          <option value="audit">Auditoria</option>
          <option value="debug">Debug</option>
        </select>
        <select
          value={screen}
          onChange={(e) => { setScreen(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-white px-3 py-2 text-[13px] w-full sm:w-auto"
        >
          <option value="">Todas as telas</option>
          {screens.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          value={userEmail}
          onChange={(e) => { setUserEmail(e.target.value); setPage(1); }}
          placeholder="E-mail do usuário"
          className="rounded-lg border border-border bg-white px-3 py-2 text-[13px] w-full sm:w-auto"
        />
        <div className="flex items-center gap-1">
          <input
            type="date" value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-white px-2 py-2 text-[12.5px] w-full"
          />
          <span className="text-muted-foreground text-[11px]">→</span>
          <input
            type="date" value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-white px-2 py-2 text-[12.5px] w-full"
          />
        </div>
      </div>

      {/* KPIs de visitantes / instalações */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
        <StatCard icon={<Eye className="h-4 w-4" />} label="Visitantes" value={stats.visitors.size} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Anônimos" value={stats.anon} muted />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Pageviews" value={stats.pageviews} muted />
        <StatCard icon={<Smartphone className="h-4 w-4" />} label="Mobile" value={stats.mobile} />
        <StatCard icon={<Monitor className="h-4 w-4" />} label="Desktop" value={stats.desktop} />
        <StatCard icon={<DownloadCloud className="h-4 w-4" />} label={`Baixar app · ${stats.installed} instalados`} value={stats.installClicks} accent />
      </div>

      {/* Origens de tráfego */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="mb-3">
          <h3 className="text-[13.5px] font-semibold text-ink">Origens de tráfego · de onde vêm os acessos</h3>
          <p className="text-[11.5px] text-muted-foreground">
            Use links com <code className="rounded bg-secondary px-1">?utm_source=instagram</code> na bio/stories para medição exata.
          </p>
        </div>
        {(() => {
          const list = Array.from(stats.sources.entries())
            .map(([source, v]) => ({ source, visitors: v.visitors.size, pageviews: v.pageviews, campaigns: Array.from(v.campaigns.entries()).sort((a, b) => b[1] - a[1]) }))
            .sort((a, b) => b.visitors - a.visitors);
          const max = Math.max(1, ...list.map((l) => l.visitors));
          const insta = list.find((l) => l.source === "instagram");
          if (list.length === 0) return <p className="text-[12.5px] text-muted-foreground">Sem dados de origem ainda.</p>;
          return (
            <>
              <div className="mb-3 rounded-xl border border-pink-200 bg-pink-50/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-pink-700">Cliques vindos do Instagram</p>
                <div className="mt-1 flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-semibold leading-none text-ink">{insta?.visitors ?? 0}</span>
                  <span className="text-[12px] text-muted-foreground">
                    pessoas · {insta?.pageviews ?? 0} pageviews
                  </span>
                </div>
                {insta && insta.campaigns.length > 0 && (
                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                    Campanhas: {insta.campaigns.map(([c, n]) => `${c} (${n})`).join(" · ")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {list.map((l) => (
                  <div key={l.source} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-[12.5px] text-ink">{l.source}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.round((l.visitors / max) * 100)}%` }} />
                    </div>
                    <span className="w-28 shrink-0 text-right text-[12px] text-muted-foreground">
                      {l.visitors} pessoas · {l.pageviews} views
                    </span>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>

      {/* Funil de instalação PWA */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[13.5px] font-semibold text-ink">Funil · Baixar app → Instalação</h3>
            <p className="text-[11.5px] text-muted-foreground">Jornada desde a exibição do prompt até a instalação concluída.</p>
          </div>
        </div>
        {(() => {
          const steps = [
            { label: "Prompt exibido", value: stats.installShown, icon: <Eye className="h-3.5 w-3.5" /> },
            { label: "Clique em Baixar", value: stats.installClicks, icon: <DownloadCloud className="h-3.5 w-3.5" /> },
            { label: "Aceitou instalar", value: stats.installAccepted, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
            { label: "Instalação concluída", value: stats.installed, icon: <Smartphone className="h-3.5 w-3.5" /> },
          ];
          const top = Math.max(1, steps[0].value || steps.find((s) => s.value > 0)?.value || 1);
          return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {steps.map((s, i) => {
                const pct = Math.round((s.value / top) * 100);
                const prev = i === 0 ? null : steps[i - 1].value;
                const conv = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
                return (
                  <div key={s.label} className="rounded-lg border border-border p-3 bg-secondary/20">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {s.icon}<span className="truncate">{s.label}</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-[20px] font-semibold text-ink">{s.value.toLocaleString("pt-BR")}</span>
                      {conv !== null && (
                        <span className="text-[11px] text-muted-foreground">{conv}% do passo anterior</span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 rounded bg-border overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => setShowVisitors((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-[12.5px] hover:bg-secondary"
        >
          {showVisitors ? "Ocultar visitantes" : `Ver visitantes (${stats.visitors.size})`}
          <ChevronRight className={`h-3.5 w-3.5 transition ${showVisitors ? "rotate-90" : ""}`} />
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={visitorDevice}
            onChange={(e) => setVisitorDevice(e.target.value as "" | "mobile" | "desktop" | "tablet")}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-[12px]"
          >
            <option value="">Todos dispositivos</option>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
          </select>
          <input
            value={visitorPage}
            onChange={(e) => setVisitorPage(e.target.value)}
            placeholder="Filtrar por página (ex: /planos)"
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-[12px] w-[200px]"
          />
          <input
            type="date" value={visitorFrom}
            onChange={(e) => setVisitorFrom(e.target.value)}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-[12px]"
          />
          <span className="text-muted-foreground text-[11px]">→</span>
          <input
            type="date" value={visitorTo}
            onChange={(e) => setVisitorTo(e.target.value)}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-[12px]"
          />
          {(visitorDevice || visitorPage || visitorFrom || visitorTo) && (
            <button
              onClick={() => { setVisitorDevice(""); setVisitorPage(""); setVisitorFrom(""); setVisitorTo(""); }}
              className="text-[11.5px] text-muted-foreground hover:text-ink underline"
            >
              limpar
            </button>
          )}
        </div>
      </div>


      {showVisitors && (
        <div className="bg-white border border-border rounded-xl overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[12.5px]">
              <thead className="bg-secondary text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">Identificado?</th>
                  <th className="px-4 py-2.5 font-medium">Dispositivo</th>
                  <th className="px-4 py-2.5 font-medium">SO / Navegador</th>
                  <th className="px-4 py-2.5 font-medium">Páginas visitadas</th>
                  <th className="px-4 py-2.5 font-medium">Última atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from(stats.visitors.entries())
                  .sort((a, b) => (a[1].lastAt < b[1].lastAt ? 1 : -1))
                  .slice(0, 50)
                  .map(([vid, v]) => (
                    <tr key={vid} className="hover:bg-secondary/30">
                      <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground truncate max-w-[140px]" title={vid}>
                        {vid.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2">
                        {v.anon ? (
                          <span className="text-muted-foreground">Anônimo</span>
                        ) : (
                          <span className="text-foreground">{v.email ?? "logado"}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 capitalize">
                        <span className="inline-flex items-center gap-1">
                          {v.device === "mobile" ? <Smartphone className="h-3 w-3" /> : v.device === "tablet" ? <Tablet className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                          {v.device}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{v.os} · {v.browser}</td>
                      <td className="px-4 py-2 text-muted-foreground truncate max-w-[280px]" title={Array.from(v.routes).join(" → ")}>
                        {Array.from(v.routes).slice(0, 4).join(" → ") || "—"}
                        {v.routes.size > 4 ? ` +${v.routes.size - 4}` : ""}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                        {new Date(v.lastAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                {stats.visitors.size === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Sem visitantes no período filtrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {err && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-[13px] border border-red-100">
          {err}
        </div>
      )}

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="bg-secondary">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">Data</th>
                <th className="px-4 py-2.5 font-medium">Nível</th>
                <th className="px-4 py-2.5 font-medium">Tela</th>
                <th className="px-4 py-2.5 font-medium">Rota</th>
                <th className="px-4 py-2.5 font-medium">Usuário</th>
                <th className="px-4 py-2.5 font-medium">Mensagem</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Carregando…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" strokeWidth={1.5} />
                  Nenhum registro encontrado.
                </td></tr>
              ) : pageRows.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30 cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10.5px] font-medium uppercase tracking-wider ${levelStyles[r.level]}`}>
                      {r.level}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-foreground/80">{r.screen ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[180px]">{r.route ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[180px]">{r.user_email ?? "anônimo"}</td>
                  <td className="px-4 py-2.5 truncate max-w-[360px]">{r.message}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    <ChevronRight className="h-4 w-4 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-[12.5px] text-muted-foreground">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40">
              Próxima <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10.5px] font-medium uppercase tracking-wider ${levelStyles[selected.level]}`}>
                    {selected.level}
                  </span>
                  <span className="text-[11.5px] text-muted-foreground">
                    {new Date(selected.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-ink">{selected.message}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto space-y-3 text-[13px]">
              <Row k="Tela" v={selected.screen} />
              <Row k="Rota" v={selected.route} />
              <Row k="Ação" v={selected.action} />
              <Row k="Usuário" v={selected.user_email ?? "—"} />
              <Row k="user_id" v={selected.user_id} />
              <Row k="office_id" v={selected.office_id} />
              <Row k="User-Agent" v={selected.user_agent} />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Detalhes</div>
                <pre className="bg-secondary/40 rounded-lg p-3 text-[11.5px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
{selected.details ? JSON.stringify(selected.details, null, 2) : "—"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <ImportLogsModal
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); load(); }}
        />
      )}
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="text-foreground break-all">{v ?? "—"}</div>
    </div>
  );
}

function StatCard({ icon, label, value, accent, muted }: { icon: ReactNode; label: string; value: number; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? "bg-primary/5 border-primary/30" : "bg-white border-border"}`}>
      <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${muted ? "text-muted-foreground" : "text-foreground/70"}`}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-1 text-[22px] font-semibold tracking-tight ${accent ? "text-primary" : "text-ink"}`}>{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}

function ImportLogsModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const importLogs = useServerFn(importLogsFn);
  const [text, setText] = useState("");
  const [source, setSource] = useState<"server" | "client" | "webhook" | "db">("server");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ count: number; sample: unknown } | null>(null);

  function parseInput(): any[] {
    const raw = text.trim();
    if (!raw) throw new Error("Cole o conteúdo (JSON ou CSV) ou selecione um arquivo.");
    // JSON array or NDJSON
    if (raw.startsWith("[")) {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) throw new Error("JSON deve ser um array.");
      return arr;
    }
    if (raw.startsWith("{")) {
      // NDJSON
      return raw.split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
    }
    // CSV
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV deve ter cabeçalho + linhas.");
    const parseLine = (l: string) => {
      const out: string[] = []; let cur = ""; let q = false;
      for (let i = 0; i < l.length; i++) {
        const c = l[i];
        if (q) {
          if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; }
          else if (c === '"') q = false;
          else cur += c;
        } else {
          if (c === '"') q = true;
          else if (c === ",") { out.push(cur); cur = ""; }
          else cur += c;
        }
      }
      out.push(cur);
      return out;
    };
    const headers = parseLine(lines[0]).map((h) => h.trim());
    return lines.slice(1).map((l) => {
      const cells = parseLine(l);
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        let v: unknown = cells[i] ?? "";
        if (h === "details" && typeof v === "string" && v) {
          try { v = JSON.parse(v as string); } catch {}
        }
        if (v === "") v = null;
        obj[h] = v;
      });
      return obj;
    });
  }

  function onPreview() {
    try {
      const arr = parseInput();
      setPreview({ count: arr.length, sample: arr.slice(0, 3) });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) return toast.error("Arquivo muito grande (máx. 25MB).");
    const t = await f.text();
    setText(t);
    setPreview(null);
  }

  async function onImport() {
    try {
      setBusy(true);
      const entries = parseInput();
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");
      let total = 0;
      // send in chunks of 2000 to respect server cap of 5000
      for (let i = 0; i < entries.length; i += 2000) {
        const chunk = entries.slice(i, i + 2000);
        const res = await importLogs({ data: { accessToken, entries: chunk, source } });
        total += res.inserted;
      }
      toast.success(`${total} registros importados.`);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Importar logs antigos</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Aceita JSON (array), NDJSON ou CSV. Campos: created_at, level, source, screen, route, action, message, details, user_id, user_email, office_id, user_agent, ip.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-4 space-y-3 overflow-y-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary cursor-pointer">
              <FileText className="h-3.5 w-3.5" /> Selecionar arquivo (.json/.ndjson/.csv)
              <input type="file" accept=".json,.ndjson,.csv,application/json,text/csv" className="hidden" onChange={onFile} />
            </label>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">Origem:</span>
              <select value={source} onChange={(e) => setSource(e.target.value as any)}
                className="rounded-lg border border-border bg-white px-2 py-1.5 text-[13px]">
                <option value="server">server (CDN/host)</option>
                <option value="client">client</option>
                <option value="webhook">webhook</option>
                <option value="db">db</option>
              </select>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setPreview(null); }}
            placeholder='Ex.: [{"created_at":"2025-08-01T12:00:00Z","level":"info","message":"pageview /","route":"/","action":"pageview"}]'
            className="w-full h-56 rounded-lg border border-border bg-white p-3 text-[12px] font-mono"
          />
          {preview && (
            <div className="rounded-lg bg-secondary/40 p-3 text-[12px]">
              <div className="font-medium text-ink mb-1">Prévia · {preview.count} registros</div>
              <pre className="text-[11px] overflow-x-auto max-h-40">{JSON.stringify(preview.sample, null, 2)}</pre>
            </div>
          )}
          <div className="text-[11.5px] text-muted-foreground">
            Dica: exporte os logs do seu provedor (Cloudflare, Vercel, nginx) como JSON/CSV e mapeie ao menos <code>created_at</code> e <code>message</code>. Os registros importados recebem <code>details.imported = true</code>.
          </div>
        </div>
        <div className="px-6 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onPreview} disabled={busy}
            className="px-3 py-2 rounded-lg border border-border bg-white text-[13px] hover:bg-secondary disabled:opacity-50">
            Pré-visualizar
          </button>
          <button onClick={onImport} disabled={busy || !text.trim()}
            className="px-3 py-2 rounded-lg bg-primary text-white text-[13px] hover:bg-primary/90 disabled:opacity-50">
            {busy ? "Importando…" : "Importar"}
          </button>
        </div>
      </div>
    </div>
  );
}
