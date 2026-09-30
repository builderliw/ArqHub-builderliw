import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";

export const Route = createFileRoute("/app/profissional/ia")({
  head: () => ({ meta: [{ title: "IA ArqHub — ArqHub" }] }),
  component: IAPage,
});

function IAPage() {
  return (
    <AppShell role="profissional" nav={nav} title="IA ArqHub">
      <div className="bg-white border border-border rounded-xl p-12 text-center max-w-2xl mx-auto mt-8">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-primary" strokeWidth={1.75} />
        </div>
        <h2 className="text-[20px] font-semibold tracking-tight text-ink">IA ArqHub</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Assistente inteligente para automatizar tarefas, gerar conteúdo e analisar projetos.
        </p>
        <span className="inline-block mt-5 text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">Em breve</span>
      </div>
    </AppShell>
  );
}
