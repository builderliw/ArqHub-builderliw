import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ArrowLeft, ExternalLink, Search, ShoppingBag, Tag, Check,
BellRing, CalendarClock , Images } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listClienteProdutos, setClienteProdutoComprado } from "@/lib/cliente-produtos.functions";

export const Route = createFileRoute("/app/cliente_/produtos")({
  head: () => ({ meta: [{ title: "Produtos do projeto — ArqHub" }] }),
  component: ProdutosCliente,
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

type Produto = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  store_name: string | null;
  store_url: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  quantity: number;
  purchased: boolean;
  purchased_at: string | null;
  created_at: string;
};

function brl(n: number | null, currency = "BRL") {
  if (n == null) return null;
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n); }
  catch { return `R$ ${n.toFixed(2)}`; }
}

function ProdutosCliente() {
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [projeto, setProjeto] = useState<{ id: string; name: string } | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const setComprado = useServerFn(setClienteProdutoComprado);

  async function togglePurchased(p: Produto) {
    setBusyId(p.id);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      await setComprado({ data: { accessToken: token, productId: p.id, purchased: !p.purchased } });
      setProdutos((arr) => arr.map((x) => x.id === p.id ? { ...x, purchased: !p.purchased } : x));
    } catch (e: any) {
      alert(e?.message ?? "Erro ao atualizar");
    } finally { setBusyId(null); }
  }

  useEffect(() => {
    (async () => {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { setLoading(false); return; }
      try {
        const r = await listClienteProdutos({ data: { accessToken: token } });
        setProjeto(r.projeto);
        setProdutos((r.produtos ?? []) as Produto[]);
      } finally { setLoading(false); }
    })();
  }, []);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [produtos]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return produtos.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        (p.description ?? "").toLowerCase().includes(term) ||
        (p.store_name ?? "").toLowerCase().includes(term)
      );
    });
  }, [produtos, q, cat]);

  return (
    <AppShell role="cliente" nav={nav} title="Produtos">
      <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-3">
        <Link to="/app/cliente" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
      </nav>

      <header className="mb-5">
        <h1 className="text-[24px] font-semibold tracking-tight text-ink">Produtos & Referências</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Itens selecionados pelo escritório com indicação de onde comprar.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-2 bg-white border border-border rounded-md px-3 h-9 flex-1 min-w-[220px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            className="bg-transparent flex-1 text-[13px] focus:outline-none"
            placeholder="Buscar por nome, loja ou descrição"
          />
        </div>
        {categorias.length > 0 && (
          <select
            value={cat} onChange={(e) => setCat(e.target.value)}
            className="bg-white border border-border rounded-md h-9 px-2 text-[12.5px]"
          >
            <option value="all">Todas as categorias</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-secondary/60 animate-pulse" />
          ))}
        </div>
      ) : !projeto ? (
        <EmptyHero
          title="Aguardando vinculação"
          desc="Seu painel será ativado quando o escritório vincular um projeto à sua conta."
        />
      ) : filtered.length === 0 ? (
        <EmptyHero
          title="Nenhum produto disponível"
          desc="Assim que o escritório adicionar referências de compra para o seu projeto, elas aparecerão aqui."
        />
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <li key={p.id} className={`bg-white border border-border rounded-xl overflow-hidden flex flex-col ${p.purchased ? "ring-1 ring-emerald-300" : ""}`}>
              <div className="aspect-square bg-secondary/60 relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className={`h-full w-full object-cover ${p.purchased ? "opacity-70" : ""}`} loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                )}
                {p.purchased && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                    <Check className="h-2.5 w-2.5" /> Comprado
                  </span>
                )}
              </div>
              <div className="p-2.5 flex-1 flex flex-col">
                {p.category && (
                  <div className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wide text-primary mb-1">
                    <Tag className="h-2.5 w-2.5" /> {p.category}
                  </div>
                )}
                <h3 className={`text-[12.5px] font-semibold text-ink leading-tight line-clamp-2 ${p.purchased ? "line-through opacity-70" : ""}`}>{p.name}</h3>
                {p.store_name && (
                  <div className="text-[10.5px] text-muted-foreground mt-0.5 truncate">{p.store_name}</div>
                )}
                {p.description && (
                  <p className="text-[11px] text-foreground/75 mt-1.5 line-clamp-2">{p.description}</p>
                )}
                <label className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-ink select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={p.purchased}
                    disabled={busyId === p.id}
                    onChange={() => togglePurchased(p)}
                    className="h-3.5 w-3.5 rounded border-border accent-emerald-600"
                  />
                  Já comprei
                </label>
                <div className="mt-auto pt-2 flex items-center justify-between gap-1.5">
                  <div className="text-[12px] font-semibold text-ink tabular-nums">
                    {brl(p.price, p.currency) ?? <span className="text-muted-foreground font-normal text-[10.5px]">sob consulta</span>}
                  </div>
                  {p.store_url ? (
                    <a
                      href={p.store_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 h-7 rounded-md bg-ink text-white text-[11px] font-medium hover:bg-black transition"
                    >
                      Comprar <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function EmptyHero({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center max-w-xl mx-auto">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
        <ShoppingBag className="h-5 w-5" />
      </div>
      <h2 className="text-[18px] font-semibold tracking-tight text-ink">{title}</h2>
      <p className="text-[13px] text-muted-foreground mt-2">{desc}</p>
    </div>
  );
}
