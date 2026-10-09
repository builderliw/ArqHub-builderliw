import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Check, X, Clock, QrCode, CreditCard, RefreshCw, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPaymentTracking } from "@/lib/payment-tracking.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/pagamento/$paymentId")({
  head: () => ({
    meta: [
      { title: "Status do pagamento — ArqHub" },
      { name: "description", content: "Acompanhe a confirmação do seu pagamento em tempo real." },
    ],
  }),
  component: PagamentoStatusPage,
});

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function elapsed(from: string | null) {
  if (!from) return "—";
  const diff = Date.now() - new Date(from).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora há pouco";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  return `há ${h}h ${m % 60}min`;
}

function PagamentoStatusPage() {
  const { paymentId } = Route.useParams();
  const navigate = useNavigate();
  const track = useServerFn(getPaymentTracking);

  const [state, setState] = useState<Awaited<ReturnType<typeof track>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startedAt = useRef<number>(Date.now());

  async function fetchOnce(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      const res = await track({ data: { paymentId } });
      setState(res);
      setError(null);
      if (res.status === "approved" && res.subscriptionActivated) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao consultar pagamento");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOnce(true);
    intervalRef.current = window.setInterval(() => fetchOnce(true), 4000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const status = state?.status ?? "pending";
  const approved = status === "approved";
  const failed = ["rejected", "cancelled", "refunded", "charged_back"].includes(status);
  const waitingTooLong = Date.now() - startedAt.current > 10 * 60 * 1000;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 py-10 lg:py-14">
        <div className="mx-auto max-w-2xl px-6">
          <div className="rounded-2xl bg-white border border-border p-8 lg:p-10">
            <div className="t-eyebrow text-primary mb-2">Acompanhamento</div>
            <h1 className="t-h2">Status do pagamento</h1>
            <p className="mt-1 t-body-sm text-muted-foreground">
              ID <span className="font-mono">{paymentId}</span>
            </p>

            <div className="mt-8">
              {loading ? (
                <SkeletonStatus />
              ) : error ? (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 t-body-sm">
                  {error}
                </div>
              ) : (
                <StatusBadge approved={approved} failed={failed} />
              )}
            </div>

            {state && (
              <div className="mt-6 grid sm:grid-cols-2 gap-3 rounded-xl bg-secondary border border-border p-5">
                <InfoRow
                  label="Método"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {state.method === "pix" ? (
                        <QrCode className="h-4 w-4 text-primary" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-primary" />
                      )}
                      {state.method === "pix" ? "PIX" : "Cartão"}
                    </span>
                  }
                />
                <InfoRow label="Valor" value={<span className="font-semibold">{formatBRL(state.amount)}</span>} />
                <InfoRow label="Plano" value={state.planCode ? `ArqHub ${cap(state.planCode)}` : "—"} />
                <InfoRow
                  label="Frequência"
                  value={state.frequency === "yearly" ? "Anual" : state.frequency === "monthly" ? "Mensal" : "—"}
                />
                <InfoRow label="Criado" value={elapsed(state.createdAt)} />
                <InfoRow
                  label="Aprovado"
                  value={state.approvedAt ? new Date(state.approvedAt).toLocaleString("pt-BR") : "aguardando"}
                />
              </div>
            )}

            {approved && (
              <div className="mt-6">
                {state?.emailExists === true ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-[13.5px] leading-relaxed">
                    <div className="font-semibold mb-1">Já existe uma conta com este e-mail.</div>
                    <p className="mb-3">
                      Enviamos um e-mail para <span className="font-mono">{state.payerEmail}</span> com as instruções.
                      Entre com sua senha para liberar o plano — se esqueceu, recupere abaixo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to="/entrar/$role"
                        params={{ role: "escritorio" }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white t-label hover:bg-primary-dark"
                      >
                        Entrar agora <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        to="/esqueci-senha"
                        search={{ role: "escritorio" as const }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 bg-white t-label hover:bg-amber-100"
                      >
                        Recuperar senha
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-[13.5px] leading-relaxed">
                    <div className="font-semibold text-primary mb-1">Tudo certo!</div>
                    <p className="mb-3 text-foreground">
                      {state?.payerEmail
                        ? <>Enviamos um e-mail para <span className="font-mono">{state.payerEmail}</span> com o próximo passo. Crie sua senha para acessar o painel.</>
                        : <>Crie sua senha para acessar o painel.</>}
                    </p>
                  </div>
                )}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/cadastro"
                    search={{ paid: "1" } as any}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary text-white t-label hover:bg-primary-dark"
                  >
                    {state?.emailExists ? "Ir para meu painel" : "Criar minha conta"} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={"/comprovante/$paymentId" as any}
                    params={{ paymentId } as any}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-border t-label hover:bg-secondary"
                  >
                    Ver comprovante
                  </Link>
                </div>
              </div>
            )}


            {!approved && !failed && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3 items-start">
                <button
                  type="button"
                  onClick={() => fetchOnce(false)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border t-label hover:bg-secondary disabled:opacity-60"
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Verificar agora
                </button>
                {waitingTooLong && (
                  <p className="t-caption text-muted-foreground">
                    Demorando mais que o normal? O webhook da operadora pode levar alguns minutos. Clique em
                    "Verificar agora" ou tente novamente.
                  </p>
                )}
              </div>
            )}

            {failed && (
              <div className="mt-8">
                <Link
                  to="/planos"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border t-label hover:bg-secondary"
                >
                  Tentar novamente
                </Link>
              </div>
            )}
          </div>

          {state?.events && state.events.length > 0 && (
            <div className="mt-6 rounded-2xl bg-white border border-border p-6">
              <h2 className="t-label text-muted-foreground mb-3">Histórico</h2>
              <ul className="space-y-2">
                {state.events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between t-body-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {labelForEvent(e.type)}
                    </span>
                    <span className="text-muted-foreground t-caption">
                      {new Date(e.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatusBadge({ approved, failed }: { approved: boolean; failed: boolean }) {
  if (approved) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-5">
        <span className="h-10 w-10 rounded-full bg-primary text-white grid place-items-center">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <div className="t-label text-primary">Pagamento aprovado</div>
          <div className="t-body-sm text-muted-foreground">Seu acesso foi liberado.</div>
        </div>
      </div>
    );
  }
  if (failed) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-5">
        <span className="h-10 w-10 rounded-full bg-red-600 text-white grid place-items-center">
          <X className="h-5 w-5" />
        </span>
        <div>
          <div className="t-label text-red-700">Pagamento não aprovado</div>
          <div className="t-body-sm text-muted-foreground">Tente novamente ou use outro método.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-5">
      <span className="h-10 w-10 rounded-full bg-amber-500 text-white grid place-items-center">
        <Clock className="h-5 w-5" />
      </span>
      <div>
        <div className="t-label text-amber-800">Aguardando confirmação</div>
        <div className="t-body-sm text-muted-foreground">
          Atualizando automaticamente a cada 4s. Pode levar alguns instantes após o pagamento.
        </div>
      </div>
    </div>
  );
}

function SkeletonStatus() {
  return <div className="h-20 rounded-xl bg-secondary animate-pulse" />;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="t-caption text-muted-foreground">{label}</div>
      <div className="t-body-sm mt-0.5">{value}</div>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function labelForEvent(t: string) {
  switch (t) {
    case "created":
      return "Pagamento criado";
    case "pending":
      return "Aguardando confirmação";
    case "approved":
      return "Pagamento aprovado";
    case "failed":
      return "Pagamento não aprovado";
    case "webhook_received":
      return "Webhook recebido";
    case "subscription_activated":
      return "Assinatura ativada";
    default:
      return t;
  }
}
