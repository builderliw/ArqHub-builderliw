import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listProfessionalProducts } from "@/lib/profissional-project-data.functions";

export type ProjectProduct = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  category: string | null;
  store_name: string | null;
  store_url: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  quantity: number;
  visible_to_client: boolean;
  purchased: boolean;
  purchased_at: string | null;
  purchased_by: string | null;
  created_at: string;
};

export async function setProductPurchased(productId: string, purchased: boolean) {
  const { error } = await externalSupabase.rpc("set_product_purchased", {
    p_product_id: productId,
    p_purchased: purchased,
  });
  if (error) throw error;
}

export function useProjectProductsAdmin(projectId: string | null) {
  const [products, setProducts] = useState<ProjectProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listProducts = useServerFn(listProfessionalProducts);

  const load = useCallback(async () => {
    if (!projectId) {
      setProducts([]); setLoading(false); return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      const r = await listProducts({ data: { accessToken: token, projectId } });
      setProducts((r.products ?? []) as ProjectProduct[]);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar produtos");
      setProducts([]);
    }
    setLoading(false);
  }, [projectId, listProducts]);

  useEffect(() => { load(); }, [load]);

  return { products, loading, error, refresh: load };
}

export async function createProjectProduct(input: {
  project_id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  store_name?: string | null;
  store_url?: string | null;
  image_url?: string | null;
  price?: number | null;
  currency?: string;
  quantity?: number;
  visible_to_client?: boolean;
}) {
  const { data: u } = await externalSupabase.auth.getUser();
  const { error } = await externalSupabase.from("project_products").insert({
    ...input,
    currency: input.currency ?? "BRL",
    quantity: input.quantity ?? 1,
    visible_to_client: input.visible_to_client ?? true,
    created_by: u?.user?.id ?? null,
  });
  if (error) throw error;
}

export async function updateProjectProduct(id: string, patch: Partial<ProjectProduct>) {
  const { error } = await externalSupabase
    .from("project_products")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProjectProduct(id: string) {
  const { error } = await externalSupabase.from("project_products").delete().eq("id", id);
  if (error) throw error;
}
