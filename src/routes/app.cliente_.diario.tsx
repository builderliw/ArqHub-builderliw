import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ShoppingBag, BellRing, CalendarClock, Images, ClipboardList,
  Calendar as CalendarIcon, Sun, Camera, CheckCircle2, Clock, Plus, X, Loader2,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { useClienteCronograma } from "@/hooks/use-cliente-cronograma";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listClienteDiaryEntries } from "@/lib/cliente-data.functions";

export const Route = createFileRoute("/app/cliente_/diario")({
  head: () => ({ meta: [{ title: "Diário de Obra — ArqHub" }] }),
  component: DiarioCliente,
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

type Atividade = { id: string; descricao: string; status: "pendente" | "andamento" | "concluida" };
type Entry = {
  id: string;
  date: string;
  weather: string;
  photos: string[];
  atividades: Atividade[];
  observacao: string;
};

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function DiarioCliente() {
  const { projeto, loading } = useClienteCronograma();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const listEntries = useServerFn(listClienteDiaryEntries);

  const loadEntries = useCallback(async () => {
    if (!projeto?.id) { setEntries([]); return; }
    setLoadingEntries(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      const r = await listEntries({ data: { accessToken: token, projectId: projeto.id } });
      setEntries((r.entries ?? []) as Entry[]);
    } catch { setEntries([]); }
    setLoadingEntries(false);
  }, [projeto?.id, listEntries]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const sorted = useMemo(() => entries.slice().sort((a, b) => b.date.localeCompare(a.date)), [entries]);

  return (
    <AppShell role="cliente" nav={nav} title="Diário de Obra">
      <div className="max-w-md mx-auto p-4 md:p-6 space-y-4">
        <header>
          <h1 className="text-[22px] font-semibold text-ink">Diário de Obra</h1>
          <p className="text-[13px] text-muted-foreground">
            Registros diários do seu projeto{projeto?.name ? ` · ${projeto.name}` : ""}
          </p>
        </header>

        {loading || loadingEntries ? (
          <div className="text-[12.5px] text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center text-[12.5px] text-muted-foreground">
            <ClipboardList className="h-6 w-6 mx-auto mb-2 opacity-50" />
            Nenhum registro de diário ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((e) => <DiarioCard key={e.id} entry={e} onPhoto={setPreview} />)}
          </div>
        )}

        <div className="pt-2">
          <Link to="/app/cliente" className="text-[12.5px] text-primary hover:underline">← Voltar ao painel</Link>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
          <img src={preview} alt="" className="max-h-[90vh] max-w-[92vw] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </AppShell>
  );
}

function formatWeather(raw: string) {
  const v = (raw ?? "").trim();
  if (!v) return "—";
  // Se for só número, formata como temperatura
  if (/^-?\d{1,3}(?:[.,]\d+)?$/.test(v)) return `${v.replace(",", ".")}°C`;
  // Se contiver número sem unidade, adiciona °C ao número
  const m = v.match(/^(-?\d{1,3}(?:[.,]\d+)?)(?:\s*(?:graus|c|ºc|°c|°)?\s*)$/i);
  if (m) return `${m[1].replace(",", ".")}°C`;
  return v;
}

function DiarioCard({ entry, onPhoto }: { entry: Entry; onPhoto: (src: string) => void }) {
  const dt = parseDate(entry.date);
  const dia = String(dt.getDate()).padStart(2, "0");
  const mes = MONTHS[dt.getMonth()];
  const ano = dt.getFullYear();
  const semana = WEEKDAYS[dt.getDay()];
  const previewPhotos = entry.photos.slice(0, 3);
  const weather = formatWeather(entry.weather);

  return (
    <div className="bg-white border border-border/70 rounded-2xl overflow-hidden shadow-[0_2px_12px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.18)] transition-shadow">
      {/* Header com gradiente sutil */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-emerald-50 via-white to-white border-b border-border/60">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
          <CalendarIcon className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-ink leading-tight">Diário de Obra</div>
          <div className="text-[11.5px] text-muted-foreground">{semana}</div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Data + clima */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/70 bg-secondary/20 p-3">
            <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1.5">
              <CalendarIcon className="h-3 w-3" /> Data
            </div>
            <div className="text-[15px] font-semibold text-ink leading-tight">{dia} {mes} {ano}</div>
            <div className="text-[11.5px] text-muted-foreground mt-0.5">{semana}</div>
          </div>
          <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50/40 p-3">
            <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-amber-700/80 mb-1.5">
              <Sun className="h-3 w-3" /> Temperatura
            </div>
            <div className="text-[18px] font-bold text-ink leading-none tabular-nums">{weather}</div>
            <div className="text-[11.5px] text-muted-foreground mt-1">Previsão do dia</div>
          </div>
        </div>

        {/* Fotos do dia */}
        <div className="rounded-xl border border-border/70 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
              <Camera className="h-3.5 w-3.5" /> Fotos do dia
            </div>
            <span className="text-[11px] text-muted-foreground">{entry.photos.length} foto{entry.photos.length === 1 ? "" : "s"}</span>
          </div>
          {entry.photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {previewPhotos.map((src, i) => (
                <button key={i} onClick={() => onPhoto(src)} className="block aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : <p className="text-[12px] text-muted-foreground">Nenhuma foto registrada neste dia.</p>}
        </div>

        {/* Atividades */}
        <div className="rounded-xl border border-border/70 p-3">
          <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink mb-2">
            <ClipboardList className="h-3.5 w-3.5" /> Atividades do dia
          </div>
          {entry.atividades.length > 0 ? (
            <ul className="space-y-2">
              {entry.atividades.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {a.status === "concluida" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-[13px] text-ink truncate">{a.descricao}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {a.status === "concluida" ? "Concluída" : a.status === "andamento" ? "Em andamento" : "Pendente"}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="text-[12px] text-muted-foreground">Nenhuma atividade registrada neste dia.</p>}
        </div>

        {/* Observação */}
        {entry.observacao && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 flex items-start gap-2">
            <Plus className="h-4 w-4 text-amber-600 mt-0.5 rotate-45 shrink-0" />
            <div>
              <div className="text-[12.5px] font-semibold text-ink">Observação do dia</div>
              <p className="text-[12px] text-muted-foreground whitespace-pre-wrap">{entry.observacao}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
