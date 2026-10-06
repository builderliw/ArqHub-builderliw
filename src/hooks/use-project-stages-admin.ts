import { useCallback, useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";

export type AdminStage = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  order_index: number;
  start_at: string | null;
  end_at: string | null;
  depends_on: string | null;
};

export type AdminApproval = {
  id: string;
  stage_id: string;
  client_user_id: string;
  status: "approved" | "rejected" | "changes_requested";
  note: string | null;
  created_at: string;
  client_name?: string;
};

export type StageDocument = {
  id: string;
  stage_id: string | null;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  visible_to_client: boolean;
  created_at: string;
};

export type StagesAdminData = {
  loading: boolean;
  error: string | null;
  stages: AdminStage[];
  approvals: Record<string, AdminApproval[]>;
  documents: Record<string, StageDocument[]>;
  refresh: () => Promise<void>;
};

export function useProjectStagesAdmin(projectId: string | null): StagesAdminData {
  const [state, setState] = useState<Omit<StagesAdminData, "refresh">>({
    loading: true,
    error: null,
    stages: [],
    approvals: {},
    documents: {},
  });

  const load = useCallback(async () => {
    if (!projectId) {
      setState({ loading: false, error: null, stages: [], approvals: {}, documents: {} });
      return;
    }
    try {
      setState((s) => ({ ...s, loading: true }));
      const { data: st, error: stErr } = await externalSupabase
        .from("project_stages")
        .select("id, project_id, title, description, status, progress, order_index, start_at, end_at, depends_on")
        .eq("project_id", projectId)
        .order("order_index", { ascending: true });
      if (stErr) throw stErr;
      const stages = (st ?? []) as AdminStage[];

      const approvals: Record<string, AdminApproval[]> = {};
      const documents: Record<string, StageDocument[]> = {};

      if (stages.length > 0) {
        const stageIds = stages.map((s) => s.id);
        const [apRes, docRes] = await Promise.all([
          externalSupabase
            .from("stage_approvals")
            .select("id, stage_id, client_user_id, status, note, created_at")
            .in("stage_id", stageIds)
            .order("created_at", { ascending: false }),
          externalSupabase
            .from("project_documents")
            .select("id, stage_id, name, storage_path, mime_type, size_bytes, visible_to_client, created_at")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false }),
        ]);
        const list = (apRes.data ?? []) as AdminApproval[];
        const userIds = Array.from(new Set(list.map((a) => a.client_user_id)));
        let nameMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: profs } = await externalSupabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);
          for (const p of profs ?? []) {
            nameMap[(p as any).id] = (p as any).full_name || (p as any).email || "Cliente";
          }
        }
        for (const a of list) {
          a.client_name = nameMap[a.client_user_id] ?? "Cliente";
          (approvals[a.stage_id] ??= []).push(a);
        }
        for (const d of (docRes.data ?? []) as StageDocument[]) {
          const key = d.stage_id ?? "__none__";
          (documents[key] ??= []).push(d);
        }
      }

      setState({ loading: false, error: null, stages, approvals, documents });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message ?? "Erro" }));
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}

export async function createStage(input: {
  project_id: string;
  title: string;
  description?: string | null;
  order_index: number;
  start_at?: string | null;
  end_at?: string | null;
}) {
  const { error } = await externalSupabase.from("project_stages").insert({
    project_id: input.project_id,
    title: input.title,
    description: input.description ?? null,
    status: "todo",
    progress: 0,
    order_index: input.order_index,
    start_at: input.start_at ?? null,
    end_at: input.end_at ?? null,
  });
  if (error) throw error;
}

export async function updateStage(id: string, patch: Partial<AdminStage>) {
  const { error } = await externalSupabase.from("project_stages").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteStage(id: string) {
  const { error } = await externalSupabase.from("project_stages").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadStageDocument(args: {
  project_id: string;
  stage_id: string | null;
  file: File;
  visible_to_client?: boolean;
}) {
  const { data: u } = await externalSupabase.auth.getUser();
  const userId = u?.user?.id;
  const safeName = args.file.name.replace(/[^\w.\-]/g, "_");
  const path = `${args.project_id}/${Date.now()}_${safeName}`;
  const up = await externalSupabase.storage
    .from("project-documents")
    .upload(path, args.file, { contentType: args.file.type, upsert: false });
  if (up.error) throw up.error;
  const { error } = await externalSupabase.from("project_documents").insert({
    project_id: args.project_id,
    stage_id: args.stage_id,
    name: args.file.name,
    storage_path: path,
    mime_type: args.file.type || null,
    size_bytes: args.file.size,
    visible_to_client: args.visible_to_client ?? true,
    uploaded_by: userId ?? null,
  });
  if (error) {
    await externalSupabase.storage.from("project-documents").remove([path]);
    throw error;
  }

  // Notifica o cliente por e-mail (respeita preferências/plano).
  if (args.visible_to_client !== false) {
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (accessToken) {
        const { notifyNewClientDocument } = await import("@/lib/notify-new-document.functions");
        await notifyNewClientDocument({
          data: {
            externalAccessToken: accessToken,
            projectId: args.project_id,
            documentName: args.file.name,
          },
        });
      }
    } catch (e) {
      // Falha de notificação não deve quebrar o upload.
      console.warn("[notify-new-document] falhou:", e);
    }
  }
}

export async function deleteDocument(doc: { id: string; storage_path: string }) {
  const { error } = await externalSupabase.from("project_documents").delete().eq("id", doc.id);
  if (error) throw error;
  await externalSupabase.storage.from("project-documents").remove([doc.storage_path]);
}

export async function toggleDocumentVisibility(id: string, visible_to_client: boolean) {
  const { error } = await externalSupabase
    .from("project_documents")
    .update({ visible_to_client })
    .eq("id", id);
  if (error) throw error;
}

export async function getDocumentSignedUrl(storage_path: string) {
  const { data, error } = await externalSupabase.storage
    .from("project-documents")
    .createSignedUrl(storage_path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
