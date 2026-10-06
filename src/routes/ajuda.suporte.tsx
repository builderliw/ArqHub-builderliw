import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { submitSupportMessage } from "@/lib/support-messages.functions";

export const Route = createFileRoute("/ajuda/suporte")({
  head: () => ({
    meta: [
      { title: "Fale com o suporte — Central de Ajuda ArqHub" },
      { name: "description", content: "Envie uma mensagem para o suporte da ArqHub. Respondemos em até 1 dia útil." },
      { property: "og:title", content: "Fale com o suporte — ArqHub" },
      { property: "og:description", content: "Envie sua dúvida ou solicitação para a equipe ArqHub." },
    ],
  }),
  component: Page,
});

function Page() {
  const submitFn = useServerFn(submitSupportMessage);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await submitFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
        },
      });
      setSent(true);
      toast.success("Mensagem enviada! Vamos te responder em breve.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-2xl mx-auto px-6 py-16">
          <Link to="/ajuda" className="text-sm text-muted-foreground hover:text-foreground">← Voltar para a Central de Ajuda</Link>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">Fale com o suporte</h1>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">
            Escreva sua mensagem como um e-mail. Respondemos em até 1 dia útil em horário comercial.
          </p>

          {sent ? (
            <div className="mt-10 rounded-2xl border border-border bg-white p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-ink">Mensagem enviada!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Nossa equipe recebeu sua solicitação e vai responder no e-mail informado.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setName(""); setEmail(""); setPhone(""); setMessage(""); setSent(false);
                  }}
                  className="px-4 h-10 inline-flex items-center rounded-lg border border-border bg-white text-sm font-semibold hover:bg-secondary"
                >
                  Enviar outra
                </button>
                <Link to="/ajuda" className="px-4 h-10 inline-flex items-center rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">
                  Voltar para Ajuda
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border border-border bg-white p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Nome <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">E-mail <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Mensagem <span className="text-red-500">*</span></label>
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={7}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Conte sua dúvida ou solicitação com o máximo de detalhes possível…"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <div className="mt-1 text-[11.5px] text-muted-foreground text-right">
                  {message.length}/2000
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {sending ? "Enviando…" : "Enviar mensagem"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
