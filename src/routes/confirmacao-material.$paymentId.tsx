import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  ArrowLeft, CheckCircle2, Clock, Download, Loader2, RefreshCw, XCircle, Mail,
} from "lucide-react";
import { getMaterialPurchaseStatus, MATERIAL_PRICE } from "@/lib/material-checkout.functions";
import { seuNegocioMaterials } from "@/lib/materiais-seu-negocio";

const searchSchema = z.object({
  slug: z.string().optional(),
});

export const Route = createFileRoute("/confirmacao-material/$paymentId")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Confirmação de pagamento — ArqHub" },
      {
        name: "description",
        content: "Acompanhe o status do pagamento do seu material avulso e baixe o arquivo.",
      },
      { property: "og:title", content: "Confirmação de pagamento — ArqHub" },
      {
        property: "og:description",
        content: "Status do pagamento e download do material adquirido na ArqHub.",
      },
    ],
  }),
  component: ConfirmacaoMaterial,
});

type Phase = "loading" | "approved" | "pending" | "rejected" | "unknown";

const PENDING_STATUSES = ["pending", "in_process", "authorized", "in_mediation"];
const REJECTED_STATUSES = ["rejected", "cancelled", "refunded", "charged_back"];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ConfirmacaoMaterial() {
  const { paymentId } = Route.useParams();
  const { slug } = Route.useSearch();
  const statusFn = useServerFn(getMaterialPurchaseStatus);

  const material = useMemo(
    () => (slug ? seuNegocioMaterials.find((m) => m.id === slug) ?? null : null),
    [slug],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [rawStatus, setRawStatus] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [buyerEmail, setBuyerEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    try {
      setBuyerEmail(sessionStorage.getItem(`arqhub:material-buyer:${paymentId}`) ?? "");
    } catch {
      /* ignore */
    }
  }, [paymentId]);

  const check = useCallback(async () => {
    if (!buyerEmail) return;
    setChecking(true);
    try {
      const res = await statusFn({ data: { paymentId, email: buyerEmail } });
      setRawStatus(res.status ?? "");
      setDownloadUrl(res.downloadUrl ?? null);
      if (res.status === "approved") setPhase("approved");
      else if (REJECTED_STATUSES.includes(res.status)) setPhase("rejected");
      else if (PENDING_STATUSES.includes(res.status)) setPhase("pending");
      else setPhase("unknown");
    } catch {
      setPhase("unknown");
    } finally {
      setChecking(false);
    }
  }, [paymentId, statusFn, buyerEmail]);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    if (phase !== "pending") return;
    const id = setInterval(check, 6000);
    return () => clearInterval(id);
  }, [phase, check]);

  if (!buyerEmail) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="mx-auto max-w-md px-6">
            <h1 className="t-h2">Confirme seu e-mail</h1>
            <p className="mt-2 t-body-sm text-muted-foreground">
              Informe o e-mail usado na compra para acompanhar o pagamento e baixar o material.
            </p>
            <form
              className="mt-5 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const v = emailInput.trim().toLowerCase();
                if (!/\S+@\S+\.\S+/.test(v)) return;
                try {
                  sessionStorage.setItem(`arqhub:material-buyer:${paymentId}`, v);
                } catch {
                  /* ignore */
                }
                setBuyerEmail(v);
              }}
            >
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="voce@exemplo.com"
                className="h-11 rounded-lg border border-border px-3 text-sm"
              />
              <button className="h-11 rounded-lg bg-primary text-white font-medium">Continuar</button>
            </form>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 lg:py-16">
        <div className="mx-auto max-w-xl px-6">
          <Link
            to="/conteudos/seu-negocio"
            className="inline-flex items-center gap-1.5 t-body-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para materiais
          </Link>

          <div className="rounded-2xl bg-white border border-border p-7 lg:p-9 text-center">
            {phase === "loading" && (
              <>
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
                <h1 className="mt-4 t-h3 text-ink">Verificando pagamento…</h1>
                <p className="mt-2 t-body-sm text-muted-foreground">Isso leva só alguns segundos.</p>
              </>
            )}

            {phase === "approved" && (
              <>
                <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <div className="mt-4 t-eyebrow text-primary">Pagamento aprovado</div>
                <h1 className="mt-1 t-h3 text-ink">
                  {material ? material.title : "Material liberado!"}
                </h1>
                <p className="mt-2 t-body-sm text-muted-foreground">
                  Enviamos o arquivo para o seu e-mail junto com um passo a passo de como usar.
                  Você também pode baixar agora — o link vale por 7 dias.
                </p>
                {downloadUrl ? (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-white t-label hover:bg-primary-dark"
                  >
                    <Download className="h-4 w-4" /> Baixar material
                  </a>
                ) : (
                  <button
                    onClick={check}
                    className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border t-label hover:border-primary"
                  >
                    <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} /> Gerar link de download
                  </button>
                )}
              </>
            )}

            {phase === "pending" && (
              <>
                <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 grid place-items-center">
                  <Clock className="h-7 w-7 text-amber-700" />
                </div>
                <div className="mt-4 t-eyebrow text-amber-700">Pagamento pendente</div>
                <h1 className="mt-1 t-h3 text-ink">Aguardando confirmação</h1>
                <p className="mt-2 t-body-sm text-muted-foreground">
                  Assim que o pagamento de {formatBRL(MATERIAL_PRICE)} for confirmado, liberamos o
                  download aqui e enviamos o arquivo por e-mail. Esta página atualiza sozinha.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 t-caption text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando…
                </div>
              </>
            )}

            {phase === "rejected" && (
              <>
                <div className="mx-auto h-14 w-14 rounded-full bg-red-100 grid place-items-center">
                  <XCircle className="h-7 w-7 text-red-600" />
                </div>
                <div className="mt-4 t-eyebrow text-red-600">Pagamento não aprovado</div>
                <h1 className="mt-1 t-h3 text-ink">Não conseguimos confirmar</h1>
                <p className="mt-2 t-body-sm text-muted-foreground">
                  Nenhum valor foi cobrado. Você pode tentar novamente com outro cartão ou pagar via PIX.
                </p>
                {slug && (
                  <Link
                    to="/comprar-material/$slug"
                    params={{ slug }}
                    className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-white t-label hover:bg-primary-dark"
                  >
                    Tentar novamente
                  </Link>
                )}
              </>
            )}

            {phase === "unknown" && (
              <>
                <div className="mx-auto h-14 w-14 rounded-full bg-secondary grid place-items-center">
                  <Mail className="h-7 w-7 text-muted-foreground" />
                </div>
                <h1 className="mt-4 t-h3 text-ink">Não localizamos este pagamento</h1>
                <p className="mt-2 t-body-sm text-muted-foreground">
                  Se você acabou de pagar, aguarde alguns instantes e atualize. Qualquer dúvida,
                  fale com o suporte informando o código {paymentId}.
                </p>
              </>
            )}

            {phase !== "loading" && (
              <div className="mt-7 border-t border-border pt-4 flex items-center justify-between gap-3 text-left">
                <div className="t-caption text-muted-foreground">
                  Código do pagamento: <span className="font-mono">{paymentId}</span>
                  {rawStatus ? <> · status: {rawStatus}</> : null}
                </div>
                <button
                  onClick={check}
                  disabled={checking}
                  className="shrink-0 inline-flex items-center gap-1.5 t-caption text-muted-foreground hover:text-primary disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} /> Atualizar
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
