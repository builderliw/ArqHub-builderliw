import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Bell, Search, Settings, Menu } from "lucide-react";
import { useOfficeStatus } from "@/hooks/use-office-status";
import { clearSession, getSession, setSession, planHasFeature, PLAN_LABELS, type Role, type Session } from "@/lib/session";
import { MODULE_BY_NAV_LABEL } from "@/lib/module-access";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { useMensagensBadge } from "@/hooks/use-mensagens-badge";
import { ProfileSettingsModal } from "@/components/profile-settings-modal";
import { ClienteNotificationsBell } from "@/components/cliente-notifications-bell";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import arqhubLogo from "@/assets/arqhub-logo.png.asset.json";
import { resolveUserRole } from "@/lib/resolve-role.functions";

export type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

function withTimeout<T>(promise: Promise<T>, ms = 7000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

type SearchResult = {
  kind: "cliente" | "projeto" | "nav";
  label: string;
  sub?: string;
  to: string;
  search?: Record<string, string>;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatDateBR(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

function HeaderSearch({ groups, role }: { groups: NavGroup[]; role: Role }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [dataset, setDataset] = useState<{
    clientes: Array<{ id: string; name: string; email?: string | null; cidade?: string | null; created_at?: string | null }>;
    projetos: Array<{ id: string; name: string; client_id?: string | null; city?: string | null; created_at?: string | null; deadline?: string | null }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const navItems = groups.flatMap((g) => g.items).filter((it) => it.to !== "#");

  async function ensureLoaded() {
    if (role !== "profissional" || dataset || loading) return;
    setLoading(true);
    try {
      const { data } = await externalSupabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const { listProfissionalClientData } = await import("@/lib/profissional-clientes.functions");
      const res = await listProfissionalClientData({ data: { accessToken: token } });
      setDataset({
        clientes: (res.clientes ?? []) as any,
        projetos: (res.projetos ?? []) as any,
      });
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  const term = normalize(q);
  const results: SearchResult[] = [];
  if (term) {
    if (dataset) {
      const clienteById = new Map(dataset.clientes.map((c) => [c.id, c]));
      for (const c of dataset.clientes) {
        const hay = [c.name, c.email ?? "", c.cidade ?? "", formatDateBR(c.created_at)].join(" ");
        if (normalize(hay).includes(term)) {
          results.push({
            kind: "cliente",
            label: c.name,
            sub: [c.cidade, c.email].filter(Boolean).join(" · ") || "Cliente",
            to: "/app/profissional/clientes",
            search: { clientId: c.id },
            icon: Search,
          });
        }
      }
      for (const p of dataset.projetos) {
        const cliente = p.client_id ? clienteById.get(p.client_id) : null;
        const hay = [p.name, cliente?.name ?? "", p.city ?? "", formatDateBR(p.deadline), formatDateBR(p.created_at)].join(" ");
        if (normalize(hay).includes(term)) {
          results.push({
            kind: "projeto",
            label: p.name,
            sub: [cliente?.name, p.deadline ? `Entrega ${formatDateBR(p.deadline)}` : null].filter(Boolean).join(" · ") || "Projeto",
            to: "/app/profissional/clientes",
            search: cliente ? { clientId: cliente.id, projectId: p.id } : { projectId: p.id },
            icon: Search,
          });
        }
      }
    }
    for (const it of navItems) {
      if (normalize(it.label).includes(term)) {
        results.push({ kind: "nav", label: it.label, sub: "Ir para página", to: it.to, icon: it.icon });
      }
    }
  }

  const limited = results.slice(0, 12);

  function go(r: SearchResult) {
    navigate({ to: r.to as any, search: r.search as any });
    setQ("");
    setOpen(false);
  }

  return (
    <div className="hidden md:block relative">
      <div className="flex items-center gap-2 px-3 h-9 bg-secondary/60 border border-transparent hover:border-border rounded-md text-sm text-muted-foreground w-72 transition-colors focus-within:bg-white focus-within:border-border">
        <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); void ensureLoaded(); }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && limited[0]) {
              go(limited[0]);
            } else if (e.key === "Escape") {
              setQ(""); setOpen(false);
            }
          }}
          className="bg-transparent flex-1 focus:outline-none text-[13px] text-ink placeholder:text-muted-foreground"
          placeholder={role === "profissional" ? "Buscar cliente, projeto, data..." : "Buscar..."}
        />
      </div>
      {open && q.trim() && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-border rounded-md shadow-lg max-h-96 overflow-y-auto z-50 w-80">
          {loading && !dataset ? (
            <div className="px-3 py-2 text-[12.5px] text-muted-foreground">Carregando...</div>
          ) : limited.length === 0 ? (
            <div className="px-3 py-2 text-[12.5px] text-muted-foreground">Nada encontrado</div>
          ) : limited.map((r, idx) => (
            <button
              key={`${r.kind}-${r.label}-${idx}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(r)}
              className="w-full flex items-start gap-2 px-3 py-2 hover:bg-secondary/60 text-left border-b border-border/40 last:border-0"
            >
              <r.icon className="h-[15px] w-[15px] text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-ink truncate">{r.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                    {r.kind === "cliente" ? "Cliente" : r.kind === "projeto" ? "Projeto" : "Menu"}
                  </span>
                </div>
                {r.sub && <div className="text-[11.5px] text-muted-foreground truncate">{r.sub}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



export function AppShell({
  role,
  nav,
  title,
  children,
}: {
  role: Role;
  nav: NavItem[] | NavGroup[];
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [session, setSessionState] = useState<Session | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const officeStatus = useOfficeStatus();
  const loginTarget = role === "profissional" ? "escritorio" : role;

  useEffect(() => {
    let alive = true;
    (async () => {
      let s = getSession();
      if (!s) {
        try {
          const { data } = await withTimeout(externalSupabase.auth.getSession(), 4000);
          const token = data.session?.access_token;
          if (token) {
            const res = await withTimeout(resolveUserRole({ data: { accessToken: token } }), 7000);
            if (res.ok) {
              s = {
                role: res.role,
                name: res.name,
                email: res.email,
                onboardingDone: true,
                ...(res.role === "profissional"
                  ? { officeId: res.officeId, isMember: (res as { isMember?: boolean }).isMember }
                  : {}),
              };
              setSession(s);
            }
          }
        } catch (err) {
          console.error("[app-shell] restoreSession failed", err);
        }
      }
      if (!s || !s.onboardingDone) {
        navigate({ to: "/entrar/$role", params: { role: loginTarget } });
        return;
      }
      if (s.role !== role) {
        navigate({ to: "/app" });
        return;
      }
      if (role === "admin") {
        const { data: user } = await externalSupabase.auth.getUser();
        if (!user?.user) {
          clearSession();
          navigate({ to: "/entrar/$role", params: { role: "admin" } });
          return;
        }
        const { data: prof } = await externalSupabase
          .from("profiles")
          .select("is_admin_master")
          .eq("id", user.user.id)
          .maybeSingle();
        if (!prof?.is_admin_master) {
          toast.error("Acesso restrito: você não é administrador.");
          await externalSupabase.auth.signOut();
          clearSession();
          navigate({ to: "/entrar/$role", params: { role: "admin" } });
          return;
        }
      }
      if (alive) setSessionState(s);
      const { data: u } = await externalSupabase.auth.getUser();
      if (u.user) {
        const { data: prof } = await externalSupabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", u.user.id)
          .maybeSingle();
        if (alive) setAvatarUrl(prof?.avatar_url ?? null);
      }
    })();
    return () => { alive = false; };
  }, [role, loginTarget, navigate]);

  // Fecha o menu mobile ao trocar de rota
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  function logout() {
    externalSupabase.auth.signOut().catch(() => {});
    clearSession();
    navigate({ to: "/" });
  }
  const mensagensBadge = useMensagensBadge(role);

  if (!session) return null;

  const baseGroups: NavGroup[] = Array.isArray(nav) && nav.length > 0 && "items" in (nav[0] as object)
    ? (nav as NavGroup[])
    : [{ items: nav as NavItem[] }];

  const restrictedForMembers = new Set(["Financeiro", "Equipe", "Relatórios", "Relatório", "Relatorios"]);
  const planFiltered: NavGroup[] = baseGroups.map((g) => ({
    ...g,
    items: g.items.filter((it) => {
      if (role !== "profissional") return true;
      if (it.label === "IA ArqHub" && !planHasFeature(session.plan, "ia")) return false;
      if (session.isMember && restrictedForMembers.has(it.label)) return false;
      if (session.isMember && session.allowedModules) {
        const mod = MODULE_BY_NAV_LABEL[it.label];
        if (mod && !session.allowedModules.includes(mod)) return false;
      }
      return true;
    }),
  })).filter((g) => g.items.length > 0);


  const groups: NavGroup[] = planFiltered.map((g) => ({
    ...g,
    items: g.items.map((it) =>
      it.label === "Mensagens" && mensagensBadge > 0 ? { ...it, badge: mensagensBadge } : it,
    ),
  }));


  const roleLabel = role === "profissional" ? "Profissional" : role === "cliente" ? "Cliente" : "Admin";
  const roleColor =
    role === "profissional" ? "bg-primary" : role === "cliente" ? "bg-blue-600" : "bg-foreground";

  const sidebarInner = (
    <>
      <div className="h-14 flex items-center px-5 border-b border-border shrink-0">
        <div className="flex items-center gap-2 select-none leading-none">
          <img src={arqhubLogo.url} alt="ArqHub" className="h-6 w-6 object-contain block" />
          <span className="font-semibold tracking-tight font-display text-[15px] leading-none">
            <span className="text-ink">Arq</span><span className="text-primary">Hub</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 pt-4 pb-3 space-y-5 overflow-y-auto">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.label && (
              <div className="px-2.5 mb-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground/80">
                {g.label}
              </div>
            )}
            <ul className="space-y-px">
              {g.items.map((it) => {
                const active = it.to !== "#" && pathname === it.to;
                const cls = `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                  active
                    ? "bg-emerald-600 text-white font-medium hover:bg-emerald-600"
                    : "text-foreground/70 hover:bg-secondary/60 hover:text-ink"
                }`;

                const badgeNode = it.badge && it.badge > 0 ? (
                  <span
                    className={`ml-auto shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold tabular-nums ${
                      active ? "bg-white text-emerald-700" : "bg-primary text-white"
                    }`}
                    aria-label={`${it.badge} ${it.badge === 1 ? "não lida" : "não lidas"}`}
                  >
                    {it.badge > 99 ? "99+" : it.badge}
                  </span>
                ) : null;

                return (
                  <li key={it.label}>
                    {it.to === "#" ? (
                      <span className={cls + " opacity-60 cursor-not-allowed"}>
                        <it.icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{it.label}</span>
                        {badgeNode}
                      </span>
                    ) : (
                      <Link to={it.to} className={cls}>
                        <it.icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{it.label}</span>
                        {badgeNode}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border mx-3 shrink-0" />
      <div className="px-3 py-3 shrink-0">

        <div className="rounded-xl border border-border bg-secondary/30 p-2.5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className={`relative flex h-9 w-9 items-center justify-center rounded-lg ${roleColor} text-white text-sm font-semibold shrink-0 overflow-hidden ring-1 ring-black/5`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                (role === "profissional" ? officeStatus.officeName : session.name)?.[0]?.toUpperCase() ?? "U"
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-[13px] truncate leading-tight ${role === "profissional" ? "office-name-on-light" : "font-semibold text-ink"}`}>
                {role === "profissional" ? (officeStatus.officeName ?? session.name) : session.name}
              </div>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-ink transition-colors shrink-0"
              aria-label="Configurações do perfil"
              title="Configurações do perfil"
            >
              <Settings className="h-[15px] w-[15px]" strokeWidth={1.75} />
            </button>
          </div>

          {role === "profissional" && (
            <div className="rounded-lg bg-background border border-border/70 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    officeStatus.status === "active" ? "bg-emerald-500" :
                    officeStatus.status === "trial" ? "bg-amber-500" :
                    "bg-amber-500"
                  }`} />
                  <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Plano</span>
                </div>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                  session.plan === "premium" ? "bg-primary/15 text-primary" :
                  session.plan === "enterprise" ? "bg-foreground text-white" :
                  session.plan === "basico" ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {PLAN_LABELS[session.plan ?? "trial"]}
                </span>
              </div>
              {officeStatus.expiresAt && (
                <div className="mt-1 text-[10.5px] text-muted-foreground">
                  {officeStatus.status === "trial" ? "Termina em " : "Renova em "}
                  <span className="text-ink font-medium">
                    {new Date(officeStatus.expiresAt).toLocaleDateString("pt-BR")}
                  </span>
                  {officeStatus.daysLeft !== null && officeStatus.daysLeft >= 0 && (
                    <span> · {officeStatus.daysLeft}d</span>
                  )}
                </div>
              )}
              {session.plan !== "premium" && session.plan !== "enterprise" && (
                <Link
                  to="/planos"
                  className="mt-2 w-full inline-flex items-center justify-center rounded-md bg-primary px-2.5 py-1.5 text-[11.5px] font-medium text-white hover:bg-primary/90 transition-colors"
                >
                  Contratar plano
                </Link>
              )}
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] text-muted-foreground hover:bg-background hover:text-ink transition-colors"
          >
            <LogOut className="h-[14px] w-[14px]" strokeWidth={1.75} /> Sair
          </button>
        </div>

      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-white sticky top-0 h-screen">
        {sidebarInner}
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col bg-white md:hidden">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          {sidebarInner}
        </SheetContent>
      </Sheet>

      <ProfileSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={({ name, avatar_url }) => {
          setSessionState((prev) => (prev ? { ...prev, name } : prev));
          setAvatarUrl(avatar_url);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-white/80 backdrop-blur px-3 sm:px-6 pt-[env(safe-area-inset-top)] box-content flex items-center justify-between gap-2 sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-secondary/60 text-ink shrink-0"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <h1 className="text-[15px] font-semibold tracking-tight text-ink truncate font-display leading-none">{title}</h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <HeaderSearch groups={groups} role={role} />

            {role === "cliente" ? (
              <ClienteNotificationsBell />
            ) : (
              <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-ink transition-colors">
                <Bell className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </header>
        {role === "profissional" && <SubscriptionBanner />}
        <main className="flex-1 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-w-0 flex flex-col min-h-0">{children}</main>
      </div>
    </div>
  );
}
