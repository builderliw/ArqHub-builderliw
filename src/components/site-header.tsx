// Cabeçalho das páginas públicas — versão com menus suspensos (igual à Lovable).
// Funcionalidades (mega menu) · Recursos (Exclusivo Premium) · Conteúdos Gratuitos · Planos
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight, ChevronDown, Menu, X,
  LayoutDashboard, CalendarDays, FolderOpen,
  Users, UsersRound, MessageSquare,
  Wallet, FileText, Sparkles,
  Calculator, Ruler, ShoppingCart, CalendarClock,
  Images, GraduationCap, Zap, Download,
  type LucideIcon,
} from "lucide-react";
import logoMark from "@/assets/arqhub-logo-mark.png.asset.json";

type NavItem = {
  label: string;
  desc: string;
  icon: LucideIcon;
  to: string;
  params?: Record<string, string>;
  badge?: string;
};

const FUNCIONALIDADES: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Visão & Rotina",
    items: [
      { label: "Dashboard", desc: "Panorama executivo do escritório", icon: LayoutDashboard, to: "/funcionalidades/$slug", params: { slug: "dashboard" } },
      { label: "Agenda da semana", desc: "Calendário semanal da equipe", icon: CalendarDays, to: "/funcionalidades/$slug", params: { slug: "cronograma" } },
      { label: "Projetos", desc: "Todos os projetos organizados", icon: FolderOpen, to: "/funcionalidades/$slug", params: { slug: "projetos" } },
    ],
  },
  {
    heading: "Pessoas",
    items: [
      { label: "Clientes", desc: "Base de clientes e portal", icon: Users, to: "/funcionalidades/$slug", params: { slug: "clientes" } },
      { label: "Equipe", desc: "Gestão de colaboradores", icon: UsersRound, to: "/funcionalidades/$slug", params: { slug: "equipe" } },
      { label: "Mensagens", desc: "Conversas por cliente", icon: MessageSquare, to: "/funcionalidades/$slug", params: { slug: "mensagens" } },
    ],
  },
  {
    heading: "Números & IA",
    items: [
      { label: "Financeiro", desc: "Receita, contratos e caixa", icon: Wallet, to: "/funcionalidades/$slug", params: { slug: "financeiro" } },
      { label: "Relatórios", desc: "PDFs com sua marca", icon: FileText, to: "/funcionalidades/$slug", params: { slug: "relatorios" } },
      { label: "IA ArqHub", desc: "Assistente inteligente", icon: Sparkles, to: "/funcionalidades/$slug", params: { slug: "ia-arqhub" } },
    ],
  },
];

const RECURSOS_PREMIUM: NavItem[] = [
  { label: "Orçamentos Inteligentes", desc: "IA aplicada a custos.", icon: Calculator, to: "/recursos/premium/$slug", params: { slug: "orcamentos-inteligentes" } },
  { label: "Levantamento Quantitativo", desc: "Automação de medições.", icon: Ruler, to: "/recursos/premium/$slug", params: { slug: "levantamento-quantitativo" } },
  { label: "Sugestão de Compras", desc: "Materiais na hora certa.", icon: ShoppingCart, to: "/recursos/premium/$slug", params: { slug: "sugestao-de-compras" } },
  { label: "Planejamento de Obra", desc: "Cronograma automático.", icon: CalendarClock, to: "/recursos/premium/$slug", params: { slug: "planejamento-de-obra" } },
];

const CONTEUDOS: NavItem[] = [
  { label: "Portfólio", desc: "Obras reais de escritórios que operam no ArqHub.", icon: Images, to: "/portfolio" },
  { label: "ArqHub Academy", desc: "Planos de estudo, dicas e trilhas para concursos e provas.", icon: GraduationCap, to: "/academy", badge: "Novo" },
  { label: "Potencializador", desc: "Matérias especiais sobre tendências, IA e tecnologia.", icon: Zap, to: "/conteudos/potencializador" },
  { label: "Seu Negócio", desc: "PDFs e planilhas grátis para baixar no seu escritório.", icon: Download, to: "/conteudos/seu-negocio" },
];

type MenuKey = "funcionalidades" | "recursos" | "conteudos";

/* ---------- Itens reutilizáveis ---------- */

function MegaItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to as any}
      params={item.params as any}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-white">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight text-ink">{item.label}</span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">{item.desc}</span>
      </span>
    </Link>
  );
}

function ListItem({
  item,
  onNavigate,
  accent = false,
}: {
  item: NavItem;
  onNavigate: () => void;
  accent?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to as any}
      params={item.params as any}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span
        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
          accent
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-surface text-ink-muted group-hover:border-ink group-hover:bg-ink group-hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13px] font-semibold leading-tight text-ink">
          {item.label}
          {item.badge && (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-ink-muted">
              {item.badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">{item.desc}</span>
      </span>
      <ArrowRight className="mt-2 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

/* ---------- Cabeçalho ---------- */

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MenuKey | null>(null);
  const [menu, setMenu] = useState<MenuKey | null>(null);
  const closeTimer = useRef<number | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const closeAll = useCallback(() => {
    setMenu(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, []);

  // Fecha tudo ao trocar de página.
  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  // Esc e clique fora fecham o menu suspenso.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [menu]);

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const openMenu = (key: MenuKey) => {
    cancelClose();
    setMenu(key);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setMenu(null), 140);
  };

  const isActive = (prefixes: string[]) =>
    prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const trigger = (key: MenuKey, label: string, prefixes: string[]) => (
    <button
      type="button"
      onClick={() => setMenu((m) => (m === key ? null : key))}
      onMouseEnter={() => openMenu(key)}
      onMouseLeave={scheduleClose}
      aria-expanded={menu === key}
      aria-haspopup="true"
      className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
        menu === key || isActive(prefixes) ? "text-ink" : "text-muted-foreground hover:text-ink"
      }`}
    >
      {label}
      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${menu === key ? "rotate-180" : ""}`} />
    </button>
  );

  const panelBase =
    "absolute top-full z-50 pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-150";
  const panelCard =
    "rounded-2xl border border-border bg-background shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="ArqHub — página inicial">
          <img src={logoMark.url} alt="" className="h-7 w-7 object-contain" />
          <span className="font-display text-[19px] font-semibold tracking-tight text-ink">ArqHub</span>
        </Link>

        {/* ---------- Desktop ---------- */}
        <nav ref={navRef} className="relative mx-auto hidden items-center gap-1 lg:flex" aria-label="Principal">
          {/* Funcionalidades */}
          <div className="relative">
            {trigger("funcionalidades", "Funcionalidades", ["/funcionalidades"])}
            {menu === "funcionalidades" && (
              <div
                className={`${panelBase} -left-28`}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                <div className={`${panelCard} grid w-[860px] grid-cols-[1fr_1fr_1fr_220px] gap-2 p-3`}>
                  {FUNCIONALIDADES.map((col) => (
                    <div key={col.heading} className="p-1">
                      <div className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {col.heading}
                      </div>
                      {col.items.map((item) => (
                        <MegaItem key={item.label} item={item} onNavigate={closeAll} />
                      ))}
                    </div>
                  ))}
                  <Link
                    to="/planos"
                    onClick={closeAll}
                    className="group flex flex-col justify-between rounded-xl bg-ink p-4 text-white transition-colors hover:bg-black"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                        <Sparkles className="h-3 w-3" /> Em destaque
                      </div>
                      <div className="mt-2 text-[15px] font-semibold leading-snug">
                        Tudo o que seu escritório precisa
                      </div>
                      <p className="mt-1.5 text-[12px] leading-snug text-white/65">
                        Projetos, financeiro, obra e cliente — em uma só plataforma.
                      </p>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-1 text-[12.5px] font-semibold">
                      Ver planos
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recursos */}
          <div className="relative">
            {trigger("recursos", "Recursos", ["/recursos"])}
            {menu === "recursos" && (
              <div className={`${panelBase} left-0`} onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
                <div className={`${panelCard} w-[380px] p-2`}>
                  <div className="flex items-center justify-between px-2.5 pb-1 pt-1.5">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Exclusivo Premium
                    </span>
                    <Link to="/recursos" onClick={closeAll} className="text-[12px] font-medium text-ink hover:underline">
                      Ver todos
                    </Link>
                  </div>
                  {RECURSOS_PREMIUM.map((item) => (
                    <ListItem key={item.label} item={item} onNavigate={closeAll} accent />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conteúdos Gratuitos */}
          <div className="relative">
            {trigger("conteudos", "Conteúdos Gratuitos", ["/portfolio", "/academy", "/conteudos", "/blog"])}
            {menu === "conteudos" && (
              <div className={`${panelBase} left-0`} onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
                <div className={`${panelCard} w-[360px] p-2`}>
                  <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Conteúdos Gratuitos
                  </div>
                  {CONTEUDOS.map((item) => (
                    <ListItem key={item.label} item={item} onNavigate={closeAll} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/planos"
            className={`rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
              isActive(["/planos"]) ? "text-ink" : "text-muted-foreground hover:text-ink"
            }`}
          >
            Planos
          </Link>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            to="/entrar"
            className="inline-flex h-9 items-center rounded-md px-3.5 text-[14px] font-medium text-ink transition-colors hover:bg-secondary"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-4 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-black"
          >
            Começar grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* ---------- Botão móvel ---------- */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-secondary lg:hidden"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ---------- Menu móvel (acordeão) ---------- */}
      {mobileOpen && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3" aria-label="Principal (móvel)">
            {(
              [
                { key: "funcionalidades", label: "Funcionalidades", items: FUNCIONALIDADES.flatMap((c) => c.items) },
                { key: "recursos", label: "Recursos", items: RECURSOS_PREMIUM },
                { key: "conteudos", label: "Conteúdos Gratuitos", items: CONTEUDOS },
              ] as { key: MenuKey; label: string; items: NavItem[] }[]
            ).map((sec) => (
              <div key={sec.key} className="border-b border-border/60">
                <button
                  type="button"
                  onClick={() => setMobileSection((s) => (s === sec.key ? null : sec.key))}
                  aria-expanded={mobileSection === sec.key}
                  className="flex w-full items-center justify-between py-3 text-[15px] font-medium text-ink"
                >
                  {sec.label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileSection === sec.key ? "rotate-180" : ""}`} />
                </button>
                {mobileSection === sec.key && (
                  <div className="pb-2">
                    {sec.items.map((item) => (
                      <ListItem key={item.label} item={item} onNavigate={closeAll} accent={sec.key === "recursos"} />
                    ))}
                    {sec.key === "recursos" && (
                      <Link to="/recursos" onClick={closeAll} className="block px-2.5 py-2 text-[13px] font-medium text-primary">
                        Ver todos os recursos →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
            <Link to="/planos" className="border-b border-border/60 py-3 text-[15px] font-medium text-ink">
              Planos
            </Link>
            <div className="grid grid-cols-2 gap-2 pt-4">
              <Link
                to="/entrar"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border text-[14px] font-medium text-ink"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="inline-flex h-10 items-center justify-center rounded-md bg-ink text-[14px] font-semibold text-white"
              >
                Começar grátis
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
