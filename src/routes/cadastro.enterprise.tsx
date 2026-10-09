import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Send } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/external-supabase/client";

export const Route = createFileRoute("/cadastro/enterprise")({
  head: () => ({
    meta: [
      { title: "Plano Enterprise — Solicitar proposta | ArqHub" },
      { name: "description", content: "Plano Enterprise sob medida. Conte sobre seu escritório e o que você precisa." },
    ],
  }),
  component: CadastroEnterprise,
});

const STORAGE_KEY = "arqhub.enterprise_requests";

const schema = z.object({
  empresa: z.string().trim().min(2, "Informe o nome da empresa").max(120),
  cnpj: z.string().trim().max(20).optional().or(z.literal("")),
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().min(8, "Telefone inválido").max(20),
  cargo: z.string().trim().max(80).optional().or(z.literal("")),
  numEscritorios: z.string().max(20).optional().or(z.literal("")),
  numUsuarios: z.string().max(20).optional().or(z.literal("")),
  mensagem: z.string().trim().min(20, "Descreva com pelo menos 20 caracteres").max(2000),
});

type FormState = z.infer<typeof schema>;

const empty: FormState = {
  empresa: "", cnpj: "", nome: "", email: "", telefone: "",
  cargo: "", numEscritorios: "", numUsuarios: "", mensagem: "",
};

function CadastroEnterprise() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof FormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Verifique os campos destacados.");
      return;
    }
    setSubmitting(true);
    try {
      const d = result.data;
      const { error } = await supabase.from("enterprise_requests").insert({
        empresa: d.empresa,
        cnpj: d.cnpj || null,
        nome: d.nome,
        email: d.email,
        telefone: d.telefone,
        cargo: d.cargo || null,
        num_escritorios: d.numEscritorios || null,
        num_usuarios: d.numUsuarios || null,
        mensagem: d.mensagem,
      });
      if (error) throw error;
      // Backup local (caso o admin queira ver histórico no próprio device)
      try {
        const existing: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        const list = Array.isArray(existing) ? existing : [];
        list.push({ ...d, status: "pending", created_at: new Date().toISOString() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch { /* ignore */ }
      setSuccess(true);
      toast.success("Pedido enviado! Nossa equipe entrará em contato em até 1 dia útil.");
    } catch (err) {
      console.error("[enterprise_requests] insert failed", err);
      toast.error("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 py-20 px-6">
          <div className="max-w-xl mx-auto bg-white border border-border rounded-2xl p-10 text-center shadow-sm">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Pedido enviado!</h1>
            <p className="mt-3 text-muted-foreground">
              Recebemos sua solicitação para o plano <strong>Enterprise</strong>. Nossa equipe vai
              analisar suas necessidades e entrar em contato pelo e-mail <strong>{form.email}</strong> em
              até 1 dia útil.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark">
                Voltar ao início
              </Link>
              <button
                onClick={() => { setForm(empty); setSuccess(false); }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-secondary"
              >
                Enviar outro pedido
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 lg:py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link to="/planos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink mb-6">
            <ArrowLeft className="h-4 w-4" /> Voltar aos planos
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-xs font-semibold">
            <Building2 className="h-3.5 w-3.5" /> Plano Enterprise
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
            Vamos montar um plano sob medida pro seu escritório.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Conte um pouco sobre sua operação e o que você precisa. Nossa equipe responde em até
            1 dia útil com proposta personalizada de valor e configurações.
          </p>

          <form onSubmit={onSubmit} className="mt-10 bg-white border border-border rounded-2xl p-8 space-y-6">
            <Section title="Dados da empresa">
              <Grid>
                <Field label="Nome da empresa *" error={errors.empresa}>
                  <input value={form.empresa} onChange={(e) => update("empresa", e.target.value)} className={inputCls(errors.empresa)} maxLength={120} />
                </Field>
                <Field label="CNPJ" error={errors.cnpj}>
                  <input value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} className={inputCls(errors.cnpj)} placeholder="00.000.000/0000-00" maxLength={20} />
                </Field>
              </Grid>
              <Grid>
                <Field label="Nº de escritórios / filiais">
                  <input value={form.numEscritorios} onChange={(e) => update("numEscritorios", e.target.value)} className={inputCls()} placeholder="ex: 3" maxLength={20} />
                </Field>
                <Field label="Nº de usuários previstos">
                  <input value={form.numUsuarios} onChange={(e) => update("numUsuarios", e.target.value)} className={inputCls()} placeholder="ex: 50" maxLength={20} />
                </Field>
              </Grid>
            </Section>

            <Section title="Contato">
              <Grid>
                <Field label="Seu nome *" error={errors.nome}>
                  <input value={form.nome} onChange={(e) => update("nome", e.target.value)} className={inputCls(errors.nome)} maxLength={120} />
                </Field>
                <Field label="Cargo">
                  <input value={form.cargo} onChange={(e) => update("cargo", e.target.value)} className={inputCls()} placeholder="ex: Diretor" maxLength={80} />
                </Field>
              </Grid>
              <Grid>
                <Field label="E-mail corporativo *" error={errors.email}>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls(errors.email)} maxLength={255} />
                </Field>
                <Field label="Telefone / WhatsApp *" error={errors.telefone}>
                  <input value={form.telefone} onChange={(e) => update("telefone", e.target.value)} className={inputCls(errors.telefone)} placeholder="(11) 99999-0000" maxLength={20} />
                </Field>
              </Grid>
            </Section>

            <Section title="Configurações desejadas">
              <Field
                label="O que você precisa? *"
                error={errors.mensagem}
                hint="Descreva integrações, SLA, treinamento, número de projetos, automações ou qualquer requisito específico."
              >
                <textarea
                  value={form.mensagem}
                  onChange={(e) => update("mensagem", e.target.value)}
                  className={`${inputCls(errors.mensagem)} min-h-[140px] resize-y`}
                  maxLength={2000}
                  placeholder="Ex: Integração com nosso ERP, SLA de 4h, login SSO via Google Workspace, treinamento para 30 pessoas..."
                />
                <div className="mt-1 text-[11px] text-muted-foreground text-right">
                  {form.mensagem.length}/2000
                </div>
              </Field>
            </Section>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Enviando..." : "Enviar pedido ao time ArqHub"}
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/planos" })}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border text-sm font-semibold hover:bg-secondary"
              >
                Cancelar
              </button>
            </div>

            <p className="text-[12px] text-muted-foreground">
              Ao enviar, seus dados serão tratados conforme nossa{" "}
              <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
            </p>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
function Field({
  label, error, hint, children,
}: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-[11.5px] text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-[11.5px] text-red-600">{error}</p>}
    </label>
  );
}
function inputCls(err?: string) {
  return `w-full px-3.5 py-2.5 rounded-lg border bg-white text-[14px] outline-none transition-colors ${
    err ? "border-red-300 focus:border-red-500" : "border-border focus:border-primary"
  }`;
}
