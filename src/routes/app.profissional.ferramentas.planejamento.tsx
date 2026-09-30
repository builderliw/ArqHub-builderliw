import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { ToolHero } from "@/components/tool-hero";

export const Route = createFileRoute("/app/profissional/ferramentas/planejamento")({
  head: () => ({ meta: [{ title: "Planejamento de Obra — ArqHub" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell role="profissional" nav={nav} title="Planejamento de Obra">
      <ToolHero
        icon={<CalendarClock className="h-6 w-6 text-primary" strokeWidth={1.75} />}
        title="Planejamento de Obra"
        subtitle="Cronograma gerado automaticamente — etapas, prazos e dependências prontos em minutos."
        slug="planejamento"
        bullets={[
          "Cronograma físico-financeiro com IA",
          "Curva S e marcos automáticos",
          "Integração com Agenda da semana",
        ]}
      />
    </AppShell>
  );
}
