import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Users, CreditCard, Shield, Activity, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight, MessageSquare, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { resetUserTrial, grantUserPlan } from "@/lib/admin-users.functions";
import { listAuthAccounts } from "@/lib/admin-accounts.functions";

export const Route = createFileRoute("/app/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Admin" }] }),
  component: Page,
});


type Row = {
  id: string;
  email: string | null;
  lastSignInAt?: string | null;
  incomplete?: boolean;
  full_name: string | null;
  is_admin_master: boolean | null;
  phone: string | null;
  created_at: string | null;
};

type PlanKind = "premium" | "basico" | "enterprise" | "trial" | "expirado" | "cancelado" | "membro" | "sem_escritorio";

type UserView = Row & {
  planKind: PlanKind;
  planLabel: string;
  officeName: string | null;
  officeStatus: string | null;
  planCode: string | null;
  trialExpiresAt: string | null;
  subscriptionEndsAt: string | null;
};

const PAGE_SIZE = 10;

const planBadge: Record<PlanKind, string> = {
  premium: "bg-primary/10 text-primary",
  enterprise: "bg-foreground/10 text-foreground",
  basico: "bg-blue-50 text-blue-700",
  trial: "bg-amber-50 text-amber-700",
  expirado: "bg-red-50 text-red-700",
  cancelado: "bg-red-50 text-red-700",
  membro: "bg-secondary text-foreground/70",
  sem_escritorio: "bg-secondary text-muted-foreground",
};

const planTitle: Record<PlanKind, string> = {
  premium: "Premium",
  enterprise: "Enterprise",
  basico: "Básico",
  trial: "Teste grátis",
  expirado: "Expirado",
  cancelado: "Cancelado",
  membro: "Membro",
  sem_escritorio: "Sem escritório",
};

function classifyPlanCode(code: string | null): PlanKind | null {
  if (!code) return null;
  const c = code.toLowerCase();
  if (c.includes("enterprise")) return "enterprise";
  if (c.includes("premium")) return "premium";
  if (c.includes("basic") || c.includes("basico") || c.includes("básico")) return "basico";
  return null;
}

function formatRemaining(iso: string | null): { label: string; tone: "ok" | "warn" | "danger" | "muted" } {
  if (!iso) return { label: "—", tone: "muted" };
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return { label: "—", tone: "muted" };
  const diffMs = end - Date.now();
  if (diffMs <= 0) return { label: "Expirado", tone: "danger" };
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const tone: "ok" | "warn" | "danger" = days >= 7 ? "ok" : days >= 3 ? "warn" : "danger";
  const label = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  return { label, tone };
}

type StatusKind = "trial" | "ativo" | "cancelado" | "expirado" | "sem_status";

const statusTitle: Record<StatusKind, string> = {
  trial: "Em teste",
  ativo: "Ativo",
  cancelado: "Cancelado",
  expirado: "Expirado",
  sem_status: "—",
};

const statusBadge: Record<StatusKind, string> = {
  trial: "bg-amber-50 text-amber-700 border border-amber-200",
  ativo: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelado: "bg-red-50 text-red-700 border border-red-200",
  expirado: "bg-red-50 text-red-700 border border-red-200",
  sem_status: "bg-secondary text-muted-foreground border border-border",
};

function computeStatusAndRemaining(u: {
  planKind: PlanKind;
  trialExpiresAt: string | null;
  subscriptionEndsAt: string | null;
}): { status: StatusKind; remainingMs: number | null; sourceIso: string | null } {
  const now = Date.now();
  if (u.planKind === "trial") {
    const end = u.trialExpiresAt ? new Date(u.trialExpiresAt).getTime() : NaN;
    if (!Number.isNaN(end)) {
      const diff = end - now;
      return diff <= 0
        ? { status: "expirado", remainingMs: 0, sourceIso: u.trialExpiresAt }
        : { status: "trial", remainingMs: diff, sourceIso: u.trialExpiresAt };
    }
    return { status: "trial", remainingMs: null, sourceIso: null };
  }
  if (u.planKind === "premium" || u.planKind === "basico" || u.planKind === "enterprise") {
    const end = u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt).getTime() : NaN;
    if (!Number.isNaN(end)) {
      const diff = end - now;
      return diff <= 0
        ? { status: "expirado", remainingMs: 0, sourceIso: u.subscriptionEndsAt }
        : { status: "ativo", remainingMs: diff, sourceIso: u.subscriptionEndsAt };
    }
    return { status: "ativo", remainingMs: null, sourceIso: null };
  }
  if (u.planKind === "cancelado") return { status: "cancelado", remainingMs: null, sourceIso: null };
  if (u.planKind === "expirado") return { status: "expirado", remainingMs: 0, sourceIso: null };
  if (u.planKind === "membro") return { status: "ativo", remainingMs: null, sourceIso: null };
  return { status: "sem_status", remainingMs: null, sourceIso: null };
}

function Page() {
  const [rows, setRows] = useState<UserView[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [filterAdmin, setFilterAdmin] = useState<"all" | "admin" | "user">("all");
  const [filterPlan, setFilterPlan] = useState<"all" | PlanKind>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | StatusKind>("all");
  const [sortBy, setSortBy] = useState<"remaining_asc" | "remaining_desc" | "recent">("remaining_asc");
  const [page, setPage] = useState(1);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const resetFn = useServerFn(resetUserTrial);
  const accountsFn = useServerFn(listAuthAccounts);
  const grantFn = useServerFn(grantUserPlan);

  async function handleGrantPlan(userId: string, name: string, planCode: "basico" | "premium" | "enterprise" | "none") {
    const label = planCode === "none" ? "Revogar assinatura" : `Liberar plano ${planCode}`;
    if (!confirm(`${label} para ${name || "este usuário"}?`)) return;
    setGrantingId(userId);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");
      await grantFn({ data: { accessToken, userId, planCode, months: 12 } });
      toast.success(planCode === "none" ? "Assinatura revogada." : `Plano ${planCode} liberado por 12 meses.`);
      await load();
    } catch (e: any) {
      toast.error("Falha ao alterar plano", { description: e?.message ?? "" });
    } finally {
      setGrantingId(null);
    }
  }

  async function handleResetTrial(userId: string, name: string) {
    if (!confirm(`Reiniciar 14 dias de teste grátis para ${name || "este usuário"}?`)) return;
    setResettingId(userId);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");
      await resetFn({ data: { accessToken, userId, days: 14 } });
      toast.success("Teste grátis reiniciado por 14 dias.");
      await load();
    } catch (e: any) {
      toast.error("Falha ao reiniciar teste", { description: e?.message ?? "" });
    } finally {
      setResettingId(null);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token ?? null;
      const accountsPromise = accessToken
        ? accountsFn({ data: { accessToken } }).catch(() => ({ accounts: [] as Array<{ id: string; email: string | null; created_at: string | null; last_sign_in_at: string | null }> }))
        : Promise.resolve({ accounts: [] as Array<{ id: string; email: string | null; created_at: string | null; last_sign_in_at: string | null }> });

      const [profilesRes, officesRes, subsRes, membersRes, plansRes, accountsRes] = await Promise.all([
        externalSupabase
          .from("profiles")
          .select("id, full_name, is_admin_master, phone, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
        externalSupabase
          .from("offices")
          .select("id, name, owner_id, status, trial_expires_at"),
        externalSupabase
          .from("subscriptions")
          .select("office_id, plan_id, status, current_period_end"),
        externalSupabase
          .from("office_members")
          .select("user_id, office_id, status"),
        externalSupabase.from("plans").select("id, code"),
        accountsPromise,
      ]);

      const accounts = accountsRes.accounts ?? [];
      const accountById = new Map(accounts.map((a) => [a.id, a]));

      if (profilesRes.error) throw profilesRes.error;

      const offices = (officesRes.data ?? []) as Array<{
        id: string;
        name: string | null;
        owner_id: string;
        status: string | null;
        trial_expires_at: string | null;
      }>;
      const subs = (subsRes.data ?? []) as Array<{
        office_id: string;
        plan_id: string | null;
        status: string | null;
        current_period_end: string | null;
      }>;
      const members = (membersRes.data ?? []) as Array<{
        user_id: string | null;
        office_id: string;
        status: string | null;
      }>;
      const planCodeById = new Map<string, string>(
        ((plansRes.data ?? []) as Array<{ id: string; code: string }>).map((p) => [p.id, p.code]),
      );

      const officeByOwner = new Map<string, typeof offices[number]>();
      offices.forEach((o) => officeByOwner.set(o.owner_id, o));
      const subByOffice = new Map<string, typeof subs[number]>();
      subs.forEach((s) => subByOffice.set(s.office_id, s));
      const memberOfficeByUser = new Map<string, string>();
      members.forEach((m) => {
        if (m.user_id && m.status === "active") memberOfficeByUser.set(m.user_id, m.office_id);
      });
      const officeById = new Map(offices.map((o) => [o.id, o]));

      const list: UserView[] = ((profilesRes.data ?? []) as Row[]).map((raw) => {
        const acc = accountById.get(raw.id);
        const p: Row = { ...raw, email: acc?.email ?? raw.email ?? null, lastSignInAt: acc?.last_sign_in_at ?? null };
        const ownedOffice = officeByOwner.get(p.id);
        if (ownedOffice) {
          const sub = subByOffice.get(ownedOffice.id);
          const planCode = sub?.plan_id ? planCodeById.get(sub.plan_id) ?? null : null;
          const codeKind = classifyPlanCode(planCode);
          let planKind: PlanKind = "trial";
          if (sub && sub.status === "active" && codeKind) planKind = codeKind;
          else if (sub && sub.status === "canceled") planKind = "cancelado";
          else if (ownedOffice.status === "active" && codeKind) planKind = codeKind;
          else if (ownedOffice.status === "expired") planKind = "expirado";
          else if (ownedOffice.status === "canceled") planKind = "cancelado";
          else planKind = "trial";
          return {
            ...p,
            planKind,
            planLabel: planTitle[planKind],
            officeName: ownedOffice.name,
            officeStatus: ownedOffice.status,
            planCode,
            trialExpiresAt: ownedOffice.trial_expires_at,
            subscriptionEndsAt: sub?.current_period_end ?? null,
          };
        }
        const memberOfficeId = memberOfficeByUser.get(p.id);
        if (memberOfficeId) {
          const off = officeById.get(memberOfficeId);
          return {
            ...p,
            planKind: "membro",
            planLabel: planTitle.membro,
            officeName: off?.name ?? null,
            officeStatus: off?.status ?? null,
            planCode: null,
            trialExpiresAt: null,
            subscriptionEndsAt: null,
          };
        }
        return {
          ...p,
          planKind: "sem_escritorio",
          planLabel: planTitle.sem_escritorio,
          officeName: null,
          officeStatus: null,
          planCode: null,
          trialExpiresAt: null,
          subscriptionEndsAt: null,
        };
      });

      // Contas que fizeram acesso mas não concluíram o cadastro (sem perfil)
      const profileIds = new Set(((profilesRes.data ?? []) as Row[]).map((p) => p.id));
      const pending: UserView[] = accounts
        .filter((a) => !profileIds.has(a.id))
        .map((a) => ({
          id: a.id,
          email: a.email ?? null,
          lastSignInAt: a.last_sign_in_at ?? null,
          incomplete: true,
          full_name: null,
          is_admin_master: false,
          phone: null,
          created_at: a.created_at ?? null,
          planKind: "sem_escritorio" as PlanKind,
          planLabel: "Cadastro incompleto",
          officeName: null,
          officeStatus: null,
          planCode: null,
          trialExpiresAt: null,
          subscriptionEndsAt: null,
        }));

      setRows([...list, ...pending]);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const enriched = useMemo(() => {
    return (rows ?? []).map((r) => ({ ...r, ...computeStatusAndRemaining(r) }));
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = enriched.filter((r) => {
      if (filterAdmin === "admin" && !r.is_admin_master) return false;
      if (filterAdmin === "user" && r.is_admin_master) return false;
      if (filterPlan !== "all" && r.planKind !== filterPlan) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (!term) return true;
      return (
        (r.full_name ?? "").toLowerCase().includes(term) ||
        (r.email ?? "").toLowerCase().includes(term) ||
        (r.officeName ?? "").toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    });
    const sorted = [...list];
    if (sortBy === "recent") {
      sorted.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
    } else {
      const dir = sortBy === "remaining_asc" ? 1 : -1;
      sorted.sort((a, b) => {
        const av = a.remainingMs;
        const bv = b.remainingMs;
        if (av === null && bv === null) return 0;
        if (av === null) return 1; // sem tempo → sempre no fim
        if (bv === null) return -1;
        return (av - bv) * dir;
      });
    }
    return sorted;
  }, [enriched, q, filterAdmin, filterPlan, filterStatus, sortBy]);

  const counts = useMemo(() => {
    const c: Record<PlanKind, number> = {
      premium: 0, enterprise: 0, basico: 0, trial: 0, expirado: 0, cancelado: 0, membro: 0, sem_escritorio: 0,
    };
    (rows ?? []).forEach((r) => { c[r.planKind]++; });
    return c;
  }, [rows]);

  const segments = useMemo(() => {
    const total = enriched.length;
    const trial = enriched.filter((r) => r.status === "trial").length;
    const assinantes = enriched.filter(
      (r) => r.status === "ativo" && (r.planKind === "premium" || r.planKind === "basico" || r.planKind === "enterprise"),
    ).length;
    const expirados = enriched.filter((r) => r.status === "expirado" || r.status === "cancelado").length;
    const equipe = enriched.filter((r) => r.planKind === "membro").length;
    const semEscritorio = enriched.filter((r) => r.planKind === "sem_escritorio").length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return { total, trial, assinantes, expirados, equipe, semEscritorio, pct };
  }, [enriched]);


  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [q, filterAdmin, filterPlan, filterStatus, sortBy]);

  return (
    <AppShell role="admin" nav={adminNav} title="Usuários">
      {/* Painel principal */}
      <section className="mb-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Usuários com login na plataforma
            </p>
            <div className="mt-1 flex items-end gap-3">
              <span className="text-5xl font-semibold leading-none tracking-tight text-ink">
                {rows === null ? "—" : segments.total}
              </span>
              <button
                onClick={load}
                className="mb-1 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] hover:bg-secondary"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
              </button>
            </div>
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              {segments.equipe} membro(s) de equipe · {segments.semEscritorio} sem escritório
            </p>
            {/* barra de distribuição */}
            <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="bg-emerald-500" style={{ width: `${segments.pct(segments.assinantes)}%` }} />
              <div className="bg-amber-400" style={{ width: `${segments.pct(segments.trial)}%` }} />
              <div className="bg-red-400" style={{ width: `${segments.pct(segments.expirados)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {([
              { key: "ativo", label: "Com assinatura", value: segments.assinantes, dot: "bg-emerald-500", tint: "hover:border-emerald-300", icon: CreditCard },
              { key: "trial", label: "Em teste grátis", value: segments.trial, dot: "bg-amber-400", tint: "hover:border-amber-300", icon: Activity },
              { key: "expirado", label: "Expirados / cancelados", value: segments.expirados, dot: "bg-red-400", tint: "hover:border-red-300", icon: AlertCircle },
            ] as const).map((s) => {
              const active = filterStatus === s.key;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setFilterStatus((prev) => (prev === s.key ? "all" : (s.key as StatusKind)))}
                  className={`rounded-xl border border-border bg-white p-4 text-left transition-colors ${s.tint} ${active ? "ring-2 ring-primary/40" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                      <span className="truncate text-[12px] font-medium text-muted-foreground">{s.label}</span>
                    </span>
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-semibold leading-none text-ink">{s.value}</span>
                    <span className="text-[12px] text-muted-foreground">{segments.pct(s.value)}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* detalhamento por plano */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          {(["premium","enterprise","basico","trial","expirado","cancelado","membro","sem_escritorio"] as PlanKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setFilterPlan((prev) => (prev === k ? "all" : k))}
              className={`inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12px] hover:bg-secondary/60 ${filterPlan === k ? "ring-2 ring-primary/40" : ""}`}
            >
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${planBadge[k]}`}>{planTitle[k]}</span>
              <span className="font-semibold text-ink">{counts[k]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, e-mail, escritório ou ID"
            className="w-full rounded-lg border border-border bg-white py-2 pl-8 pr-3 text-[13px]"
          />
        </div>
        <select
          value={filterAdmin}
          onChange={(e) => setFilterAdmin(e.target.value as any)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] sm:w-auto"
        >
          <option value="all">Todos os papéis</option>
          <option value="admin">Admin master</option>
          <option value="user">Usuários comuns</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] sm:w-auto"
        >
          <option value="all">Todos os status</option>
          <option value="trial">Em teste</option>
          <option value="ativo">Ativo</option>
          <option value="cancelado">Cancelado</option>
          <option value="expirado">Expirado</option>
          <option value="sem_status">Sem status</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] sm:w-auto"
        >
          <option value="remaining_asc">Menor tempo restante</option>
          <option value="remaining_desc">Maior tempo restante</option>
          <option value="recent">Mais recentes</option>
        </select>
        {(filterPlan !== "all" || filterStatus !== "all" || filterAdmin !== "all" || q) && (
          <button
            onClick={() => { setQ(""); setFilterPlan("all"); setFilterStatus("all"); setFilterAdmin("all"); }}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13px] hover:bg-secondary sm:w-auto"
          >
            Limpar filtros
          </button>
        )}
      </div>


      {err && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-[13px] mb-4">{err}</div>}

      <div className="bg-white border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-secondary">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Nome</th>
              <th className="px-4 py-2.5 font-medium">E-mail</th>
              <th className="px-4 py-2.5 font-medium">Escritório</th>
              <th className="px-4 py-2.5 font-medium">Plano</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Tempo restante</th>
              <th className="px-4 py-2.5 font-medium">Telefone</th>
              <th className="px-4 py-2.5 font-medium">Papel</th>
              <th className="px-4 py-2.5 font-medium">Cadastro</th>
              <th className="px-4 py-2.5 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows === null ? (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
            ) : pageRows.map((u) => {
              const canReset = u.planKind === "trial" || u.planKind === "expirado" || u.planKind === "cancelado";
              const isSubscriber = u.planKind === "premium" || u.planKind === "basico" || u.planKind === "enterprise";
              const remaining = isSubscriber
                ? formatRemaining(u.subscriptionEndsAt)
                : u.planKind === "trial"
                ? formatRemaining(u.trialExpiresAt)
                : u.planKind === "expirado"
                ? { label: "Expirado", tone: "danger" as const }
                : { label: "—", tone: "muted" as const };
              const toneClass = remaining.tone === "ok"
                ? "bg-emerald-50 text-emerald-700"
                : remaining.tone === "warn"
                ? "bg-amber-50 text-amber-700"
                : remaining.tone === "danger"
                ? "bg-red-50 text-red-700"
                : "text-muted-foreground";
              const remainingHint = isSubscriber ? "Assinatura" : u.planKind === "trial" ? "Teste grátis" : "";
              return (
              <tr key={u.id} className="hover:bg-secondary/30">
                <td className="px-4 py-2.5">
                  <div className="text-ink">{u.full_name ?? "—"}</div>
                  <div className="font-mono text-[10.5px] text-muted-foreground truncate max-w-[220px]">{u.id}</div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-ink truncate max-w-[240px]">{u.email ?? <span className="text-muted-foreground">—</span>}</div>
                  {u.incomplete && (
                    <span className="mt-0.5 inline-flex rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
                      Cadastro incompleto
                    </span>
                  )}
                  {u.lastSignInAt && (
                    <div className="text-[10.5px] text-muted-foreground">
                      Último acesso: {new Date(u.lastSignInAt).toLocaleString("pt-BR")}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">{u.officeName ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex text-[10.5px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${planBadge[u.planKind]}`}>
                    {u.planLabel}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex text-[10.5px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${statusBadge[(u as any).status as StatusKind]}`}>
                    {statusTitle[(u as any).status as StatusKind]}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {remaining.tone === "muted" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-col">
                      <span className={`inline-flex w-fit text-[10.5px] font-medium px-1.5 py-0.5 rounded ${toneClass}`}>
                        {remaining.label}
                      </span>
                      {remainingHint && (
                        <span className="text-[10.5px] text-muted-foreground mt-0.5">{remainingHint}</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">{u.phone ?? "—"}</td>
                <td className="px-4 py-2.5">
                  {u.is_admin_master ? (
                    <span className="text-[10.5px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Admin master</span>
                  ) : (
                    <span className="text-muted-foreground">Usuário</span>
                  )}
                </td>
                <td className="px-4 py-2.5">{u.created_at ? new Date(u.created_at).toLocaleString("pt-BR") : "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {u.planKind !== "sem_escritorio" && u.planKind !== "membro" && (
                      <select
                        value=""
                        disabled={grantingId === u.id}
                        onChange={(e) => {
                          const v = e.target.value as "basico" | "premium" | "enterprise" | "none" | "";
                          if (!v) return;
                          handleGrantPlan(u.id, u.full_name ?? "", v);
                          e.target.value = "";
                        }}
                        className="rounded-md border border-border bg-white px-2 py-1.5 text-[12px] disabled:opacity-50"
                        title="Atribuir plano manualmente (sem pagamento)"
                      >
                        <option value="">{grantingId === u.id ? "Aplicando…" : "Atribuir plano…"}</option>
                        <option value="basico">Liberar Básico (12 meses)</option>
                        <option value="premium">Liberar Premium (12 meses)</option>
                        <option value="enterprise">Liberar Enterprise (12 meses)</option>
                        <option value="none">Revogar assinatura</option>
                      </select>
                    )}
                    {canReset && (
                      <button
                        onClick={() => handleResetTrial(u.id, u.full_name ?? "")}
                        disabled={resettingId === u.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-[12px] hover:bg-primary/5 hover:border-primary/30 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Reiniciar 14 dias de teste grátis"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${resettingId === u.id ? "animate-spin" : ""}`} />
                        {resettingId === u.id ? "Reiniciando…" : "Reiniciar teste"}
                      </button>
                    )}
                    {!canReset && (u.planKind === "sem_escritorio" || u.planKind === "membro") && (
                      <span className="text-muted-foreground text-[11.5px]">—</span>
                    )}
                  </div>
                </td>

              </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-[12.5px] text-muted-foreground">
          <span>Página {currentPage} de {totalPages} · {filtered.length} resultado(s)</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

