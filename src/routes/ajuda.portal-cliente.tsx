import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MessageCircle, Mail, ClipboardCheck, Eye } from "lucide-react";

export const Route = createFileRoute("/ajuda/portal-cliente")({
  head: () => ({
    meta: [
      { title: "Portal do cliente — Central de Ajuda ArqHub" },
      { name: "description", content: "Como funciona o convite ao cliente e a aprovação digital de etapas no Portal do Cliente da ArqHub." },
      { property: "og:title", content: "Portal do cliente — ArqHub" },
      { property: "og:description", content: "Convite, acompanhamento e aprovações digitais pelo Portal do Cliente." },
    ],
  }),
  component: Page,
});

const blocks = [
  { icon: Mail, t: "Convite por e-mail", d: "Ao cadastrar um cliente, ele recebe um convite com link para criar acesso ao Portal. Só vê os projetos em que está vinculado." },
  { icon: Eye, t: "Acompanhamento em tempo real", d: "O cliente vê cronograma, fotos da obra, documentos, produtos comprados, mensagens e pagamentos — sem precisar pedir pelo WhatsApp." },
  { icon: ClipboardCheck, t: "Aprovação digital de etapas", d: "Etapas marcadas como 'aguardando aprovação' aparecem para o cliente com botões Aprovar / Solicitar ajuste. Tudo fica registrado com data e hora." },
  { icon: MessageCircle, t: "Mensagens por projeto", d: "Canal de chat exclusivo por projeto entre cliente, equipe e escritório. Notificações por push e e-mail." },
];

function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 py-16">
          <Link to="/ajuda" className="text-sm text-muted-foreground hover:text-foreground">← Voltar para a Central de Ajuda</Link>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">Portal do cliente</h1>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">
            Como o cliente acompanha o projeto e aprova etapas digitalmente.
          </p>

          <div className="mt-10 space-y-4">
            {blocks.map((b) => (
              <div key={b.t} className="rounded-2xl border border-border bg-white p-6 flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <b.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{b.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{b.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-secondary/40 border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Quer ver o Portal funcionando antes de assinar?</p>
            <Link to="/portal-cliente" className="px-4 h-10 inline-flex items-center rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">Ver demonstração</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
