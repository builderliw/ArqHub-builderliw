import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, LayoutDashboard, FolderOpen, ShoppingBag, ClipboardCheck, Calendar,
  MessageSquare, FileText, BellRing, Upload, Trash2, Download, FileImage, FileType2, File as FileIcon,
CalendarClock , Images } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listMyReceipts, uploadReceipt, deleteReceipt } from "@/lib/receipts.functions";
import { getMySubscription, cancelMySubscription } from "@/lib/subscription.functions";
import { CreditCard, XCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/meus-pagamentos")({
  head: () => ({ meta: [{ title: "Meus pagamentos — ArqHub" }] }),
  component: MeusPagamentos,
});

const nav: NavGroup[] = [
  { label: "Interface", items: [{ to: "/app/cliente", label: "Meu projeto", icon: LayoutDashboard }] },
  {
    label: "Acompanhamento",
    items: [
      { to: "/app/cliente/agenda", label: "Agenda", icon: CalendarClock },
      { to: "/app/cliente/aprovacoes", label: "Aprovações", icon: ClipboardCheck },
      { to: "/app/cliente/cronograma", label: "Cronograma", icon: Calendar },
      { to: "/app/cliente/documentos", label: "Documentos", icon: FolderOpen },
      { to: "/app/cliente/galeria", label: "Galeria", icon: Images },
      { to: "/app/cliente/produtos", label: "Produtos", icon: ShoppingBag },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { to: "/app/cliente/mensagens", label: "Mensagens", icon: MessageSquare },
      { to: "/app/cliente/notificacoes", label: "Notificações", icon: BellRing },
    ],
  },
  { label: "Financeiro", items: [{ to: "/app/meus-pagamentos", label: "Meus pagamentos", icon: FileText }] },
];

type Receipt = {
  name: string;
  path: string;
  size: number;
  mime: string;
  created_at: string;
  url: string | null;
};

function formatBytes(n: number) {
  if (!n) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function displayName(name: string) {
  // strip leading timestamp prefix `1234567890-`
  return name.replace(/^\d{10,16}-/, "");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const idx = s.indexOf("base64,");
      resolve(idx >= 0 ? s.slice(idx + 7) : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function MeusPagamentos() {
  const listFn = useServerFn(listMyReceipts);
  const uploadFn = useServerFn(uploadReceipt);
  const deleteFn = useServerFn(deleteReceipt);
  const getSubFn = useServerFn(getMySubscription);
  const cancelSubFn = useServerFn(cancelMySubscription);

  const [items, setItems] = useState<Receipt[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sub, setSub] = useState<{ subscription: any; plan: any } | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh(t: string) {
    try {
      const r = await listFn({ data: { externalAccessToken: t } });
      setItems(r.items as Receipt[]);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
      setItems([]);
    }
  }

  async function loadSub(t: string) {
    setSubLoading(true);
    try {
      const r = await getSubFn({ data: { accessToken: t } });
      setSub(r);
    } catch {
      setSub({ subscription: null, plan: null });
    } finally {
      setSubLoading(false);
    }
  }

  async function handleCancelSub() {
    if (!token) return;
    if (!confirm("Tem certeza que deseja cancelar sua assinatura? O acesso permanece até o fim do período pago.")) return;
    setCancelLoading(true);
    try {
      await cancelSubFn({ data: { accessToken: token } });
      await loadSub(token);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao cancelar");
    } finally {
      setCancelLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const { data: sess } = await externalSupabase.auth.getSession();
      const t = sess.session?.access_token ?? null;
      setToken(t);
      if (!t) { setItems([]); setErr("Faça login para ver seus comprovantes."); setSubLoading(false); return; }
      refresh(t);
      loadSub(t);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length || !token) return;
    setUploading(true);
    setErr(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.size > 15 * 1024 * 1024) {
          setErr(`"${f.name}" excede 15MB.`);
          continue;
        }
        setProgress(`Enviando ${i + 1}/${files.length}: ${f.name}`);
        const base64 = await fileToBase64(f);
        await uploadFn({
          data: {
            externalAccessToken: token,
            fileName: f.name,
            mime: f.type || "application/octet-stream",
            base64,
          },
        });
      }
      await refresh(token);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(path: string) {
    if (!token) return;
    if (!confirm("Excluir este comprovante?")) return;
    try {
      await deleteFn({ data: { externalAccessToken: token, path } });
      await refresh(token);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao excluir");
    }
  }

  return (
    <AppShell role="cliente" nav={nav} title="Meus pagamentos">
      <Link
        to="/app/cliente"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-ink mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao painel
      </Link>

      {/* Minha assinatura */}
      <SubscriptionCard
        loading={subLoading}
        data={sub}
        onCancel={handleCancelSub}
        canceling={cancelLoading}
      />


      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">Comprovantes 🧾</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Faça upload dos seus comprovantes de pagamento. Aceitamos qualquer formato (até 15&nbsp;MB).
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !token}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Enviando..." : "Enviar comprovante"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-[13px] mb-4">
          {err}
        </div>
      )}
      {progress && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-700 text-[13px] mb-4">
          {progress}
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="rounded-xl border-2 border-dashed border-border bg-secondary/40 p-6 text-center mb-6 text-[12.5px] text-muted-foreground"
      >
        Arraste arquivos aqui — PDF, JPG, PNG, HEIC, DOC, XLSX, etc. 📎
      </div>

      {items === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-secondary/60 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-secondary flex items-center justify-center text-[28px] mb-3">📂</div>
          <h3 className="text-[15px] font-semibold text-ink">Nenhum comprovante ainda</h3>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-md mx-auto">
            Clique em <strong>Enviar comprovante</strong> para adicionar seus recibos, faturas e notas fiscais.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((it) => {
            const isImage = it.mime.startsWith("image/");
            const isPdf = it.mime === "application/pdf" || it.name.toLowerCase().endsWith(".pdf");
            const Icon = isImage ? FileImage : isPdf ? FileType2 : FileIcon;
            return (
              <div
                key={it.path}
                className="group relative rounded-xl overflow-hidden border border-border bg-white hover:shadow-md transition-shadow"
              >
                <a
                  href={it.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-square bg-secondary/40 flex items-center justify-center overflow-hidden"
                >
                  {isImage && it.url ? (
                    <img
                      src={it.url}
                      alt={displayName(it.name)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                      <Icon className="h-10 w-10" strokeWidth={1.5} />
                      <span className="text-[10.5px] font-medium uppercase tracking-wide">
                        {isPdf ? "PDF" : (it.name.split(".").pop() || "arquivo").toUpperCase()}
                      </span>
                    </div>
                  )}
                </a>
                <div className="p-2.5">
                  <div className="text-[12px] font-medium text-ink truncate" title={displayName(it.name)}>
                    {displayName(it.name)}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5 flex items-center justify-between">
                    <span>{formatDate(it.created_at)}</span>
                    <span>{formatBytes(it.size)}</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {it.url && (
                    <a
                      href={it.url}
                      download={displayName(it.name)}
                      target="_blank"
                      rel="noreferrer"
                      className="h-7 w-7 rounded-full bg-white/95 backdrop-blur border border-border flex items-center justify-center text-ink hover:bg-white"
                      title="Baixar"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(it.path)}
                    className="h-7 w-7 rounded-full bg-white/95 backdrop-blur border border-border flex items-center justify-center text-red-600 hover:bg-red-50"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status: string | null | undefined) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    active: { label: "Ativa", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
    pending: { label: "Pendente", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
    canceled: { label: "Cancelada", cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: XCircle },
    expired: { label: "Expirada", cls: "bg-muted text-muted-foreground border-border", Icon: XCircle },
  };
  const s = map[status ?? ""] ?? { label: status ?? "—", cls: "bg-muted text-muted-foreground border-border", Icon: Clock };
  const Icon = s.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] font-semibold ${s.cls}`}>
      <Icon className="h-3.5 w-3.5" /> {s.label}
    </span>
  );
}

function SubscriptionCard(props: {
  loading: boolean;
  data: { subscription: any; plan: any } | null;
  onCancel: () => void;
  canceling: boolean;
}) {
  if (props.loading) {
    return (
      <div className="rounded-xl border border-border bg-white p-5 mb-6 h-[110px] animate-pulse" />
    );
  }
  const sub = props.data?.subscription;
  if (!sub) {
    return (
      <div className="rounded-xl border border-border bg-gradient-to-br from-secondary/40 to-white p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-ink">Sem assinatura ativa</div>
            <div className="text-[12.5px] text-muted-foreground">Contrate um plano para liberar todos os recursos.</div>
          </div>
        </div>
        <Link
          to="/planos"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-[12.5px] font-semibold hover:opacity-90"
        >
          Ver planos
        </Link>
      </div>
    );
  }
  const plan = props.data?.plan;
  const isCanceled = sub.status === "canceled" || sub.status === "expired";
  return (
    <div className="rounded-xl border border-border bg-white p-5 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-semibold text-ink">
                {plan?.name ? `ArqHub ${plan.name}` : "Minha assinatura"}
              </span>
              {statusBadge(sub.status)}
            </div>
            <div className="text-[12.5px] text-muted-foreground mt-1">
              Último pagamento: {formatDateTime(sub.last_payment_at)}
              {sub.last_payment_status ? ` · ${sub.last_payment_status}` : ""}
            </div>
            <div className="text-[11.5px] text-muted-foreground mt-0.5">
              Atualizada em {formatDateTime(sub.updated_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isCanceled && (
            <button
              type="button"
              onClick={props.onCancel}
              disabled={props.canceling}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-rose-200 bg-white text-rose-700 text-[12.5px] font-semibold hover:bg-rose-50 disabled:opacity-60"
            >
              {props.canceling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              {props.canceling ? "Cancelando..." : "Cancelar assinatura"}
            </button>
          )}
          {isCanceled && (
            <Link
              to="/planos"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-primary text-white text-[12.5px] font-semibold hover:opacity-90"
            >
              Reativar plano
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

