import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { OnboardingEscritorioWizard } from "@/components/onboarding-escritorio-wizard";

export const Route = createFileRoute("/app/profissional/bem-vindo")({
  head: () => ({ meta: [{ title: "Bem-vindo ao ArqHub" }] }),
  component: BemVindoPage,
});

function BemVindoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [officeName, setOfficeName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await externalSupabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/entrar/$role", params: { role: "escritorio" }, replace: true });
        return;
      }
      const { data: offs } = await externalSupabase
        .from("offices")
        .select("id, name")
        .eq("owner_id", u.user.id)
        .limit(1);
      const office = offs?.[0];
      if (office) {
        setOfficeId(office.id);
        setOfficeName(office.name);
      }
      setLoading(false);
    })();
  }, [navigate]);

  if (loading || !officeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <OnboardingEscritorioWizard
        officeId={officeId}
        initialName={officeName}
        onComplete={() => navigate({ to: "/app/profissional", replace: true })}
      />
    </div>
  );
}
