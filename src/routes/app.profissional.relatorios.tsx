import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Eye, FileText, Search, Loader2, User, Wallet, Building2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { hasFeature } from "@/lib/plan-features";
import { getSession, type Plan } from "@/lib/session";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { externalSupabase } from "@/integrations/external-supabase/client";
import logoAsset from "@/assets/arqhub-logo-resumo.png.asset.json";
import {
  listProfessionalProjects,
  getProfessionalProjectSummary,
  getOfficeFinancialReport,
  getClientFinancialReport,
} from "@/lib/profissional-project-data.functions";

export const Route = createFileRoute("/app/profissional/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — ArqHub" }] }),
  component: RelatoriosPage,
});

type ProjetoRow = {
  id: string;
  nome: string;
  cliente: string;
  clientId: string | null;
  fase: string;
  progresso: number;
  proximaEntrega: string | null;
  status: string;
  rawStatus: string;
  budgetCents: number;
};

async function getToken() {
  const { data } = await externalSupabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function fmtMoney(cents: number | null | undefined) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
}

function escapeHtml(s: any) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c] as string));
}

function downloadBlob(content: string, filename: string, type = "text/html") {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
}

function htmlShell(title: string, logoUrl: string, headerLabel: string, body: string) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;max-width:880px;margin:32px auto;padding:0 24px;line-height:1.5}
  h1{font-size:24px;margin:0 0 4px} h2{font-size:15px;margin:24px 0 8px;color:#065f46;border-bottom:1px solid #d1d5db;padding-bottom:4px}
  .muted{color:#6b7280;font-size:13px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:13px;margin-top:8px}
  table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:6px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e5e7eb} th{background:#f3f4f6;font-weight:600}
  .badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#ecfdf5;color:#065f46;font-size:11px;font-weight:600}
  .kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px}
  .kpi>div{border:1px solid #e5e7eb;border-radius:8px;padding:10px}
  .kpi .lbl{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
  .kpi .val{font-size:18px;font-weight:600;margin-top:4px}
  .bar{height:6px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-top:4px}
  .bar>span{display:block;height:100%;background:#059669}
  .watermark{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0}
  .watermark img{width:60%;max-width:560px;opacity:.06}
  body>*{position:relative;z-index:1}
  @media print{body{margin:0} .watermark img{opacity:.08}}
</style></head><body>
  <div class="watermark"><img src="${logoUrl}" alt=""/></div>
  <header style="display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:2px solid #065f46;padding-bottom:10px">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="${logoUrl}" alt="ArqHub" style="height:44px;width:auto"/>
      <div><h1>${escapeHtml(title)}</h1>
        <div class="muted">${escapeHtml(headerLabel)} • Gerado em ${new Date().toLocaleString("pt-BR")}</div></div>
    </div>
    <span class="badge">Relatório</span>
  </header>
  ${body}
  <footer style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280">
    Documento gerado por ArqHub • ${new Date().toLocaleDateString("pt-BR")}
  </footer>
</body></html>`;
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    briefing: "Briefing", design: "Projeto", execution: "Execução",
    delivery: "Entrega", completed: "Concluído", paused: "Pausado", archived: "Arquivado",
  };
  return map[s] ?? s ?? "—";
}

function buildProjectSummaryHtml(s: any, logoUrl: string, includeDocuments: boolean) {
  const p = s.project ?? {};
  const c = s.client ?? {};
  const o = s.office ?? {};
  const stages = s.stages ?? [];
  const products = s.products ?? [];
  const meetings = s.meetings ?? [];
  const notes = s.notes ?? [];
  const documents = includeDocuments ? (s.documents ?? []) : [];
  const approvals = s.approvals ?? [];
  const approvedStages = approvals.filter((a: any) => a.status === "approved");
  const totalProdutos = products.reduce(
    (acc: number, pr: any) => acc + (pr.price_cents ?? 0) * (pr.quantity ?? 1), 0
  );
  const progresso = stages.length
    ? Math.round(stages.reduce((a: number, s: any) => a + (s.progress ?? 0), 0) / stages.length)
    : 0;

  const body = `
  <h2>Cliente</h2>
  <div class="grid">
    <div><b>Nome:</b> ${escapeHtml(c.name ?? "—")}</div>
    <div><b>E-mail:</b> ${escapeHtml(c.email ?? "—")}</div>
    <div><b>Telefone:</b> ${escapeHtml(c.phone ?? "—")}</div>
  </div>
  <h2>Projeto</h2>
  <div class="grid">
    <div><b>Início:</b> ${fmtDate(p.started_at)}</div>
    <div><b>Prazo:</b> ${fmtDate(p.deadline)}</div>
    <div><b>Orçamento:</b> ${fmtMoney(p.budget_cents)}</div>
    <div><b>Área:</b> ${p.area_m2 ? `${p.area_m2} m²` : "—"}</div>
    <div><b>Local:</b> ${escapeHtml([p.location, p.city, p.uf].filter(Boolean).join(", ") || "—")}</div>
    <div><b>Progresso médio:</b> ${progresso}%<div class="bar"><span style="width:${progresso}%"></span></div></div>
  </div>
  ${p.description ? `<p style="margin-top:10px;font-size:13px">${escapeHtml(p.description)}</p>` : ""}

  <h2>Etapas (${stages.length})</h2>
  ${stages.length === 0 ? `<div class="muted">Nenhuma etapa cadastrada.</div>` : `
  <table><thead><tr><th>Etapa</th><th>Status</th><th>Progresso</th><th>Início</th><th>Fim</th></tr></thead><tbody>
  ${stages.map((s: any) => `<tr><td>${escapeHtml(s.title ?? "")}</td><td>${escapeHtml(s.status ?? "—")}</td><td>${s.progress ?? 0}%</td><td>${fmtDate(s.start_at)}</td><td>${fmtDate(s.end_at)}</td></tr>`).join("")}
  </tbody></table>`}

  <h2>Produtos (${products.length})</h2>
  ${products.length === 0 ? `<div class="muted">Nenhum produto.</div>` : `
  <table><thead><tr><th>Produto</th><th>Qtd</th><th>Status</th><th>Valor</th></tr></thead><tbody>
  ${products.map((pr: any) => `<tr><td>${escapeHtml(pr.name ?? "")}</td><td>${pr.quantity ?? 1}</td><td>${escapeHtml(pr.status ?? "—")}</td><td>${fmtMoney((pr.price_cents ?? 0) * (pr.quantity ?? 1))}</td></tr>`).join("")}
  <tr><td colspan="3" style="text-align:right"><b>Total</b></td><td><b>${fmtMoney(totalProdutos)}</b></td></tr>
  </tbody></table>`}

  <h2>Reuniões (${meetings.length})</h2>
  ${meetings.length === 0 ? `<div class="muted">Sem reuniões.</div>` : `
  <table><thead><tr><th>Título</th><th>Data</th><th>Status</th></tr></thead><tbody>
  ${meetings.map((m: any) => `<tr><td>${escapeHtml(m.title ?? "")}</td><td>${fmtDate(m.scheduled_at)}</td><td>${escapeHtml(m.status ?? "—")}</td></tr>`).join("")}
  </tbody></table>`}

  <h2>Etapas aprovadas (${approvedStages.length})</h2>
  ${approvedStages.length === 0 ? `<div class="muted">Nenhuma aprovação registrada.</div>` : `
  <table><thead><tr><th>Etapa</th><th>Data</th><th>Observação</th></tr></thead><tbody>
  ${approvedStages.map((a: any) => `<tr><td>${escapeHtml(a.stage_title ?? "—")}</td><td>${fmtDate(a.created_at)}</td><td>${escapeHtml(a.note ?? "—")}</td></tr>`).join("")}
  </tbody></table>`}

  ${includeDocuments ? `
  <h2>Documentos enviados (${documents.length})</h2>
  ${documents.length === 0 ? `<div class="muted">Nenhum documento enviado.</div>` : `
  <table><thead><tr><th>Nome</th><th>Etapa</th><th>Tipo</th><th>Tamanho</th><th>Enviado em</th><th>Visível ao cliente</th></tr></thead><tbody>
  ${documents.map((d: any) => `<tr><td>${escapeHtml(d.name ?? "—")}</td><td>${escapeHtml(d.stage_id ? (stages.find((st: any) => st.id === d.stage_id)?.title ?? "—") : "—")}</td><td>${escapeHtml(d.mime_type ?? "—")}</td><td>${d.size_bytes ? `${(d.size_bytes / 1024).toFixed(1)} KB` : "—"}</td><td>${fmtDate(d.created_at)}</td><td>${d.visible_to_client ? "Sim" : "Não"}</td></tr>`).join("")}
  </tbody></table>`}
  ` : ""}

  <h2>Anotações recentes (${notes.length})</h2>
  ${notes.length === 0 ? `<div class="muted">Sem anotações.</div>` : notes.map((n: any) => `
    <div style="margin:8px 0;padding:8px 10px;border-left:3px solid #059669;background:#f9fafb">
      <div style="font-weight:600;font-size:13px">${escapeHtml(n.title ?? "")} <span class="muted" style="font-weight:400">• ${fmtDate(n.noted_on)}</span></div>
      <div style="font-size:12.5px;white-space:pre-wrap">${escapeHtml(n.body ?? "")}</div>
    </div>`).join("")}

  <h2>Comunicação</h2>
  <div class="grid"><div><b>Mensagens trocadas:</b> ${s.messagesCount ?? 0}</div></div>`;

  return htmlShell(`Resumo — ${p.name ?? "Projeto"}`, logoUrl, o.name ?? "", body);
}

function buildClientFinancialHtml(data: any, logoUrl: string) {
  const c = data.client ?? {};
  const o = data.office ?? {};
  const projects = data.projects ?? [];
  const products = data.products ?? [];
  const productsByProject = new Map<string, any[]>();
  for (const pr of products) {
    const arr = productsByProject.get(pr.project_id) ?? [];
    arr.push(pr); productsByProject.set(pr.project_id, arr);
  }
  const totalBudget = projects.reduce((a: number, p: any) => a + (p.budget_cents ?? 0), 0);
  const totalProducts = products.reduce((a: number, pr: any) => a + (pr.price_cents ?? 0) * (pr.quantity ?? 1), 0);
  const totalGeral = totalBudget + totalProducts;
  const ativos = projects.filter((p: any) => p.status !== "completed" && p.status !== "archived").length;

  const body = `
  <h2>Cliente</h2>
  <div class="grid">
    <div><b>Nome:</b> ${escapeHtml(c.name ?? "—")}</div>
    <div><b>E-mail:</b> ${escapeHtml(c.email ?? "—")}</div>
    <div><b>Telefone:</b> ${escapeHtml(c.phone ?? "—")}</div>
    <div><b>Escritório:</b> ${escapeHtml(o.name ?? "—")}</div>
  </div>

  <h2>Resumo financeiro</h2>
  <div class="kpi">
    <div><div class="lbl">Projetos</div><div class="val">${projects.length}</div></div>
    <div><div class="lbl">Ativos</div><div class="val">${ativos}</div></div>
    <div><div class="lbl">Orçamentos</div><div class="val">${fmtMoney(totalBudget)}</div></div>
    <div><div class="lbl">Produtos</div><div class="val">${fmtMoney(totalProducts)}</div></div>
  </div>
  <p style="margin-top:12px;font-size:14px"><b>Total geral:</b> ${fmtMoney(totalGeral)}</p>

  <h2>Projetos (${projects.length})</h2>
  ${projects.length === 0 ? `<div class="muted">Sem projetos.</div>` : `
  <table><thead><tr><th>Projeto</th><th>Status</th><th>Início</th><th>Prazo</th><th>Orçamento</th><th>Produtos</th><th>Total</th></tr></thead><tbody>
  ${projects.map((p: any) => {
    const prods = productsByProject.get(p.id) ?? [];
    const prodTotal = prods.reduce((a: number, pr: any) => a + (pr.price_cents ?? 0) * (pr.quantity ?? 1), 0);
    return `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(statusLabel(p.status))}</td><td>${fmtDate(p.started_at)}</td><td>${fmtDate(p.deadline)}</td><td>${fmtMoney(p.budget_cents)}</td><td>${fmtMoney(prodTotal)}</td><td><b>${fmtMoney((p.budget_cents ?? 0) + prodTotal)}</b></td></tr>`;
  }).join("")}
  <tr><td colspan="4" style="text-align:right"><b>Total</b></td><td><b>${fmtMoney(totalBudget)}</b></td><td><b>${fmtMoney(totalProducts)}</b></td><td><b>${fmtMoney(totalGeral)}</b></td></tr>
  </tbody></table>`}
  `;
  return htmlShell(`Relatório financeiro — ${c.name ?? "Cliente"}`, logoUrl, o.name ?? "", body);
}

function buildOfficeFinancialHtml(data: any, logoUrl: string) {
  const o = data.office ?? {};
  const projects = data.projects ?? [];
  const clients = data.clients ?? [];
  const products = data.products ?? [];
  const clientMap = new Map(clients.map((c: any) => [c.id, c.name]));

  const productsByProject = new Map<string, any[]>();
  for (const pr of products) {
    const arr = productsByProject.get(pr.project_id) ?? [];
    arr.push(pr); productsByProject.set(pr.project_id, arr);
  }
  const totalBudget = projects.reduce((a: number, p: any) => a + (p.budget_cents ?? 0), 0);
  const totalProducts = products.reduce((a: number, pr: any) => a + (pr.price_cents ?? 0) * (pr.quantity ?? 1), 0);
  const totalGeral = totalBudget + totalProducts;
  const ativos = projects.filter((p: any) => p.status !== "completed" && p.status !== "archived").length;
  const concluidos = projects.filter((p: any) => p.status === "completed").length;

  // Aggregate per client
  const perClient = new Map<string, { name: string; count: number; budget: number; prods: number }>();
  for (const p of projects) {
    const key = p.client_id ?? "—";
    const name = (clientMap.get(p.client_id) as string) ?? "Sem cliente";
    const prods = productsByProject.get(p.id) ?? [];
    const prodTotal = prods.reduce((a: number, pr: any) => a + (pr.price_cents ?? 0) * (pr.quantity ?? 1), 0);
    const cur = perClient.get(key) ?? { name, count: 0, budget: 0, prods: 0 };
    cur.count += 1; cur.budget += (p.budget_cents ?? 0); cur.prods += prodTotal;
    perClient.set(key, cur);
  }
  const perClientArr = Array.from(perClient.values()).sort((a, b) => (b.budget + b.prods) - (a.budget + a.prods));

  const body = `
  <h2>Escritório</h2>
  <div class="grid">
    <div><b>Nome:</b> ${escapeHtml(o.name ?? "—")}</div>
    <div><b>Clientes cadastrados:</b> ${clients.length}</div>
  </div>

  <h2>Resumo financeiro geral</h2>
  <div class="kpi">
    <div><div class="lbl">Projetos</div><div class="val">${projects.length}</div></div>
    <div><div class="lbl">Ativos / Concluídos</div><div class="val">${ativos} / ${concluidos}</div></div>
    <div><div class="lbl">Orçamentos</div><div class="val">${fmtMoney(totalBudget)}</div></div>
    <div><div class="lbl">Produtos</div><div class="val">${fmtMoney(totalProducts)}</div></div>
  </div>
  <p style="margin-top:12px;font-size:14px"><b>Total geral:</b> ${fmtMoney(totalGeral)}</p>

  <h2>Receita por cliente (${perClientArr.length})</h2>
  ${perClientArr.length === 0 ? `<div class="muted">Sem dados.</div>` : `
  <table><thead><tr><th>Cliente</th><th>Projetos</th><th>Orçamentos</th><th>Produtos</th><th>Total</th></tr></thead><tbody>
  ${perClientArr.map((c) => `<tr><td>${escapeHtml(c.name)}</td><td>${c.count}</td><td>${fmtMoney(c.budget)}</td><td>${fmtMoney(c.prods)}</td><td><b>${fmtMoney(c.budget + c.prods)}</b></td></tr>`).join("")}
  <tr><td style="text-align:right"><b>Total</b></td><td><b>${projects.length}</b></td><td><b>${fmtMoney(totalBudget)}</b></td><td><b>${fmtMoney(totalProducts)}</b></td><td><b>${fmtMoney(totalGeral)}</b></td></tr>
  </tbody></table>`}

  <h2>Projetos (${projects.length})</h2>
  ${projects.length === 0 ? `<div class="muted">Sem projetos.</div>` : `
  <table><thead><tr><th>Projeto</th><th>Cliente</th><th>Status</th><th>Prazo</th><th>Orçamento</th><th>Produtos</th><th>Total</th></tr></thead><tbody>
  ${projects.map((p: any) => {
    const prods = productsByProject.get(p.id) ?? [];
    const prodTotal = prods.reduce((a: number, pr: any) => a + (pr.price_cents ?? 0) * (pr.quantity ?? 1), 0);
    return `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml((clientMap.get(p.client_id) as string) ?? "—")}</td><td>${escapeHtml(statusLabel(p.status))}</td><td>${fmtDate(p.deadline)}</td><td>${fmtMoney(p.budget_cents)}</td><td>${fmtMoney(prodTotal)}</td><td><b>${fmtMoney((p.budget_cents ?? 0) + prodTotal)}</b></td></tr>`;
  }).join("")}
  </tbody></table>`}
  `;
  return htmlShell(`Relatório financeiro geral — ${o.name ?? "Escritório"}`, logoUrl, o.name ?? "", body);
}

function RelatoriosPage() {
  const loadProjects = useServerFn(listProfessionalProjects);
  const loadSummary = useServerFn(getProfessionalProjectSummary);
  const loadOfficeFin = useServerFn(getOfficeFinancialReport);
  const loadClientFin = useServerFn(getClientFinancialReport);
  const [projetos, setProjetos] = useState<ProjetoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [includeDocs, setIncludeDocs] = useState(true);
  const [busyGlobal, setBusyGlobal] = useState<null | "office" | "client">(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = await getToken();
      if (!token) { setLoading(false); return; }
      const res = await loadProjects({ data: { accessToken: token } });
      setProjetos(res.projects as ProjetoRow[]);
      setLoading(false);
    })();
  }, [loadProjects]);

  const clientes = useMemo(() => {
    const map = new Map<string, { id: string | null; count: number }>();
    for (const p of projetos) {
      const cur = map.get(p.cliente) ?? { id: p.clientId, count: 0 };
      cur.count += 1;
      if (!cur.id && p.clientId) cur.id = p.clientId;
      map.set(p.cliente, cur);
    }
    return Array.from(map.entries())
      .filter(([c]) => c && c !== "—")
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [projetos]);

  const clientesFiltrados = useMemo(() => {
    if (!query.trim()) return clientes;
    const q = query.toLowerCase();
    return clientes.filter(([c]) => c.toLowerCase().includes(q));
  }, [clientes, query]);

  const projetosCliente = useMemo(
    () => (selectedClient ? projetos.filter((p) => p.cliente === selectedClient) : []),
    [projetos, selectedClient],
  );

  const selectedClientId = useMemo(() => {
    if (!selectedClient) return null;
    const found = clientes.find(([n]) => n === selectedClient);
    return found?.[1].id ?? null;
  }, [selectedClient, clientes]);

  async function baixarResumo(projectId: string, nome: string) {
    setDownloadingId(projectId);
    try {
      const token = await getToken();
      if (!token) return;
      const summary = await loadSummary({ data: { accessToken: token, projectId } });
      const logoUrl = `${window.location.origin}${logoAsset.url}`;
      const html = buildProjectSummaryHtml(summary, logoUrl, includeDocs);
      const safe = nome.replace(/[^a-z0-9-_ ]/gi, "_").trim() || "projeto";
      downloadBlob(html, `resumo_${safe}${includeDocs ? "" : "_sem-docs"}.html`);
    } catch (e) {
      console.error(e); alert("Não foi possível gerar o resumo.");
    } finally { setDownloadingId(null); }
  }

  const [previewingId, setPreviewingId] = useState<string | null>(null);
  async function visualizarResumo(projectId: string) {
    setPreviewingId(projectId);
    const win = window.open("", "_blank");
    if (win) win.document.write('<p style="font-family:sans-serif;padding:24px">Gerando resumo...</p>');
    try {
      const token = await getToken();
      if (!token) { win?.close(); return; }
      const summary = await loadSummary({ data: { accessToken: token, projectId } });
      const logoUrl = `${window.location.origin}${logoAsset.url}`;
      const html = buildProjectSummaryHtml(summary, logoUrl, includeDocs);
      if (win) { win.document.open(); win.document.write(html); win.document.close(); }
    } catch (e) {
      console.error(e); win?.close(); alert("Não foi possível gerar o resumo.");
    } finally { setPreviewingId(null); }
  }

  async function gerarFinanceiroEscritorio(action: "view" | "download") {
    setBusyGlobal("office");
    const win = action === "view" ? window.open("", "_blank") : null;
    if (win) win.document.write('<p style="font-family:sans-serif;padding:24px">Gerando relatório...</p>');
    try {
      const token = await getToken();
      if (!token) { win?.close(); return; }
      const data = await loadOfficeFin({ data: { accessToken: token } });
      const logoUrl = `${window.location.origin}${logoAsset.url}`;
      const html = buildOfficeFinancialHtml(data, logoUrl);
      if (action === "view" && win) { win.document.open(); win.document.write(html); win.document.close(); }
      else downloadBlob(html, `financeiro_escritorio.html`);
    } catch (e) {
      console.error(e); win?.close(); alert("Não foi possível gerar o relatório.");
    } finally { setBusyGlobal(null); }
  }

  async function gerarFinanceiroCliente(action: "view" | "download") {
    if (!selectedClientId) { alert("Cliente sem identificador."); return; }
    setBusyGlobal("client");
    const win = action === "view" ? window.open("", "_blank") : null;
    if (win) win.document.write('<p style="font-family:sans-serif;padding:24px">Gerando relatório...</p>');
    try {
      const token = await getToken();
      if (!token) { win?.close(); return; }
      const data = await loadClientFin({ data: { accessToken: token, clientId: selectedClientId } });
      const logoUrl = `${window.location.origin}${logoAsset.url}`;
      const html = buildClientFinancialHtml(data, logoUrl);
      const safe = (selectedClient ?? "cliente").replace(/[^a-z0-9-_ ]/gi, "_").trim();
      if (action === "view" && win) { win.document.open(); win.document.write(html); win.document.close(); }
      else downloadBlob(html, `financeiro_${safe}.html`);
    } catch (e) {
      console.error(e); win?.close(); alert("Não foi possível gerar o relatório.");
    } finally { setBusyGlobal(null); }
  }

  if (!hasFeature((getSession()?.plan ?? "trial") as Plan, "relatorios")) {
    return (
      <AppShell role="profissional" nav={nav} title="Relatórios">
        <div className="max-w-xl mx-auto mt-10 bg-white border border-border rounded-xl p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Lock className="h-5 w-5 text-amber-700" />
          </div>
          <h2 className="mt-4 text-[19px] font-semibold tracking-tight text-ink">
            Relatórios são um recurso Premium
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Gere resumos de projetos e relatórios financeiros do escritório e por cliente
            nos planos Premium e Enterprise.
          </p>
          <Link
            to="/planos"
            className="mt-5 inline-flex items-center justify-center px-4 h-10 rounded-md bg-primary text-primary-foreground text-[13px] font-medium"
          >
            Ver planos
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="profissional" nav={nav} title="Relatórios">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gere resumos de projetos e relatórios financeiros do escritório e por cliente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => gerarFinanceiroEscritorio("view")}
            disabled={busyGlobal === "office"}
            className="inline-flex items-center gap-1.5 px-3 h-9 border border-border bg-white hover:bg-secondary/40 text-ink rounded-md text-[12.5px] font-medium disabled:opacity-60"
          >
            {busyGlobal === "office" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            Ver financeiro geral
          </button>
          <button
            onClick={() => gerarFinanceiroEscritorio("download")}
            disabled={busyGlobal === "office"}
            className="inline-flex items-center gap-1.5 px-3 h-9 bg-ink hover:bg-black text-white rounded-md text-[12.5px] font-medium disabled:opacity-60"
          >
            <Building2 className="h-3.5 w-3.5" />
            Financeiro do escritório
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar cliente..."
                className="w-full h-9 pl-8 pr-3 text-[13px] border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Carregando...
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                Nenhum cliente encontrado.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {clientesFiltrados.map(([nome, info]) => (
                  <li key={nome}>
                    <button
                      onClick={() => setSelectedClient(nome)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-secondary/40 flex items-center gap-2 ${
                        selectedClient === nome ? "bg-emerald-50" : ""
                      }`}
                    >
                      <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-ink truncate">{nome}</div>
                        <div className="text-[11.5px] text-muted-foreground">{info.count} projeto(s)</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {!selectedClient ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-[14px] font-semibold text-ink">Selecione um cliente</h3>
              <p className="text-[12.5px] text-muted-foreground mt-1 max-w-sm mx-auto">
                Use a busca ao lado para localizar um cliente e baixar o resumo dos projetos dele, ou gere o relatório financeiro geral acima.
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[13px] font-semibold text-ink">{selectedClient}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {projetosCliente.length} projeto(s) cadastrado(s)
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => gerarFinanceiroCliente("view")}
                    disabled={busyGlobal === "client" || !selectedClientId}
                    className="inline-flex items-center gap-1.5 px-2.5 h-8 border border-border bg-white hover:bg-secondary/40 text-ink rounded-md text-[12px] font-medium disabled:opacity-60"
                  >
                    {busyGlobal === "client" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                    Ver financeiro
                  </button>
                  <button
                    onClick={() => gerarFinanceiroCliente("download")}
                    disabled={busyGlobal === "client" || !selectedClientId}
                    className="inline-flex items-center gap-1.5 px-2.5 h-8 bg-ink hover:bg-black text-white rounded-md text-[12px] font-medium disabled:opacity-60"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Financeiro do cliente
                  </button>
                </div>
              </div>

              <div className="px-4 py-2 border-b border-border bg-secondary/20">
                <label className="inline-flex items-center gap-2 text-[12px] text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDocs}
                    onChange={(e) => setIncludeDocs(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Incluir documentos no resumo do projeto
                </label>
              </div>

              {projetosCliente.length === 0 ? (
                <div className="p-8 text-center text-[12.5px] text-muted-foreground">
                  Nenhum projeto para este cliente.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {projetosCliente.map((p) => (
                    <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-ink truncate">{p.nome}</div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {p.fase} • {p.progresso}% • {p.status}
                        </div>
                      </div>
                      <button
                        onClick={() => visualizarResumo(p.id)}
                        disabled={previewingId === p.id}
                        title="Visualizar resumo"
                        className="inline-flex items-center justify-center w-8 h-8 border border-border bg-white hover:bg-secondary/40 text-ink rounded-md disabled:opacity-60"
                      >
                        {previewingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => baixarResumo(p.id, p.nome)}
                        disabled={downloadingId === p.id}
                        className="inline-flex items-center gap-1.5 px-3 h-8 bg-ink hover:bg-black text-white rounded-md text-[12px] font-medium disabled:opacity-60"
                      >
                        {downloadingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Baixar resumo
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
