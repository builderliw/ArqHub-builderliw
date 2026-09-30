import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSession, setSession } from "@/lib/session";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { resolveUserRole } from "@/lib/resolve-role.functions";

function withTimeout<T>(promise: Promise<T>, ms = 7000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Painel — ArqHub" }] }),
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/app" || pathname === "/app/";

  useEffect(() => {
    if (!isRoot) return;
    (async () => {
      let s = getSession();
      try {
        if (!s) {
          const { data } = await withTimeout(externalSupabase.auth.getSession(), 4000);
          const token = data.session?.access_token;
          if (token) {
            const res = await withTimeout(resolveUserRole({ data: { accessToken: token } }), 7000);
            if (res.ok) {
              s = {
                role: res.role,
                name: res.name,
                email: res.email,
                onboardingDone: true,
                ...(res.role === "profissional"
                  ? { officeId: res.officeId, isMember: (res as { isMember?: boolean }).isMember }
                  : {}),
              };
              setSession(s);
            }
          }
        }
      } catch (err) {
        console.error("[app] resolveSession failed", err);
        await externalSupabase.auth.signOut().catch(() => {});
      }
      try {
        if (!s) {
          navigate({ to: "/entrar/$role", params: { role: "escritorio" } });
          return;
        }
        if (s.role === "profissional") navigate({ to: "/app/profissional" });
        else if (s.role === "cliente") navigate({ to: "/app/cliente" });
        else if (s.role === "admin") navigate({ to: "/app/admin" });
        else navigate({ to: "/entrar/$role", params: { role: "escritorio" } });
      } catch (err) {
        console.error("[app] navigate failed", err);
        window.location.href = "/entrar/escritorio";
      }
    })();
  }, [navigate, isRoot]);

  if (isRoot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-sm text-muted-foreground">Carregando seu painel...</div>
      </div>
    );
  }

  return <Outlet />;
}
