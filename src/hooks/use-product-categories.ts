import { useCallback, useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";

export type ProductCategory = {
  id: string;
  office_id: string;
  name: string;
  color: string | null;
  created_at: string;
};

export function useProductCategories(officeId: string | null) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!officeId) { setCategories([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await externalSupabase
      .from("product_categories")
      .select("*")
      .eq("office_id", officeId)
      .order("name", { ascending: true });
    if (error) setError(error.message);
    setCategories((data ?? []) as ProductCategory[]);
    setLoading(false);
  }, [officeId]);

  useEffect(() => { load(); }, [load]);

  return { categories, loading, error, refresh: load };
}

export async function createCategory(officeId: string, name: string, color?: string | null) {
  const { error } = await externalSupabase
    .from("product_categories")
    .insert({ office_id: officeId, name: name.trim(), color: color ?? null });
  if (error) throw error;
}

export async function updateCategory(id: string, patch: { name?: string; color?: string | null }) {
  const { error } = await externalSupabase.from("product_categories").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await externalSupabase.from("product_categories").delete().eq("id", id);
  if (error) throw error;
}

// Categorias visíveis ao cliente (lê todas as do escritório dono do projeto)
export function useProductCategoriesForClient() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await externalSupabase
        .from("product_categories")
        .select("*")
        .order("name", { ascending: true });
      setCategories((data ?? []) as ProductCategory[]);
    })();
  }, []);
  return categories;
}
