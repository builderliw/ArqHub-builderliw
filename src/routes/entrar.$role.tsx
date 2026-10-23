import { createFileRoute, Link, useNavigate, notFound, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { setSession, type Role } from "@/lib/session";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import { checkClientByToken } from "@/lib/cliente-lookup.functions";
import {
  checkClientLoginState,
  finalizeClientPassword,
} from "@/lib/cliente-first-login.functions";
import loginEscritorio from "@/assets/login-escritorio.jpg";
import loginCliente from "@/assets/login-cliente.jpg";
import loginAdmin from "@/assets/login-admin.jpg";
import logoMark from "@/assets/arqhub-logo-mark.png.asset.json";

type Variant = "escritorio" | "cliente" | "admin";

const variants: Record<Variant, {
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  role: Role;
  others: Variant[];
  dark: boolean;
}> = {
  escritorio: {
    badge: "ESCRITÓRIO",
    title: "Login do Escritório",
    subtitle: "Acesse o painel do seu escritório",
    image: loginEscritorio,
    role: "profissional",
    others: ["cliente"],
    dark: false,
  },
  cliente: {
    badge: "PORTAL DO CLIENTE",
    title: "Portal do Cliente",
    subtitle: "Acompanhe seu projeto",
    image: loginCliente,
    role: "cliente",
    others: ["escritorio"],
    dark: false,
  },
  admin: {
    badge: "ADMIN MASTER",
    title: "Admin Master",
    subtitle: "Acesso restrito à administração ArqHub",
    image: loginAdmin,
    role: "admin",
    others: ["escritorio", "cliente"],
    dark: true,
  },
};

const labelOf: Record<Variant, string> = {
  escritorio: "Escritório",
  cliente: "Cliente",
  admin: "Admin",
};

export const Route = createFileRoute("/entrar/$role")({
  head: () => ({ meta: [{ title: "Entrar — ArqHub" }] }),
  beforeLoad: ({ params }) => {
    if (params.role === "profissional") {
      throw redirect({ to: "/entrar/$role", params: { role: "escritorio" }, replace: true });
    }
    if (!(params.role in variants)) throw notFound();
  },
  component: EntrarRole,
});

function EntrarRole() {
  const { role } = Route.useParams();
  const v = variants[role as Variant];
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  // Cliente: 'email' → 'password' (já tem senha) | 'setup' (primeiro acesso, com OTP)
  const [clientStep, setClientStep] = useState<"email" | "password" | "setup">("email");

  async function handleClientEmailStep(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await checkClientLoginState({ data: { email } });
    setLoading(false);
    if (!res.ok) {
      toast.error("E-mail não encontrado. Peça ao seu escritório para te cadastrar.");
      return;
    }
    setClientStep(res.hasAuthUser ? "password" : "setup");
  }

  async function handleClientSetup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirmPass) {
      toast.error("As senhas não conferem.");
      return;
    }
    setLoading(true);

    // Passo 1: envia OTP para provar posse do e-mail
    if (!otpSent) {
      const { error: otpErr } = await externalSupabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      setLoading(false);
      if (otpErr) {
        toast.error("Não foi possível enviar o código. Tente novamente.");
        return;
      }
      setOtpSent(true);
      toast.info("Enviamos um código de 6 dígitos para o seu e-mail.");
      return;
    }

    // Passo 2: verifica OTP e finaliza a senha
    if (!otp || otp.length < 6) {
      setLoading(false);
      toast.error("Informe o código enviado ao seu e-mail.");
      return;
    }
    const { data: verified, error: vErr } = await externalSupabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (vErr || !verified.session?.access_token) {
      setLoading(false);
      toast.error("Código inválido ou expirado.");
      return;
    }
    const res = await finalizeClientPassword({
      data: { accessToken: verified.session.access_token, password },
    });
    if (!res.ok) {
      setLoading(false);
      toast.error(res.reason === "not_found" ? "Cliente não encontrado." : "Não foi possível cadastrar a senha.");
      return;
    }
    setLoading(false);
    setSession({
      role: "cliente",
      name: email.split("@")[0],
      email,
      onboardingDone: true,
    });
    navigate({ to: "/app/cliente" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await externalSupabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message || "Não foi possível entrar.");
      return;
    }

    // Validação de admin master: precisa estar marcado em profiles.is_admin_master
    if (v.role === "admin") {
      const { data: prof, error: profErr } = await externalSupabase
        .from("profiles")
        .select("is_admin_master")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profErr || !prof?.is_admin_master) {
        await externalSupabase.auth.signOut();
        setLoading(false);
        toast.error("Esta conta não tem permissão de administrador.");
        return;
      }
    }

    // Validação de cliente: e-mail precisa estar cadastrado por algum escritório
    if (v.role === "cliente") {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      const result = token
        ? await checkClientByToken({ data: { accessToken: token } })
        : { ok: false as const, reason: "unauthenticated" };
      if (!result.ok) {
        await externalSupabase.auth.signOut();
        setLoading(false);
        toast.error("E-mail não encontrado. Peça ao seu escritório para te cadastrar.");
        return;
      }
    }

    setLoading(false);
    setSession({
      role: v.role,
      name: data.user.user_metadata?.name || email.split("@")[0],
      email,
      onboardingDone: true,
    });
    navigate({
      to:
        v.role === "cliente"
          ? "/app/cliente"
          : v.role === "admin"
            ? "/app/admin"
            : "/app/profissional",
    });
  }

  return (
    <div className={`min-h-screen grid lg:grid-cols-2 ${
      v.dark ? "bg-[#0f0f0e]" : "bg-white"
    }`}>
      {/* Coluna visual */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src={typeof v.image === "string" ? v.image : (v.image as { url?: string })?.url || ""}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-2">
            <img src={logoMark.url} alt="" className="h-8 w-8 object-contain brightness-0 invert" />
            <span className="font-display text-lg font-semibold tracking-tight">ArqHub</span>
          </div>
          <div>
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur">
              {v.badge}
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight max-w-md">
              {v.role === "cliente"
                ? "Seu projeto, do começo ao fim."
                : v.role === "admin"
                  ? "Controle total da plataforma."
                  : "A arquitetura do seu negócio."}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/75">
              {v.role === "cliente"
                ? "Acompanhe etapas, documentos, cronograma e converse com seu arquiteto — tudo em um só lugar."
                : v.role === "admin"
                  ? "Gestão de contas, planos, pagamentos e operação ArqHub."
                  : "A plataforma definitiva para quem projeta o futuro. Gestão, clientes e obras em um só lugar."}
            </p>
          </div>
          <p className="text-[11px] text-white/50">© {new Date().getFullYear()} ARQHUB</p>
        </div>
      </div>

      {/* Formulário */}
      <div className={`flex flex-col px-6 py-8 sm:px-12 ${
        v.dark ? "text-white" : ""
      }`}>
        <Link
          to="/"
          className={`inline-flex items-center gap-2 text-sm ${
            v.dark ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className={`font-display text-4xl md:text-5xl tracking-tight ${
              v.dark ? "text-white" : "text-[#1d1d1b]"
            }`}>
              {v.title}
            </h1>

            <form
              onSubmit={
                v.role === "cliente"
                  ? clientStep === "email"
                    ? handleClientEmailStep
                    : clientStep === "setup"
                      ? handleClientSetup
                      : handleSubmit
                  : handleSubmit
              }
              className="mt-8 space-y-5"
            >
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  v.dark ? "text-white" : "text-[#1d1d1b]"
                }`}>
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (v.role === "cliente") setClientStep("email");
                  }}
                  placeholder="nome@empresa.com"
                  className={`w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary ${
                    v.dark
                      ? "bg-white/10 border border-white/10 text-white placeholder:text-white/40"
                      : "bg-[#F5F5F5] border border-transparent focus:bg-white"
                  }`}
                />
              </div>

              {(v.role !== "cliente" || clientStep !== "email") && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm font-semibold ${
                      v.dark ? "text-white" : "text-[#1d1d1b]"
                    }`}>
                      {v.role === "cliente" && clientStep === "setup" ? "Crie sua senha" : "Senha"}
                    </label>
                    {!(v.role === "cliente" && clientStep === "setup") && (
                      <Link
                        to="/esqueci-senha"
                        search={{ role }}
                        className="text-xs text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={v.role === "cliente" && clientStep === "setup" ? "Mínimo 6 caracteres" : "Sua senha"}
                      className={`w-full px-4 py-3 pr-11 rounded-lg text-sm focus:outline-none focus:border-primary ${
                        v.dark
                          ? "bg-white/10 border border-white/10 text-white placeholder:text-white/40"
                          : "bg-[#F5F5F5] border border-transparent focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        v.dark ? "text-white/50" : "text-muted-foreground"
                      }`}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {v.role === "cliente" && clientStep === "setup" && (
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    v.dark ? "text-white" : "text-[#1d1d1b]"
                  }`}>
                    Confirme a senha
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repita a senha"
                    className={`w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary ${
                      v.dark
                        ? "bg-white/10 border border-white/10 text-white placeholder:text-white/40"
                        : "bg-[#F5F5F5] border border-transparent focus:bg-white"
                    }`}
                  />
                </div>
              )}

              {v.role === "cliente" && clientStep === "setup" && otpSent && (
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    v.dark ? "text-white" : "text-[#1d1d1b]"
                  }`}>
                    Código enviado por e-mail
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className={`w-full px-4 py-3 rounded-lg text-sm tracking-widest text-center focus:outline-none focus:border-primary ${
                      v.dark
                        ? "bg-white/10 border border-white/10 text-white"
                        : "bg-[#F5F5F5] border border-transparent focus:bg-white"
                    }`}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {loading
                  ? "Aguarde..."
                  : v.role === "cliente" && clientStep === "email"
                    ? "Continuar"
                    : v.role === "cliente" && clientStep === "setup"
                      ? otpSent
                        ? "Verificar e criar senha"
                        : "Enviar código por e-mail"
                      : "Entrar"}
              </button>
            </form>

            {v.others.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex-1 h-px ${
                    v.dark ? "bg-white/10" : "bg-border"
                  }`} />
                  <span className={`text-[11px] font-semibold tracking-[0.2em] ${
                    v.dark ? "text-white/40" : "text-muted-foreground"
                  }`}>
                    OUTROS ACESSOS
                  </span>
                  <div className={`flex-1 h-px ${
                    v.dark ? "bg-white/10" : "bg-border"
                  }`} />
                </div>
                <div className="flex flex-col gap-2">
                  {v.others.map((o) => (
                    <Link
                      key={o}
                      to="/entrar/$role"
                      params={{ role: o }}
                      className={`inline-flex h-11 items-center justify-center rounded-lg border text-[14px] font-medium transition ${
                        v.dark
                          ? "border-white/15 text-white hover:bg-white/10"
                          : "border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      {labelOf[o]}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <p className={`mt-8 text-center text-[11px] ${
              v.dark ? "text-white/40" : "text-muted-foreground"
            }`}>
              Ambiente seguro · Dados criptografados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
