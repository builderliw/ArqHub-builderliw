import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ShoppingBag, BellRing, CalendarClock, Images, ClipboardList,
  Layers, PencilRuler, Box, Sparkles, FileText as FileIcon,
  ZoomIn, ZoomOut, RotateCw, Loader2, Lock, Image as ImageIcon,
  ChevronLeft, ChevronRight, History,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import {
  useClienteCronograma,
  getDocSignedUrl,
  type Documento,
} from "@/hooks/use-cliente-cronograma";
import { baseFileName } from "@/components/project-presentation-manager";

export const Route = createFileRoute("/app/cliente_/meu-projeto")({
  head: () => ({ meta: [{ title: "Meu projeto — ArqHub" }] }),
  component: MeuProjetoCliente,
});

const nav: NavGroup[] = [
  { label: "Interface", items: [
    { to: "/app/cliente", label: "Início", icon: LayoutDashboard },
    { to: "/app/cliente/meu-projeto", label: "Meu projeto", icon: FolderOpen },
  ] },
  {
    label: "Acompanhamento",
    items: [
      { to: "/app/cliente/agenda", label: "Agenda", icon: CalendarClock },
      { to: "/app/cliente/aprovacoes", label: "Aprovações", icon: ClipboardCheck },
      { to: "/app/cliente/cronograma", label: "Cronograma", icon: Calendar },
      { to: "/app/cliente/documentos", label: "Documentos", icon: FolderOpen },
      { to: "/app/cliente/galeria", label: "Galeria", icon: Images },
      { to: "/app/cliente/diario", label: "Diário de obra", icon: ClipboardList },
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

const PRESENTATION_CATEGORIES = [
  { key: "apres_levantamento", label: "Levantamento e Análise", icon: ClipboardList },
  { key: "apres_briefing", label: "Programa de Necessidades", icon: Sparkles },
  { key: "apres_preliminar", label: "Estudo Preliminar", icon: PencilRuler },
  { key: "apres_anteprojeto", label: "Anteprojeto", icon: Layers },
  { key: "apres_legal", label: "Projeto Legal", icon: FileIcon },
  { key: "apres_executivo", label: "Projeto Executivo", icon: FileIcon },
  { key: "apres_render3d", label: "Renderizações 3D", icon: Images },
  { key: "apres_modelo3d", label: "Visualizador 3D", icon: Box },
] as const;

function isImage(mime?: string | null, name?: string) {
  if (mime?.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name ?? "");
}
function isPdf(mime?: string | null, name?: string) {
  if (mime === "application/pdf") return true;
  return /\.pdf$/i.test(name ?? "");
}
function is3DModel(name?: string) {
  return /\.(glb|gltf)$/i.test(name ?? "");
}

type VersionGroup = { base: string; versions: Documento[] };

function MeuProjetoCliente() {
  const { projeto, documentos, loading } = useClienteCronograma();
  const [catKey, setCatKey] = useState<string>(PRESENTATION_CATEGORIES[0].key);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [versionIdx, setVersionIdx] = useState(0); // 0 = mais antiga (v1); N-1 = mais recente
  const [url, setUrl] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [signing, setSigning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);

  const presentationDocs = useMemo(
    () => (documentos ?? []).filter((d) => d.doc_kind?.startsWith("apres_")),
    [documentos],
  );

  // Agrupa por base name dentro da categoria selecionada
  const versionGroups = useMemo<VersionGroup[]>(() => {
    const list = presentationDocs.filter((d) => d.doc_kind === catKey);
    const map = new Map<string, Documento[]>();
    for (const d of list) {
      const b = baseFileName(d.name);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(d);
    }
    const groups = Array.from(map.entries()).map(([base, versions]) => ({
      base,
      versions: [...versions].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    }));
    groups.sort((a, b) => b.versions[b.versions.length - 1].created_at.localeCompare(a.versions[a.versions.length - 1].created_at));
    return groups;
  }, [presentationDocs, catKey]);

  const countsPerCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of PRESENTATION_CATEGORIES) {
      m[c.key] = presentationDocs.filter((d) => d.doc_kind === c.key).length;
    }
    return m;
  }, [presentationDocs]);

  // Seleciona automaticamente o grupo mais recente ao mudar categoria / lista mudar
  useEffect(() => {
    if (versionGroups.length === 0) { setSelectedBase(null); return; }
    if (!selectedBase || !versionGroups.find((g) => g.base === selectedBase)) {
      const first = versionGroups[0];
      setSelectedBase(first.base);
      setVersionIdx(first.versions.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey, versionGroups.length]);

  const currentGroup = versionGroups.find((g) => g.base === selectedBase) ?? null;
  const selected = currentGroup ? currentGroup.versions[Math.min(versionIdx, currentGroup.versions.length - 1)] : null;

  // Ao trocar de grupo, aponta para a versão mais recente
  useEffect(() => {
    if (currentGroup) setVersionIdx(currentGroup.versions.length - 1);
  }, [selectedBase]);

  // URL do arquivo selecionado
  useEffect(() => {
    let alive = true;
    (async () => {
      setUrl(null);
      if (!selected) return;
      setSigning(true);
      try {
        const u = await getDocSignedUrl(selected.storage_path);
        if (alive) { setUrl(u); setZoom(1); setRot(0); }
      } finally {
        if (alive) setSigning(false);
      }
    })();
    return () => { alive = false; };
  }, [selected?.id]);

  // Thumbnails para os grupos (usa a versão mais recente)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = versionGroups
        .map((g) => g.versions[g.versions.length - 1])
        .filter((d) => isImage(d.mime_type, d.name) && !thumbs[d.id]);
      for (const d of missing) {
        try {
          const u = await getDocSignedUrl(d.storage_path);
          if (!cancelled) setThumbs((t) => ({ ...t, [d.id]: u }));
        } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
  }, [versionGroups]);

  const versionsCount = currentGroup?.versions.length ?? 0;
  const canPrev = versionIdx > 0;
  const canNext = versionIdx < versionsCount - 1;

  return (
    <AppShell role="cliente" nav={nav} title="Meu projeto">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <header className="mb-4">
          <h1 className="text-[22px] font-semibold text-ink">Meu projeto</h1>
          <p className="text-[13px] text-muted-foreground">
            Visualize as apresentações enviadas pelo escritório
            {projeto?.name ? ` · ${projeto.name}` : ""}. Somente visualização.
          </p>
        </header>

        {loading ? (
          <div className="text-[12.5px] text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
            {/* Sidebar: categorias + miniaturas */}
            <aside className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="p-2 space-y-0.5 border-b border-border">
                {PRESENTATION_CATEGORIES.map((c) => {
                  const Ico = c.icon;
                  const count = countsPerCategory[c.key] ?? 0;
                  const active = c.key === catKey;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCatKey(c.key)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] text-left ${
                        active ? "bg-ink text-white" : "hover:bg-secondary text-ink"
                      }`}
                    >
                      <Ico className="h-3.5 w-3.5" />
                      <span className="flex-1">{c.label}</span>
                      <span className={`text-[11px] tabular-nums ${active ? "text-white/70" : "text-muted-foreground"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              {versionGroups.length === 0 ? (
                <div className="p-4 text-[12px] text-muted-foreground text-center">
                  Nenhum arquivo nesta categoria ainda.
                </div>
              ) : (
                <ul className="max-h-[520px] overflow-auto p-2 space-y-1">
                  {versionGroups.map((g) => {
                    const latest = g.versions[g.versions.length - 1];
                    const active = g.base === selectedBase;
                    return (
                      <li key={g.base}>
                        <button
                          onClick={() => setSelectedBase(g.base)}
                          className={`w-full flex items-center gap-2 p-1.5 rounded-md text-left border ${
                            active ? "border-primary bg-primary/5" : "border-transparent hover:bg-secondary"
                          }`}
                        >
                          <div className="h-12 w-12 rounded bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                            {thumbs[latest.id] ? (
                              <img src={thumbs[latest.id]} alt="" className="h-full w-full object-cover" draggable={false} />
                            ) : isImage(latest.mime_type, latest.name) ? (
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <FileIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] font-medium text-ink truncate">{latest.name}</div>
                            <div className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                              <span>{new Date(latest.created_at).toLocaleDateString("pt-BR")}</span>
                              {g.versions.length > 1 && (
                                <span className="inline-flex items-center gap-0.5 px-1 rounded bg-primary/10 text-primary font-semibold">
                                  <History className="h-2.5 w-2.5" /> v{g.versions.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            {/* Visualizador */}
            <section className="rounded-xl border border-border bg-white min-h-[560px] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-secondary/40 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">
                    {selected?.name ?? "Nenhum arquivo selecionado"}
                  </div>
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Somente visualização · Download desabilitado
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {versionsCount > 1 && (
                    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-1 h-8">
                      <button
                        onClick={() => setVersionIdx((i) => Math.max(0, i - 1))}
                        disabled={!canPrev}
                        className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-secondary disabled:opacity-30"
                        title="Versão anterior"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11.5px] tabular-nums px-1.5 inline-flex items-center gap-1">
                        <History className="h-3 w-3 text-primary" />
                        v{versionIdx + 1} <span className="text-muted-foreground">/ {versionsCount}</span>
                      </span>
                      <button
                        onClick={() => setVersionIdx((i) => Math.min(versionsCount - 1, i + 1))}
                        disabled={!canNext}
                        className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-secondary disabled:opacity-30"
                        title="Próxima versão"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {selected && isImage(selected.mime_type, selected.name) && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="h-8 w-8 inline-flex items-center justify-center rounded border border-border hover:bg-white" title="Menos zoom"><ZoomOut className="h-3.5 w-3.5" /></button>
                      <span className="text-[11px] tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
                      <button onClick={() => setZoom((z) => Math.min(5, z + 0.25))} className="h-8 w-8 inline-flex items-center justify-center rounded border border-border hover:bg-white" title="Mais zoom"><ZoomIn className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setRot((r) => (r + 90) % 360)} className="h-8 w-8 inline-flex items-center justify-center rounded border border-border hover:bg-white" title="Girar"><RotateCw className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="flex-1 relative bg-neutral-100 overflow-auto select-none"
                onContextMenu={(e) => e.preventDefault()}
              >
                {!selected ? (
                  <div className="absolute inset-0 flex items-center justify-center text-[12.5px] text-muted-foreground">
                    Selecione um arquivo à esquerda.
                  </div>
                ) : signing || !url ? (
                  <div className="absolute inset-0 flex items-center justify-center text-[12.5px] text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Preparando visualização…
                  </div>
                ) : isImage(selected.mime_type, selected.name) ? (
                  <div className="min-h-full flex items-center justify-center p-4">
                    <img
                      src={url}
                      alt={selected.name}
                      draggable={false}
                      style={{
                        transform: `scale(${zoom}) rotate(${rot}deg)`,
                        transition: "transform .15s ease",
                        maxWidth: "100%",
                        maxHeight: "80vh",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                ) : isPdf(selected.mime_type, selected.name) ? (
                  <iframe
                    key={url}
                    src={`${url}#toolbar=0&navpanes=0&view=FitH`}
                    title={selected.name}
                    className="w-full h-[75vh] border-0"
                  />
                ) : is3DModel(selected.name) ? (
                  <ModelViewer3D src={url} name={selected.name} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[12.5px] text-muted-foreground gap-2 p-6 text-center">
                    <FileIcon className="h-6 w-6 opacity-50" />
                    Este tipo de arquivo não pode ser visualizado no navegador.
                    <div className="text-[11px]">Peça ao escritório para enviar em PDF, imagem ou modelo GLB.</div>
                  </div>
                )}

                {/* Marca d'água */}
                {selected && url && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="text-[10vw] font-bold text-black/[0.04] rotate-[-20deg] whitespace-nowrap">
                      ArqHub · {projeto?.name ?? ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Linha do tempo das versões */}
              {currentGroup && versionsCount > 1 && (
                <div className="border-t border-border bg-white px-3 py-2">
                  <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1.5 inline-flex items-center gap-1">
                    <History className="h-3 w-3" /> Histórico de versões
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {currentGroup.versions.map((v, i) => {
                      const active = i === versionIdx;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setVersionIdx(i)}
                          className={`shrink-0 px-2.5 py-1 rounded text-[11.5px] border tabular-nums ${
                            active ? "bg-primary text-white border-primary" : "bg-white text-ink border-border hover:bg-secondary"
                          }`}
                          title={new Date(v.created_at).toLocaleString("pt-BR")}
                        >
                          v{i + 1} · {new Date(v.created_at).toLocaleDateString("pt-BR")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ModelViewer3D({ src, name }: { src: string; name: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as unknown as { customElements?: CustomElementRegistry };
    if (w.customElements?.get("model-viewer")) { setReady(true); return; }
    const existing = document.querySelector<HTMLScriptElement>('script[data-model-viewer]');
    if (existing) {
      existing.addEventListener("load", () => setReady(true), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
    s.dataset.modelViewer = "1";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  if (!ready) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-[12.5px] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando visualizador 3D…
      </div>
    );
  }
  return (
    <div className="w-full h-[75vh]">
      {/* @ts-expect-error - custom element */}
      <model-viewer
        src={src}
        alt={name}
        camera-controls
        auto-rotate
        shadow-intensity="1"
        exposure="1"
        style={{ width: "100%", height: "100%", background: "#f5f5f4" }}
      />
    </div>
  );
}
