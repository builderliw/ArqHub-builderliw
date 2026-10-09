import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Loader2, Check, QrCode, CreditCard, ArrowLeft, Copy, ArrowRight } from "lucide-react";
import {
  createPixCheckout,
  createCardCheckout,
  getMpPublicKey,
} from "@/lib/checkout-mp.functions";
import { toast } from "sonner";

const searchSchema = z.object({
  freq: z.enum(["monthly", "yearly"]),
});

export const Route = createFileRoute("/checkout/$plano")({
  validateSearch: searchSchema,
  beforeLoad: ({ params }) => {
    if (params.plano !== "basico" && params.plano !== "premium") {
      throw notFound();
    }
  },
  head: () => ({
    meta: [
      { title: "Checkout — ArqHub" },
      { name: "description", content: "Finalize sua assinatura com PIX ou cartão de crédito." },
    ],
  }),
  component: CheckoutPage,
});

type Plano = "basico" | "premium";

const PLAN_INFO: Record<Plano, { name: string; monthly: number }> = {
  basico: { name: "Básico", monthly: 129.99 },
  premium: { name: "Premium", monthly: 249.99 },
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function maskCPF(s: string) {
  const d = onlyDigits(s).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCard(s: string) {
  return onlyDigits(s).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function maskExp(s: string) {
  const d = onlyDigits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

function loadMpSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.MercadoPago) return resolve();
    const existing = document.querySelector<HTMLScriptElement>("script[data-mp-sdk]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar SDK")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.dataset.mpSdk = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar SDK do Mercado Pago"));
    document.head.appendChild(s);
  });
}

function CheckoutPage() {
  const { plano } = Route.useParams();
  const { freq } = Route.useSearch();
  const navigate = useNavigate();

  const planoKey = (plano === "premium" ? "premium" : "basico") as Plano;
  const info = PLAN_INFO[planoKey];
  const amount = useMemo(
    () => (freq === "yearly" ? Number((info.monthly * 12 * 0.8).toFixed(2)) : info.monthly),
    [freq, info.monthly],
  );

  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  const pixFn = useServerFn(createPixCheckout);
  const cardFn = useServerFn(createCardCheckout);
  
  const pkFn = useServerFn(getMpPublicKey);

  const validBase = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && onlyDigits(cpf).length === 11;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 py-10 lg:py-14">
        <div className="mx-auto max-w-3xl px-6">
          <Link to="/planos" className="inline-flex items-center gap-1.5 t-body-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> Voltar para planos
          </Link>

          <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="rounded-2xl bg-white border border-border p-6 lg:p-8">
              <div className="t-eyebrow text-primary mb-1">Checkout seguro</div>
              <h1 className="t-h2">Finalizar assinatura</h1>
              <p className="mt-1 t-body-sm text-muted-foreground">
                Pagamento processado de forma segura. Sem redirecionamento.
              </p>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <Field label="Nome completo" value={name} onChange={setName} placeholder="Maria Souza" />
                <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@exemplo.com" />
                <Field
                  label="CPF"
                  value={cpf}
                  onChange={(v) => setCpf(maskCPF(v))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>

              {/* Tabs */}
              <div className="mt-8 inline-flex p-1 rounded-full bg-secondary border border-border">
                <button
                  type="button"
                  onClick={() => setMethod("pix")}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full t-label transition-colors ${
                    method === "pix" ? "bg-primary text-white" : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  <QrCode className="h-4 w-4" /> PIX
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full t-label transition-colors ${
                    method === "card" ? "bg-primary text-white" : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Cartão de crédito
                </button>
              </div>

              <div className="mt-6">
                {method === "pix" ? (
                  <PixPanel
                    enabled={validBase}
                    planoKey={planoKey}
                    freq={freq}
                    name={name}
                    email={email}
                    cpf={cpf}
                    onCreated={(paymentId) =>
                      navigate({ to: "/pagamento/$paymentId" as any, params: { paymentId } as any })
                    }
                    create={pixFn}
                  />
                ) : (
                  <CardPanel
                    enabled={validBase}
                    planoKey={planoKey}
                    freq={freq}
                    name={name}
                    email={email}
                    cpf={cpf}
                    amount={amount}
                    onCreated={(paymentId) =>
                      navigate({ to: "/pagamento/$paymentId" as any, params: { paymentId } as any })
                    }
                    create={cardFn}
                    getPublicKey={pkFn}
                  />
                )}
              </div>
            </div>

            {/* Resumo */}
            <aside className="rounded-2xl bg-[#4A4A47] text-white p-6 sticky top-6">
              <div className="t-label text-white/60">Resumo</div>
              <div className="mt-1 text-2xl font-semibold">ArqHub {info.name}</div>
              <div className="mt-1 t-body-sm text-white/70">
                {freq === "yearly" ? "Plano anual (12 meses, -20%)" : "Plano mensal"}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4 flex items-baseline justify-between">
                <span className="t-body-sm text-white/70">Total</span>
                <span className="text-2xl font-semibold">{formatBRL(amount)}</span>
              </div>
              {freq === "monthly" && (
                <p className="mt-2 t-caption text-white/60">
                  Mensal: cobrança recorrente automática no cartão (ou pagamento único via PIX).
                </p>
              )}
              {freq === "yearly" && (
                <p className="mt-2 t-caption text-white/60">
                  Anual: pagamento único, sem renovação automática.
                </p>
              )}
              <ul className="mt-5 space-y-2 t-body-sm text-white/80">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancele quando quiser</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Processado por Mercado Pago</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Acesso imediato após confirmação</li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
}) {
  return (
    <label className={`block ${props.className ?? ""}`}>
      <span className="t-label text-muted-foreground">{props.label}</span>
      <input
        type={props.type ?? "text"}
        inputMode={props.inputMode}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 t-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

// ---------------- PIX ----------------
function PixPanel(props: {
  enabled: boolean;
  planoKey: Plano;
  freq: "monthly" | "yearly";
  name: string;
  email: string;
  cpf: string;
  onCreated: (paymentId: string) => void;
  create: (args: { data: any }) => Promise<any>;
}) {
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<{
    paymentId: string;
    qrCode: string;
    qrCodeBase64: string;
    ticketUrl: string;
  } | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await props.create({
        data: {
          planCode: props.planoKey,
          frequency: props.freq,
          email: props.email,
          cpf: onlyDigits(props.cpf),
          name: props.name,
        },
      });
      setPix({
        paymentId: res.paymentId,
        qrCode: res.qrCode ?? "",
        qrCodeBase64: res.qrCodeBase64 ?? "",
        ticketUrl: res.ticketUrl ?? "",
      });
      toast.success("PIX gerado! Escaneie o QR Code ou copie o código.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!pix?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      toast.success("Código copiado!");
    } catch {
      toast.error("Não foi possível copiar. Selecione manualmente.");
    }
  }

  if (pix) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-secondary/40 p-5 flex flex-col items-center text-center">
          {pix.qrCodeBase64 ? (
            <img
              src={`data:image/png;base64,${pix.qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-56 h-56 rounded-lg bg-white p-2 border border-border"
            />
          ) : (
            <div className="w-56 h-56 rounded-lg bg-white border border-border grid place-items-center text-muted-foreground text-sm">
              QR indisponível
            </div>
          )}
          <p className="mt-4 t-body-sm text-muted-foreground max-w-xs">
            Abra o app do seu banco, escolha pagar via PIX com QR Code e escaneie a imagem acima.
          </p>
        </div>

        {pix.qrCode && (
          <div>
            <div className="t-label text-muted-foreground mb-1.5">Copia e cola</div>
            <div className="flex gap-2">
              <textarea
                readOnly
                value={pix.qrCode}
                className="flex-1 rounded-lg border border-border bg-white px-3 py-2 t-body-sm font-mono resize-none h-20"
              />
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 px-3 rounded-lg border border-border t-label hover:bg-secondary"
              >
                <Copy className="h-4 w-4" /> Copiar
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => props.onCreated(pix.paymentId)}
            className="inline-flex items-center justify-center gap-2 flex-1 py-3 rounded-lg bg-primary text-white t-label hover:bg-primary-dark"
          >
            Acompanhar pagamento <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPix(null)}
            className="inline-flex items-center justify-center px-4 py-3 rounded-lg border border-border t-label hover:bg-secondary"
          >
            Gerar novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="t-body-sm text-muted-foreground">
        Ao clicar em "Gerar PIX" vamos exibir aqui mesmo o QR Code e o código copia-e-cola. A
        confirmação acontece em segundos pelo app do seu banco.
      </p>
      <button
        type="button"
        disabled={!props.enabled || loading}
        onClick={generate}
        className="mt-4 inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-white t-label hover:bg-primary-dark disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Gerar PIX
      </button>
      {!props.enabled && (
        <p className="mt-2 t-caption text-muted-foreground">Preencha nome, e-mail e CPF acima.</p>
      )}
    </div>
  );
}

// ---------------- Cartão ----------------
function CardPanel(props: {
  enabled: boolean;
  planoKey: Plano;
  freq: "monthly" | "yearly";
  name: string;
  email: string;
  cpf: string;
  amount: number;
  onCreated: (paymentId: string) => void;
  create: (args: { data: any }) => Promise<any>;
  getPublicKey: () => Promise<{ publicKey: string }>;
}) {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);
  const mpRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadMpSdk();
        const { publicKey } = await props.getPublicKey();
        if (!mounted) return;
        mpRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      } catch (e) {
        toast.error("Falha ao carregar SDK de cartão.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [props]);

  const maxInstallments = props.freq === "yearly" ? 12 : 1;

  async function submit() {
    if (!mpRef.current) {
      toast.error("SDK não carregado.");
      return;
    }
    const [mm, yy] = exp.split("/");
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2) {
      toast.error("Validade inválida (MM/AA).");
      return;
    }
    setLoading(true);
    try {
      const tokenRes = await mpRef.current.createCardToken({
        cardNumber: onlyDigits(number),
        cardholderName: holder,
        cardExpirationMonth: mm,
        cardExpirationYear: `20${yy}`,
        securityCode: onlyDigits(cvv),
        identificationType: "CPF",
        identificationNumber: onlyDigits(props.cpf),
      });
      if (!tokenRes?.id) throw new Error("Não foi possível tokenizar o cartão.");

      // Descobre payment_method_id pelo BIN
      let paymentMethodId = "";
      let issuerId: string | undefined;
      try {
        const bin = onlyDigits(number).slice(0, 8);
        const pm = await mpRef.current.getPaymentMethods({ bin });
        paymentMethodId = pm?.results?.[0]?.id ?? "";
        issuerId = pm?.results?.[0]?.issuer?.id ? String(pm.results[0].issuer.id) : undefined;
      } catch {
        /* ignore */
      }
      if (!paymentMethodId) throw new Error("Bandeira do cartão não reconhecida.");

      const res = await props.create({
        data: {
          planCode: props.planoKey,
          frequency: props.freq,
          email: props.email,
          cpf: onlyDigits(props.cpf),
          name: props.name,
          cardToken: tokenRes.id,
          paymentMethodId,
          issuerId,
          installments,
          backUrl: `${window.location.origin}/cadastro`,
        },
      });

      // Anual: temos paymentId — redireciona para acompanhamento (mesmo que já aprovado).
      // Mensal: preapproval autorizada na hora — vai direto para cadastro.
      if (res.paymentId) {
        props.onCreated(res.paymentId);
      } else if (res.status === "authorized") {
        toast.success("Assinatura ativada!");
        window.location.href = "/cadastro?paid=1";
      } else {
        toast.error(`Pagamento ${res.status}${res.statusDetail ? ` (${res.statusDetail})` : ""}`);
      }
    } catch (err: any) {
      const msg = err?.message || err?.cause?.[0]?.description || "Erro ao processar cartão";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const cardValid =
    onlyDigits(number).length >= 13 &&
    holder.trim().length >= 2 &&
    exp.length === 5 &&
    onlyDigits(cvv).length >= 3;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Field
        label="Número do cartão"
        value={number}
        onChange={(v) => setNumber(maskCard(v))}
        placeholder="0000 0000 0000 0000"
        inputMode="numeric"
        className="sm:col-span-2"
      />
      <Field
        label="Nome impresso no cartão"
        value={holder}
        onChange={setHolder}
        placeholder="Como está no cartão"
        className="sm:col-span-2"
      />
      <Field label="Validade (MM/AA)" value={exp} onChange={(v) => setExp(maskExp(v))} placeholder="12/29" inputMode="numeric" />
      <Field label="CVV" value={cvv} onChange={(v) => setCvv(onlyDigits(v).slice(0, 4))} placeholder="123" inputMode="numeric" />

      {props.freq === "yearly" && (
        <label className="sm:col-span-2 block">
          <span className="t-label text-muted-foreground">Parcelamento</span>
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 t-body outline-none focus:border-primary"
          >
            {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}x de {formatBRL(props.amount / n)} {n === 1 ? "à vista" : "sem juros (a critério da bandeira)"}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        disabled={!props.enabled || !cardValid || loading}
        onClick={submit}
        className="sm:col-span-2 mt-2 inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-white t-label hover:bg-primary-dark disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {props.freq === "yearly" ? `Pagar ${formatBRL(props.amount)}` : `Assinar ${formatBRL(props.amount)}/mês`}
      </button>
      {!props.enabled && (
        <p className="sm:col-span-2 t-caption text-muted-foreground">Preencha nome, e-mail e CPF acima.</p>
      )}
    </div>
  );
}
