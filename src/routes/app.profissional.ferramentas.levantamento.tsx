import { createFileRoute } from "@tanstack/react-router";
import { Ruler } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { ToolHero } from "@/components/tool-hero";

export const Route = createFileRoute("/app/profissional/ferramentas/levantamento")({
  head: () => ({ meta: [{ title: "Levantamento Quantitativo — ArqHub" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell role="profissional" nav={nav} title="Levantamento Quantitativo">
      <ToolHero
        icon={<Ruler className="h-6 w-6 text-primary" strokeWidth={1.75} />}
        title="Levantamento Quantitativo"
        subtitle="Automação de medições — extraia áreas, volumes e quantidades diretamente do projeto."
        slug="levantamento"
        bullets={[
          "Leitura de plantas em PDF/DWG com IA",
          "Cálculo automático de áreas, comprimentos e volumes",
          "Sincronização direta com Orçamentos Inteligentes",
        ]}
      />
    </AppShell>
  );
}
