import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Wrench, Palette, Users, Shield, Plug } from "lucide-react";

export const Route = createFileRoute("/ajuda/configuracao")({
  head: () => ({
    meta: [
      { title: "Configuração da conta — Central de Ajuda ArqHub" },
      { name: "description", content: "Personalize identidade, equipe, permissões e integrações do seu escritório na ArqHub." },
      { property: "og:title", content: "Configuração da conta — ArqHub" },
      { property: "og:description", content: "Identidade, equipe, permissões e integrações." },
    ],
  }),
  component: Page,
});

const blocks = [
  { icon: Palette, t: "Identidade do escritório", d: "Logo, cores, nome público, slug do portfólio e dados de contato. Acesse em Escritório → Identidade." },
  { icon: Users, t: "Equipe", d: "Convide membros por e-mail, defina cargo e papel (membro, premium ou enterprise). Cada papel libera módulos específicos do sistema." },
  { icon: Shield, t: "Permissões", d: "Controle o que cada papel pode ver e fazer. Membros têm acesso restrito; Premium libera IA; Enterprise libera tudo." },
  { icon: Plug, t: "Integrações", d: "Mercado Pago para pagamentos, e-mail transacional, notificações push e calendário. Configure em Escritório → Integrações." },
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
              <Wrench className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">Configuração da conta</h1>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">
            Deixe a ArqHub com a cara do seu escritório.
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
            <p className="text-sm text-muted-foreground">Dúvida sobre integrações específicas?</p>
            <Link to="/contato" className="px-4 h-10 inline-flex items-center rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">Contato</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
