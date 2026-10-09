import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Briefcase, User, Shield, Check, ArrowRight,
  Building2, Phone, Users, Sparkles, FolderOpen, MessageSquare,
  KeyRound, Mail, Lock,
} from "lucide-react";
import { getSession, setSession, type Role } from "@/lib/session";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Bem-vindo ao ArqHub" }] }),
  component: Onboarding,
});

// ---------- Schemas (validação client-side) ----------
const baseName = z.string().trim().min(2, "Mínimo 2 caracteres").max(80);
const phone = z.string().trim().regex(/^[0-9()+\-\s]{8,20}$/, "Telefone inválido");

const profissionalSchema = z.object({
  name: baseName,
  escritorio: z.string().trim().min(2, "Informe o escritório").max(80),
  especialidade: z.enum(["arquitetura", "engenharia", "interiores", "construtora", "autonomo"]),
  equipe: z.enum(["1", "2-5", "6-15", "16-50", "50+"]),
  telefone: phone,
});

const clienteSchema = z.object({
  name: baseName,
  conviteCodigo: z.string().trim().regex(/^[A-Z0-9-]{4,20}$/i, "Formato: ARQ-12345").optional().or(z.literal("")),
  telefone: phone,
});

const adminSchema = z.object({
  name: baseName,
  organizacao: z.string().trim().min(2).max(80),
  cargo: z.string().trim().min(2).max(80),
  codigoAdmin: z.string().trim().regex(/^ADM-[A-Z0-9]{6,12}$/i, "Use o código fornecido pela ArqHub. Ex.: ADM-XXXX12"),
});

type FormData = Record<string, string>;

const perfis: { id: Role; icon: typeof Briefcase; title: string; desc: string }[] = [
  { id: "profissional", icon: Briefcase, title: "Profissional", desc: "Arquiteto, engenheiro ou designer gerenciando projetos e equipe." },
  { id: "cliente", icon: User, title: "Cliente", desc: "Acompanhar um projeto contratado de um profissional." },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [form, setForm] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const s = getSession();
    if (s?.role) {
      setSession({
        role: s.role,
        name: s.name || "Usuário",
        email: s.email,
        onboardingDone: true,
      });
      navigate({ to: "/app" });
      return;
    }
    if (s?.name) setForm((f) => ({ ...f, name: s.name ?? "" }));
  }, [navigate]);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  function validateStep2() {
    if (!role) return false;
    const schema =
      role === "profissional" ? profissionalSchema :
      role === "cliente" ? clienteSchema : adminSchema;
    const res = schema.safeParse(form);
    if (!res.success) {
      const flat: Record<string, string> = {};
      for (const issue of res.error.issues) flat[String(issue.path[0])] = issue.message;
      setErrors(flat);
      return false;
    }
    setErrors({});
    return true;
  }

  function finish() {
    if (!role) return;
    setSession({
      role,
      name: form.name || "Usuário",
      email: getSession()?.email,
      onboardingDone: true,
    });
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">A</span>
            <span className="font-bold tracking-tight font-display">ArqHub</span>
          </div>
          <div className="text-xs text-muted-foreground">Etapa {step} de 3</div>
        </div>
        <div className="h-1 bg-secondary">
          <div className="h-1 bg-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="mx-auto max-w-2xl">
          {step === 1 && (
            <Step1 role={role} setRole={setRole} onNext={() => setStep(2)} />
          )}

          {step === 2 && role === "profissional" && (
            <StepProfissional
              form={form}
              errors={errors}
              update={update}
              onBack={() => setStep(1)}
              onNext={() => validateStep2() && setStep(3)}
            />
          )}
          {step === 2 && role === "cliente" && (
            <StepCliente
              form={form}
              errors={errors}
              update={update}
              onBack={() => setStep(1)}
              onNext={() => validateStep2() && setStep(3)}
            />
          )}
          {step === 2 && role === "admin" && (
            <StepAdmin
              form={form}
              errors={errors}
              update={update}
              onBack={() => setStep(1)}
              onNext={() => validateStep2() && setStep(3)}
            />
          )}

          {step === 3 && role && (
            <Step3 role={role} form={form} onBack={() => setStep(2)} onFinish={finish} />
          )}
        </div>
      </main>
    </div>
  );
}

// ---------- Step 1 ----------
function Step1({ role, setRole, onNext }: { role: Role | null; setRole: (r: Role) => void; onNext: () => void }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Como você vai usar o ArqHub?</h1>
      <p className="mt-2 text-muted-foreground">Vamos personalizar sua experiência com base no seu perfil.</p>
      <div className="mt-8 space-y-3">
        {perfis.map((p) => {
          const active = role === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setRole(p.id)}
              className={`w-full flex items-center gap-4 p-5 bg-white border-2 rounded-xl text-left transition-all ${
                active ? "border-primary shadow-md" : "border-border hover:border-primary/50"
              }`}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${active ? "bg-primary text-white" : "bg-accent text-primary-dark"}`}>
                <p.icon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{p.title}</span>
                <span className="block text-sm text-muted-foreground">{p.desc}</span>
              </span>
              {active && <Check className="h-5 w-5 text-primary" />}
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          disabled={!role}
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continuar <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------- Reusable ----------
function Field({
  label, name, value, onChange, error, placeholder, icon: Icon, type = "text",
}: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  error?: string; placeholder?: string; icon?: React.ComponentType<{ className?: string }>; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground/70">{label}</label>
      <div className="relative mt-1">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={120}
          className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
            error ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-primary/20"
          }`}
          placeholder={placeholder}
          name={name}
        />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Select({
  label, value, onChange, options, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; error?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground/70">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${
          error ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-primary/20"
        }`}
      >
        <option value="">Selecione...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function StepFooter({ onBack, onNext, nextLabel = "Continuar" }: { onBack: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="mt-8 flex justify-between">
      <button onClick={onBack} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">← Voltar</button>
      <button onClick={onNext} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors">
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------- Step 2: Profissional ----------
function StepProfissional({ form, errors, update, onBack, onNext }: {
  form: FormData; errors: Record<string, string>;
  update: (k: string, v: string) => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Sobre seu escritório</h1>
      <p className="mt-2 text-muted-foreground">Vamos preparar seu ambiente de trabalho com projetos, equipe e financeiro.</p>
      <div className="mt-8 space-y-4 bg-white p-6 rounded-2xl border border-border">
        <Field label="Seu nome" name="name" icon={User} value={form.name} onChange={(v) => update("name", v)} error={errors.name} placeholder="Como devemos te chamar" />
        <Field label="Nome do escritório" name="escritorio" icon={Building2} value={form.escritorio} onChange={(v) => update("escritorio", v)} error={errors.escritorio} placeholder="Ex.: Estúdio Aurora" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Especialidade principal"
            value={form.especialidade}
            onChange={(v) => update("especialidade", v)}
            error={errors.especialidade}
            options={[
              { value: "arquitetura", label: "Arquitetura" },
              { value: "engenharia", label: "Engenharia" },
              { value: "interiores", label: "Design de Interiores" },
              { value: "construtora", label: "Construtora" },
              { value: "autonomo", label: "Profissional autônomo" },
            ]}
          />
          <Select
            label="Tamanho da equipe"
            value={form.equipe}
            onChange={(v) => update("equipe", v)}
            error={errors.equipe}
            options={[
              { value: "1", label: "Só eu" },
              { value: "2-5", label: "2 a 5 pessoas" },
              { value: "6-15", label: "6 a 15 pessoas" },
              { value: "16-50", label: "16 a 50 pessoas" },
              { value: "50+", label: "Mais de 50" },
            ]}
          />
        </div>
        <Field label="Telefone de contato" name="telefone" icon={Phone} value={form.telefone} onChange={(v) => update("telefone", v)} error={errors.telefone} placeholder="(11) 98888-7777" />
      </div>
      <StepFooter onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ---------- Step 2: Cliente ----------
function StepCliente({ form, errors, update, onBack, onNext }: {
  form: FormData; errors: Record<string, string>;
  update: (k: string, v: string) => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Conecte-se ao seu projeto</h1>
      <p className="mt-2 text-muted-foreground">Se você já tem um profissional, informe o código de convite que ele enviou.</p>
      <div className="mt-8 space-y-4 bg-white p-6 rounded-2xl border border-border">
        <Field label="Seu nome" name="name" icon={User} value={form.name} onChange={(v) => update("name", v)} error={errors.name} placeholder="Como devemos te chamar" />
        <Field label="Telefone (WhatsApp)" name="telefone" icon={Phone} value={form.telefone} onChange={(v) => update("telefone", v)} error={errors.telefone} placeholder="(11) 99999-0000" />
        <Field
          label="Código de convite do profissional (opcional)"
          name="conviteCodigo"
          icon={KeyRound}
          value={form.conviteCodigo}
          onChange={(v) => update("conviteCodigo", v.toUpperCase())}
          error={errors.conviteCodigo}
          placeholder="ARQ-12345"
        />
        <p className="text-xs text-muted-foreground bg-accent/40 border border-primary/20 rounded-lg p-3">
          Sem código? Tudo bem — você pode usar a área de demonstração até receber o convite.
        </p>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ---------- Step 2: Admin ----------
function StepAdmin({ form, errors, update, onBack, onNext }: {
  form: FormData; errors: Record<string, string>;
  update: (k: string, v: string) => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Acesso administrativo</h1>
      <p className="mt-2 text-muted-foreground">Esta área é restrita à equipe ArqHub. Informe o código de administrador.</p>
      <div className="mt-8 space-y-4 bg-white p-6 rounded-2xl border border-border">
        <Field label="Seu nome" name="name" icon={User} value={form.name} onChange={(v) => update("name", v)} error={errors.name} placeholder="Nome completo" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Organização" name="organizacao" icon={Building2} value={form.organizacao} onChange={(v) => update("organizacao", v)} error={errors.organizacao} placeholder="ArqHub" />
          <Field label="Cargo" name="cargo" value={form.cargo} onChange={(v) => update("cargo", v)} error={errors.cargo} placeholder="Ex.: Operações" />
        </div>
        <Field
          label="Código de administrador"
          name="codigoAdmin"
          icon={Lock}
          value={form.codigoAdmin}
          onChange={(v) => update("codigoAdmin", v.toUpperCase())}
          error={errors.codigoAdmin}
          placeholder="ADM-XXXX12"
        />
        <p className="text-xs text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
          Acessos administrativos são auditados. Use somente o código pessoal fornecido pela ArqHub.
        </p>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ---------- Step 3: confirmação por perfil ----------
function Step3({ role, form, onBack, onFinish }: { role: Role; form: FormData; onBack: () => void; onFinish: () => void }) {
  const first = (form.name || "").split(" ")[0] || "tudo";

  const config = {
    profissional: {
      title: `Tudo pronto, ${first}!`,
      desc: "Seu ambiente foi preparado com base no seu escritório. Você terá acesso completo a projetos, equipe e financeiro.",
      next: [
        { icon: FolderOpen, label: "Criar seu primeiro projeto" },
        { icon: Users, label: "Convidar membros da equipe" },
        { icon: Sparkles, label: "Experimentar a IA de orçamentos" },
      ],
      cta: "Ir para o painel do escritório",
    },
    cliente: {
      title: `Bem-vindo, ${first}!`,
      desc: form.conviteCodigo
        ? "Vamos validar o código do seu profissional e conectar você ao projeto."
        : "Você entrará no modo demonstração até receber o convite do profissional.",
      next: [
        { icon: FolderOpen, label: "Acompanhar etapas do projeto" },
        { icon: MessageSquare, label: "Trocar mensagens com o profissional" },
        { icon: Mail, label: "Receber notificações por e-mail" },
      ],
      cta: "Acessar meu projeto",
    },
    admin: {
      title: `Acesso concedido, ${first}.`,
      desc: "Painel de administração liberado. Todas as ações ficam registradas em logs de auditoria.",
      next: [
        { icon: Users, label: "Ver usuários ativos" },
        { icon: Sparkles, label: "Gerenciar planos e assinaturas" },
        { icon: Shield, label: "Auditar permissões" },
      ],
      cta: "Abrir administração",
    },
  }[role];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
      <p className="mt-2 text-muted-foreground">{config.desc}</p>
      <div className="mt-8 bg-white border border-border rounded-2xl p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Próximos passos</div>
        <ul className="space-y-3">
          {config.next.map((s) => (
            <li key={s.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary-dark">
                <s.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">← Voltar</button>
        <button onClick={onFinish} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors">
          {config.cta} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
