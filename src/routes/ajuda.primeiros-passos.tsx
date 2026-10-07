import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  BookOpen,
  UserPlus,
  Building2,
  Users,
  UserCheck,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Sparkles,
  ArrowRight,
  PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/ajuda/primeiros-passos")({
  head: () => ({
    meta: [
      { title: "Primeiros passos — Central de Ajuda ArqHub" },
      { name: "description", content: "Guia didático e ilustrado para criar sua conta, configurar o escritório e iniciar seu primeiro projeto na ArqHub." },
      { property: "og:title", content: "Primeiros passos — ArqHub" },
      { property: "og:description", content: "Aprenda em 6 passos como começar a usar a ArqHub no seu escritório." },
    ],
  }),
  component: Page,
});

const steps = [
  {
    icon: UserPlus,
    t: "Crie sua conta",
    d: "Cadastre-se com seu e-mail profissional. É gratuito e você ganha 14 dias de teste com todos os recursos liberados.",
    tip: "Use o e-mail do escritório para facilitar a gestão da equipe.",
    time: "1 min",
  },
  {
    icon: Building2,
    t: "Configure seu escritório",
    d: "No primeiro acesso, complete o onboarding: nome do escritório, logo, identidade visual, e dados de contato. Tudo aparecerá automaticamente nos documentos e no Portal do Cliente.",
    tip: "Tenha o logo em PNG (fundo transparente) por perto.",
    time: "3 min",
  },
  {
    icon: Users,
    t: "Adicione sua equipe",
    d: "Convide colaboradores por e-mail e defina papéis (membro, premium, enterprise). Cada papel libera módulos específicos da plataforma.",
    tip: "Comece pelos sócios e líderes — você pode adicionar mais pessoas depois.",
    time: "2 min",
  },
  {
    icon: UserCheck,
    t: "Cadastre seu primeiro cliente",
    d: "Vá em Clientes → Novo cliente. O cliente recebe um convite por e-mail para acessar o Portal do Cliente e acompanhar o projeto.",
    tip: "Confirme o e-mail do cliente antes de enviar o convite.",
    time: "2 min",
  },
  {
    icon: FolderKanban,
    t: "Crie o primeiro projeto",
    d: "Em Projetos → Novo projeto, vincule ao cliente, defina etapas, cronograma e a equipe responsável. Pronto: a obra começa a viver na ArqHub.",
    tip: "Use templates de etapas para acelerar projetos parecidos.",
    time: "5 min",
  },
  {
    icon: LayoutDashboard,
    t: "Acompanhe pelo Dashboard",
    d: "Tudo aparece consolidado: prazos, financeiro, mensagens e aprovações pendentes. É a sua sala de comando.",
    tip: "Fixe o Dashboard como aba inicial do navegador.",
    time: "—",
  },
];

function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 py-16">
          <Link to="/ajuda" className="text-sm text-muted-foreground hover:text-foreground">← Voltar para a Central de Ajuda</Link>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl tracking-tight">Primeiros passos</h1>
              <p className="text-sm text-muted-foreground">Tempo estimado: ~15 minutos</p>
            </div>
          </div>

          <p className="mt-4 text-lg text-muted-foreground">
            Um guia rápido e ilustrado para colocar seu escritório dentro da ArqHub. Siga na ordem — cada passo desbloqueia o próximo.
          </p>

          {/* Resumo visual */}
          <div className="mt-8 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {steps.map((s, i) => (
              <div key={s.t} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/40 border border-border">
                <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
                  {i + 1}
                </div>
                <s.icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{s.t.split(" ")[0]}</span>
              </div>
            ))}
          </div>

          {/* Passos detalhados */}
          <ol className="mt-12 space-y-5">
            {steps.map((s, i) => (
              <li key={s.t} className="rounded-2xl border border-border bg-white p-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h3 className="font-semibold text-ink flex items-center gap-2 text-lg">
                        <s.icon className="h-5 w-5 text-primary" /> {s.t}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                        ⏱ {s.time}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
                      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-ink/80"><span className="font-semibold">Dica: </span>{s.tip}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Próximos passos */}
          <div className="mt-12 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-secondary/30 p-6">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold text-ink">Pronto para ir além?</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Explore guias específicos para extrair o máximo da plataforma.</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <Link to="/ajuda/configuracao" className="rounded-xl border border-border bg-white p-4 hover:shadow-md transition-shadow flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-ink">Configuração da conta</p>
                  <p className="text-xs text-muted-foreground">Identidade, equipe, permissões</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
              <Link to="/ajuda/portal-cliente" className="rounded-xl border border-border bg-white p-4 hover:shadow-md transition-shadow flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-ink">Portal do cliente</p>
                  <p className="text-xs text-muted-foreground">Convites e aprovações</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-secondary/40 border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PlayCircle className="h-6 w-6 text-primary" />
              <p className="text-sm text-muted-foreground">Travou em algum passo? Nossa equipe responde rápido.</p>
            </div>
            <Link to="/ajuda/suporte" className="px-4 h-10 inline-flex items-center rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">Fale com o suporte</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
