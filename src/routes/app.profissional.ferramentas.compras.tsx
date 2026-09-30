import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { navProfissional as nav } from "@/lib/nav-profissional";
import { ToolHero } from "@/components/tool-hero";

export const Route = createFileRoute("/app/profissional/ferramentas/compras")({
  head: () => ({ meta: [{ title: "Sugestão de Compras — ArqHub" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell role="profissional" nav={nav} title="Sugestão de Compras">
      <ToolHero
        icon={<ShoppingCart className="h-6 w-6 text-primary" strokeWidth={1.75} />}
        title="Sugestão de Compras"
        subtitle="Materiais recomendados na hora certa — a IA indica o que comprar e quando."
        slug="compras"
        bullets={[
          "Lista de materiais gerada a partir do orçamento",
          "Alertas de compra alinhados ao cronograma de obra",
          "Sugestão de fornecedores e cotações",
        ]}
      />
    </AppShell>
  );
}
