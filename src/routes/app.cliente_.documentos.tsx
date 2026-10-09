import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ArrowLeft, Download, Search, FileSignature, Layers,
  PencilRuler, Eye, Box, Receipt, Image as ImageIcon, ClipboardList, Files,
  Sparkles, X, Bell, BellOff,
  ShoppingBag,
BellRing, CalendarClock , Images } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import {
  useClienteCronograma,
  getDocSignedUrl,
  formatDate,
  formatSize,
  type Documento,
} from "@/hooks/use-cliente-cronograma";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { getMyNotificationPrefs, setMyNotificationPrefs } from "@/lib/notify-new-document.functions";
import { subscribePush, unsubscribePush } from "@/lib/push.functions";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-config";
import { getPushSubscription, clearBadge } from "@/lib/pwa-register";

export const Route = createFileRoute("/app/cliente_/documentos")({
  head: () => ({ meta: [{ title: "Documentos do projeto — ArqHub" }] }),
  component: DocumentosCliente,
});

const nav: NavGroup[] = [
  { label: "Interface", items: [{ to: "/app/cliente", label: "Início", icon: LayoutDashboard }, { to: "/app/cliente/meu-projeto", label: "Meu projeto", icon: FolderOpen }] },
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

type CatKey =
  | "briefing" | "contratos" | "plantas" | "croquis" | "vistas"
  | "render3d" | "fiscais" | "outros";

const CATEGORIAS: { key: CatKey; label: string; icon: typeof FileText; match: (d: Documento) => boolean }[] = [
  { key: "briefing", label: "Briefing", icon: ClipboardList, match: (d) => /briefing|levantamento|programa/i.test(d.name) },
  { key: "contratos", label: "Contratos", icon: FileSignature, match: (d) => /contrato|art|rrt|proposta/i.test(d.name) },
  { key: "plantas", label: "Plantas", icon: Layers, match: (d) => /planta|baixa|layout|humanizada|\.dwg$|\.dxf$|\.rvt$|\.pln$/i.test(d.name) },
  { key: "croquis", label: "Croquis", icon: PencilRuler, match: (d) => /croqui|esboço|esboco|estudo|\.skp$/i.test(d.name) },
  { key: "vistas", label: "Vistas e cortes", icon: Eye, match: (d) => /vista|corte|elevação|elevacao|fachada/i.test(d.name) },
  { key: "render3d", label: "Imagens 3D / Render", icon: Box, match: (d) => /3d|render|perspectiva|maquete/i.test(d.name) },
  { key: "fiscais", label: "Notas fiscais", icon: Receipt, match: (d) => /nf|nota.?fiscal|cupom|recibo|invoice/i.test(d.name) },
  { key: "outros", label: "Outros", icon: Files, match: () => true },
];

// Documentos técnicos apenas: ocultar imagens de obra/registro fotográfico (vão para a Galeria).
const PHOTO_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|heic|heif|tiff?)$/i;
function isPhotoDoc(d: Documento): boolean {
  if (d.mime_type && /^image\//i.test(d.mime_type) && !/svg/i.test(d.mime_type)) return true;
  return PHOTO_EXT_RE.test(d.name);
}

function classify(d: Documento): CatKey {
  for (const c of CATEGORIAS) {
    if (c.key === "outros") continue;
    if (c.match(d)) return c.key;
  }
  return "outros";
}

const SEEN_KEY = "arqhub.cliente.docs.seen";

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch { return new Set(); }
}
function saveSeen(s: Set<string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(s))); } catch {}
}

function DocumentosCliente() {
  const d = useClienteCronograma();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CatKey | "all">("all");
  const [seen, setSeen] = useState<Set<string>>(() => (typeof window !== "undefined" ? loadSeen() : new Set()));
  const [viewer, setViewer] = useState<Documento | null>(null);
  const initialized = useRef(false);
  const [emailNotify, setEmailNotify] = useState<boolean | null>(null);
  const [savingPref, setSavingPref] = useState(false);

  const [pushState, setPushState] = useState<"unsupported" | "unsubscribed" | "subscribed" | "denied" | "loading">("loading");
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await externalSupabase.auth.getSession();
        const t = sess.session?.access_token;
        if (!t) return;
        const r = await getMyNotificationPrefs({ data: { externalAccessToken: t } });
        setEmailNotify(r.new_document);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      // Clear app badge when user opens the documents page
      clearBadge();
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setPushState("denied");
        return;
      }
      const sub = await getPushSubscription();
      setPushState(sub ? "subscribed" : "unsubscribed");
    })();
  }, []);

  async function togglePref() {
    if (emailNotify === null || savingPref) return;
    setSavingPref(true);
    const next = !emailNotify;
    setEmailNotify(next);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const t = sess.session?.access_token;
      if (t) await setMyNotificationPrefs({ data: { externalAccessToken: t, new_document: next } });
    } catch {
      setEmailNotify(!next);
    } finally {
      setSavingPref(false);
    }
  }

  async function togglePush() {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const t = sess.session?.access_token;
      if (!t) return;

      if (pushState === "subscribed") {
        const sub = await getPushSubscription();
        if (sub) {
          await unsubscribePush({ data: { externalAccessToken: t, endpoint: sub.endpoint } });
          await sub.unsubscribe();
        }
        setPushState("unsubscribed");
        return;
      }

      // Subscribe flow
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPushState(perm === "denied" ? "denied" : "unsubscribed");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const endpoint = sub.endpoint;
      const p256dh = json.keys?.p256dh ?? "";
      const auth = json.keys?.auth ?? "";
      const res = await subscribePush({
        data: {
          externalAccessToken: t,
          endpoint,
          p256dh,
          auth,
          userAgent: navigator.userAgent.slice(0, 256),
        },
      });
      if (res.ok) setPushState("subscribed");
      else {
        await sub.unsubscribe();
        setPushState("unsubscribed");
      }
    } catch (e) {
      console.warn("[push] toggle failed", e);
    } finally {
      setPushBusy(false);
    }
  }

  // Detect novos documentos: qualquer doc cujo id ainda não está em "seen".
  const novos = useMemo(
    () => (d.documentos ?? []).filter((doc) => !isPhotoDoc(doc) && !seen.has(doc.id)),
    [d.documentos, seen],
  );

  // Na primeira carga, marca tudo o que já existe como visto (sem alarme falso).
  useEffect(() => {
    if (d.loading || initialized.current || !d.documentos) return;
    initialized.current = true;
    const stored = loadSeen();
    if (stored.size === 0 && d.documentos.length > 0) {
      const next = new Set(d.documentos.map((x) => x.id));
      saveSeen(next);
      setSeen(next);
    } else {
      setSeen(stored);
    }
  }, [d.loading, d.documentos]);

  function marcarTodosComoVistos() {
    const next = new Set((d.documentos ?? []).map((x) => x.id));
    saveSeen(next);
    setSeen(next);
  }
  function marcarComoVisto(id: string) {
    const next = new Set(seen);
    next.add(id);
    saveSeen(next);
    setSeen(next);
  }

  const docsTecnicos = useMemo(
    () => (d.documentos ?? []).filter((doc) => !isPhotoDoc(doc)),
    [d.documentos],
  );

  const grupos = useMemo(() => {
    const g: Record<CatKey, Documento[]> = {
      briefing: [], contratos: [], plantas: [], croquis: [], vistas: [],
      render3d: [], fiscais: [], outros: [],
    };
    const q = query.trim().toLowerCase();
    for (const doc of docsTecnicos) {
      if (q && !doc.name.toLowerCase().includes(q)) continue;
      const k = classify(doc);
      g[k].push(doc);
    }
    return g;
  }, [docsTecnicos, query]);

  const total = docsTecnicos.filter((doc) =>
    query.trim() ? doc.name.toLowerCase().includes(query.trim().toLowerCase()) : true,
  ).length;

  const visiveis = cat === "all" ? CATEGORIAS : CATEGORIAS.filter((c) => c.key === cat);

  if (d.loading) {
    return (
      <AppShell role="cliente" nav={nav} title="Documentos">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-border bg-secondary/30 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!d.projeto) {
    return (
      <AppShell role="cliente" nav={nav} title="Documentos">
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-[13px] text-muted-foreground">{d.error ?? "Sem projeto ativo."}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="cliente" nav={nav} title="Documentos">
      <Link
        to="/app/cliente"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-ink mb-3"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao painel
      </Link>

      <header className="mb-5">
        <h1 className="text-[20px] font-semibold text-ink tracking-tight">Documentos do projeto</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">
          {total} {total === 1 ? "arquivo" : "arquivos"} · briefing, contratos, plantas, croquis, vistas, 3D, fotos e notas fiscais.
        </p>
      </header>

      {novos.length > 0 && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4 flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink">
              {novos.length} {novos.length === 1 ? "novo documento" : "novos documentos"} do escritório
            </div>
            <div className="text-[11.5px] text-muted-foreground truncate">
              {novos.slice(0, 3).map((x) => x.name).join(" · ")}
              {novos.length > 3 ? ` · +${novos.length - 3}` : ""}
            </div>
          </div>
          <button
            onClick={marcarTodosComoVistos}
            className="text-[12px] font-medium text-primary hover:underline"
          >
            Marcar como lidos
          </button>
        </div>
      )}








      <div className="mb-4 rounded-xl border border-border bg-white p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5 sm:items-center">
        <label className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome do arquivo"
            className="w-full h-9 text-[12.5px] rounded-md border border-border bg-white pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </label>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value as CatKey | "all")}
          className="h-9 text-[12.5px] rounded-md border border-border bg-white px-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary sm:w-56"
        >
          <option value="all">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <FolderOpen className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">
            {query ? "Nenhum arquivo corresponde à busca." : "Nenhum arquivo disponível ainda."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visiveis.map((c) => {
            const items = grupos[c.key];
            if (items.length === 0 && cat === "all") return null;
            const Icon = c.icon;
            return (
              <section key={c.key} className="rounded-xl border border-border bg-white">
                <header className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <Icon className="h-4 w-4 text-ink/70" strokeWidth={2} />
                  <h2 className="text-[13px] font-semibold text-ink">{c.label}</h2>
                  <span className="ml-auto text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {items.length}
                  </span>
                </header>
                {items.length === 0 ? (
                  <div className="px-4 py-5 text-[12px] text-muted-foreground/80">Nenhum arquivo nesta categoria.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {items.map((doc) => (
                      <DocItem
                        key={doc.id}
                        doc={doc}
                        isNew={!seen.has(doc.id)}
                        onOpen={() => { marcarComoVisto(doc.id); setViewer(doc); }}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {viewer && <DocViewer doc={viewer} onClose={() => setViewer(null)} />}
    </AppShell>
  );
}

function DocItem({ doc, isNew, onOpen }: { doc: Documento; isNew: boolean; onOpen: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function download() {
    if (loading) return;
    setLoading(true); setErr(null);
    try {
      const url = await getDocSignedUrl(doc.storage_path);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e: any) {
      setErr(e?.message ?? "Erro");
    } finally { setLoading(false); }
  }

  return (
    <li className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-medium text-ink truncate">{doc.name}</div>
          {isNew && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground shrink-0">
              Novo
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {formatSize(doc.size_bytes)} · {formatDate(doc.created_at)}
        </div>
        {err && <div className="text-[11px] text-red-600 mt-0.5">{err}</div>}
      </div>
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-ink"
      >
        <Eye className="h-3.5 w-3.5" strokeWidth={2} />
        Abrir
      </button>
      <button
        onClick={download}
        disabled={loading}
        className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" strokeWidth={2} />
        {loading ? "..." : "Baixar"}
      </button>
    </li>
  );
}

function isImageDoc(doc: Documento) {
  if (doc.mime_type && /^image\//i.test(doc.mime_type)) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(doc.name);
}
function isPdfDoc(doc: Documento) {
  if (doc.mime_type === "application/pdf") return true;
  return /\.pdf$/i.test(doc.name);
}

function DocViewer({ doc, onClose }: { doc: Documento; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getDocSignedUrl(doc.storage_path);
        if (alive) setUrl(u);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Erro ao carregar arquivo");
      }
    })();
    return () => { alive = false; };
  }, [doc.storage_path]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const img = isImageDoc(doc);
  const pdf = isPdfDoc(doc);

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[90vh] bg-white rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 border-b border-border flex items-center gap-3">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink truncate">{doc.name}</div>
            <div className="text-[11px] text-muted-foreground">
              {formatSize(doc.size_bytes)} · {formatDate(doc.created_at)}
            </div>
          </div>
          {url && (
            <a
              href={url}
              download={doc.name}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} /> Baixar
            </a>
          )}
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-secondary text-muted-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 min-h-0 bg-secondary/40">
          {err ? (
            <div className="h-full flex items-center justify-center p-6 text-[13px] text-red-600">{err}</div>
          ) : !url ? (
            <div className="h-full flex items-center justify-center text-[12.5px] text-muted-foreground">Carregando…</div>
          ) : img ? (
            <div className="h-full overflow-auto flex items-center justify-center p-4">
              <img src={url} alt={doc.name} className="max-w-full max-h-full object-contain" />
            </div>
          ) : pdf ? (
            <iframe src={url} title={doc.name} className="w-full h-full border-0" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-[13px] text-muted-foreground">
                Pré-visualização não disponível para este formato.
              </p>
              <a
                href={url}
                download={doc.name}
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5" /> Baixar arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
