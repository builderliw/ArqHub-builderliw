import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Printer, Check } from "lucide-react";
import { getMyReceipt } from "@/lib/payment-tracking.functions";

export const Route = createFileRoute("/comprovante/$paymentId")({
  head: () => ({ meta: [{ title: "Comprovante — ArqHub" }] }),
  component: ComprovantePage,
});

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ComprovantePage() {
  const { paymentId } = Route.useParams();
  const fetchReceipt = useServerFn(getMyReceipt);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchReceipt>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipt({ data: { paymentId } })
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }, [paymentId, fetchReceipt]);

  if (err) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="t-h3 text-ink">Comprovante indisponível</h1>
          <p className="mt-2 t-body-sm text-muted-foreground">{err}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6 t-body-sm text-muted-foreground">
        Carregando comprovante…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 print:py-0">
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <a href="/app/cliente" className="t-body-sm text-muted-foreground hover:text-primary">
            ← Voltar
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white t-label hover:bg-primary-dark"
          >
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-border p-8 lg:p-10 print:border-0 print:shadow-none">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div>
              <div className="t-eyebrow text-primary">ArqHub</div>
              <h1 className="t-h3 mt-0.5">Comprovante de pagamento</h1>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary t-caption font-medium">
              <Check className="h-3.5 w-3.5" /> Aprovado
            </span>
          </div>

          <dl className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-4">
            <Row k="Plano" v={data.planCode ? `ArqHub ${cap(data.planCode)}` : "—"} />
            <Row k="Frequência" v={data.frequency === "yearly" ? "Anual" : data.frequency === "monthly" ? "Mensal" : "—"} />
            <Row k="Método" v={data.method === "pix" ? "PIX" : data.method === "card" ? "Cartão de crédito" : "—"} />
            <Row k="Valor" v={<span className="font-semibold">{formatBRL(data.amount)}</span>} />
            <Row k="Data" v={new Date(data.approvedAt).toLocaleString("pt-BR")} />
            <Row k="E-mail do pagador" v={data.payerEmail ?? "—"} />
            <Row k="ID da transação" v={<span className="font-mono">{data.paymentId}</span>} />
          </dl>

          <div className="mt-8 pt-5 border-t border-border t-caption text-muted-foreground">
            Este comprovante é gerado automaticamente após confirmação do pagamento pelo Mercado Pago.
            Em caso de dúvidas, entre em contato com nosso suporte citando o ID da transação.
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="t-caption text-muted-foreground">{k}</dt>
      <dd className="t-body-sm mt-0.5">{v}</dd>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
