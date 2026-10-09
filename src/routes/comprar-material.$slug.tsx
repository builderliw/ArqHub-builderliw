import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  ArrowLeft, Check, CreditCard, Download, Loader2, QrCode, Copy, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { getMpPublicKey } from "@/lib/checkout-mp.functions";
import {
  createMaterialPixCheckout,
  createMaterialCardCheckout,
  getMaterialPurchaseStatus,
  MATERIAL_PRICE,
} from "@/lib/material-checkout.functions";
import { seuNegocioMaterials, CATEGORY_SEU_NEGOCIO } from "@/lib/materiais-seu-negocio";

export const Route = createFileRoute("/comprar-material/$slug")({
  head: () => ({
    meta: [
      { title: "Comprar material avulso — ArqHub" },
      {
        name: "description",
        content: "Compre o material avulso por R$ 29,90 e receba o arquivo no seu e-mail.",
      },
      { property: "og:title", content: "Comprar material avulso — ArqHub" },
      {
        property: "og:description",
        content: "Pagamento seguro via PIX ou cartão. Entrega imediata por e-mail.",
      },
    ],
  }),
  component: MaterialCheckoutPage,
});

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

function MaterialCheckoutPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const material = useMemo(
    () => seuNegocioMaterials.find((m) => m.id === slug) ?? null,
    [slug],
  );

  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  const pixFn = useServerFn(createMaterialPixCheckout);
  const cardFn = useServerFn(createMaterialCardCheckout);
  const statusFn = useServerFn(getMaterialPurchaseStatus);
  const pkFn = useServerFn(getMpPublicKey);

  const validBase =
    name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && onlyDigits(cpf).length === 11;

  function goToConfirmation(paymentId: string) {
    try {
      sessionStorage.setItem(`arqhub:material-buyer:${paymentId}`, email.trim().toLowerCase());
    } catch {
      /* ignore */
    }
    navigate({
      to: "/confirmacao-material/$paymentId",
      params: { paymentId },
      search: { slug },
    });
  }


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 py-10 lg:py-14">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            to="/conteudos/seu-negocio"
            className="inline-flex items-center gap-1.5 t-body-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para materiais
          </Link>

          <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="rounded-2xl bg-white border border-border p-6 lg:p-8">
              <div className="t-eyebrow text-primary mb-1">Compra avulsa</div>
              <h1 className="t-h2">Comprar material</h1>
              <p className="mt-1 t-body-sm text-muted-foreground">
                Pagamento único de {formatBRL(MATERIAL_PRICE)}. O arquivo chega no seu e-mail
                logo após a confirmação.
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
                  <CreditCard className="h-4 w-4" /> Cartão
                </button>
              </div>

              <div className="mt-6">
                {method === "pix" ? (
                  <PixPanel
                    enabled={validBase}
                    slug={slug}
                    name={name}
                    email={email}
                    cpf={cpf}
                    create={pixFn}
                    checkStatus={statusFn}
                    onApproved={goToConfirmation}
                  />
                ) : (
                  <CardPanel
                    enabled={validBase}
                    slug={slug}
                    name={name}
                    email={email}
                    cpf={cpf}
                    create={cardFn}
                    checkStatus={statusFn}
                    getPublicKey={pkFn}
                    onApproved={goToConfirmation}
                  />
                )}
              </div>
            </div>

            <aside className="rounded-2xl bg-[#4A4A47] text-white p-6 sticky top-6">
              <div className="t-label text-white/60">Resumo</div>
              <div className="mt-1 text-lg font-semibold leading-snug">
                {material?.title ?? "Material ArqHub"}
              </div>
              {material && (
                <div className="mt-1 inline-flex items-center gap-1 t-caption text-white/70">
                  <FileText className="h-3 w-3" /> {material.format}
                </div>
              )}
              <div className="mt-6 border-t border-white/10 pt-4 flex items-baseline justify-between">
                <span className="t-body-sm text-white/70">Total</span>
                <span className="text-2xl font-semibold">{formatBRL(MATERIAL_PRICE)}</span>
              </div>
              <ul className="mt-5 space-y-2 t-body-sm text-white/80">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Pagamento único</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Entrega por e-mail</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Processado por Mercado Pago</li>
              </ul>
              <p className="mt-4 t-caption text-white/60">
                Assinantes ArqHub baixam este e todos os outros materiais sem custo.
              </p>
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

function PixPanel(props: {
  enabled: boolean;
  slug: string;
  name: string;
  email: string;
  cpf: string;
  create: (args: { data: any }) => Promise<any>;
  checkStatus: (args: { data: any }) => Promise<any>;
  onApproved: (paymentId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<{ paymentId: string; qrCode: string; qrCodeBase64: string } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pix) return;
    timer.current = setInterval(async () => {
      try {
        const res = await props.checkStatus({ data: { paymentId: pix.paymentId } });
        if (res.status === "approved") {
          if (timer.current) clearInterval(timer.current);
          props.onApproved(pix.paymentId);
        }
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [pix, props]);

  async function generate() {
    setLoading(true);
    try {
      const res = await props.create({
        data: {
          category: CATEGORY_SEU_NEGOCIO,
          slug: props.slug,
          email: props.email,
          cpf: onlyDigits(props.cpf),
          name: props.name,
        },
      });
      setPix({
        paymentId: res.paymentId,
        qrCode: res.qrCode ?? "",
        qrCodeBase64: res.qrCodeBase64 ?? "",
      });
      toast.success("PIX gerado! Escaneie o QR Code ou copie o código.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar PIX");
    } finally {
      setLoading(false);
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
            Assim que o pagamento for confirmado, liberamos o download e enviamos o arquivo por e-mail.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 t-caption text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando confirmação…
          </div>
          <button
            type="button"
            onClick={() => props.onApproved(pix.paymentId)}
            className="mt-3 t-body-sm text-primary hover:text-primary-dark underline"
          >
            Já paguei — acompanhar status
          </button>
        </div>

        {pix.qrCode && (
          <div>
            <div className="t-label text-muted-foreground mb-1.5">Copia e cola</div>
            <div className="flex gap-2">
              <textarea
                readOnly
                value={pix.qrCode}
                className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs h-20"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(pix.qrCode);
                    toast.success("Código copiado!");
                  } catch {
                    toast.error("Não foi possível copiar.");
                  }
                }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 rounded-lg border border-border bg-white t-label hover:border-primary"
              >
                <Copy className="h-4 w-4" /> Copiar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={!props.enabled || loading}
        onClick={generate}
        className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-white t-label hover:bg-primary-dark disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Gerar PIX de {formatBRL(MATERIAL_PRICE)}
      </button>
      {!props.enabled && (
        <p className="mt-2 t-caption text-muted-foreground">Preencha nome, e-mail e CPF acima.</p>
      )}
    </div>
  );
}

function CardPanel(props: {
  enabled: boolean;
  slug: string;
  name: string;
  email: string;
  cpf: string;
  create: (args: { data: any }) => Promise<any>;
  checkStatus: (args: { data: any }) => Promise<any>;
  getPublicKey: () => Promise<{ publicKey: string }>;
  onApproved: (paymentId: string) => void;
}) {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
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
      } catch {
        toast.error("Falha ao carregar SDK de cartão.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [props]);

  const cardValid =
    onlyDigits(number).length >= 13 &&
    holder.trim().length >= 2 &&
    exp.length === 5 &&
    onlyDigits(cvv).length >= 3;

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
          category: CATEGORY_SEU_NEGOCIO,
          slug: props.slug,
          email: props.email,
          cpf: onlyDigits(props.cpf),
          name: props.name,
          cardToken: tokenRes.id,
          paymentMethodId,
          issuerId,
          installments: 1,
        },
      });

      if (res.status === "rejected") {
        toast.error(`Pagamento recusado${res.statusDetail ? ` (${res.statusDetail})` : ""}`);
      }
      props.onApproved(res.paymentId);
      return;
    } catch (err: any) {
      toast.error(err?.message || "Erro ao processar cartão");
    } finally {
      setLoading(false);
    }
  }

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

      <button
        type="button"
        disabled={!props.enabled || !cardValid || loading}
        onClick={submit}
        className="sm:col-span-2 mt-2 inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-white t-label hover:bg-primary-dark disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Pagar {formatBRL(MATERIAL_PRICE)}
      </button>
      {!props.enabled && (
        <p className="sm:col-span-2 t-caption text-muted-foreground">Preencha nome, e-mail e CPF acima.</p>
      )}
    </div>
  );
}
