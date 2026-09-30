import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AssistenteChat } from "@/components/assistente-chat";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Liw — Assistente ArqHub" },
      { name: "description", content: "Liw, assistente com IA do ArqHub, tira dúvidas sobre planos, funcionalidades e temas de arquitetura e engenharia." },
      { property: "og:title", content: "Liw — Assistente ArqHub" },
      { property: "og:description", content: "IA do ArqHub para tirar dúvidas sobre a plataforma e arquitetura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistentePage,
});

function AssistentePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="font-display text-3xl md:text-4xl tracking-tight text-ink">Liw · Assistente ArqHub</h1>
          <p className="mt-3 text-muted-foreground">
            Oi! Sou a Liw. Pergunte sobre o site, os planos, funcionalidades ou qualquer assunto de arquitetura e engenharia.
          </p>
          <div className="mt-8">
            <AssistenteChat />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
