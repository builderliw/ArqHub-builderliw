// ArqHub Academy — planos de estudo, progresso, agenda e biblioteca de dicas.
// Recriada a partir da versão Lovable. Os dados ficam salvos no navegador
// (localStorage), então funciona sem login e sem tabelas no Supabase.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  GraduationCap, Upload, Pencil, CheckCircle2, Circle, CalendarDays,
  BookOpen, CalendarPlus, Link2, Trash2, Layers, BarChart3, Library,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "ArqHub Academy — Planos de estudo para arquitetura" },
      {
        name: "description",
        content: "Monte seu plano de estudo para concursos, vestibular, provas específicas, interiores ou urbanismo e receba um cronograma semanal.",
      },
    ],
  }),
  component: AcademyPage,
});

/* ============================== Dados ============================== */

type Tipo = "concurso" | "vestibular" | "prova-especifica" | "interiores" | "urbanismo";

const TIPOS: { id: Tipo; label: string; desc: string }[] = [
  { id: "concurso", label: "Concurso público", desc: "Arquiteto e engenheiro em órgãos públicos" },
  { id: "vestibular", label: "Vestibular", desc: "Entrada em Arquitetura e Urbanismo" },
  { id: "prova-especifica", label: "Prova específica", desc: "Habilidade específica e desenho" },
  { id: "interiores", label: "Interiores", desc: "Especialização em design de interiores" },
  { id: "urbanismo", label: "Urbanismo", desc: "Planejamento urbano e legislação" },
];

const TOPICOS: Record<Tipo, string[]> = {
  concurso: [
    "Legislação urbanística e Estatuto da Cidade", "Licitações e contratos (Lei 14.133)",
    "NBR 9050 — acessibilidade", "NBR 15575 — desempenho", "Conforto ambiental",
    "Tecnologia da construção", "Orçamento, SINAPI e composições", "Projeto de arquitetura",
    "Patrimônio histórico e restauro", "Gestão e fiscalização de obras", "Revisão geral + simulado",
  ],
  vestibular: [
    "Geometria plana e espacial", "Desenho geométrico", "Perspectiva", "História da arte",
    "Física — estática e resistência", "Matemática — funções e trigonometria", "Redação",
    "Teste de habilidade específica", "Simulado completo",
  ],
  "prova-especifica": [
    "Desenho de observação", "Perspectiva com 1 e 2 pontos de fuga", "Composição e proporção",
    "Luz e sombra", "Repertório arquitetônico", "Criatividade e croqui rápido", "Simulado cronometrado",
  ],
  interiores: [
    "Ergonomia e antropometria", "Layout e fluxos", "Iluminação de interiores", "Materiais e acabamentos",
    "Marcenaria e detalhamento", "Teoria das cores", "Orçamento de interiores", "Apresentação e portfólio",
  ],
  urbanismo: [
    "Estatuto da Cidade", "Plano Diretor e zoneamento", "Parcelamento do solo (Lei 6.766)",
    "Mobilidade urbana", "Habitação de interesse social", "Infraestrutura e saneamento",
    "Desenho urbano e espaço público", "Simulado e revisão",
  ],
};

const DICAS: { titulo: string; texto: string }[] = [
  { titulo: "Estude em blocos de 50 minutos", texto: "Faça 10 minutos de pausa entre blocos. Três blocos bem feitos rendem mais do que uma tarde inteira dispersa." },
  { titulo: "Revise em 24h, 7 dias e 30 dias", texto: "A revisão espaçada fixa o conteúdo. Marque na agenda as revisões de cada tópico concluído." },
  { titulo: "Questões antes da teoria", texto: "Resolver questões de provas anteriores mostra o que a banca cobra e onde está sua dificuldade." },
  { titulo: "Normas técnicas: leia o sumário primeiro", texto: "Entenda a estrutura da NBR antes de decorar números. Tabelas e definições caem com frequência." },
  { titulo: "Desenhe todos os dias", texto: "Para provas de habilidade, 20 minutos diários de croqui valem mais do que um treino longo por semana." },
  { titulo: "Simulado com cronômetro", texto: "Reproduza as condições da prova: mesmo horário, mesmo tempo e sem consultas." },
];

type Item = { id: string; titulo: string; data: string; feito: boolean };
type Plano = {
  id: string;
  tipo: Tipo;
  objetivo: string;
  horasSemana: number;
  semanas: number;
  criadoEm: string;
  itens: Item[];
};
type Estado = { nome: string; foto: string | null; planos: Plano[] };

const STORAGE_KEY = "arqhub-academy-v1";
const VAZIO: Estado = { nome: "", foto: null, planos: [] };

function carregar(): Estado {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...VAZIO, ...JSON.parse(raw) } : VAZIO;
  } catch {
    return VAZIO;
  }
}

function salvar(e: Estado) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(e));
  } catch {
    toast.error("Não foi possível salvar no navegador.");
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);
const hojeISO = () => new Date().toISOString().slice(0, 10);

function proximoDiaUtil(d: Date) {
  const n = new Date(d);
  n.setHours(12, 0, 0, 0);
  while (n.getDay() === 0 || n.getDay() === 6) n.setDate(n.getDate() + 1);
  return n;
}

function somarDiasUteis(base: Date, n: number) {
  const d = proximoDiaUtil(base);
  let k = n;
  while (k > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) k--;
  }
  return d;
}

/** Distribui os tópicos nas semanas escolhidas, espalhando as sessões pelos dias úteis. */
function gerarPlano(tipo: Tipo, objetivo: string, horasSemana: number, semanas: number): Plano {
  const porSemana = Math.max(2, Math.min(10, Math.round(horasSemana / 2))); // ~2h por sessão
  const topicos = TOPICOS[tipo];
  const inicio = proximoDiaUtil(new Date());
  const itens: Item[] = [];
  let i = 0;
  for (let w = 0; w < semanas; w++) {
    for (let s = 0; s < porSemana; s++, i++) {
      const t = topicos[i % topicos.length];
      const rodada = Math.floor(i / topicos.length);
      const titulo = rodada === 0 ? t : `${t} — ${rodada === 1 ? "exercícios" : "revisão"}`;
      const dia = somarDiasUteis(inicio, w * 5 + Math.floor((s * 5) / porSemana));
      itens.push({ id: uid(), titulo, data: dia.toISOString().slice(0, 10), feito: false });
    }
  }
  return { id: uid(), tipo, objetivo, horasSemana, semanas, criadoEm: new Date().toISOString(), itens };
}

function formatarData(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

function gerarICS(planos: Plano[]) {
  const linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ArqHub//Academy//PT-BR"];
  for (const p of planos) {
    for (const it of p.itens) {
      const d = it.data.replace(/-/g, "");
      const fim = new Date(it.data + "T12:00:00");
      fim.setDate(fim.getDate() + 1);
      linhas.push(
        "BEGIN:VEVENT",
        `UID:${it.id}@arqhub-academy`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
        `DTSTART;VALUE=DATE:${d}`,
        `DTEND;VALUE=DATE:${fim.toISOString().slice(0, 10).replace(/-/g, "")}`,
        `SUMMARY:${it.titulo.replace(/[,;]/g, " ")}`,
        "END:VEVENT",
      );
    }
  }
  linhas.push("END:VCALENDAR");
  return linhas.join("\r\n");
}

/* ============================== Página ============================== */

type Aba = "planos" | "progresso" | "agenda" | "biblioteca";

function AcademyPage() {
  const [estado, setEstado] = useState<Estado>(VAZIO);
  const [pronto, setPronto] = useState(false);
  const [aba, setAba] = useState<Aba>("planos");
  const [wizard, setWizard] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEstado(carregar());
    setPronto(true);
    const h = window.location.hash.replace("#", "") as Aba;
    if (["planos", "progresso", "agenda", "biblioteca"].includes(h)) setAba(h);
  }, []);

  const atualizar = (fn: (e: Estado) => Estado) =>
    setEstado((e) => {
      const n = fn(e);
      salvar(n);
      return n;
    });

  const todosItens = useMemo(() => estado.planos.flatMap((p) => p.itens), [estado.planos]);
  const concluidos = todosItens.filter((i) => i.feito).length;
  const focoHoje = useMemo(
    () => todosItens.filter((i) => !i.feito && i.data <= hojeISO()).slice(0, 4),
    [todosItens],
  );

  const alternarItem = (planoId: string, itemId: string) =>
    atualizar((e) => ({
      ...e,
      planos: e.planos.map((p) =>
        p.id !== planoId ? p : { ...p, itens: p.itens.map((i) => (i.id === itemId ? { ...i, feito: !i.feito } : i)) },
      ),
    }));

  const planoDoItem = (itemId: string) => estado.planos.find((p) => p.itens.some((i) => i.id === itemId));

  const onFoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const s = 240;
        c.width = s;
        c.height = s;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, s, s);
        atualizar((e) => ({ ...e, foto: c.toDataURL("image/jpeg", 0.85) }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const exportarCalendario = () => {
    if (!todosItens.length) return toast.info("Monte um plano de estudo primeiro.");
    const blob = new Blob([gerarICS(estado.planos)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "arqhub-academy.ics";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/academy#agenda`);
      toast.success("Link da agenda copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const abas: { id: Aba; label: string; icon: typeof Layers; badge?: number }[] = [
    { id: "planos", label: "Meus planos de estudo", icon: Layers },
    { id: "progresso", label: "Progresso", icon: BarChart3, badge: concluidos },
    { id: "agenda", label: "Agenda", icon: CalendarDays },
    { id: "biblioteca", label: "Biblioteca", icon: Library },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />

      <div className="border-b border-border bg-background">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-6 text-[13.5px] font-semibold text-ink">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
          </span>
          ArqHub Academy
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        {/* Banner com foto e nome */}
        <section className="relative h-36 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-sky-100 via-sky-50 to-white sm:h-40">
          <svg className="absolute inset-x-0 bottom-0 h-20 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 70 C200 20 380 40 600 60 C820 80 1000 30 1200 50 L1200 120 L0 120 Z" fill="#a7c98a" />
            <path d="M0 95 C250 60 450 70 700 85 C900 97 1050 75 1200 80 L1200 120 L0 120 Z" fill="#6e9b45" />
          </svg>
          {[12, 30, 55, 78].map((l, i) => (
            <span
              key={l}
              aria-hidden="true"
              className="absolute h-6 w-20 rounded-full bg-white/90 blur-[1px]"
              style={{ left: `${l}%`, top: `${10 + (i % 2) * 8}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-center gap-4 px-5 sm:px-6">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white/80 text-ink-muted shadow-md transition-transform hover:scale-[1.03] sm:h-24 sm:w-24"
              aria-label="Enviar foto"
            >
              {estado.foto ? <img src={estado.foto} alt="" className="h-full w-full object-cover" /> : <Upload className="h-6 w-6" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFoto(e.target.files[0])}
            />
            {editandoNome ? (
              <input
                autoFocus
                defaultValue={estado.nome}
                maxLength={40}
                onBlur={(e) => {
                  const nome = e.target.value.trim();
                  atualizar((s) => ({ ...s, nome }));
                  setEditandoNome(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="rounded-md border border-border bg-white/90 px-3 py-1.5 font-display text-xl font-semibold text-ink outline-none focus:ring-2 focus:ring-primary"
                placeholder="Seu nome"
              />
            ) : (
              <h1 className="font-display text-2xl font-semibold text-ink drop-shadow-sm">
                {pronto && estado.nome ? estado.nome : "Seu nome"}
              </h1>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditandoNome(true)}
            className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-muted shadow hover:text-ink"
            aria-label="Editar nome"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </section>

        {/* CTA montar plano */}
        <section className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Monte seu plano de estudo</h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              Escolha o tipo de estudo — concurso, vestibular, prova específica, interiores ou urbanismo — e receba um cronograma semanal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWizard(true)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-ink px-5 text-[14px] font-semibold text-white hover:bg-black"
          >
            <BookOpen className="h-4 w-4" /> Montar plano de estudo
          </button>
        </section>

        {/* Abas */}
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4" role="tablist">
          {abas.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={`flex h-11 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors ${
                aba === a.id ? "border-ink/20 bg-secondary text-ink" : "border-border bg-background text-ink-muted hover:text-ink"
              }`}
            >
              <a.icon className="h-4 w-4 text-primary" />
              {a.badge !== undefined && <span className="font-semibold text-ink">{a.badge}</span>}
              {a.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Coluna principal */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-[16px] font-semibold text-ink">Foco de hoje</h3>
                  <p className="text-[12px] text-muted-foreground">Sequência sugerida a partir do seu avanço</p>
                </div>
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
              </div>
              {focoHoje.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-[13px] text-ink-muted">
                  <CheckCircle2 className="h-6 w-6 text-ink-muted" />
                  {estado.planos.length ? "Tudo concluído por aqui. Excelente ritmo!" : "Monte um plano para receber o foco do dia."}
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {focoHoje.map((it) => {
                    const p = planoDoItem(it.id);
                    return (
                      <li key={it.id}>
                        <ItemLinha item={it} onToggle={() => p && alternarItem(p.id, it.id)} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-background p-5">
              {aba === "planos" && (
                <MeusPlanos
                  planos={estado.planos}
                  onNovo={() => setWizard(true)}
                  onExcluir={(id) => atualizar((e) => ({ ...e, planos: e.planos.filter((p) => p.id !== id) }))}
                />
              )}
              {aba === "progresso" && <Progresso planos={estado.planos} />}
              {aba === "agenda" && <Agenda planos={estado.planos} onToggle={alternarItem} />}
              {aba === "biblioteca" && <Biblioteca />}
            </section>
          </div>

          {/* Navegação rápida */}
          <aside className="h-fit rounded-2xl border border-border bg-background p-5">
            <h3 className="font-display text-[16px] font-semibold text-ink">Navegação rápida</h3>
            <div className="mt-3 space-y-2">
              <QuickBtn icon={CalendarDays} label="Agenda de estudos" dark onClick={() => setAba("agenda")} />
              <QuickBtn icon={BookOpen} label="Biblioteca de dicas" onClick={() => setAba("biblioteca")} />
              <QuickBtn icon={CalendarPlus} label="Exportar para meu calendário" onClick={exportarCalendario} muted={!todosItens.length} />
              <QuickBtn icon={Link2} label="Copiar link da agenda" onClick={copiarLink} ghost />
            </div>
            <p className="mt-3 text-[11.5px] leading-snug text-muted-foreground">
              Dica: na agenda você marca cada sessão como concluída e o foco do dia se ajusta sozinho.
            </p>
          </aside>
        </div>
      </main>

      <NovoPlanoDialog
        open={wizard}
        onOpenChange={setWizard}
        onCriar={(p) => {
          atualizar((e) => ({ ...e, planos: [p, ...e.planos] }));
          setAba("agenda");
          toast.success("Plano criado! Sua agenda semanal está pronta.");
        }}
      />

      <SiteFooter />
    </div>
  );
}

/* ============================== Partes ============================== */

function QuickBtn({
  icon: Icon, label, onClick, dark, muted, ghost,
}: { icon: typeof Layers; label: string; onClick: () => void; dark?: boolean; muted?: boolean; ghost?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-colors ${
        dark
          ? "bg-ink text-white hover:bg-black"
          : ghost
            ? "text-ink-muted hover:bg-secondary hover:text-ink"
            : `border border-border hover:bg-secondary ${muted ? "text-muted-foreground" : "text-ink"}`
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function ItemLinha({ item, onToggle }: { item: Item; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 py-2.5 text-left">
      {item.feito ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
      )}
      <span className={`flex-1 text-[13.5px] ${item.feito ? "text-muted-foreground line-through" : "text-ink"}`}>{item.titulo}</span>
      <span className="text-[11.5px] text-muted-foreground">{formatarData(item.data)}</span>
    </button>
  );
}

const tipoLabel = (t: Tipo) => TIPOS.find((x) => x.id === t)?.label ?? t;

function MeusPlanos({ planos, onNovo, onExcluir }: { planos: Plano[]; onNovo: () => void; onExcluir: (id: string) => void }) {
  if (!planos.length)
    return (
      <div className="py-8 text-center">
        <p className="text-[13.5px] text-ink-muted">Você ainda não tem planos de estudo.</p>
        <button type="button" onClick={onNovo} className="mt-3 text-[13px] font-semibold text-primary hover:underline">
          Montar meu primeiro plano →
        </button>
      </div>
    );
  return (
    <ul className="space-y-3">
      {planos.map((p) => {
        const feitos = p.itens.filter((i) => i.feito).length;
        const pct = Math.round((feitos / Math.max(1, p.itens.length)) * 100);
        return (
          <li key={p.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{tipoLabel(p.tipo)}</div>
                <div className="mt-0.5 text-[15px] font-semibold text-ink">{p.objetivo || "Plano de estudo"}</div>
                <div className="text-[12px] text-muted-foreground">
                  {p.semanas} semanas · {p.horasSemana}h por semana · {p.itens.length} sessões
                </div>
              </div>
              <button
                type="button"
                onClick={() => confirm("Excluir este plano?") && onExcluir(p.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-ink"
                aria-label="Excluir plano"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 text-right text-[11px] text-muted-foreground">{pct}% concluído</div>
          </li>
        );
      })}
    </ul>
  );
}

function Progresso({ planos }: { planos: Plano[] }) {
  const itens = planos.flatMap((p) => p.itens);
  const feitos = itens.filter((i) => i.feito).length;
  const atrasados = itens.filter((i) => !i.feito && i.data < hojeISO()).length;
  const stats = [
    { l: "Sessões concluídas", v: feitos },
    { l: "Sessões restantes", v: itens.length - feitos },
    { l: "Atrasadas", v: atrasados },
    { l: "Planos ativos", v: planos.length },
  ];
  return (
    <div>
      <h3 className="font-display text-[16px] font-semibold text-ink">Progresso</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-surface p-3">
            <div className="text-[22px] font-semibold tabular-nums text-ink">{s.v}</div>
            <div className="text-[11.5px] text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Agenda({ planos, onToggle }: { planos: Plano[]; onToggle: (planoId: string, itemId: string) => void }) {
  const porSemana = useMemo(() => {
    const mapa = new Map<string, { planoId: string; item: Item }[]>();
    for (const p of planos)
      for (const it of p.itens) {
        const d = new Date(it.data + "T12:00:00");
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // segunda-feira
        const k = d.toISOString().slice(0, 10);
        mapa.set(k, [...(mapa.get(k) ?? []), { planoId: p.id, item: it }]);
      }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [planos]);

  if (!porSemana.length) return <p className="py-8 text-center text-[13.5px] text-ink-muted">Sua agenda aparece aqui depois que você montar um plano.</p>;

  return (
    <div className="space-y-5">
      <h3 className="font-display text-[16px] font-semibold text-ink">Agenda de estudos</h3>
      {porSemana.map(([semana, lista]) => (
        <div key={semana}>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Semana de {formatarData(semana)}
          </div>
          <ul className="divide-y divide-border rounded-xl border border-border px-3">
            {lista
              .sort((a, b) => a.item.data.localeCompare(b.item.data))
              .map(({ planoId, item }) => (
                <li key={item.id}>
                  <ItemLinha item={item} onToggle={() => onToggle(planoId, item.id)} />
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Biblioteca() {
  return (
    <div>
      <h3 className="font-display text-[16px] font-semibold text-ink">Biblioteca de dicas</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {DICAS.map((d) => (
          <article key={d.titulo} className="rounded-xl border border-border bg-surface p-4">
            <h4 className="text-[14px] font-semibold text-ink">{d.titulo}</h4>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{d.texto}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function NovoPlanoDialog({
  open, onOpenChange, onCriar,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCriar: (p: Plano) => void }) {
  const [tipo, setTipo] = useState<Tipo>("concurso");
  const [objetivo, setObjetivo] = useState("");
  const [horas, setHoras] = useState(10);
  const [semanas, setSemanas] = useState(8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Montar plano de estudo</DialogTitle>
          <DialogDescription>Escolha o tipo de estudo e sua disponibilidade. O cronograma é gerado na hora.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipo(t.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                tipo === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
              }`}
            >
              <div className="text-[13.5px] font-semibold text-ink">{t.label}</div>
              <div className="text-[11.5px] text-muted-foreground">{t.desc}</div>
            </button>
          ))}
        </div>

        <label className="mt-1 block text-[12.5px] font-medium text-ink">
          Objetivo (opcional)
          <input
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            placeholder="Ex.: Concurso Prefeitura de Brasília 2027"
            className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-[13.5px] outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[12.5px] font-medium text-ink">
            Horas por semana: <span className="font-semibold">{horas}h</span>
            <input type="range" min={4} max={30} step={1} value={horas} onChange={(e) => setHoras(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
          </label>
          <label className="block text-[12.5px] font-medium text-ink">
            Duração: <span className="font-semibold">{semanas} semanas</span>
            <input type="range" min={2} max={24} step={1} value={semanas} onChange={(e) => setSemanas(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
          </label>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => {
              onCriar(gerarPlano(tipo, objetivo.trim(), horas, semanas));
              onOpenChange(false);
              setObjetivo("");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-5 text-[14px] font-semibold text-white hover:bg-black"
          >
            Gerar cronograma
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
