import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Shield, Lock, FileText, UserCheck } from "lucide-react";

export const Route = createFileRoute("/lgpd")({
  head: () => ({
    meta: [
      { title: "LGPD — ArqHub" },
      { name: "description", content: "Conformidade da ArqHub com a Lei Geral de Proteção de Dados (LGPD)." },
    ],
  }),
  component: LgpdPage,
});

function LgpdPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 py-16">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">LGPD</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A ArqHub está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-border p-6">
              <Shield className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">Segurança</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Criptografia em trânsito e em repouso, backups diários e controle de acesso.</p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <Lock className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">Minimização</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Coletamos apenas os dados necessários para entregar nosso serviço.</p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <UserCheck className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">Seus direitos</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Acesso, correção, portabilidade e exclusão dos seus dados, conforme a LGPD.</p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <FileText className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-ink">Transparência</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Veja nossa <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.</p>
            </div>
          </div>

          <div className="mt-10 prose prose-neutral max-w-none">
            <h2>Encarregado de Dados (DPO)</h2>
            <p>
              Para exercer seus direitos ou tirar dúvidas sobre o tratamento dos seus dados,
              entre em contato pelo e-mail <strong>dpo@arqhub.world</strong>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
