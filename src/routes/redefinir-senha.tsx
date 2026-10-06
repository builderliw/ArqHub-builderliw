import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";

type Role = "escritorio" | "cliente" | "admin";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({ meta: [{ title: "Redefinir senha — ArqHub" }] }),
  validateSearch: (s: Record<string, unknown>): { role: Role; code?: string } => {
    const r = s.role;
    return {
      role: r === "cliente" || r === "admin" ? r : "escritorio",
      code: typeof s.code === "string" ? s.code : undefined,
    };
  },
  component: RedefinirSenha,
});

function RedefinirSenha() {
  const { role, code } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState<"checking" | "ok" | "invalid">("checking");

  // Troca PKCE code → session (Supabase v2 default flowType=pkce).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 1. Se tem ?code= na URL → exchange
        if (code) {
          const { error } = await externalSupabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // 2. Caso contrário, supabase-js detecta hash automaticamente (#access_token&type=recovery).
        const { data } = await externalSupabase.auth.getSession();
        if (!alive) return;
        setSessionReady(data.session ? "ok" : "invalid");
      } catch {
        if (alive) setSessionReady("invalid");
      }
    })();
    return () => { alive = false; };
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await externalSupabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      toast.error(error.message || "Não foi possível atualizar a senha.");
      return;
    }
    // Encerra a sessão temporária de recuperação para forçar login com a nova senha.
    await externalSupabase.auth.signOut().catch(() => {});
    setLoading(false);
    setDone(true);
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
          {done ? (
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5">
                <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <h1 className="font-display text-4xl tracking-tight text-[#1d1d1b]">Senha redefinida</h1>
              <p className="mt-3 text-muted-foreground">
                Sua nova senha foi salva. Use-a para entrar novamente.
              </p>
              <div className="mt-8 flex flex-col gap-2">
                <Link
                  to="/entrar/$role"
                  params={{ role }}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                  Voltar para o login
                </Link>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/";
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground mt-2"
                  >
                    Voltar ao site
                  </button>
              </div>
            </div>
          ) : sessionReady === "checking" ? (
            <div className="flex flex-col items-center text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Validando link de recuperação…</span>
            </div>
          ) : sessionReady === "invalid" ? (
            <div>
              <h1 className="font-display text-4xl tracking-tight text-[#1d1d1b]">Link inválido</h1>
              <p className="mt-3 text-muted-foreground">
                Este link de recuperação expirou ou já foi usado. Solicite um novo link.
              </p>
              <Link
                to="/esqueci-senha"
                search={{ role }}
                className="mt-8 inline-block w-full text-center py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Solicitar novo link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-4xl md:text-5xl tracking-tight text-[#1d1d1b]">
                Nova senha
              </h1>
              <p className="mt-2 text-muted-foreground">Defina sua nova senha de acesso.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">Nova senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1d1d1b] mb-2">Confirmar nova senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {loading ? "Salvando..." : "Redefinir senha"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
