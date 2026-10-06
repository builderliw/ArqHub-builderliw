import { useCallback, useEffect, useRef, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";

export type ApprovalNotification = {
  id: string;
  stage_id: string;
  stage_title: string;
  project_id: string;
  project_name: string;
  client_name: string;
  status: "approved" | "rejected" | "changes_requested";
  note: string | null;
  created_at: string;
};

const LS_KEY = "arqhub.notifications.lastSeen";

function readLastSeen(): string {
  if (typeof localStorage === "undefined") return new Date(0).toISOString();
  return localStorage.getItem(LS_KEY) ?? new Date(0).toISOString();
}

export function useProfissionalNotifications(officeId: string | null) {
  const [items, setItems] = useState<ApprovalNotification[]>([]);
  const [lastSeen, setLastSeen] = useState<string>(readLastSeen());
  const channelRef = useRef<any>(null);

  const load = useCallback(async () => {
    if (!officeId) return;
    const { data: projects } = await externalSupabase
      .from("projects")
      .select("id, name, client_id")
      .eq("office_id", officeId);
    const projs = projects ?? [];
    if (projs.length === 0) {
      setItems([]);
      return;
    }
    const projectIds = projs.map((p: any) => p.id);
    const projectMap = new Map(projs.map((p: any) => [p.id, p.name]));

    const { data: stages } = await externalSupabase
      .from("project_stages")
      .select("id, title, project_id")
      .in("project_id", projectIds);
    const stageMap = new Map((stages ?? []).map((s: any) => [s.id, s]));
    const stageIds = (stages ?? []).map((s: any) => s.id);
    if (stageIds.length === 0) {
      setItems([]);
      return;
    }

    const { data: ap } = await externalSupabase
      .from("stage_approvals")
      .select("id, stage_id, client_user_id, status, note, created_at")
      .in("stage_id", stageIds)
      .order("created_at", { ascending: false })
      .limit(30);
    const list = ap ?? [];
    const userIds = Array.from(new Set(list.map((a: any) => a.client_user_id)));
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

    setItems(
      list.map((a: any) => {
        const stage = stageMap.get(a.stage_id) as any;
        return {
          id: a.id,
          stage_id: a.stage_id,
          stage_title: stage?.title ?? "Etapa",
          project_id: stage?.project_id ?? "",
          project_name: projectMap.get(stage?.project_id) ?? "Projeto",
          client_name: nameMap[a.client_user_id] ?? "Cliente",
          status: a.status,
          note: a.note,
          created_at: a.created_at,
        };
      }),
    );
  }, [officeId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!officeId) return;
    const ch = externalSupabase
      .channel(`approvals-${officeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "stage_approvals" },
        () => load(),
      )
      .subscribe();
    channelRef.current = ch;
    return () => {
      try { externalSupabase.removeChannel(ch); } catch {}
    };
  }, [officeId, load]);

  const unread = items.filter((i) => i.created_at > lastSeen);

  function markAllSeen() {
    const now = new Date().toISOString();
    setLastSeen(now);
    try { localStorage.setItem(LS_KEY, now); } catch {}
  }

  return { items, unread, markAllSeen, refresh: load };
}
