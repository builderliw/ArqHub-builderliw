// Reconstruído em out/2026 (arquivo original perdido na migração da Lovable).
// Produtos especificados para o projeto (lista de compras do cliente).
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, ImageOff, Loader2, Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { useProjectProductsAdmin, type ProjectProduct } from "@/hooks/use-project-products-admin";
import {
  deleteProfessionalProduct,
  listProfessionalProductCategories,
  saveProfessionalProduct,
  setProfessionalProductPurchased,
} from "@/lib/profissional-project-data.functions";

type Draft = {
  name: string;
  description: string;
  category: string;
  store_name: string;
  store_url: string;
  image_url: string;
  price: string;
  quantity: string;
  visible_to_client: boolean;
};

const EMPTY_DRAFT: Draft = {
  name: "", description: "", category: "", store_name: "", store_url: "",
  image_url: "", price: "", quantity: "1", visible_to_client: true,
};

function brl(n: number | null | undefined, currency = "BRL") {
  if (n == null) return null;
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n);
  } catch {
    return `R$ ${Number(n).toFixed(2)}`;
  }
}

function parsePrice(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  // aceita "1.234,56", "1234,56" e "1234.56"
  const norm = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(norm.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function token() {
  const { data } = await externalSupabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Sessão expirada. Entre novamente.");
  return t;
}

export function ProjectProductsManager({ projectId, officeId }: { projectId: string; officeId: string | null }) {
  const { products, loading, error, refresh } = useProjectProductsAdmin(projectId);
  const saveFn = useServerFn(saveProfessionalProduct);
  const deleteFn = useServerFn(deleteProfessionalProduct);
  const purchasedFn = useServerFn(setProfessionalProductPurchased);
  const categoriesFn = useServerFn(listProfessionalProductCategories);

  const [categories, setCategories] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "purchased">("all");

  const loadCategories = useCallback(async () => {
    if (!officeId) return;
    try {
      const r: any = await categoriesFn({ data: { accessToken: await token(), officeId } });
      setCategories((r.categories ?? []).map((c: any) => c.name).filter(Boolean));
    } catch {
      setCategories([]);
    }
  }, [officeId, categoriesFn]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const visible = useMemo(
    () => products.filter((p) => (filter === "all" ? true : filter === "purchased" ? p.purchased : !p.purchased)),
    [products, filter],
  );
  const total = products.reduce((a, p) => a + (Number(p.price) || 0) * (Number(p.quantity) || 1), 0);
  const purchasedCount = products.filter((p) => p.purchased).length;

  function startEdit(p?: ProjectProduct) {
    setEditing({
      id: p?.id ?? null,
      draft: p
        ? {
            name: p.name ?? "",
            description: p.description ?? "",
            category: p.category ?? "",
            store_name: p.store_name ?? "",
            store_url: p.store_url ?? "",
            image_url: p.image_url ?? "",
            price: p.price != null ? String(p.price).replace(".", ",") : "",
            quantity: String(p.quantity ?? 1),
            visible_to_client: p.visible_to_client ?? true,
          }
        : { ...EMPTY_DRAFT },
    });
  }

  async function save() {
    if (!editing) return;
    const d = editing.draft;
    if (!d.name.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }
    setSaving(true);
    try {
      const product = {
        name: d.name.trim(),
        description: d.description.trim() || null,
        category: d.category.trim() || null,
        store_name: d.store_name.trim() || null,
        store_url: d.store_url.trim() || null,
        image_url: d.image_url.trim() || null,
        price: parsePrice(d.price),
        currency: "BRL",
        quantity: Math.max(1, Math.round(Number(d.quantity) || 1)),
        visible_to_client: d.visible_to_client,
      };
      await saveFn({ data: { accessToken: await token(), projectId, product, id: editing.id } });
      toast.success(editing.id ? "Produto atualizado" : "Produto adicionado");
      setEditing(null);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar");
    }
    setSaving(false);
  }

  async function remove(p: ProjectProduct) {
    if (!confirm(`Excluir “${p.name}”?`)) return;
    try {
      await deleteFn({ data: { accessToken: await token(), projectId, id: p.id } });
      toast.success("Produto excluído");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível excluir");
    }
  }

  async function togglePurchased(p: ProjectProduct) {
    try {
      await purchasedFn({ data: { accessToken: await token(), projectId, id: p.id, purchased: !p.purchased } });
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível atualizar");
    }
  }

  const set = (k: keyof Draft, v: string | boolean) =>
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, [k]: v } } : e));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border bg-white p-0.5 text-[12.5px]">
          {([
            ["all", "Todos"],
            ["pending", "A comprar"],
            ["purchased", "Comprados"],
          ] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-2.5 h-7 rounded ${filter === v ? "bg-secondary text-ink font-medium" : "text-muted-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-muted-foreground">
          {purchasedCount}/{products.length} comprados · total {brl(total)}
        </span>
        <button
          onClick={() => startEdit()}
          className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink text-white text-[12.5px] font-medium"
        >
          <Plus className="h-3.5 w-3.5" /> Novo produto
        </button>
      </div>

      {error && <p className="text-[12.5px] text-red-600">{error}</p>}

      {editing && (
        <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">{editing.id ? "Editar produto" : "Novo produto"}</span>
            <button onClick={() => setEditing(null)} className="p-1 text-muted-foreground hover:text-ink" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="Nome *" value={editing.draft.name} onChange={(v) => set("name", v)} />
            <label className="grid gap-1 text-[12px] text-muted-foreground">
              Categoria
              <input
                list={`cats-${projectId}`}
                value={editing.draft.category}
                onChange={(e) => set("category", e.target.value)}
                className="h-9 px-2.5 text-[13px] text-ink border border-border rounded-md bg-white"
              />
              <datalist id={`cats-${projectId}`}>
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>
            <Field label="Loja" value={editing.draft.store_name} onChange={(v) => set("store_name", v)} />
            <Field label="Link da loja" value={editing.draft.store_url} onChange={(v) => set("store_url", v)} placeholder="https://" />
            <Field label="Preço unitário (R$)" value={editing.draft.price} onChange={(v) => set("price", v)} placeholder="0,00" />
            <Field label="Quantidade" value={editing.draft.quantity} onChange={(v) => set("quantity", v)} type="number" />
            <div className="sm:col-span-2">
              <Field label="URL da imagem" value={editing.draft.image_url} onChange={(v) => set("image_url", v)} placeholder="https://" />
            </div>
          </div>
          <label className="grid gap-1 text-[12px] text-muted-foreground">
            Observações
            <textarea
              value={editing.draft.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="px-2.5 py-2 text-[13px] text-ink border border-border rounded-md bg-white resize-y"
            />
          </label>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[12.5px] text-ink">
              <input
                type="checkbox"
                checked={editing.draft.visible_to_client}
                onChange={(e) => set("visible_to_client", e.target.checked)}
              />
              Visível para o cliente
            </label>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-[12.5px] font-semibold disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar
            </button>
          </div>
        </div>
      )}

      {loading && products.length === 0 ? (
        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground py-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando produtos…
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingBag className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-[13px]">{products.length === 0 ? "Nenhum produto especificado ainda." : "Nada neste filtro."}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {visible.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <input
                type="checkbox"
                checked={p.purchased}
                onChange={() => togglePurchased(p)}
                className="h-4 w-4 shrink-0"
                title={p.purchased ? "Marcar como não comprado" : "Marcar como comprado"}
              />
              <div className="h-11 w-11 shrink-0 rounded-md bg-secondary overflow-hidden flex items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[13.5px] font-medium truncate ${p.purchased ? "line-through text-muted-foreground" : "text-ink"}`}>
                  {p.name}
                </div>
                <div className="text-[11.5px] text-muted-foreground flex flex-wrap gap-x-2">
                  {p.category && <span>{p.category}</span>}
                  {p.store_name && <span>· {p.store_name}</span>}
                  <span>· {p.quantity ?? 1} un.</span>
                  {!p.visible_to_client && <span className="text-amber-700">· oculto do cliente</span>}
                </div>
              </div>
              <div className="text-[13px] font-medium tabular-nums text-ink shrink-0">
                {brl(p.price, p.currency) ?? <span className="text-[11px] text-muted-foreground font-normal">sob consulta</span>}
              </div>
              {p.store_url && (
                <a href={p.store_url} target="_blank" rel="noopener noreferrer" className="p-1 text-muted-foreground hover:text-ink" aria-label="Abrir loja">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button onClick={() => startEdit(p)} className="p-1 text-muted-foreground hover:text-ink" aria-label="Editar">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(p)} className="p-1 text-muted-foreground hover:text-red-600" aria-label="Excluir">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-[12px] text-muted-foreground">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-2.5 text-[13px] text-ink border border-border rounded-md bg-white"
      />
    </label>
  );
}
