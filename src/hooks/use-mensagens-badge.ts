import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { getClienteMensagensMeta } from "@/lib/cliente-data.functions";
import type { Role } from "@/lib/session";

const lastReadKey = (projectId: string) => `chat:lastRead:${projectId}`;

function readLastRead(projectId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(lastReadKey(projectId));
}

function sumUnread(items: Array<{ projectId: string; lastFromOtherAt: string | null }>): number {
  let total = 0;
  for (const it of items) {
    if (!it.lastFromOtherAt) continue;
    const lastRead = readLastRead(it.projectId);
    if (!lastRead || it.lastFromOtherAt > lastRead) total += 1;
  }
  return total;
}

/**
 * Soma o número de projetos com mensagens novas (não lidas) para o usuário atual.
 * Compara `project_messages.created_at` (do outro lado) com `localStorage[chat:lastRead:<projectId>]`.
 */
export function useMensagensBadge(role: Role): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (role === "admin") return;
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function loadCliente() {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      try {
        const r = await getClienteMensagensMeta({ data: { accessToken: token } });
        if (!alive) return;
        setCount(sumUnread(r.projects));
      } catch {
        /* ignore */
      }
    }

    async function loadProfissional() {
      const { data: u } = await externalSupabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) return;
      const { data: offices } = await externalSupabase
        .from("offices")
        .select("id")
        .eq("owner_id", userId)
        .limit(1);
      const officeId = offices?.[0]?.id;
      if (!officeId) return;
      const { data: projects } = await externalSupabase
        .from("projects")
        .select("id")
        .eq("office_id", officeId);
      const ids = (projects ?? []).map((p: any) => p.id);
      if (ids.length === 0) {
        if (alive) setCount(0);
        return;
      }
      const { data: msgs } = await externalSupabase
        .from("project_messages")
        .select("project_id, created_at, sender_id")
        .in("project_id", ids)
        .neq("sender_id", userId)
        .order("created_at", { ascending: false });
      const byProject: Record<string, string> = {};
      for (const m of msgs ?? []) {
        if (!byProject[m.project_id]) byProject[m.project_id] = m.created_at;
      }
      const items = ids.map((pid: string) => ({
        projectId: pid,
        lastFromOtherAt: byProject[pid] ?? null,
      }));
      if (alive) setCount(sumUnread(items));
    }

    async function load() {
      if (role === "cliente") await loadCliente();
      else if (role === "profissional") await loadProfissional();
    }

    load();
    timer = setInterval(load, 15000);

    const onFocus = () => load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("chat:lastRead:")) load();
    };
    const onLastReadChanged = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener("chat:lastReadChanged", onLastReadChanged as EventListener);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("chat:lastReadChanged", onLastReadChanged as EventListener);
    };
  }, [role]);

  return count;
}
