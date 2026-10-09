import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { UsersRound, Plus, Loader2, Trash2, CheckCircle2, Clock, ChevronDown, ChevronRight, Shield, Lock, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { getSession, planHasFeature, type Plan } from "@/lib/session";
import { hasFeature, limitLabel, planLimits } from "@/lib/plan-features";
import { useUpgradeModal } from "@/components/upgrade-modal";
import { inviteTeamMember } from "@/lib/team-invite.functions";
import { toast } from "sonner";

const CARGOS = ["Arquiteto(a)", "Estagiário(a)", "Designer", "Engenheiro(a)", "Administrativo", "Outro"];

export const Route = createFileRoute("/app/profissional/equipe")({
  head: () => ({ meta: [{ title: "Equipe — ArqHub" }] }),
  component: EquipePage,
});

type Member = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  status: "invited" | "active" | "disabled";
  invited_at: string;
  joined_at: string | null;
  user_id: string | null;
  role_id: string | null;
  position: string | null;
};

type Role = { id: string; name: string; modules: string[] };

const AVAILABLE_MODULES = [
  { key: "projetos", label: "Projetos" },
  { key: "clientes", label: "Clientes" },
  { key: "cronograma", label: "Cronograma" },
  { key: "mensagens", label: "Mensagens" },
  { key: "escritorio", label: "Escritório" },
  { key: "ia", label: "IA" },
];

// Plano premium libera papéis customizados
function isPremium(): boolean {
  const plan: Plan = (getSession()?.plan ?? "trial") as Plan;
  return hasFeature(plan, "papeis");
  void planHasFeature;
}


function EquipePage() {
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState(CARGOS[0]);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showRolesPanel, setShowRolesPanel] = useState(false);
  const inviteFn = useServerFn(inviteTeamMember);
  const premium = isPremium();
  const seats = planLimits((getSession()?.plan ?? "trial") as Plan).seats;
  const { requireUpgrade, modal: upgradeModal } = useUpgradeModal();

  async function load() {
    setLoading(true);
    const { data: u } = await externalSupabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { data: offs } = await externalSupabase
      .from("offices").select("id").eq("owner_id", u.user.id).limit(1);
    const oid = offs?.[0]?.id ?? null;
    setOfficeId(oid);
    if (!oid) { setLoading(false); return; }

    const [mRes, rRes] = await Promise.all([
      externalSupabase.from("office_members")
        .select("id, email, full_name, avatar_url, status, invited_at, joined_at, user_id, role_id, position")
        .eq("office_id", oid).order("invited_at", { ascending: false }),
      externalSupabase.from("office_roles").select("id, name, modules").eq("office_id", oid).order("name"),
    ]);
    setMembers((mRes.data as Member[]) ?? []);
    setRoles((rRes.data as Role[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);


  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!officeId) return;
    if (members.length >= seats) {
      requireUpgrade({
        title: "Limite de acessos atingido",
        description: `Seu plano permite ${limitLabel(seats)} acessos de escritório/equipe. Faça upgrade para liberar mais assentos.`,
      });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    if (!cleanEmail || !cleanName) { toast.error("Preencha nome e e-mail."); return; }
    if (pwd.length < 6) { toast.error("Senha precisa de pelo menos 6 caracteres."); return; }
    if (pwd !== pwd2) { toast.error("As senhas não coincidem."); return; }

    setBusy(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { toast.error("Sessão expirada. Entre novamente."); return; }
      await inviteFn({ data: {
        accessToken: token, officeId, fullName: cleanName, email: cleanEmail,
        password: pwd, position,
      }});
      toast.success("Membro cadastrado. Pode entrar com o e-mail e senha.");
      setEmail(""); setFullName(""); setPwd(""); setPwd2(""); setPosition(CARGOS[0]);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar membro.");
    } finally { setBusy(false); }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remover ${name} da equipe?`)) return;
    const { error } = await externalSupabase.from("office_members").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Membro removido.");
    setMembers((m) => m.filter((x) => x.id !== id));
  }

  async function setMemberRole(memberId: string, roleId: string | null) {
    const { error } = await externalSupabase.from("office_members").update({ role_id: roleId }).eq("id", memberId);
    if (error) { toast.error(error.message); return; }
    setMembers((arr) => arr.map((m) => m.id === memberId ? { ...m, role_id: roleId } : m));
    toast.success("Papel atualizado.");
  }

  return (
    <AppShell role="profissional" nav={nav} title="Equipe">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Equipe do escritório</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Convide membros do escritório. Todos os membros têm acesso a todos os projetos{premium ? " e você pode definir papéis customizados" : " — (Premium) crie papéis customizados"}.
          </p>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            Acessos usados: <strong className="text-ink">{members.length}</strong> de {limitLabel(seats)}
          </p>

        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => premium
                ? setShowRolesPanel((v) => !v)
                : requireUpgrade({
                    title: "Papéis e permissões é um recurso Premium",
                    description: "Crie papéis personalizados para a sua equipe nos planos Premium e Enterprise.",
                  })}
            className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[13px] font-medium border ${premium ? "border-border hover:bg-secondary" : "border-border text-muted-foreground"}`}
          >
            {premium ? <Shield className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} Papéis
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 bg-ink text-white rounded-md text-[13px] font-medium hover:bg-black"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Convidar membro
          </button>
        </div>
      </div>

      {showRolesPanel && premium && (
        <RolesPanel officeId={officeId} roles={roles} onChange={load} />
      )}

      {showForm && (
        <form onSubmit={invite} className="bg-white border border-border rounded-xl p-5 mb-6 max-w-2xl grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Nome</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Maria Arquiteta"
              className="w-full h-9 px-3 rounded-md border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" required />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Cargo</label>
            <select value={position} onChange={(e) => setPosition(e.target.value)}
              className="w-full h-9 px-2 rounded-md border border-border text-[13px] bg-white">
              {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@exemplo.com"
              className="w-full h-9 px-3 rounded-md border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" required />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Senha</label>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={6} placeholder="Mín. 6 caracteres"
              className="w-full h-9 px-3 rounded-md border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" required />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Confirmar senha</label>
            <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} minLength={6}
              className="w-full h-9 px-3 rounded-md border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" required />
          </div>
          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 h-9 text-[13px] text-muted-foreground hover:text-ink">Cancelar</button>
            <button type="submit" disabled={busy}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 bg-primary text-white rounded-md text-[13px] font-medium hover:bg-primary/90 disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Cadastrar membro
            </button>
          </div>
          <p className="sm:col-span-2 text-[11.5px] text-muted-foreground">
            O membro entra direto na tela de login com este e-mail e senha. Compartilhe com ele de forma segura.
          </p>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : members.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <UsersRound className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <h3 className="text-[15px] font-semibold text-ink">Nenhum membro na equipe</h3>
          <p className="text-[12.5px] text-muted-foreground mt-1">Convide colaboradores para participar dos projetos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => {
            const isOpen = !!expanded[m.id];
            const canExpand = premium && roles.length > 0;
            const isOwner = m.position === null && !m.role_id && m.email === members[0]?.email && members.findIndex(x => x.id === m.id) === members.findIndex(x => x.email === m.email);
            const roleName = roles.find((r) => r.id === m.role_id)?.name;
            return (
              <div key={m.id} className="group relative bg-white border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all">
                <button
                  onClick={() => remove(m.id, m.full_name)}
                  className="absolute top-3 right-3 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <span className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center text-[20px] font-semibold overflow-hidden ring-2 ring-white shadow-sm">
                    {m.avatar_url ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" /> : (m.full_name[0]?.toUpperCase() ?? "?")}
                  </span>
                  <div className="mt-3 text-[14px] font-semibold text-ink truncate max-w-full">{m.full_name}</div>
                  {m.position && (
                    <div className="mt-0.5 text-[12px] text-muted-foreground">{m.position}</div>
                  )}
                  <div className="mt-1 text-[11.5px] text-muted-foreground truncate max-w-full">{m.email}</div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full ${
                      m.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      m.status === "invited" ? "bg-amber-100 text-amber-700" : "bg-secondary text-muted-foreground"
                    }`}>
                      {m.status === "active" ? <><CheckCircle2 className="h-3 w-3" /> Ativo</> :
                       m.status === "invited" ? <><Clock className="h-3 w-3" /> Convidado</> : <>Inativo</>}
                    </span>
                    {roleName && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        <Shield className="h-3 w-3" /> {roleName}
                      </span>
                    )}
                  </div>
                </div>

                {canExpand && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <button
                      onClick={() => setExpanded((s) => ({ ...s, [m.id]: !s[m.id] }))}
                      className="w-full inline-flex items-center justify-center gap-1 text-[11.5px] text-muted-foreground hover:text-ink"
                    >
                      {isOpen ? <><ChevronDown className="h-3.5 w-3.5" /> Ocultar papel</> : <><ChevronRight className="h-3.5 w-3.5" /> Definir papel</>}
                    </button>
                    {isOpen && (
                      <select
                        value={m.role_id ?? ""}
                        onChange={(e) => setMemberRole(m.id, e.target.value || null)}
                        className="mt-2 w-full h-8 px-2 text-[12px] rounded-md border border-border bg-white"
                      >
                        <option value="">— Sem papel —</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    )}
                  </div>
                )}
                {void isOwner}
              </div>
            );
          })}
        </div>
      )}
      {upgradeModal}
    </AppShell>
  );
}

function RolesPanel({ officeId, roles, onChange }: { officeId: string | null; roles: Role[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function toggleMod(k: string) {
    setModules((arr) => arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);
  }

  async function create() {
    if (!officeId || !name.trim()) { toast.error("Dê um nome ao papel."); return; }
    setBusy(true);
    const { error } = await externalSupabase.from("office_roles")
      .insert({ office_id: officeId, name: name.trim(), modules });
    setBusy(false);
    if (error) {
      if (error.code === "23505") toast.error("Já existe um papel com esse nome.");
      else toast.error(error.message);
      return;
    }
    setName(""); setModules([]);
    toast.success("Papel criado.");
    onChange();
  }

  async function removeRole(id: string, n: string) {
    if (!confirm(`Excluir o papel "${n}"?`)) return;
    const { error } = await externalSupabase.from("office_roles").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Papel removido.");
    onChange();
  }

  return (
    <div className="bg-white border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-[14px] font-semibold text-ink">Papéis customizados</h3>
        <span className="text-[10.5px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">Premium</span>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-4">
        <div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Arquiteto Sênior"
            className="w-full h-9 px-3 rounded-md border border-border text-[13px]" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {AVAILABLE_MODULES.map((mod) => (
              <button key={mod.key} type="button" onClick={() => toggleMod(mod.key)}
                className={`text-[12px] px-2 py-1 rounded-md border ${modules.includes(mod.key) ? "bg-primary text-white border-primary" : "border-border text-ink hover:bg-secondary"}`}>
                {mod.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={create} disabled={busy}
          className="self-start inline-flex items-center gap-1.5 px-3.5 h-9 bg-primary text-white rounded-md text-[13px] font-medium hover:bg-primary/90 disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Criar papel
        </button>
      </div>

      {roles.length === 0 ? (
        <p className="text-[12px] text-muted-foreground italic">Nenhum papel criado ainda.</p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md">
          {roles.map((r) => (
            <li key={r.id} className="px-3 py-2 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink">{r.name}</div>
                <div className="text-[11.5px] text-muted-foreground truncate">
                  {r.modules.length === 0 ? "Sem módulos" : r.modules.map((k) => AVAILABLE_MODULES.find((m) => m.key === k)?.label ?? k).join(" · ")}
                </div>
              </div>
              <button onClick={() => removeRole(r.id, r.name)} className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
