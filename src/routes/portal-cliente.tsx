import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Eye, ClipboardCheck, MessageSquare, Images, FolderOpen, ShoppingBag, Calendar, BellRing } from "lucide-react";

export const Route = createFileRoute("/portal-cliente")({
  head: () => ({
    meta: [
      { title: "Portal do Cliente — ArqHub" },
      { name: "description", content: "Um portal premium e exclusivo para o seu cliente acompanhar o projeto do início ao fim." },
    ],
  }),
  component: PortalClientePage,
});

const beneficios = [
  { icon: Eye, title: "Transparência total", desc: "Cliente vê o andamento do projeto em tempo real." },
  { icon: ClipboardCheck, title: "Aprovações rápidas", desc: "Cliente aprova etapas e documentos com um clique." },
  { icon: MessageSquare, title: "Canal direto", desc: "Mensagens organizadas por projeto, sem WhatsApp solto." },
  { icon: Images, title: "Galeria de fotos", desc: "Álbuns de obra, consultoria e ajustes sempre acessíveis." },
  { icon: FolderOpen, title: "Documentos no lugar", desc: "Plantas, contratos e relatórios versionados e seguros." },
  { icon: ShoppingBag, title: "Lista de produtos", desc: "O que comprar, onde e o que já foi adquirido." },
  { icon: Calendar, title: "Reuniões e prazos", desc: "Agenda integrada com confirmação do cliente." },
  { icon: BellRing, title: "Notificações", desc: "Avisos por e-mail e push para nada passar batido." },
];

function PortalClientePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Portal do Cliente</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            Surpreenda seu cliente com uma experiência digital à altura do seu projeto.
          </p>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {beneficios.map((b) => (
              <div key={b.title} className="rounded-2xl border border-border bg-white p-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
