import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookOpen, MessageCircle, Mail, Wrench } from "lucide-react";

export const Route = createFileRoute("/ajuda/")({
  head: () => ({
    meta: [
      { title: "Central de Ajuda — ArqHub" },
      { name: "description", content: "Tutoriais, guias e suporte para usar a plataforma ArqHub." },
    ],
  }),
  component: AjudaPage,
});

const topicos = [
  { icon: BookOpen, title: "Primeiros passos", desc: "Como criar sua conta, configurar o escritório e adicionar o primeiro projeto.", to: "/ajuda/primeiros-passos" as const },
  { icon: Wrench, title: "Configuração da conta", desc: "Personalize identidade, equipe, permissões e integrações.", to: "/ajuda/configuracao" as const },
  { icon: MessageCircle, title: "Portal do cliente", desc: "Como funciona o convite e a aprovação digital de etapas.", to: "/ajuda/portal-cliente" as const },
  { icon: Mail, title: "Fale com suporte", desc: "Não achou o que procurava? Nossa equipe responde rápido.", to: "/ajuda/suporte" as const },
];

function AjudaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-16">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Central de Ajuda</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            Tudo que você precisa para tirar o máximo da ArqHub.
          </p>

          <div className="mt-12 grid sm:grid-cols-2 gap-5">
            {topicos.map((t) => (
              <Link key={t.title} to={t.to} className="rounded-2xl border border-border bg-white p-6 hover:shadow-md transition-shadow block">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">{t.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-secondary/40 border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-ink">Não achou sua resposta?</h3>
              <p className="text-sm text-muted-foreground">Veja a FAQ ou fale com a gente.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/faq" className="px-4 h-10 inline-flex items-center rounded-lg border border-border bg-white text-sm font-semibold hover:bg-secondary">FAQ</Link>
              <Link to="/contato" className="px-4 h-10 inline-flex items-center rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">Contato</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
