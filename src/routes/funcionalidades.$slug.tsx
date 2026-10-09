import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  LayoutDashboard, FolderOpen, Users, Calendar, MessageSquare,
  UsersRound, Wallet, FileText, Sparkles,
  ArrowRight, Check, Zap, Shield, Award, Quote,
  Plus, Download, Eye, ClipboardList, User as UserIcon,
  Camera, Clock, Calendar as CalendarIcon, Sun, CheckCircle2,
} from "lucide-react";
import type { ComponentType, ReactElement } from "react";
import dashboardBanner from "@/assets/dashboard-banner-v3.jpg.asset.json";

/* ============================================================
   Cada demo abaixo espelha o visual real do painel profissional.
   ============================================================ */

/* Frame padrão de "janela do painel" (chrome + área) */
function PanelFrame({ title, children }: { title: string; children: ReactElement }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-surface">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-white">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
          <span className="ml-3 text-[11px] font-medium text-muted-foreground">{title}</span>
        </div>
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">painel · arqhub</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

/* ---------- Dashboard (escritório) ---------- */
const DemoDashboard = () => (
  <PanelFrame title="Dashboard">
    <div>
      {/* Banner claro com imagem + KPIs translúcidos no rodapé */}
      <div className="relative rounded-xl border border-border overflow-hidden mb-3 aspect-[16/7]">
        <img
          src={dashboardBanner.url}
          alt="Banner do escritório"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end">
          <div className="text-[11px] text-white/80">Bom dia,</div>
          <div className="text-[16px] font-semibold text-[#8FBF9F] leading-tight drop-shadow">Estúdio Vila</div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[
              { l: "Projetos", v: "12" },
              { l: "Clientes", v: "37" },
              { l: "Receita", v: "R$ 84k" },
              { l: "Agenda", v: "8" },
            ].map((s) => (
              <div key={s.l} className="rounded-md bg-white/15 backdrop-blur-md border border-white/20 px-2 py-1.5">
                <div className="text-[8.5px] font-medium uppercase tracking-wider text-white/75">{s.l}</div>
                <div className="text-[12.5px] font-semibold tabular-nums text-white">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Cards abaixo do banner */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white border border-border p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Próxima agenda</div>
          <div className="text-[12px] font-medium text-ink mt-0.5">Reunião · Marina</div>
          <div className="text-[10.5px] text-muted-foreground">Hoje · 14:30</div>
        </div>
        <div className="rounded-lg bg-white border border-border p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Últimas mensagens</div>
          <div className="text-[12px] font-medium text-ink mt-0.5">3 não lidas</div>
          <div className="text-[10.5px] text-muted-foreground">Vila Nova, Aurora, Loft 32</div>
        </div>
      </div>
    </div>
  </PanelFrame>
);
const DemoClientes = () => (
  <PanelFrame title="Clientes">
    <div className="rounded-xl bg-white border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="text-[12px] font-semibold text-ink">Base de clientes</div>
        <span className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-medium">
          <Plus className="h-3 w-3" /> Novo cliente
        </span>
      </div>
      <ul className="divide-y divide-border">
        {[
          ["Marina Souza", "Residencial", "R$ 32.400"],
          ["Bruno Lima", "Retrofit", "R$ 18.900"],
          ["Construtora Vale", "Comercial", "R$ 84.000"],
          ["Pedro Antunes", "Reforma", "R$ 12.600"],
        ].map(([n, tipo, v]) => (
          <li key={n} className="px-4 py-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent text-primary-dark flex items-center justify-center text-[12px] font-semibold shrink-0">{n[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium text-ink truncate">{n}</div>
              <div className="text-[11px] text-muted-foreground">{tipo}</div>
            </div>
            <span className="text-[11.5px] font-semibold tabular-nums text-ink">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  </PanelFrame>
);

/* ---------- Agenda da semana ---------- */
const DemoAgenda = () => {
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const eventos: Record<string, { t: string; tone: string }[]> = {
    Seg: [{ t: "Reunião · Marina", tone: "bg-primary/10 text-primary-dark border-primary/20" }],
    Ter: [{ t: "Visita técnica", tone: "bg-amber-50 text-amber-700 border-amber-200" }],
    Qua: [
      { t: "Entrega executivo", tone: "bg-primary/10 text-primary-dark border-primary/20" },
      { t: "Aprovação", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    ],
    Qui: [],
    Sex: [{ t: "Obra · Vila Nova", tone: "bg-violet-50 text-violet-700 border-violet-200" }],
    Sáb: [],
  };
  return (
    <PanelFrame title="Agenda da semana">
      <div className="rounded-xl bg-white border border-border overflow-hidden -mx-1 sm:mx-0">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 divide-x divide-border min-w-[520px]">
            {dias.map((d, i) => (
              <div key={d} className="min-h-[128px]">
                <div className="px-3 py-2 border-b border-border flex items-baseline justify-between">
                  <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{d}</span>
                  <span className="text-[13px] font-semibold tabular-nums text-ink">{9 + i}</span>
                </div>
                <div className="p-2 space-y-1.5">
                  {eventos[d].map((e) => (
                    <div key={e.t} className={`text-[10.5px] rounded-md border px-2 py-1 leading-tight ${e.tone}`}>{e.t}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PanelFrame>
  );
};


/* ---------- Equipe ---------- */
const DemoEquipe = () => (
  <PanelFrame title="Equipe">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        ["AM", "Ana Mendes", "Arquiteta titular"],
        ["JP", "João Pires", "Arquiteto pleno"],
        ["RS", "Rita Salles", "Coordenadora"],
        ["CL", "Caio Lopes", "Estagiário"],
      ].map(([i, n, r]) => (
        <div key={i} className="rounded-xl bg-white border border-border p-3 text-center">
          <div className="h-12 w-12 rounded-full bg-primary text-white font-semibold flex items-center justify-center mx-auto text-[13px]">{i}</div>
          <div className="text-[12.5px] font-medium text-ink mt-2 truncate">{n}</div>
          <div className="text-[10.5px] text-muted-foreground truncate">{r}</div>
          <span className="inline-block mt-1.5 text-[9.5px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Ativo</span>
        </div>
      ))}
    </div>
  </PanelFrame>
);

/* ---------- Financeiro ---------- */
const DemoFinanceiro = () => (
  <PanelFrame title="Financeiro">
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-border bg-gradient-to-br from-primary to-primary-dark text-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10.5px] uppercase tracking-wider text-white/70">Receita prevista</div>
          <Wallet className="h-3.5 w-3.5 text-white/70" />
        </div>
        <div className="mt-1 text-[24px] font-semibold tabular-nums">R$ 128.400</div>
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/15 pt-3 text-[11.5px]">
          <div><div className="text-white/60 text-[10px] uppercase tracking-wider">Recebido</div><div className="font-semibold tabular-nums">R$ 82.400</div></div>
          <div><div className="text-white/60 text-[10px] uppercase tracking-wider">Em atraso</div><div className="font-semibold tabular-nums text-amber-200">R$ 6.900</div></div>
          <div><div className="text-white/60 text-[10px] uppercase tracking-wider">Contratos</div><div className="font-semibold tabular-nums">9</div></div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-white p-3">
        <div className="flex items-end gap-1.5 h-16">
          {[24, 38, 32, 52, 44, 68, 60, 84].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
          {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago"].map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
    </div>
  </PanelFrame>
);

/* ---------- Mensagens ---------- */
const DemoMensagens = () => (
  <PanelFrame title="Mensagens">
    <div className="rounded-xl bg-white border border-border overflow-hidden">
      {[
        { n: "Marina Souza", p: "Residência Vila Nova", m: "Aprovei o executivo, podem seguir.", u: true, t: "2 min" },
        { n: "Bruno Lima", p: "Loft Industrial 32", m: "Recebi as fotos, obrigado.", u: false, t: "1 h" },
        { n: "Construtora Vale", p: "Edifício Aurora", m: "Segue anexo o cronograma revisado.", u: true, t: "3 h" },
        { n: "Pedro Antunes", p: "Reforma 204", m: "Consegue passar hoje na obra?", u: false, t: "ontem" },
      ].map((c, i) => (
        <div key={i} className={`px-4 py-2.5 flex items-start gap-3 ${i > 0 ? "border-t border-border" : ""}`}>
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-semibold shrink-0">{c.n[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-medium text-ink truncate">{c.n}</span>
              <span className="text-[10.5px] text-muted-foreground">· {c.p}</span>
              {c.u && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
            </div>
            <div className="text-[11.5px] text-muted-foreground truncate">{c.m}</div>
          </div>
          <span className="text-[10.5px] text-muted-foreground whitespace-nowrap">{c.t}</span>
        </div>
      ))}
    </div>
  </PanelFrame>
);

/* ---------- Projetos ---------- */
const DemoProjetos = () => (
  <PanelFrame title="Projetos">
    <div className="space-y-2.5">
      {[
        { n: "Residência Vila Nova", c: "Marina Souza", pct: 64, s: "Em obra", tone: "bg-primary/10 text-primary-dark" },
        { n: "Loft Industrial 32", c: "Bruno Lima", pct: 28, s: "Projeto", tone: "bg-amber-50 text-amber-700" },
        { n: "Edifício Aurora", c: "Construtora Vale", pct: 82, s: "Executivo", tone: "bg-violet-50 text-violet-700" },
        { n: "Casa Praia Norte", c: "Pedro Antunes", pct: 100, s: "Entregue", tone: "bg-emerald-50 text-emerald-700" },
      ].map((p) => (
        <div key={p.n} className="rounded-xl border border-border bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-ink truncate">{p.n}</div>
              <div className="text-[11px] text-muted-foreground truncate">{p.c}</div>
            </div>
            <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full ${p.tone}`}>{p.s}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${p.pct}%` }} />
            </div>
            <span className="text-[10.5px] tabular-nums text-muted-foreground">{p.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  </PanelFrame>
);

/* ---------- Relatórios ---------- */
const DemoRelatorios = () => (
  <PanelFrame title="Relatórios">
    <div className="space-y-3">
      <div className="rounded-xl bg-white border border-border p-3 flex items-center gap-2">
        <div className="flex-1 rounded-md bg-secondary px-3 py-1.5 text-[11.5px] text-muted-foreground">Buscar cliente…</div>
        <span className="inline-flex items-center gap-1 rounded-md bg-white border border-border px-2.5 py-1.5 text-[11px] font-medium text-ink">
          <Eye className="h-3 w-3" /> Ver
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-[11px] font-medium">
          <Download className="h-3 w-3" /> Baixar
        </span>
      </div>
      <div className="rounded-xl bg-white border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Resumo do projeto</div>
          <span className="text-[10.5px] uppercase tracking-widest text-primary-dark font-semibold">ArqHub</span>
        </div>
        <div className="mt-1.5 text-[15px] font-semibold text-ink">Residência Vila Nova · Marina Souza</div>
        <ul className="mt-3 space-y-1.5">
          {["Etapa aprovada · Estudo preliminar","Etapa aprovada · Anteprojeto","Documentos enviados: 12","Avanço financeiro: 64%"].map(t => (
            <li key={t} className="text-[12px] flex items-center gap-2 text-ink"><Check className="h-3.5 w-3.5 text-primary" />{t}</li>
          ))}
        </ul>
      </div>
    </div>
  </PanelFrame>
);

/* ---------- IA ArqHub ---------- */
const DemoIA = () => (
  <PanelFrame title="IA ArqHub">
    <div className="rounded-xl bg-white border border-border p-4">
      <div className="flex items-center gap-2 text-[11px] text-primary-dark font-semibold">
        <Sparkles className="h-3.5 w-3.5" /> Sugestão da IA
      </div>
      <div className="mt-2 text-[12.5px] text-ink leading-relaxed">
        Estimativa para <strong>120 m² de alvenaria estrutural</strong> com base em projetos similares na sua região:
      </div>
      <div className="mt-3 rounded-lg bg-accent/60 border border-primary/15 p-3 text-[13px] font-semibold text-primary-dark tabular-nums">
        R$ 22.800 — R$ 26.400
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Otimizar cronograma","Sugerir compras","Revisar orçamento"].map((c) => (
          <span key={c} className="text-[10.5px] rounded-full bg-secondary text-ink px-2.5 py-1 border border-border">{c}</span>
        ))}
      </div>
    </div>
  </PanelFrame>
);

/* ---------- Portal do Cliente ---------- */
const ETAPAS = [
  "Levantamento", "Briefing", "Estudo Prel.", "Anteprojeto",
  "Legal", "Executivo", "3D", "Entrega",
];
const DemoCliente = () => (
  <PanelFrame title="Portal do cliente">
    <div>
      {/* banner do cliente */}
      <div className="relative rounded-xl overflow-hidden aspect-[16/6] mb-3">
        <img src={dashboardBanner.url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/75">Projeto</div>
          <div className="text-[14px] font-semibold text-white leading-tight">Residência Vila Nova</div>
          <div className="text-[10.5px] text-white/80 mt-0.5">Início 03/2025 · Entrega prevista 11/2025</div>
        </div>
      </div>
      {/* timeline horizontal */}
      <div className="rounded-xl bg-white border border-border p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold text-ink">Progresso do projeto</div>
          <div className="text-[11px] font-semibold text-primary tabular-nums">45%</div>
        </div>
        <div className="flex items-center gap-1">
          {ETAPAS.map((e, i) => {
            const done = i < 3;
            const current = i === 3;
            return (
              <div key={e} className="flex-1 flex flex-col items-center">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold ${
                  done ? "bg-primary text-white" : current ? "bg-accent text-primary-dark ring-2 ring-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <div className={`text-[8.5px] mt-1 truncate w-full text-center ${current ? "font-semibold text-primary-dark" : "text-muted-foreground"}`}>{e}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* KPI + próximo compromisso */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white border border-border p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" /> Próximo compromisso
          </div>
          <div className="text-[12px] font-medium text-ink mt-0.5">Reunião de aprovação</div>
          <div className="text-[10.5px] text-primary-dark font-medium">Amanhã · 10:00</div>
        </div>
        <div className="rounded-lg bg-white border border-border p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Aprovações pendentes</div>
          <div className="text-[18px] font-semibold text-ink tabular-nums">2</div>
        </div>
      </div>
    </div>
  </PanelFrame>
);

/* ---------- Diário de obra ---------- */
const DemoDiario = () => (
  <PanelFrame title="Diário de obra">
    <div className="max-w-sm mx-auto">
      <div className="bg-white border border-border/70 rounded-2xl overflow-hidden shadow-[0_2px_12px_-6px_rgba(0,0,0,0.08)]">
        {/* Header com gradiente */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-br from-emerald-50 via-white to-white border-b border-border/60">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
            <CalendarIcon className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-ink leading-tight">Diário de Obra</div>
            <div className="text-[10px] text-muted-foreground">Segunda-feira</div>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Data + clima */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/70 bg-secondary/20 p-2.5">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                <CalendarIcon className="h-2.5 w-2.5" /> Data
              </div>
              <div className="text-[12px] font-semibold text-ink leading-tight">15 Jul 2025</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Segunda-feira</div>
            </div>
            <div className="rounded-lg border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50/40 p-2.5">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-amber-700/80 mb-1">
                <Sun className="h-2.5 w-2.5" /> Temperatura
              </div>
              <div className="text-[14px] font-bold text-ink leading-none tabular-nums">28°C</div>
              <div className="text-[10px] text-muted-foreground mt-1">Previsão do dia</div>
            </div>
          </div>

          {/* Fotos do dia */}
          <div className="rounded-lg border border-border/70 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink">
                <Camera className="h-3 w-3" /> Fotos do dia
              </div>
              <span className="text-[9.5px] text-muted-foreground">3 fotos</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="aspect-square rounded bg-gradient-to-br from-stone-200 to-stone-300" />
              <div className="aspect-square rounded bg-gradient-to-br from-stone-300 to-stone-400" />
              <div className="aspect-square rounded bg-gradient-to-br from-stone-200 to-stone-300" />
            </div>
          </div>

          {/* Atividades */}
          <div className="rounded-lg border border-border/70 p-2.5">
            <div className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink mb-1.5">
              <ClipboardList className="h-3 w-3" /> Atividades do dia
            </div>
            <ul className="space-y-1">
              <li className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span className="text-[10.5px] text-ink truncate">Concretagem laje</span>
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0">Concluída</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="text-[10.5px] text-ink truncate">Instalação hidráulica</span>
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0">Em andamento</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span className="text-[10.5px] text-ink truncate">Alvenaria pavimento térreo</span>
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0">Concluída</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </PanelFrame>
);



/* ============================================================
   Catálogo — apenas o que existe no painel profissional.
   ============================================================ */

type Feature = {
  icon: ComponentType<{ className?: string }>;
  category: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  demo: () => ReactElement;
};

export const FEATURES: Record<string, Feature> = {
  "dashboard": {
    icon: LayoutDashboard, category: "Visão geral", title: "Dashboard",
    tagline: "O panorama executivo do seu escritório.",
    description: "Um painel único com projetos, receita, agenda e alertas em tempo real. Tudo que importa em uma tela clean.",
    highlights: ["Banner com saudação e status da assinatura","KPIs de projetos, clientes, receita e tarefas","Próximas agendas e projetos em atenção","Últimas mensagens e resumo financeiro"],
    demo: DemoDashboard,
  },
  "clientes": {
    icon: Users, category: "Relacionamento", title: "Clientes",
    tagline: "Base de clientes completa e organizada.",
    description: "Cadastre clientes, acompanhe projetos vinculados, valores e histórico de conversas — tudo em um só lugar.",
    highlights: ["Ficha completa por cliente","Vínculo direto com projetos e contratos","Histórico de mensagens integrado","Convite ao portal do cliente"],
    demo: DemoClientes,
  },
  "cronograma": {
    icon: Calendar, category: "Rotina", title: "Agenda da semana",
    tagline: "A semana do escritório em um calendário claro.",
    description: "Visualize reuniões, entregas, visitas e aprovações da equipe em um calendário semanal fácil de ler.",
    highlights: ["Visão semanal por dia","Eventos por projeto e cliente","Cores por tipo de atividade","Sincronização com projetos"],
    demo: DemoAgenda,
  },
  "equipe": {
    icon: UsersRound, category: "Colaboração", title: "Equipe",
    tagline: "Gestão da equipe do escritório.",
    description: "Cadastre colaboradores, defina cargos e permissões e acompanhe quem está ativo.",
    highlights: ["Cards visuais por colaborador","Papéis e permissões","Status ativo/inativo","Convite por e-mail"],
    demo: DemoEquipe,
  },
  "financeiro": {
    icon: Wallet, category: "Financeiro", title: "Financeiro",
    tagline: "A vida financeira do escritório em um painel.",
    description: "KPIs de receita prevista, recebido, em atraso e contratos ativos, com gráficos mensais e ocultação de valores por privacidade.",
    highlights: ["Receita prevista, recebida e em atraso","Gráfico mensal de faturamento","Distribuição por status","Ocultar valores com um clique"],
    demo: DemoFinanceiro,
  },
  "mensagens": {
    icon: MessageSquare, category: "Comunicação", title: "Mensagens",
    tagline: "Todas as conversas com clientes, num só lugar.",
    description: "Lista unificada de conversas por cliente e projeto, com filtros de lidas, não lidas, respondidas e não respondidas.",
    highlights: ["Lista de conversas por cliente","Filtros por status","Busca rápida","Abre o chat direto no projeto"],
    demo: DemoMensagens,
  },
  "projetos": {
    icon: FolderOpen, category: "Gestão", title: "Projetos",
    tagline: "Todos os projetos do escritório organizados.",
    description: "Acompanhe status, fase, cliente e avanço de cada projeto, com busca, filtros e progresso visual.",
    highlights: ["Cards de projeto com status","Barra de avanço por projeto","Busca e filtros","Documentos, contrato e chat por projeto"],
    demo: DemoProjetos,
  },
  "relatorios": {
    icon: FileText, category: "Documentação", title: "Relatórios",
    tagline: "Relatórios profissionais com a marca do escritório.",
    description: "Gere resumos financeiros e de projeto com etapas aprovadas, documentos enviados e marca d'água ArqHub. Visualize antes de baixar.",
    highlights: ["Financeiro geral do escritório","Financeiro por cliente","Resumo de projeto com documentos","Visualizar e baixar em PDF"],
    demo: DemoRelatorios,
  },
  "ia-arqhub": {
    icon: Sparkles, category: "Inteligência", title: "IA ArqHub",
    tagline: "Assistente inteligente para o dia a dia do escritório.",
    description: "Sugestões de orçamento, otimização de cronogramas e recomendações a partir dos dados dos seus projetos.",
    highlights: ["Estimativas por região e tipologia","Sugestões de compras e materiais","Otimização de cronogramas","Aprende com seus projetos"],
    demo: DemoIA,
  },
  "portal-do-cliente": {
    icon: UserIcon, category: "Cliente", title: "Portal do cliente",
    tagline: "A experiência premium que seu cliente vê.",
    description: "Cada cliente entra em um painel próprio com banner do projeto, linha do tempo das 8 etapas, próximo compromisso, aprovações pendentes e chat direto com o escritório.",
    highlights: ["Banner com nome, início e entrega prevista","Linha do tempo horizontal com 8 etapas","Próximo compromisso e aprovações pendentes","Chat, documentos e diário sem downloads não autorizados"],
    demo: DemoCliente,
  },
  "diario-de-obra": {
    icon: ClipboardList, category: "Obra", title: "Diário de obra",
    tagline: "Registro visual do avanço da obra, dia após dia.",
    description: "Fotos, vídeos, clima, equipe e notas datadas. Compartilhado direto no portal do cliente e alimenta relatórios automaticamente.",
    highlights: ["Entradas datadas com clima e equipe","Fotos e vídeos por dia","Histórico completo por projeto","Compartilhado no portal do cliente"],
    demo: DemoDiario,
  },
};

/* Redireciona slugs antigos para os novos */
export const SLUG_ALIASES: Record<string, string> = {
  "gestao-de-projetos": "projetos",
  "gestao-de-tarefas": "cronograma",
  "orcamentos": "financeiro",
  "financeiro-geral": "financeiro",
  "financeiro-por-projeto": "financeiro",
  "fluxo-de-caixa": "financeiro",
  "gestao-de-arquivos": "projetos",
  "portfolio-digital": "clientes",
  "apresentacao-de-projetos": "projetos",
  "orcamentos-inteligentes": "ia-arqhub",
  "levantamento-quantitativo": "ia-arqhub",
  "sugestao-de-compras": "ia-arqhub",
  "planejamento-de-obra": "ia-arqhub",
  "notificacoes": "dashboard",
  "historico": "projetos",
  "timeline": "projetos",
  "compartilhamentos": "clientes",
};

export const Route = createFileRoute("/funcionalidades/$slug")({
  loader: ({ params }) => {
    const alias = SLUG_ALIASES[params.slug];
    if (alias && FEATURES[alias]) {
      throw redirect({ to: "/funcionalidades/$slug", params: { slug: alias }, replace: true });
    }
    if (!FEATURES[params.slug]) throw notFound();
    return null;
  },
  head: ({ params }) => {
    const key = SLUG_ALIASES[params.slug] ?? params.slug;
    const f = FEATURES[key];
    const title = f ? `${f.title} — ArqHub` : "ArqHub";
    const desc = f?.tagline ?? "";
    return { meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }] };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-6 py-24 text-center">
        <div>
          <h1 className="text-3xl font-bold">Funcionalidade não encontrada</h1>
          <Link to="/" className="inline-block mt-4 text-primary-dark underline">Voltar para a página inicial</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: () => <div className="p-10">Erro ao carregar.</div>,
  component: FeaturePage,
});

function FeaturePage() {
  const { slug } = Route.useParams();
  const key = SLUG_ALIASES[slug] ?? slug;
  const f = FEATURES[key]!;
  const Icon = f.icon;
  const Demo = f.demo;

  

  const beneficios = [
    { Icon: Zap, title: "Ganho de tempo real", text: "Reduza tarefas repetitivas e centralize as informações do escritório numa única ferramenta." },
    { Icon: Shield, title: "Segurança e controle", text: "Permissões por papel, histórico e backups automáticos — seus dados protegidos por padrão." },
    { Icon: Award, title: "Padrão de escritório premium", text: "Entregue a experiência que clientes de alto valor esperam, do briefing à entrega final." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-white border-b border-border">
          <div
            className="absolute inset-0 opacity-[0.6] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 14% 12%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 45%), radial-gradient(circle at 88% 60%, color-mix(in oklab, var(--primary) 7%, transparent), transparent 55%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, var(--ink) 0 1px, transparent 1px 72px), repeating-linear-gradient(90deg, var(--ink) 0 1px, transparent 1px 72px)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-10 pb-12 sm:pb-16">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-ink transition-colors"
            >
              ← Voltar
            </Link>

            <div className="mt-8 sm:mt-10 grid lg:grid-cols-[1.05fr_1fr] gap-8 sm:gap-10 lg:gap-14 items-center">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-3 text-[10.5px] uppercase tracking-[0.28em] text-primary font-semibold">
                  <span className="h-px w-6 sm:w-8 bg-primary" />
                  {f.category}
                </div>
                <h1 className="mt-4 sm:mt-5 font-display font-semibold text-[32px] sm:text-[48px] lg:text-[60px] leading-[1.05] tracking-[-0.028em] text-ink">
                  {f.title}
                </h1>
                <p className="mt-4 sm:mt-5 text-[15px] sm:text-[17px] leading-[1.55] text-ink-muted max-w-xl">
                  {f.tagline}
                </p>

                <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to="/cadastro"
                    className="group inline-flex items-center gap-2 bg-ink text-white px-5 sm:px-6 h-11 rounded-full text-[13px] font-semibold hover:bg-primary transition-colors shadow-sm"
                  >
                    Começar gratuitamente
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/planos"
                    className="inline-flex items-center gap-2 text-ink/80 hover:text-ink px-5 h-11 rounded-full text-[13px] font-medium border border-border hover:border-border-strong transition-colors"
                  >
                    Ver planos
                  </Link>
                </div>

                <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> 14 dias grátis</span>
                  <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Sem cartão</span>
                  <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Suporte humano</span>
                </div>
              </div>

              {/* Preview real do painel */}
              <div className="relative min-w-0">
                <div className="absolute -inset-6 sm:-inset-8 rounded-3xl bg-primary/10 blur-3xl pointer-events-none" />
                <div className="relative">
                  <Demo />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* O QUE É */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-12 sm:pt-20 pb-4">
          <div className="grid lg:grid-cols-[180px_1fr] gap-6 lg:gap-10">
            <div className="text-[10.5px] uppercase tracking-[0.28em] text-muted-foreground font-semibold lg:pt-2">
              O que é
            </div>
            <div>
              <p className="font-display text-[20px] sm:text-[28px] leading-[1.3] tracking-[-0.015em] text-ink font-medium">
                {f.description}
              </p>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid sm:grid-cols-3 gap-4">
            {beneficios.map((b) => (
              <div key={b.title} className="rounded-2xl bg-white border border-border p-5 sm:p-6 hover:border-primary/30 hover:shadow-[0_20px_50px_-30px_rgba(16,24,40,0.2)] transition-all">
                <div className="h-10 w-10 rounded-xl bg-accent text-primary border border-primary/15 flex items-center justify-center">
                  <b.Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 font-display text-[17px] sm:text-[18px] tracking-[-0.015em] text-ink font-semibold">{b.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-[1.6] text-ink-muted">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RECURSOS */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="rounded-2xl bg-white border border-border p-6 sm:p-8 lg:p-10">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-16 items-start">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.28em] text-muted-foreground font-semibold">
                  Recursos inclusos
                </div>
                <h2 className="mt-3 font-display text-[24px] sm:text-[32px] leading-[1.1] tracking-[-0.024em] text-ink font-semibold">
                  O que você tem em {f.title}.
                </h2>
                <p className="mt-4 text-[14px] leading-[1.65] text-ink-muted">
                  Sem módulos extras, sem cobranças escondidas. Tudo integrado à plataforma ArqHub.
                </p>
                <div className="mt-6 flex items-center gap-2 text-[12px] text-primary-dark font-medium">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent"><Icon className="h-3.5 w-3.5" /></span>
                  {f.category}
                </div>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-4">
                {f.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3">
                    <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/12 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <Check className="h-3 w-3" />
                    </span>
                    <div className="text-[13.5px] font-medium text-ink leading-snug">{h}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* O QUE VOCÊ GANHA — comparação dos 9 módulos */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.28em] text-primary font-semibold">
                O que você ganha
              </div>
              <h2 className="mt-2 font-display text-[24px] sm:text-[32px] leading-[1.1] tracking-[-0.024em] text-ink font-semibold">
                Os 9 módulos do painel, comparados.
              </h2>
              <p className="mt-2 text-[13.5px] sm:text-[14px] text-ink-muted max-w-2xl">
                Ao contratar o ArqHub, você recebe todos estes módulos integrados. Veja o que cada um resolve.
              </p>
            </div>
            <Link
              to="/planos"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary-dark hover:gap-2.5 transition-all shrink-0"
            >
              Ver planos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(FEATURES).map(([s, r]) => {
              const RIcon = r.icon;
              const active = s === key;
              return (
                <Link
                  key={s}
                  to="/funcionalidades/$slug"
                  params={{ slug: s }}
                  className={`group relative rounded-2xl border p-4 sm:p-5 transition-all ${
                    active
                      ? "border-primary/40 bg-accent/50 shadow-[0_20px_50px_-30px_rgba(16,24,40,0.25)]"
                      : "border-border bg-white hover:border-primary/30 hover:shadow-[0_20px_50px_-30px_rgba(16,24,40,0.2)]"
                  }`}
                >
                  {active && (
                    <span className="absolute top-3 right-3 text-[9.5px] uppercase tracking-wider bg-primary text-white px-1.5 py-0.5 rounded-full font-semibold">
                      Você está aqui
                    </span>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-accent text-primary border border-primary/15 flex items-center justify-center shrink-0">
                      <RIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">{r.category}</div>
                      <h3 className="font-display text-[15.5px] tracking-[-0.015em] text-ink font-semibold truncate">{r.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-[12.5px] text-ink-muted leading-snug line-clamp-2">{r.tagline}</p>
                  <ul className="mt-3 space-y-1.5">
                    {r.highlights.slice(0, 2).map((h) => (
                      <li key={h} className="flex items-start gap-1.5 text-[11.5px] text-ink leading-snug">
                        <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span className="truncate">{h}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              );
            })}
          </div>
        </section>


        {/* DEPOIMENTO */}
        <section className="relative overflow-hidden bg-white border-y border-border">
          <div
            className="absolute inset-0 opacity-60 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 55%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-20 text-center">
            <Quote className="h-7 w-7 text-primary mx-auto" />
            <p className="mt-5 font-display text-[22px] sm:text-[26px] leading-[1.4] tracking-[-0.015em] text-ink font-medium">
              "Trocamos cinco ferramentas por uma só. {f.title} mudou a forma como o escritório opera — e como o cliente percebe nosso trabalho."
            </p>
            <div className="mt-6 text-[11.5px] uppercase tracking-[0.22em] text-muted-foreground">
              Camila Ribeiro · Arquiteta titular · CR Arquitetura
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark text-white p-8 sm:p-12 shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--primary)_55%,transparent)]">

            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-black/20 blur-3xl" />
            <div className="relative max-w-2xl">
              <div className="text-[10.5px] uppercase tracking-[0.28em] text-white/70 font-semibold">Comece hoje</div>
              <h2 className="mt-3 font-display text-[32px] sm:text-[40px] leading-[1.05] tracking-[-0.024em] font-semibold">
                Eleve o padrão do seu escritório com {f.title}.
              </h2>
              <p className="mt-4 text-[14.5px] leading-[1.65] text-white/80 max-w-xl">
                14 dias gratuitos com acesso completo. Sem cartão de crédito, sem compromisso.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/cadastro"
                  className="group inline-flex items-center gap-2 bg-white text-ink px-6 h-11 rounded-full text-[13px] font-semibold hover:bg-ink hover:text-white transition-colors"
                >
                  Experimentar agora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/planos"
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white px-5 h-11 rounded-full text-[13px] font-medium border border-white/25 hover:border-white/50 transition-colors"
                >
                  Comparar planos
                </Link>
              </div>
            </div>
          </div>
        </section>



      </main>
      <SiteFooter />
    </div>
  );
}
