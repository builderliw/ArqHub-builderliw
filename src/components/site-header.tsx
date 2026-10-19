// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Cabeçalho das páginas públicas do site.
import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import logoMark from "@/assets/arqhub-logo-mark.png.asset.json";

const NAV: { to: string; label: string }[] = [
  { to: "/recursos", label: "Recursos" },
  { to: "/modulos", label: "Módulos" },
  { to: "/portal-cliente", label: "Portal do Cliente" },
  { to: "/planos", label: "Planos" },
  { to: "/blog", label: "Conteúdos" },
  { to: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Fecha o menu móvel ao trocar de página.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="ArqHub — página inicial">
          <img src={logoMark.url} alt="" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold font-display tracking-tight">
            <span className="text-ink">Arq</span>
            <span className="text-primary">Hub</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to as any}
              className={`px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                isActive(item.to)
                  ? "text-ink bg-secondary"
                  : "text-muted-foreground hover:text-ink hover:bg-secondary/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden lg:flex items-center gap-2">
          <Link
            to="/entrar"
            className="px-3.5 h-9 inline-flex items-center rounded-md text-[14px] font-medium text-ink hover:bg-secondary transition-colors"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="px-4 h-9 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-[14px] font-semibold shadow-sm hover:bg-primary/90 transition-colors"
          >
            Começar grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-secondary"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="mx-auto max-w-7xl px-6 py-3 flex flex-col" aria-label="Principal (móvel)">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to as any}
                className={`py-2.5 text-[15px] font-medium border-b border-border/60 last:border-0 ${
                  isActive(item.to) ? "text-primary" : "text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-3">
              <Link
                to="/entrar"
                className="h-10 inline-flex items-center justify-center rounded-md border border-border text-[14px] font-medium text-ink"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="h-10 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-[14px] font-semibold"
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
