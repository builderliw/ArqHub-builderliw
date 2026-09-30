import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getNavProfissional } from "@/lib/nav-profissional";
import { getSession } from "@/lib/session";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listProfessionalProjects } from "@/lib/profissional-project-data.functions";
import { ProjectDiarioObraTab } from "@/components/project-diario-obra-tab";

export const Route = createFileRoute("/app/profissional/diario-obra")({
  head: () => ({
    meta: [
      { title: "Diário de obra — ArqHub" },
      { name: "description", content: "Registre o diário de obra dos seus projetos." },
    ],
  }),
  component: DiarioObraPage,
});

function DiarioObraPage() {
  const s = getSession();
  const nav = getNavProfissional(s?.plan, !!s?.isMember);
  const list = useServerFn(listProfessionalProjects);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const r = await list({ data: { accessToken: token } });
        setProjects((r.projects ?? []).map((p: any) => ({ id: p.id, name: p.nome })));
      } finally {
        setLoading(false);
      }
    })();
  }, [list]);

  return (
    <AppShell role="profissional" nav={nav} title="Diário de obra">
      <div className="mb-5">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">Diário de obra</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Registre atividades, clima e fotos por projeto.</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center text-[13px] text-muted-foreground">
          Nenhum projeto encontrado. Crie um projeto para começar o diário de obra.
        </div>
      ) : (
        <ProjectDiarioObraTab projects={projects} />
      )}
    </AppShell>
  );
}
