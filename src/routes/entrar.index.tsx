import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, User, X } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { resolveUserRole } from "@/lib/resolve-role.functions";
import { setSession } from "@/lib/session";

export const Route = createFileRoute("/entrar/")({
  head: () => ({ meta: [{ title: "Entrar — ArqHub" }] }),
  component: EntrarChooser,
});

function EntrarChooser() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  // Se já está logado, manda pro painel certo
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
          to:
            res.role === "cliente"
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

  if (checking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="text-sm text-white/80">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Fundo clicável volta ao site */}
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          window.location.href = "/";
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entrar-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>

        <h1 id="entrar-title" className="text-xl font-semibold tracking-tight text-foreground">
          Como você quer entrar?
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Selecione o tipo de acesso para continuar.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            to="/entrar/$role"
            params={{ role: "escritorio" }}
            className="group flex items-center gap-4 rounded-xl border border-border bg-white px-4 py-4 transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[15px] font-semibold text-foreground">Escritório</span>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">
                Acesse o painel do seu escritório
              </span>
            </span>
            <span className="text-muted-foreground transition group-hover:text-foreground group-hover:translate-x-0.5">
              →
            </span>
          </Link>

          <Link
            to="/entrar/$role"
            params={{ role: "cliente" }}
            className="group flex items-center gap-4 rounded-xl border border-border bg-white px-4 py-4 transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-ink-muted">
              <User className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[15px] font-semibold text-foreground">Cliente</span>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">
                Acompanhe seu projeto
              </span>
            </span>
            <span className="text-muted-foreground transition group-hover:text-foreground group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
