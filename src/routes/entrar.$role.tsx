import { createFileRoute, Link, useNavigate, notFound, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { setSession, type Role } from "@/lib/session";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
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
      name: (data.user.user_metadata?.name as string | undefined) || email.split("@")[0] || v.role,
      email,
      onboardingDone: true,
    });
    navigate({
      to: v.role === "cliente" ? "/app/cliente" : v.role === "admin" ? "/app/admin" : "/app",
    });
  }


  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* HERO ESQUERDO */}
      <div className="relative hidden lg:block overflow-hidden bg-black">
        <img
          src={v.image}
          alt={v.title}
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Layered cinematic overlays for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />

        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <img src={logoMark.url} alt="ArqHub" className="h-10 w-10 object-contain" />
            <div className="font-display text-xl tracking-tight">ArqHub</div>
          </div>

          <div className="max-w-lg">
            <span className="inline-flex items-center px-3 py-1.5 rounded-sm bg-white/10 backdrop-blur-md ring-1 ring-white/20 text-[10px] font-semibold tracking-[0.24em] text-white">
              {v.badge}
            </span>
            {v.role === "cliente" ? (
              <>
                <h2 className="mt-6 font-display text-5xl xl:text-6xl leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                  Seu projeto, do começo ao fim.
                </h2>
                <p className="mt-5 text-base text-white/85 max-w-md leading-relaxed">
                  Acompanhe etapas, documentos, cronograma e converse com seu arquiteto — tudo em um só lugar.
                </p>

                <div className="mt-8 flex items-center gap-6 text-white/70">
                  <div>
                    <div className="font-display text-2xl text-white">100%</div>
                    <div className="text-[10px] tracking-[0.2em] uppercase mt-0.5">Transparência</div>
                  </div>
                  <div className="h-10 w-px bg-white/20" />
                  <div>
                    <div className="font-display text-2xl text-white">Tempo real</div>
                    <div className="text-[10px] tracking-[0.2em] uppercase mt-0.5">Atualizações do projeto</div>
                  </div>
                </div>

              </>
            ) : (
              <>
                <h2 className="mt-6 font-display text-5xl xl:text-6xl leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                  A arquitetura<br />
                  do seu negócio.
                </h2>
                <p className="mt-5 text-base text-white/85 max-w-md leading-relaxed">
                  A plataforma definitiva para quem projeta o futuro. Gestão, clientes e obras em um só lugar.
                </p>

                <div className="mt-8 flex items-center gap-6 text-white/70">
                  <div>
                    <div className="font-display text-2xl text-white">1.200+</div>
                    <div className="text-[10px] tracking-[0.2em] uppercase mt-0.5">Escritórios</div>
                  </div>
                  <div className="h-10 w-px bg-white/20" />
                  <div>
                    <div className="font-display text-2xl text-white">98,7%</div>
                    <div className="text-[10px] tracking-[0.2em] uppercase mt-0.5">Satisfação</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="text-[10px] tracking-[0.24em] text-white/60 uppercase">
            © {new Date().getFullYear()} ArqHub
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DIREITO */}
      <div className="relative flex flex-col px-6 sm:px-12 lg:px-20 py-8">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </button>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="font-display text-4xl md:text-5xl tracking-tight text-[#1d1d1b]">
              {v.title}
            </h1>
            

            {v.role !== "admin" && (
              <div className="mt-8">
                <GoogleSignInButton redirectPath={`/auth/callback?role=${role}`} />
                <div className="my-5 flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">OU</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </div>
            )}

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
              className="mt-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">
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
                  className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {(v.role !== "cliente" || clientStep !== "email") && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-[#1d1d1b]">
                      {v.role === "cliente" && clientStep === "setup" ? "Crie sua senha" : "Senha"}
                    </label>
                    {!(v.role === "cliente" && clientStep === "setup") && (
                      <Link to="/esqueci-senha" search={{ role: role as "escritorio" | "cliente" | "admin" }} className="text-xs text-primary hover:underline">Esqueceu a senha?</Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={v.role === "cliente" && clientStep === "setup" ? "Mínimo 6 caracteres" : "Sua senha"}
                      className="w-full px-4 py-3 pr-11 bg-[#F5F5F5] border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {v.role === "cliente" && clientStep === "setup" && (
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">
                    Confirme a senha
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Primeiro acesso detectado. Crie uma senha para entrar.
                  </p>
                </div>
              )}

              {v.role === "cliente" && clientStep === "setup" && otpSent && (
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">
                    Código enviado por e-mail
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-lg text-sm tracking-widest text-center focus:outline-none focus:border-primary focus:bg-white"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enviamos um código de 6 dígitos para {email}.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {loading
                  ? "Aguarde..."
                  : v.role === "cliente"
                    ? clientStep === "email"
                      ? "Continuar"
                      : clientStep === "setup"
                        ? otpSent
                          ? "Verificar código e criar senha"
                          : "Enviar código por e-mail"
                        : "Entrar"
                    : "Entrar"}
              </button>

            </form>


            <div className="mt-10 flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">OUTROS ACESSOS</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className={`mt-5 grid gap-3 ${v.others.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {v.others.map((o) => (
                <Link
                  key={o}
                  to="/entrar/$role"
                  params={{ role: o }}
                  className="text-center py-3 border border-border rounded-lg text-sm font-medium text-[#1d1d1b] hover:border-primary hover:text-primary transition-colors"
                >
                  {labelOf[o]}
                </Link>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Ambiente seguro · Dados criptografados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
