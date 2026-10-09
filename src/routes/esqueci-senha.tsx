import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";

type Role = "escritorio" | "cliente" | "admin";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — ArqHub" }] }),
  validateSearch: (s: Record<string, unknown>): { role: Role } => {
    const r = s.role;
    return { role: r === "cliente" || r === "admin" ? r : "escritorio" };
  },
  component: EsqueciSenha,
});

type Step = "form" | "code" | "done";

function EsqueciSenha() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    if (password.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await externalSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/esqueci-senha?role=${role}`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Não foi possível enviar o código.");
      return;
    }
    toast.success("Código de verificação enviado para o seu e-mail.");
    setStep("code");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length < 6 || cleanCode.length > 8) {
      toast.error("O código deve ter de 6 a 8 dígitos.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Senha inválida. Volte e informe novamente.");
      setStep("form");
      return;
    }
    setLoading(true);
    try {
      const { data: vData, error: vErr } = await externalSupabase.auth.verifyOtp({
        email,
        token: cleanCode,
        type: "recovery",
      });
      console.log("[reset] verifyOtp", { ok: !vErr, hasSession: !!vData?.session, err: vErr });
      if (vErr || !vData?.session) {
        setLoading(false);
        toast.error(vErr?.message || "Código inválido ou expirado.");
        return;
      }
      const { error: uErr } = await externalSupabase.auth.updateUser({ password });
      console.log("[reset] updateUser", { ok: !uErr, err: uErr });
      if (uErr) {
        setLoading(false);
        const msg =
          (uErr as { code?: string }).code === "same_password"
            ? "A nova senha deve ser diferente da senha atual. Volte e escolha outra."
            : uErr.message || "Não foi possível atualizar a senha.";
        toast.error(msg, { duration: 6000 });
        return;
      }
      await externalSupabase.auth.signOut().catch(() => {});
      setLoading(false);
      setStep("done");
    } catch (err) {
      console.error("[reset] exception", err);
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  async function resend() {
    if (!email) return;
    setLoading(true);
    const { error } = await externalSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/esqueci-senha?role=${role}`,
    });
    setLoading(false);
    if (error) toast.error(error.message || "Falha ao reenviar.");
    else toast.success("Novo código enviado.");
  }

  return (
    <div className="min-h-screen flex flex-col bg-white px-6 sm:px-12 py-8">
      <button
        type="button"
        onClick={() => {
          window.location.href = "/";
        }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao site
      </button>

      <div className="flex-1 flex items-center">
        <div className="w-full max-w-md mx-auto">
          {step === "form" && (
            <>
              <h1 className="font-display text-4xl md:text-5xl tracking-tight text-[#1d1d1b]">
                Redefinir senha
              </h1>
              <p className="mt-2 text-muted-foreground">
                Informe seu e-mail e a nova senha. Enviaremos um código de verificação para confirmar.
              </p>
              <form onSubmit={handleRequest} className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.com"
                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 bg-[#F5F5F5] border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">Confirmar nova senha</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={`w-full px-4 py-3 pr-11 bg-[#F5F5F5] border rounded-lg text-sm focus:outline-none focus:bg-white ${
                        mismatch
                          ? "border-red-500 focus:border-red-500"
                          : "border-transparent focus:border-primary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mismatch && (
                    <p className="mt-2 text-xs text-red-600">As senhas não coincidem.</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || mismatch || !password || !confirm}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {loading ? "Enviando código..." : "Redefinir senha"}
                </button>
              </form>
              <p className="mt-8 text-center text-xs text-muted-foreground">
                <Link to="/entrar" className="text-primary hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </>
          )}

          {step === "code" && (
            <>
              <h1 className="font-display text-4xl md:text-5xl tracking-tight text-[#1d1d1b]">
                Confirmar código
              </h1>
              <p className="mt-2 text-muted-foreground">
                Digite o código de 6 dígitos enviado para <strong>{email}</strong>.
              </p>
              <form onSubmit={handleVerify} className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">Código de verificação</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-lg text-sm tracking-[0.4em] text-center font-mono focus:outline-none focus:border-primary focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={resend}
                    disabled={loading}
                    className="mt-2 text-xs text-primary hover:underline disabled:opacity-60"
                  >
                    Reenviar código
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {loading ? "Validando..." : "Confirmar e alterar senha"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Voltar
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5">
                <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <h1 className="font-display text-4xl tracking-tight text-[#1d1d1b]">Senha alterada</h1>
              <p className="mt-3 text-muted-foreground">
                Sua nova senha foi salva. Use-a para entrar novamente.
              </p>
              <button
                onClick={() => navigate({ to: "/entrar" })}
                className="mt-8 w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Ir para o login
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground"
              >
                Voltar ao site
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
