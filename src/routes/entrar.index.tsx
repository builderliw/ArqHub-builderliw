import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { resolveUserRole } from "@/lib/resolve-role.functions";
import {
  checkClientLoginState,
  finalizeClientPassword,
} from "@/lib/cliente-first-login.functions";
import { setSession } from "@/lib/session";
import logoMark from "@/assets/arqhub-logo-mark.png.asset.json";

export const Route = createFileRoute("/entrar/")({
  head: () => ({ meta: [{ title: "Entrar — ArqHub" }] }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [checking, setChecking] = useState(true);

  // Mantém logado: ao abrir, se há sessão Supabase, resolve e manda pro painel.
  useEffect(() => {
    (async () => {
      const { data } = await externalSupabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setChecking(false);
        return;
      }
      const res = await resolveUserRole({ data: { accessToken: token } });
      if (res.ok) {
        setSession({
          role: res.role,
          name: res.name,
          email: res.email,
          onboardingDone: true,
          ...(res.role === "profissional"
            ? { officeId: res.officeId, isMember: (res as { isMember?: boolean }).isMember }
            : {}),
        });
        navigate({
          to: res.role === "cliente"
            ? "/app/cliente"
            : res.role === "admin"
              ? "/app/admin"
              : "/app/profissional",
        });
      } else {
        setChecking(false);
      }
    })();
  }, [navigate]);

  async function finalize(emailUsed: string) {
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      toast.error("Falha ao iniciar sessão.");
      return;
    }
    const res = await resolveUserRole({ data: { accessToken: token } });
    if (!res.ok) {
      await externalSupabase.auth.signOut();
      toast.error("Conta sem acesso configurado. Fale com o suporte.");
      return;
    }
    setSession({
      role: res.role,
      name: res.name,
      email: res.email,
      onboardingDone: true,
      ...(res.role === "profissional"
        ? { officeId: res.officeId, isMember: (res as { isMember?: boolean }).isMember }
        : {}),
    });
    toast.success(`Bem-vindo, ${res.name || emailUsed}!`);
    navigate({
      to: res.role === "cliente"
        ? "/app/cliente"
        : res.role === "admin"
          ? "/app/admin"
          : "/app/profissional",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    // Fluxo de primeiro acesso de cliente (com verificação OTP por e-mail)
    if (needsSetup) {
      if (password.length < 6) {
        setLoading(false);
        toast.error("Senha deve ter ao menos 6 caracteres.");
        return;
      }
      if (password !== confirm) {
        setLoading(false);
        toast.error("As senhas não conferem.");
        return;
      }
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
      const setup = await finalizeClientPassword({
        data: { accessToken: verified.session.access_token, password },
      });
      if (!setup.ok) {
        setLoading(false);
        toast.error("Não foi possível criar a senha.");
        return;
      }
      await finalize(email);
      setLoading(false);
      return;
    }

    // Tenta login direto
    const { error } = await externalSupabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await finalize(email);
      setLoading(false);
      return;
    }

    // Se falhou e é cliente sem auth criado, ativa fluxo de setup
    const state = await checkClientLoginState({ data: { email } });
    if (state.ok && !state.hasAuthUser) {
      setLoading(false);
      setNeedsSetup(true);
      toast.info("Primeiro acesso detectado. Crie sua senha.");
      return;
    }

    setLoading(false);
    toast.error("E-mail ou senha incorretos.");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white px-6 py-8">
      <button
        type="button"
        onClick={() => {
          window.location.href = "/";
        }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao site
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
        <div className="flex items-center gap-3">
          <img src={logoMark.url} alt="ArqHub" className="h-10 w-10 object-contain" />
          <div className="font-display text-xl tracking-tight text-[#1d1d1b]">ArqHub</div>
        </div>

        <h1 className="mt-8 font-display text-3xl sm:text-4xl tracking-tight text-[#1d1d1b]">
          Entrar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use seu e-mail e senha. Você permanece conectado até clicar em sair.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">E-mail</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (needsSetup) setNeedsSetup(false);
              }}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[#1d1d1b]">
                {needsSetup ? "Crie sua senha" : "Senha"}
              </label>
              {!needsSetup && (
                <Link
                  to="/esqueci-senha"
                  search={{ role: "escritorio" }}
                  className="text-xs text-primary hover:underline"
                >
                  Esqueceu?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required
                autoComplete={needsSetup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={needsSetup ? "Mínimo 6 caracteres" : "Sua senha"}
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

          {needsSetup && (
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">
                Confirme a senha
              </label>
              <input
                type={showPass ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white"
              />
            </div>
          )}

          {needsSetup && otpSent && (
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
              : needsSetup
                ? otpSent
                  ? "Verificar código e criar senha"
                  : "Enviar código por e-mail"
                : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="text-primary font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
