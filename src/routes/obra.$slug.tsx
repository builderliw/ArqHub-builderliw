import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar, Check,
  ChevronRight, ChevronLeft, Building2, CalendarClock, ClipboardCheck, Flag, ArrowRight,
  ShoppingBag, BellRing, Images, Bell, Search, Settings, LogOut, Lock,
  Clock, ClipboardList, Sun, Camera, ZoomIn, ZoomOut, Maximize2, Layers,
  PencilRuler, Box, Sparkles, FileText as FileIcon,
} from "lucide-react";
import arqhubLogo from "@/assets/arqhub-logo.png.asset.json";
import heroApt from "@/assets/cliente-banner.jpg.asset.json";

export const Route = createFileRoute("/obra/$slug")({
  head: () => ({
    meta: [
      { title: "Portal do Cliente — Demonstração | ArqHub" },
      { name: "description", content: "Veja como é a visão do cliente: linha do tempo, aprovações, documentos e chat — exatamente como ele vê hoje." },
    ],
  }),
  component: ObraDemo,
});

// ---- Dados fictícios ----
const projeto = {
  name: "Residência Vila Madalena",
  escritorio: "Estúdio Carvalho Arquitetura",
  cliente: "Marina Costa",
  inicio: "08 de jun. de 2026",
  entrega: "15 de dez. de 2026",
  city: "São Paulo",
  uf: "SP",
  area_m2: 240,
};

// 8 etapas oficiais — igual ao painel real
const etapas = [
  { id: "1", title: "Levantamento e Análise de Dados", done: true, atual: false, progresso: 100, end_at: "20/02/2026" },
  { id: "2", title: "Programa de Necessidades", done: true, atual: false, progresso: 100, end_at: "10/03/2026" },
  { id: "3", title: "Estudo Preliminar", done: true, atual: false, progresso: 100, end_at: "10/04/2026" },
  { id: "4", title: "Anteprojeto", done: false, atual: true, progresso: 65, end_at: "15/07/2026" },
  { id: "5", title: "Projeto Legal", done: false, atual: false, progresso: 0, end_at: "20/08/2026" },
  { id: "6", title: "Projeto Executivo", done: false, atual: false, progresso: 0, end_at: "20/10/2026" },
  { id: "7", title: "Renderizações 3D", done: false, atual: false, progresso: 0, end_at: "20/11/2026" },
  { id: "8", title: "Visualizador 3D", done: false, atual: false, progresso: 0, end_at: "10/12/2026" },
];

const aprovacoesPendentes = 2;

const documentos = [
  { name: "Memorial descritivo - rev03.pdf", size: "2.4 MB", date: "10/06/2026" },
  { name: "Planta executiva - pavimento 2.dwg", size: "5.1 MB", date: "08/06/2026" },
  { name: "Cronograma físico-financeiro.xlsx", size: "180 KB", date: "05/06/2026" },
];

const aprovacoesItens = [
  { tipo: "Fase", titulo: "Anteprojeto — entrega parcial", prazo: "Até 15/06/2026", accent: "amber" as const },
  { tipo: "Documento", titulo: "Memorial descritivo - rev03.pdf", prazo: "Até 14/06/2026", accent: "blue" as const },
];

// Próximo compromisso (dia/mês)
const proximaReuniao = {
  dia: "18",
  mes: "JUN",
  hora: "10:00",
  quando: "Em 3 dias",
  titulo: "Reunião — escolha de revestimentos",
  local: "Showroom Aurora",
};

const galeriaFotos = [
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1486304873000-235643847519?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1503389152951-9f343605f61e?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=600&q=70",
];

const produtos = [
  { nome: "Porcelanato Atlas Plane 120x120", marca: "Portobello", status: "Aprovado" },
  { nome: "Torneira monocomando Like", marca: "Deca", status: "Aguardando aprovação" },
  { nome: "Pendente Aro Cobre 40cm", marca: "Reka", status: "Aprovado" },
  { nome: "Tinta Acrílica Suvinil — Areia", marca: "Suvinil", status: "Em compra" },
];

const mensagensMini = [
  { autor: "Estúdio Carvalho", quando: "Hoje 09:12", texto: "Bom dia! Subimos novas fotos da laje do 2º pavimento na galeria.", mine: false },
  { autor: "Você", quando: "Ontem 18:40", texto: "Ótimo, obrigada. Posso visitar a obra na sexta de manhã?", mine: true },
  { autor: "Estúdio Carvalho", quando: "Ontem 14:02", texto: "Confirmamos a entrega parcial da alvenaria. Aguardamos sua aprovação.", mine: false },
];

const agendaEventos = [
  { data: "12/06/2026", hora: "13:30", titulo: "Visita de obra com cliente", local: "Canteiro" },
  { data: "18/06/2026", hora: "10:00", titulo: "Reunião — escolha de revestimentos", local: "Showroom Aurora" },
  { data: "25/06/2026", hora: "15:00", titulo: "Apresentação de mobiliário", local: "Online" },
];

const notificacoes = [
  { titulo: "Nova fase aguardando aprovação", quando: "há 2h", tag: "Aprovação" },
  { titulo: "Documento adicionado: Memorial rev03", quando: "há 1 dia", tag: "Documento" },
  { titulo: "5 novas fotos na galeria", quando: "há 2 dias", tag: "Galeria" },
  { titulo: "Reunião agendada para 18/06", quando: "há 3 dias", tag: "Agenda" },
];

const pagamentos = [
  { ref: "Parcela 03/12", valor: "R$ 8.500,00", venc: "10/06/2026", status: "Pago" },
  { ref: "Parcela 04/12", valor: "R$ 8.500,00", venc: "10/07/2026", status: "A vencer" },
  { ref: "Parcela 05/12", valor: "R$ 8.500,00", venc: "10/08/2026", status: "A vencer" },
];

const diarioAtividades = [
  { titulo: "Concretagem laje", status: "Concluída", done: true },
  { titulo: "Instalação hidráulica", status: "Em andamento", done: false },
  { titulo: "Alvenaria pavimento térreo", status: "Concluída", done: true },
];

type SectionKey =
  | "inicio" | "meu-projeto" | "agenda" | "cronograma" | "documentos"
  | "galeria" | "diario" | "produtos" | "mensagens" | "notificacoes" | "pagamentos";

const NAV: { label?: string; items: { key: SectionKey; label: string; icon: typeof LayoutDashboard; badge?: number }[] }[] = [
  {
    items: [
      { key: "inicio", label: "Início", icon: LayoutDashboard },
      { key: "meu-projeto", label: "Meu projeto", icon: FolderOpen },
    ],
  },
  {
    label: "Acompanhamento",
    items: [
      { key: "agenda", label: "Agenda", icon: CalendarClock },
      { key: "cronograma", label: "Cronograma", icon: Calendar },
      { key: "documentos", label: "Documentos & Aprovações", icon: FolderOpen, badge: 2 },
      { key: "galeria", label: "Galeria", icon: Images },
      { key: "diario", label: "Diário de obra", icon: ClipboardList },
      { key: "produtos", label: "Produtos", icon: ShoppingBag },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { key: "mensagens", label: "Mensagens", icon: MessageSquare },
      { key: "notificacoes", label: "Notificações", icon: BellRing },
    ],
  },
  { label: "Financeiro", items: [{ key: "pagamentos", label: "Meus pagamentos", icon: FileText }] },
];

const SECTION_TITLES: Record<SectionKey, string> = {
  inicio: "Início",
  "meu-projeto": "Meu projeto",
  agenda: "Agenda",
  cronograma: "Cronograma",
  documentos: "Documentos & Aprovações",
  galeria: "Galeria",
  diario: "Diário de obra",
  produtos: "Produtos",
  mensagens: "Mensagens",
  notificacoes: "Notificações",
  pagamentos: "Meus pagamentos",
};

function ObraDemo() {
  const [active, setActive] = useState<SectionKey>("inicio");

  return (
    <div className="h-screen flex flex-col bg-[#f7f6f3] overflow-hidden">
      {/* Banner demo */}
      <div className="bg-primary text-primary-foreground text-center text-xs py-2 px-4 shrink-0">
        Você está vendo a <strong>demonstração</strong> do Portal do Cliente — obra fictícia.{" "}
        <Link to="/" className="underline font-medium">Voltar ao site</Link>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-border flex-col">
          <div className="h-14 px-5 flex items-center border-b border-border shrink-0">
            <img src={arqhubLogo.url} alt="ArqHub" className="h-7 w-7 object-contain" />
          </div>
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {NAV.map((group, gi) => (
              <div key={gi} className="mb-5">
                {group.label && (
                  <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.key === active;
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          onClick={() => setActive(item.key)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-left transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-ink/80 hover:bg-surface"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge ? (
                            <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                              isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                            }`}>
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="px-3 py-4 border-t border-border shrink-0">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-xs">
                MC
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-ink truncate">{projeto.cliente}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Cliente</div>
              </div>
              <span aria-disabled title="Apenas demonstração">
                <Settings className="h-4 w-4 text-muted-foreground/40 cursor-not-allowed" />
              </span>
            </div>
            <div
              aria-disabled
              title="Apenas demonstração"
              className="mt-2 flex items-center gap-2 px-2 py-1.5 text-[12.5px] text-muted-foreground/50 cursor-not-allowed select-none"
            >
              <LogOut className="h-4 w-4" /> Sair
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Topbar */}
          <header className="bg-white border-b border-border shrink-0">
            <div className="flex items-center justify-between px-5 lg:px-8 h-14">
              <div className="text-[15px] font-semibold text-ink">{SECTION_TITLES[active]}</div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-[12.5px] text-muted-foreground w-72 cursor-not-allowed select-none">
                  <Search className="h-3.5 w-3.5" />
                  <span className="flex-1">Buscar...</span>
                  <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-white">⌘K</kbd>
                </div>
                <div
                  aria-disabled
                  title="Apenas demonstração"
                  className="relative h-9 w-9 rounded-lg border border-border bg-white flex items-center justify-center cursor-not-allowed"
                >
                  <Bell className="h-4 w-4 text-ink" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </header>

          {/* Conteúdo rolável */}
          <main className="flex-1 overflow-y-auto px-5 lg:px-8 py-6">
            {active === "inicio" && <Inicio onGo={setActive} />}
            {active === "meu-projeto" && <MeuProjeto />}
            {active === "agenda" && <Agenda />}
            {active === "cronograma" && <Cronograma />}
            {active === "documentos" && <Documentos />}
            {active === "galeria" && <Galeria />}
            {active === "diario" && <Diario />}
            {active === "produtos" && <Produtos />}
            {active === "mensagens" && <Mensagens />}
            {active === "notificacoes" && <Notificacoes />}
            {active === "pagamentos" && <Pagamentos />}

            <div className="text-center pt-8">
              <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                Conhecer o ArqHub <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ===================== Seções =====================

function Inicio({ onGo }: { onGo: (k: SectionKey) => void }) {
  const doneCount = etapas.filter((e) => e.done).length;
  const pct = Math.round((doneCount / etapas.length) * 100);
  const activeIdx = etapas.findIndex((e) => e.atual);
  const currentTitle = etapas[activeIdx >= 0 ? activeIdx : doneCount]?.title;

  return (
    <>
      {/* Hero card — mesmo formato do painel real */}
      <div className="relative overflow-hidden rounded-2xl border border-border mb-4 aspect-[4/2] sm:aspect-[16/5] md:aspect-[16/4.7] lg:aspect-[16/4] min-h-[187px] sm:min-h-0">
        <img
          src={heroApt.url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[72%_55%] sm:object-[62%_55%] md:object-[55%_52%] lg:object-[50%_50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent sm:bg-gradient-to-tr sm:from-ink/85 sm:via-ink/35 sm:to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-4 sm:p-6 md:p-7 lg:p-8 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.4)]">
          <div className="w-full sm:max-w-[560px] md:max-w-[620px]">
            <h2 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[30px] font-semibold tracking-tight leading-[1.15] text-white truncate">
              {projeto.name}
            </h2>
            <div className="mt-1 text-[12px] sm:text-[13px] text-white/85">
              Cliente <span className="text-white font-medium">{projeto.cliente}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-[12px] text-white/85">
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-3 w-3 shrink-0" /> {projeto.escritorio}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3 w-3 shrink-0" /> Início {projeto.inicio}</span>
              <span className="inline-flex items-center gap-1.5"><Flag className="h-3 w-3 shrink-0" /> Entrega prevista {projeto.entrega}</span>
              <span className="inline-flex items-center gap-1.5">📍 {projeto.city}/{projeto.uf}</span>
              <span className="inline-flex items-center gap-1.5">{projeto.area_m2} m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linha do tempo */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 mb-5">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Linha do tempo</div>
            {currentTitle && (
              <div className="mt-0.5 text-[13px] text-ink truncate">
                Etapa atual: <span className="font-medium">{currentTitle}</span>
              </div>
            )}
          </div>
          <div className="text-[20px] sm:text-[24px] font-semibold text-ink tabular-nums shrink-0">{pct}%</div>
        </div>

        <div className="relative">
          <div className="absolute left-0 right-0 top-[7px] h-[2px] bg-muted rounded-full" />
          <div
            className="absolute left-0 top-[7px] h-[2px] bg-primary rounded-full"
            style={{ width: etapas.length > 1 ? `${(Math.max(0, activeIdx) / (etapas.length - 1)) * 100}%` : "0%" }}
          />
          <ol className="relative flex items-start justify-between gap-2">
            {etapas.map((e, i) => {
              const isDone = e.done;
              const isCurrent = i === activeIdx && !isDone;
              return (
                <li key={e.id} className="flex flex-col items-center text-center min-w-0 flex-1">
                  <span
                    className={`relative z-[1] inline-flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
                      isDone
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-background border-primary ring-4 ring-primary/15"
                        : "bg-background border-muted-foreground/30"
                    }`}
                  >
                    {isDone && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </span>
                  <span
                    className={`mt-2 text-[10.5px] sm:text-[11px] leading-tight line-clamp-2 px-0.5 ${
                      isCurrent ? "text-ink font-semibold" : isDone ? "text-ink/70" : "text-muted-foreground"
                    }`}
                  >
                    {e.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Aviso de aprovações */}
      <button
        type="button"
        onClick={() => onGo("documentos")}
        className="w-full group flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-4 mb-5 hover:bg-amber-50 transition-colors text-left"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <ClipboardCheck className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-ink">Você tem aprovações pendentes</div>
          <div className="text-[12px] text-muted-foreground">
            {aprovacoesPendentes} fases aguardam sua avaliação.
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-amber-700 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Próximo compromisso + Aprovações pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <button
          type="button"
          onClick={() => onGo("agenda")}
          className="group relative bg-white border border-border rounded-xl px-5 py-4 overflow-hidden hover:border-primary/40 transition-colors before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">Próximo compromisso</div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-center leading-none">
              <div className="text-[9.5px] font-semibold uppercase tracking-wider text-primary">{proximaReuniao.mes}</div>
              <div className="mt-1 text-[18px] font-bold text-ink tabular-nums">{proximaReuniao.dia}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">
                <Clock className="h-3 w-3" /> {proximaReuniao.quando} · {proximaReuniao.hora}
              </div>
              <div className="mt-1.5 text-[13px] font-semibold text-ink truncate">{proximaReuniao.titulo}</div>
              <div className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
                <CalendarClock className="h-3 w-3" /> {proximaReuniao.local}
              </div>
            </div>
          </div>
        </button>

        <div className="relative bg-white border border-border rounded-xl px-5 py-4 overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-amber-500">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-amber-600">Aprovações pendentes</div>
          <div className="mt-2 text-[26px] leading-none font-semibold tracking-tight text-ink tabular-nums">{aprovacoesPendentes}</div>
          <div className="mt-2 text-[11.5px] text-muted-foreground">Fases aguardando sua avaliação</div>
        </div>
      </div>

      {/* Chat mini */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => onGo("mensagens")}
          className="group bg-white border border-border rounded-xl p-5 hover:border-primary/40 transition-colors flex flex-col w-full text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </span>
              Mensagens
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <ul className="space-y-2.5">
            {mensagensMini.map((m, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className={`mt-1 inline-flex h-2 w-2 rounded-full shrink-0 ${m.mine ? "bg-muted-foreground/40" : "bg-primary"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-medium text-ink truncate">{m.mine ? "Você" : m.autor}</span>
                    <span className="text-[10.5px] text-muted-foreground shrink-0">{m.quando}</span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground line-clamp-2">{m.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </button>
      </div>
    </>
  );
}

// Categorias de apresentação — espelham o painel real
const apresCategorias = [
  { key: "levantamento", label: "Levantamento", icon: ClipboardList },
  { key: "briefing", label: "Programa de Necessidades", icon: Sparkles },
  { key: "preliminar", label: "Estudo Preliminar", icon: PencilRuler },
  { key: "anteprojeto", label: "Anteprojeto", icon: Layers },
  { key: "legal", label: "Projeto Legal", icon: FileIcon },
  { key: "executivo", label: "Projeto Executivo", icon: FileIcon },
  { key: "render", label: "Renderizações 3D", icon: Images },
  { key: "modelo3d", label: "Visualizador 3D", icon: Box },
] as const;

type SlideKind = "planta" | "corte" | "elevacao" | "detalhe" | "render" | "cover";
type Slide = { id: string; title: string; kind: SlideKind };

const slidesPorCategoria: Record<string, Slide[]> = {
  levantamento: [
    { id: "l1", title: "Capa · Levantamento do terreno", kind: "cover" },
    { id: "l2", title: "Planta do existente", kind: "planta" },
    { id: "l3", title: "Fachada existente", kind: "elevacao" },
  ],
  briefing: [
    { id: "b1", title: "Programa de necessidades", kind: "cover" },
    { id: "b2", title: "Diagrama de fluxos", kind: "detalhe" },
  ],
  preliminar: [
    { id: "p1", title: "Estudo preliminar · Capa", kind: "cover" },
    { id: "p2", title: "Planta baixa · Pav. Térreo", kind: "planta" },
    { id: "p3", title: "Planta baixa · Pav. Superior", kind: "planta" },
    { id: "p4", title: "Volumetria", kind: "render" },
  ],
  anteprojeto: [
    { id: "a1", title: "Anteprojeto · Capa", kind: "cover" },
    { id: "a2", title: "Planta baixa · Térreo", kind: "planta" },
    { id: "a3", title: "Corte AA", kind: "corte" },
    { id: "a4", title: "Elevação frontal", kind: "elevacao" },
    { id: "a5", title: "Elevação lateral", kind: "elevacao" },
    { id: "a6", title: "Detalhe · Escada", kind: "detalhe" },
  ],
  legal: [
    { id: "lg1", title: "Prancha 01 · Situação", kind: "planta" },
    { id: "lg2", title: "Prancha 02 · Locação", kind: "planta" },
  ],
  executivo: [
    { id: "e1", title: "Executivo · Capa", kind: "cover" },
    { id: "e2", title: "Planta executiva · Térreo", kind: "planta" },
    { id: "e3", title: "Detalhe · Cozinha", kind: "detalhe" },
    { id: "e4", title: "Detalhe · Banheiro", kind: "detalhe" },
  ],
  render: [
    { id: "r1", title: "Sala de estar", kind: "render" },
    { id: "r2", title: "Cozinha integrada", kind: "render" },
    { id: "r3", title: "Suíte master", kind: "render" },
  ],
  modelo3d: [
    { id: "m1", title: "Modelo 3D · Volumetria", kind: "render" },
  ],
};

function SlideArt({ kind, title }: { kind: SlideKind; title: string }) {
  if (kind === "cover") {
    return (
      <svg viewBox="0 0 800 500" className="w-full h-full">
        <rect width="800" height="500" fill="#0f172a" />
        <rect x="0" y="0" width="800" height="500" fill="url(#grad)" opacity="0.6" />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <text x="60" y="200" fill="#ffffff" fontSize="42" fontWeight="700" fontFamily="sans-serif">{projeto.name}</text>
        <text x="60" y="240" fill="#a7f3d0" fontSize="20" fontFamily="sans-serif">{title}</text>
        <text x="60" y="440" fill="#94a3b8" fontSize="14" fontFamily="sans-serif">{projeto.escritorio} · {projeto.city}/{projeto.uf}</text>
        <line x1="60" y1="260" x2="220" y2="260" stroke="#10b981" strokeWidth="3" />
      </svg>
    );
  }
  if (kind === "planta") {
    return (
      <svg viewBox="0 0 800 500" className="w-full h-full">
        <rect width="800" height="500" fill="#fafaf9" />
        {/* grid */}
        <g stroke="#e7e5e4" strokeWidth="0.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="500" />
          ))}
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 40} x2="800" y2={i * 40} />
          ))}
        </g>
        {/* paredes externas */}
        <rect x="120" y="80" width="560" height="360" fill="none" stroke="#1c1917" strokeWidth="6" />
        {/* divisórias */}
        <line x1="120" y1="240" x2="440" y2="240" stroke="#1c1917" strokeWidth="4" />
        <line x1="440" y1="80" x2="440" y2="440" stroke="#1c1917" strokeWidth="4" />
        <line x1="440" y1="300" x2="680" y2="300" stroke="#1c1917" strokeWidth="4" />
        <line x1="260" y1="240" x2="260" y2="440" stroke="#1c1917" strokeWidth="4" />
        {/* portas (arcos) */}
        <path d="M 300 240 A 40 40 0 0 1 340 280" fill="none" stroke="#78716c" strokeWidth="1.5" />
        <path d="M 500 300 A 40 40 0 0 1 540 340" fill="none" stroke="#78716c" strokeWidth="1.5" />
        {/* janelas */}
        <rect x="180" y="76" width="80" height="8" fill="#fafaf9" stroke="#1c1917" strokeWidth="2" />
        <rect x="540" y="76" width="80" height="8" fill="#fafaf9" stroke="#1c1917" strokeWidth="2" />
        <rect x="676" y="180" width="8" height="80" fill="#fafaf9" stroke="#1c1917" strokeWidth="2" />
        {/* mobiliário */}
        <rect x="150" y="110" width="80" height="40" fill="none" stroke="#059669" strokeWidth="1.5" />
        <circle cx="360" cy="150" r="30" fill="none" stroke="#059669" strokeWidth="1.5" />
        <rect x="480" y="110" width="60" height="140" fill="none" stroke="#059669" strokeWidth="1.5" />
        <rect x="500" y="340" width="140" height="70" fill="none" stroke="#059669" strokeWidth="1.5" />
        {/* legendas */}
        <text x="160" y="165" fontSize="11" fill="#57534e" fontFamily="sans-serif">SALA</text>
        <text x="340" y="200" fontSize="11" fill="#57534e" fontFamily="sans-serif">JANTAR</text>
        <text x="480" y="200" fontSize="11" fill="#57534e" fontFamily="sans-serif">COZINHA</text>
        <text x="290" y="360" fontSize="11" fill="#57534e" fontFamily="sans-serif">SUÍTE</text>
        <text x="530" y="380" fontSize="11" fill="#57534e" fontFamily="sans-serif">QUARTO 02</text>
        {/* cotas */}
        <g stroke="#1c1917" strokeWidth="0.8" fill="#1c1917" fontSize="10" fontFamily="sans-serif">
          <line x1="120" y1="60" x2="680" y2="60" />
          <line x1="120" y1="55" x2="120" y2="65" />
          <line x1="680" y1="55" x2="680" y2="65" />
          <text x="380" y="52" textAnchor="middle">14,00 m</text>
        </g>
        <text x="120" y="475" fontSize="11" fill="#78716c" fontFamily="sans-serif">Esc. 1:100</text>
      </svg>
    );
  }
  if (kind === "corte") {
    return (
      <svg viewBox="0 0 800 500" className="w-full h-full">
        <rect width="800" height="500" fill="#fafaf9" />
        {/* terreno */}
        <line x1="60" y1="400" x2="740" y2="400" stroke="#1c1917" strokeWidth="2" />
        <g stroke="#78716c" strokeWidth="1">
          {Array.from({ length: 30 }).map((_, i) => (
            <line key={i} x1={60 + i * 24} y1="400" x2={60 + i * 24 + 8} y2="420" />
          ))}
        </g>
        {/* volume */}
        <rect x="140" y="200" width="520" height="200" fill="none" stroke="#1c1917" strokeWidth="3" />
        {/* laje intermediária */}
        <line x1="140" y1="300" x2="660" y2="300" stroke="#1c1917" strokeWidth="2" />
        {/* telhado */}
        <polygon points="140,200 400,120 660,200" fill="none" stroke="#1c1917" strokeWidth="3" />
        {/* aberturas */}
        <rect x="200" y="330" width="60" height="60" fill="#e7e5e4" stroke="#1c1917" strokeWidth="1.5" />
        <rect x="340" y="330" width="60" height="60" fill="#e7e5e4" stroke="#1c1917" strokeWidth="1.5" />
        <rect x="480" y="330" width="60" height="60" fill="#e7e5e4" stroke="#1c1917" strokeWidth="1.5" />
        <rect x="220" y="230" width="80" height="50" fill="#e7e5e4" stroke="#1c1917" strokeWidth="1.5" />
        <rect x="480" y="230" width="80" height="50" fill="#e7e5e4" stroke="#1c1917" strokeWidth="1.5" />
        {/* cotas verticais */}
        <g stroke="#059669" strokeWidth="1" fill="#059669" fontSize="10" fontFamily="sans-serif">
          <line x1="700" y1="300" x2="700" y2="400" />
          <text x="710" y="355">2,80</text>
          <line x1="700" y1="200" x2="700" y2="300" />
          <text x="710" y="255">2,80</text>
        </g>
        <text x="60" y="475" fontSize="11" fill="#78716c" fontFamily="sans-serif">Corte AA · Esc. 1:100</text>
      </svg>
    );
  }
  if (kind === "elevacao") {
    return (
      <svg viewBox="0 0 800 500" className="w-full h-full">
        <rect width="800" height="500" fill="#fafaf9" />
        <line x1="60" y1="400" x2="740" y2="400" stroke="#1c1917" strokeWidth="2" />
        {/* fachada */}
        <rect x="140" y="200" width="520" height="200" fill="#ffffff" stroke="#1c1917" strokeWidth="3" />
        {/* revestimento — ripado vertical */}
        <g stroke="#a8a29e" strokeWidth="0.6">
          {Array.from({ length: 26 }).map((_, i) => (
            <line key={i} x1={160 + i * 20} y1="200" x2={160 + i * 20} y2="400" />
          ))}
        </g>
        {/* telhado */}
        <polygon points="140,200 400,120 660,200" fill="#1c1917" opacity="0.85" />
        {/* janelas */}
        <rect x="200" y="240" width="120" height="80" fill="#0f172a" opacity="0.7" stroke="#1c1917" />
        <rect x="480" y="240" width="120" height="80" fill="#0f172a" opacity="0.7" stroke="#1c1917" />
        {/* porta */}
        <rect x="370" y="290" width="60" height="110" fill="#78350f" stroke="#1c1917" strokeWidth="1.5" />
        {/* vegetação */}
        <circle cx="100" cy="390" r="24" fill="#065f46" />
        <circle cx="720" cy="385" r="30" fill="#065f46" />
        <text x="60" y="475" fontSize="11" fill="#78716c" fontFamily="sans-serif">{title} · Esc. 1:100</text>
      </svg>
    );
  }
  if (kind === "detalhe") {
    return (
      <svg viewBox="0 0 800 500" className="w-full h-full">
        <rect width="800" height="500" fill="#fafaf9" />
        <g stroke="#e7e5e4" strokeWidth="0.5">
          {Array.from({ length: 40 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="500" />
          ))}
          {Array.from({ length: 25 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="800" y2={i * 20} />
          ))}
        </g>
        {/* peça central ampliada */}
        <rect x="180" y="120" width="440" height="260" fill="#ffffff" stroke="#1c1917" strokeWidth="2.5" />
        <rect x="200" y="140" width="180" height="220" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 3" />
        <rect x="400" y="140" width="200" height="100" fill="none" stroke="#1c1917" strokeWidth="1.5" />
        <rect x="400" y="260" width="200" height="100" fill="none" stroke="#1c1917" strokeWidth="1.5" />
        {/* cotas */}
        <g stroke="#059669" strokeWidth="1" fill="#059669" fontSize="10" fontFamily="sans-serif">
          <line x1="180" y1="100" x2="620" y2="100" />
          <text x="400" y="94" textAnchor="middle">2,20</text>
          <line x1="640" y1="120" x2="640" y2="380" />
          <text x="655" y="255">1,30</text>
        </g>
        {/* chamadas */}
        <g fontSize="10" fontFamily="sans-serif" fill="#1c1917">
          <circle cx="290" cy="250" r="12" fill="#ffffff" stroke="#059669" />
          <text x="286" y="254">01</text>
          <circle cx="500" cy="190" r="12" fill="#ffffff" stroke="#059669" />
          <text x="496" y="194">02</text>
          <circle cx="500" cy="310" r="12" fill="#ffffff" stroke="#059669" />
          <text x="496" y="314">03</text>
        </g>
        <text x="180" y="420" fontSize="12" fill="#1c1917" fontWeight="600" fontFamily="sans-serif">DETALHE CONSTRUTIVO</text>
        <text x="180" y="438" fontSize="10" fill="#78716c" fontFamily="sans-serif">01 · Bancada em quartzo · 02 · Armário superior · 03 · Gaveteiro</text>
        <text x="180" y="475" fontSize="11" fill="#78716c" fontFamily="sans-serif">Esc. 1:20</text>
      </svg>
    );
  }
  // render
  return (
    <svg viewBox="0 0 800 500" className="w-full h-full">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fdba74" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d6d3d1" />
          <stop offset="100%" stopColor="#a8a29e" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#sky)" />
      <rect y="320" width="800" height="180" fill="url(#floor)" />
      {/* parede fundo */}
      <rect x="80" y="120" width="640" height="220" fill="#f5f5f4" />
      {/* janela ampla */}
      <rect x="140" y="160" width="520" height="140" fill="#a5f3fc" opacity="0.7" stroke="#1c1917" strokeWidth="2" />
      <line x1="400" y1="160" x2="400" y2="300" stroke="#1c1917" strokeWidth="2" />
      {/* sofá */}
      <rect x="180" y="330" width="240" height="60" rx="10" fill="#1c1917" />
      <rect x="180" y="310" width="240" height="30" rx="8" fill="#292524" />
      {/* mesa */}
      <rect x="460" y="360" width="180" height="14" fill="#78350f" />
      <rect x="470" y="374" width="6" height="30" fill="#78350f" />
      <rect x="624" y="374" width="6" height="30" fill="#78350f" />
      {/* luminária */}
      <line x1="560" y1="120" x2="560" y2="200" stroke="#1c1917" strokeWidth="2" />
      <ellipse cx="560" cy="210" rx="30" ry="10" fill="#fbbf24" />
      {/* planta */}
      <rect x="700" y="280" width="40" height="40" fill="#78350f" />
      <circle cx="720" cy="260" r="28" fill="#065f46" />
      <text x="30" y="475" fontSize="12" fill="#1c1917" fontFamily="sans-serif" fontWeight="600">{title}</text>
    </svg>
  );
}

function MeuProjeto() {
  const [catKey, setCatKey] = useState<string>("anteprojeto");
  const slides = slidesPorCategoria[catKey] ?? [];
  const [idx, setIdx] = useState(0);
  const current = slides[Math.min(idx, slides.length - 1)];

  const handleCat = (k: string) => { setCatKey(k); setIdx(0); };
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(slides.length - 1, i + 1));

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
        {/* Sidebar: categorias */}
        <aside className="border-b md:border-b-0 md:border-r border-border bg-secondary/30">
          <div className="p-2 space-y-0.5">
            {apresCategorias.map((c) => {
              const Ico = c.icon;
              const active = c.key === catKey;
              const count = (slidesPorCategoria[c.key] ?? []).length;
              return (
                <button
                  key={c.key}
                  onClick={() => handleCat(c.key)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[12.5px] text-left transition ${
                    active ? "bg-ink text-white" : "hover:bg-white text-ink"
                  }`}
                >
                  <Ico className="h-3.5 w-3.5" />
                  <span className="flex-1 truncate">{c.label}</span>
                  <span className={`text-[10.5px] tabular-nums ${active ? "text-white/70" : "text-muted-foreground"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Visualizador */}
        <section className="flex flex-col min-h-[520px]">
          {/* Header do viewer */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-secondary/40 flex-wrap">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-ink truncate">{current?.title ?? "—"}</div>
              <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Somente visualização · Download desabilitado
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="h-7 w-7 inline-flex items-center justify-center rounded border border-border bg-white hover:bg-secondary" title="Menos zoom"><ZoomOut className="h-3.5 w-3.5" /></button>
              <span className="text-[11px] tabular-nums w-10 text-center">100%</span>
              <button className="h-7 w-7 inline-flex items-center justify-center rounded border border-border bg-white hover:bg-secondary" title="Mais zoom"><ZoomIn className="h-3.5 w-3.5" /></button>
              <button className="h-7 w-7 inline-flex items-center justify-center rounded border border-border bg-white hover:bg-secondary" title="Tela cheia"><Maximize2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {/* Slide */}
          <div className="relative flex-1 bg-neutral-100 flex items-center justify-center p-4 select-none">
            {current ? (
              <div className="relative w-full max-w-[880px] aspect-[16/10] bg-white rounded-lg shadow-lg border border-border overflow-hidden">
                <SlideArt kind={current.kind} title={current.title} />
                {/* Marca d'água */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-[9vw] md:text-[80px] font-bold text-black/[0.05] rotate-[-20deg] whitespace-nowrap">
                    ArqHub · {projeto.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[12.5px] text-muted-foreground">Sem pranchas nesta etapa ainda.</div>
            )}

            {/* Navegação lateral */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={prev}
                  disabled={idx === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-border shadow inline-flex items-center justify-center disabled:opacity-30 hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={next}
                  disabled={idx >= slides.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-border shadow inline-flex items-center justify-center disabled:opacity-30 hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Tira de miniaturas — estilo PPT */}
          {slides.length > 0 && (
            <div className="border-t border-border bg-white px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Pranchas</div>
                <div className="text-[11px] text-muted-foreground tabular-nums">{idx + 1} / {slides.length}</div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {slides.map((s, i) => {
                  const active = i === idx;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setIdx(i)}
                      className={`shrink-0 w-[124px] rounded-md border overflow-hidden text-left transition ${
                        active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                      }`}
                      title={s.title}
                    >
                      <div className="aspect-[16/10] bg-white">
                        <SlideArt kind={s.kind} title={s.title} />
                      </div>
                      <div className="px-1.5 py-1 border-t border-border bg-white">
                        <div className="text-[10.5px] text-ink truncate">{s.title}</div>
                        <div className="text-[9.5px] text-muted-foreground tabular-nums">Prancha {i + 1}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Agenda() {
  return (
    <Panel title="Próximos compromissos" subtitle="Visitas, reuniões e marcos">
      <ul className="divide-y divide-border">
        {agendaEventos.map((ev) => (
          <li key={ev.titulo} className="flex items-center gap-4 py-3">
            <div className="h-10 w-12 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center">
              <span className="text-[10px] font-semibold uppercase tracking-wide">{ev.data.split("/")[1]}/{ev.data.split("/")[2]}</span>
              <span className="text-[13px] font-bold leading-none">{ev.data.split("/")[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-ink">{ev.titulo}</div>
              <div className="text-[11.5px] text-muted-foreground">{ev.hora} · {ev.local}</div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Cronograma() {
  return (
    <Panel title="Cronograma do projeto" subtitle="Marcos e fases">
      <div className="space-y-3">
        {etapas.map((e) => (
          <div key={e.id} className="rounded-lg border border-border p-3.5">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {e.done ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                ) : e.atual ? (
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-primary/15" />
                ) : (
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-border" />
                )}
                <span className="text-[13px] font-medium text-ink">{e.title}</span>
                {e.atual && (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Em andamento
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground tabular-nums">
                <span>até {e.end_at}</span>
                <span className="font-semibold text-ink">{e.progresso}%</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  e.done ? "bg-primary" : e.atual ? "bg-primary/70" : "bg-border"
                }`}
                style={{ width: `${e.progresso}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Documentos() {
  return (
    <>
      <Panel title="Aprovações pendentes" subtitle={`${aprovacoesItens.length} itens aguardando sua decisão`}>
        <div className="space-y-3">
          {aprovacoesItens.map((a) => (
            <div key={a.titulo} className={`rounded-lg border p-4 ${a.accent === "amber" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
              <div className={`text-[10.5px] font-semibold uppercase tracking-wide mb-1 ${a.accent === "amber" ? "text-amber-800" : "text-blue-800"}`}>{a.tipo} a aprovar</div>
              <div className="text-[14px] font-semibold text-ink">{a.titulo}</div>
              <div className="text-[11.5px] text-muted-foreground mt-1">{a.prazo}</div>
              <div className="mt-3 flex gap-2">
                <DisabledBtn variant="primary">Aprovar</DisabledBtn>
                <DisabledBtn>Solicitar ajuste</DisabledBtn>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Arquivos do projeto" subtitle={`${documentos.length} arquivos disponíveis`}>
        <ul className="divide-y divide-border -mx-2">
          {documentos.map((doc) => (
            <li key={doc.name} className="flex items-center gap-3 px-2 py-3">
              <div className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink truncate">{doc.name}</div>
                <div className="text-[11px] text-muted-foreground">{doc.size} · {doc.date}</div>
              </div>
              <DisabledBtn>Visualizar</DisabledBtn>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

function Galeria() {
  return (
    <Panel title="Galeria de fotos" subtitle="Registros recentes da obra">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {galeriaFotos.map((src, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden bg-surface">
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Diario() {
  return (
    <Panel title="Diário de obra" subtitle="Registros diários com clima, atividades e fotos">
      <div className="max-w-md">
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-br from-emerald-50 via-white to-white border-b border-border">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
              <Calendar className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink leading-tight">15 de julho de 2026</div>
              <div className="text-[11px] text-muted-foreground">Segunda-feira</div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" /> Data
                </div>
                <div className="text-[13px] font-semibold text-ink">15 Jul 2026</div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 p-3">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700 mb-1">
                  <Sun className="h-3 w-3" /> Temperatura
                </div>
                <div className="text-[15px] font-bold text-ink tabular-nums">28°C</div>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink">
                  <Camera className="h-3.5 w-3.5" /> Fotos do dia
                </div>
                <span className="text-[10px] text-muted-foreground">3 fotos</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="aspect-square rounded bg-gradient-to-br from-stone-200 to-stone-300" />
                <div className="aspect-square rounded bg-gradient-to-br from-stone-300 to-stone-400" />
                <div className="aspect-square rounded bg-gradient-to-br from-stone-200 to-stone-300" />
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink mb-2">
                <ClipboardList className="h-3.5 w-3.5" /> Atividades do dia
              </div>
              <ul className="space-y-1.5">
                {diarioAtividades.map((a) => (
                  <li key={a.titulo} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {a.done
                        ? <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        : <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      <span className="text-[12px] text-ink truncate">{a.titulo}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{a.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Produtos() {
  return (
    <Panel title="Produtos especificados" subtitle="Materiais e acabamentos do seu projeto">
      <ul className="divide-y divide-border -mx-2">
        {produtos.map((p) => (
          <li key={p.nome} className="flex items-center gap-3 px-2 py-3">
            <div className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-ink truncate">{p.nome}</div>
              <div className="text-[11px] text-muted-foreground">{p.marca}</div>
            </div>
            <span className={`text-[10.5px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${
              p.status === "Aprovado" ? "bg-primary/10 text-primary"
              : p.status === "Em compra" ? "bg-blue-50 text-blue-700"
              : "bg-amber-50 text-amber-700"
            }`}>{p.status}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Mensagens() {
  return (
    <Panel title="Conversa com o escritório" subtitle="Histórico de mensagens">
      <ul className="space-y-3">
        {mensagensMini.map((m, i) => (
          <li key={i} className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.mine ? "ml-auto bg-primary text-primary-foreground" : "bg-surface border border-border"}`}>
            <div className={`text-[10.5px] font-semibold uppercase tracking-wide mb-1 ${m.mine ? "text-white/80" : "text-muted-foreground"}`}>
              {m.mine ? "Você" : m.autor} · {m.quando}
            </div>
            <div className="text-[13px]">{m.texto}</div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-[12.5px] text-muted-foreground cursor-not-allowed select-none">
        <Lock className="h-3.5 w-3.5" />
        Envio de mensagens desabilitado nesta demonstração.
      </div>
    </Panel>
  );
}

function Notificacoes() {
  return (
    <Panel title="Notificações" subtitle="Atualizações recentes da sua obra">
      <ul className="divide-y divide-border -mx-2">
        {notificacoes.map((n) => (
          <li key={n.titulo} className="flex items-center gap-3 px-2 py-3">
            <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BellRing className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-ink">{n.titulo}</div>
              <div className="text-[11px] text-muted-foreground">{n.tag} · {n.quando}</div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Pagamentos() {
  return (
    <Panel title="Meus pagamentos" subtitle="Parcelas do contrato">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead className="bg-surface text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Referência</th>
              <th className="text-left px-4 py-2 font-medium">Vencimento</th>
              <th className="text-left px-4 py-2 font-medium">Valor</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagamentos.map((p) => (
              <tr key={p.ref}>
                <td className="px-4 py-3 text-ink">{p.ref}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.venc}</td>
                <td className="px-4 py-3 text-ink font-medium tabular-nums">{p.valor}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10.5px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    p.status === "Pago" ? "bg-primary/10 text-primary" : "bg-amber-50 text-amber-700"
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ===================== Primitivos =====================

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-border rounded-xl p-6 mb-4">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-[11.5px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function DisabledBtn({ children, variant }: { children: React.ReactNode; variant?: "primary" }) {
  return (
    <span
      aria-disabled
      title="Apenas demonstração"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium cursor-not-allowed select-none ${
        variant === "primary"
          ? "bg-primary/30 text-primary-foreground/80"
          : "border border-border bg-white text-muted-foreground"
      }`}
    >
      <Lock className="h-3 w-3" /> {children}
    </span>
  );
}
