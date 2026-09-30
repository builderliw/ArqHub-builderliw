import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, MessageCircle, MapPin } from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — ArqHub" },
      { name: "description", content: "Fale com a equipe ArqHub. E-mail, WhatsApp e endereço." },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 py-16">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Fale com a gente</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Estamos prontos para te atender. Escolha o canal que preferir.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            <Link to="/ajuda/suporte" className="rounded-2xl border border-border bg-white p-6 hover:shadow-md transition-shadow">
              <Mail className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">E-mail</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Envie sua mensagem para o suporte</p>
            </Link>
            <div className="rounded-2xl border border-border bg-white p-6 relative">
              <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                Em breve
              </span>
              <MessageCircle className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">WhatsApp</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Atendimento comercial e suporte</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-6 sm:col-span-2">
              <MapPin className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">Endereço</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Brasil — atendimento 100% digital</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
