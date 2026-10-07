import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";
import { setSession } from "@/lib/session";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import arqhubLogo from "@/assets/arqhub-logo.png.asset.json";
import cadastroBg from "@/assets/cadastro-bg.jpg";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Começar grátis — ArqHub" }] }),
  component: Cadastro,
});

function Cadastro() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setError("");
    setLoading(true);
    const { data, error: signErr } = await externalSupabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (signErr) {
      toast.error(signErr.message);
      return;
    }
    if (!data.user) {
      toast.error("Falha ao criar conta.");
      return;
    }

    // Se já temos sessão (auto-confirm ligado), seed profile + office
    if (data.session) {
      await externalSupabase.from("profiles").upsert(
        { id: data.user.id, email, full_name: name },
        { onConflict: "id" },
      );
      await externalSupabase.from("offices").insert({ owner_id: data.user.id, name: name || email });
      setSession({ role: "profissional", name: name || email, email, onboardingDone: false });
      navigate({ to: "/onboarding" });
    } else {
      toast.success("Confira seu e-mail para confirmar a conta.");
      navigate({ to: "/entrar/$role", params: { role: "escritorio" } });
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      {/* Background image blurred */}
      <img
        src={cadastroBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm"
      />
      {/* Dark/orange overlay to match brand */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220]/70 via-[#1d1d1b]/55 to-primary/25" />

      <button
        type="button"
        onClick={() => {
          window.location.href = "/";
        }}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao site
      </button>

      {/* Glass card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/40 bg-white/85 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] p-8"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={arqhubLogo.url} alt="ArqHub" className="h-10 w-10 object-contain" />
          <div className="text-2xl font-bold tracking-tight font-display">
            <span className="text-[#0b1220]">Arq</span><span className="text-primary">Hub</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#0b1220] text-center">Comece grátis</h1>

        <div className="mt-6">
          <GoogleSignInButton label="Criar conta com Google" redirectPath="/auth/callback" />
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground/70">Nome</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                required
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Seu nome ou do escritório"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/70">E-mail</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/70">Senha</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/70">Confirmar senha</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Repita a senha"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors mt-2 shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar conta grátis"} <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-center text-xs text-muted-foreground">
            concorda com <Link to="/termos" className="underline hover:text-primary">Termos</Link> e <Link to="/privacidade" className="underline hover:text-primary">Política de Privacidade</Link>.
          </p>

        </div>
      </form>

      <p className="relative z-10 mt-6 text-sm text-white/70">
        Já tem conta?{" "}
        <Link
          to="/entrar/$role"
          params={{ role: "escritorio" }}
          className="text-primary font-semibold hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
