import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { getSession, setSession, planHasFeature, type Plan } from "@/lib/session";
import { moduleForPath, memberCanAccess } from "@/lib/module-access";
import { getProfissionalDashboard } from "@/lib/profissional-project-data.functions";
import { toast } from "sonner";
import { OnboardingEscritorioWizard } from "@/components/onboarding-escritorio-wizard";


// Mapa de rotas restritas por funcionalidade do plano.
// trial/basico não acessam IA; somente premium/enterprise.
const PLAN_FEATURE_BY_PATH: Record<string, "ia"> = {
  "/app/profissional/ia": "ia",
};

// Rotas bloqueadas para membros (não-donos do escritório).
const MEMBER_BLOCKED_PREFIXES = [
  "/app/profissional/financeiro",
  "/app/profissional/equipe",
];

export const Route = createFileRoute("/app/profissional")({
  component: ProfissionalLayout,
});

function ProfissionalLayout() {
  const [loading, setLoading] = useState(true);
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchDashboard = useServerFn(getProfissionalDashboard);

  async function bootstrap() {
    setLoading(true);
    const { data: u } = await externalSupabase.auth.getUser();
    if (!u.user) {
      setLoading(false);
      return;
    }

    let office: { id: string; name?: string | null; onboarding_completed?: boolean | null } | undefined;
    let memberFlag = false;
    let modules: string[] | null = null;
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (token) {
      const dash = await fetchDashboard({ data: { accessToken: token } });
      if (dash.officeId) {
        office = { id: dash.officeId, name: dash.officeName, onboarding_completed: dash.onboarded };
        memberFlag = !!dash.isMember;
        modules = (dash.allowedModules as string[] | null) ?? null;
      }
    }

    if (!office && !memberFlag) {
      const fallback =
        ((u.user.user_metadata as Record<string, unknown>)?.name as string) ||
        u.user.email ||
        "Meu escritório";
      const { data: created, error } = await externalSupabase
        .from("offices")
        .insert({ owner_id: u.user.id, name: fallback })
        .select("id, name, onboarding_completed")
        .single();
      if (!error) office = created ?? undefined;
    }



    if (office) {
      setOfficeId(office.id);
      setOnboarded(!!office.onboarding_completed);
      setIsMember(memberFlag);
      setAllowedModules(modules);
      // Sincroniza session local para o AppShell filtrar nav corretamente
      const s = getSession();
      if (s) {
        setSession({ ...s, isMember: memberFlag, officeId: office.id, allowedModules: modules });
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    bootstrap();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isWelcome = pathname === "/app/profissional/bem-vindo";

  // Membro: nunca passa pelo onboarding (escritório já é do dono).
  if (isMember && isWelcome) {
    return <Navigate to="/app/profissional" replace />;
  }
  if (!isMember && officeId && onboarded && isWelcome) {
    return <Navigate to="/app/profissional" replace />;
  }

  // Dono sem onboarding: painel abre normalmente com a janela flutuante por cima.
  if (!isMember && officeId && !onboarded && !isWelcome) {
    return (
      <>
        <Outlet />
        <OnboardingEscritorioWizard
          officeId={officeId}
          onComplete={() => {
            setOnboarded(true);
            bootstrap();
          }}
        />
      </>
    );
  }


  // Bloqueio de rotas restritas para membros
  if (isMember && MEMBER_BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) {
    toast.error("Acesso restrito ao dono do escritório.");
    return <Navigate to="/app/profissional" replace />;
  }

  // Gate por módulo (papel customizado Premium/Enterprise)
  if (isMember) {
    const mod = moduleForPath(pathname);
    if (mod && !memberCanAccess(allowedModules, mod)) {
      toast.error("Seu papel não tem acesso a este módulo.");
      return <Navigate to="/app/profissional" replace />;
    }
  }

  // Gate por plano
  const requiredFeature = PLAN_FEATURE_BY_PATH[pathname];
  if (requiredFeature) {
    const plan: Plan = (getSession()?.plan ?? "trial") as Plan;
    if (!planHasFeature(plan, requiredFeature)) {
      toast.error("Recurso disponível apenas nos planos Premium e Enterprise.");
      return <Navigate to="/app/profissional" replace />;
    }
  }

  return <Outlet />;
}
