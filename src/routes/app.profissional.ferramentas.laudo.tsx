import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { LaudoTecnicoTool } from "@/components/laudo-tecnico-tool";

export const Route = createFileRoute("/app/profissional/ferramentas/laudo")({
  head: () => ({ meta: [{ title: "Laudo Técnico — ArqHub" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell role="profissional" nav={nav} title="Laudo Técnico">
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">
          Gerador de Laudo Técnico de Imóveis
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
          Modelo preenchível para regularização, financiamento, compra e venda, vistoria cautelar,
          locação ou inspeção predial — com checklist e orientação de uso.
        </p>
      </div>
      <LaudoTecnicoTool />
    </AppShell>
  );
}
