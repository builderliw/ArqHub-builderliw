import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import {
  useProductCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type ProductCategory,
} from "@/hooks/use-product-categories";

export function ProductCategoriesManager({ officeId }: { officeId: string }) {
  const { categories, loading, refresh } = useProductCategories(officeId);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), color });
      } else {
        await createCategory(officeId, name.trim(), color);
      }
      setName(""); setEditing(null);
      await refresh();
    } catch (e: any) { alert(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("Remover esta categoria?")) return;
    setBusy(true);
    try { await deleteCategory(id); await refresh(); }
    catch (e: any) { alert(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-muted-foreground">
        Categorias usadas ao cadastrar produtos do escritório.
      </p>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={editing ? "Editar nome" : "Nova categoria"}
          className="flex-1 border border-border rounded-md h-9 px-3 text-[13px] bg-white"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-12 rounded-md border border-border bg-white cursor-pointer"
          title="Cor"
        />
        <button
          disabled={busy || !name.trim()}
          onClick={add}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-ink text-white text-[12.5px] font-medium disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editing ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {editing ? "Salvar" : "Adicionar"}
        </button>
        {editing && (
          <button
            onClick={() => { setEditing(null); setName(""); }}
            className="px-3 h-9 rounded-md border border-border text-[12.5px]"
          >
            Cancelar
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-[12.5px] text-muted-foreground">Carregando…</div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-[12.5px] text-muted-foreground">
          Nenhuma categoria cadastrada.
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-3 w-3 rounded-full border border-border shrink-0"
                  style={{ background: c.color ?? "transparent" }}
                />
                <span className="text-[13px] text-ink truncate">{c.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditing(c); setName(c.name); setColor(c.color ?? "#3B82F6"); }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-ink hover:bg-secondary"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={busy}
                  onClick={() => remove(c.id)}
                  className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
