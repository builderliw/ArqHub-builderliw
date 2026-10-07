import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { listClienteMessages, sendClienteMessage } from "@/lib/cliente-data.functions";
import { listProfessionalMessages, sendProfessionalMessage } from "@/lib/profissional-project-data.functions";

export type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const PAGE_SIZE = 50;
const lastReadKey = (projectId: string) => `chat:lastRead:${projectId}`;

function readLastRead(projectId: string | null): string | null {
  if (!projectId || typeof window === "undefined") return null;
  return window.localStorage.getItem(lastReadKey(projectId));
}

function writeLastRead(projectId: string, iso: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(lastReadKey(projectId), iso);
  window.dispatchEvent(new CustomEvent("chat:lastReadChanged", { detail: { projectId, iso } }));
}

export function useProjectMessages(projectId: string | null, mode: "default" | "cliente" = "default", officeId: string | null = null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const listProfessional = useServerFn(listProfessionalMessages);
  const sendProfessional = useServerFn(sendProfessionalMessage);

  // Hydrate last-read from storage on project change
  useEffect(() => {
    setLastReadAt(readLastRead(projectId));
  }, [projectId]);

  const load = useCallback(async () => {
    if (!projectId) return;

    if (mode === "cliente") {
      try {
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) {
          setError("Sessão expirada");
          setLoading(false);
          return;
        }
        const r = await listClienteMessages({
          data: { accessToken: token, projectId, limit: PAGE_SIZE, officeId },
        });
        setMessages(r.messages as Message[]);
        setUserId(r.userId);
        setSenderNames((prev) => ({ ...prev, ...r.senderNames }));
        setHasMore(r.hasMore);
        setLoading(false);
      } catch (e: any) {
        setError(e?.message ?? "Erro");
        setLoading(false);
      }
      return;
    }

    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setError("Sessão expirada");
        setLoading(false);
        return;
      }
      const r = await listProfessional({ data: { accessToken: token, projectId, limit: PAGE_SIZE } });
      setMessages(r.messages as Message[]);
      setUserId(r.userId);
      setSenderNames((prev) => ({ ...prev, ...r.senderNames }));
      setHasMore(r.hasMore);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message ?? "Erro");
      setLoading(false);
      return;
    }
  }, [projectId, mode, officeId, listProfessional]);

  const loadOlder = useCallback(async () => {
    if (!projectId || loadingOlder || !hasMore) return;
    const oldest = messages[0]?.created_at;
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      if (mode === "cliente") {
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const r = await listClienteMessages({
          data: { accessToken: token, projectId, limit: PAGE_SIZE, before: oldest, officeId },
        });
        setMessages((prev) => [...(r.messages as Message[]), ...prev]);
        setSenderNames((prev) => ({ ...prev, ...r.senderNames }));
        setHasMore(r.hasMore);
      } else {
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const r = await listProfessional({ data: { accessToken: token, projectId, limit: PAGE_SIZE, before: oldest } });
        setMessages((prev) => [...(r.messages as Message[]), ...prev]);
        setSenderNames((prev) => ({ ...prev, ...r.senderNames }));
        setHasMore(r.hasMore);
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [projectId, mode, messages, hasMore, loadingOlder, listProfessional, officeId]);

  useEffect(() => {
    if (mode === "cliente") return;
    externalSupabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [mode]);

  useEffect(() => {
    if (!projectId) return;
    load();
    const t = setInterval(load, 2000);

    const onFocus = () => load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const channel = externalSupabase
      .channel(`project_messages:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      externalSupabase.removeChannel(channel);
    };
  }, [projectId, load]);

  const unreadCount = useMemo(() => {
    if (!userId) return 0;
    return messages.filter(
      (m) => m.sender_id !== userId && (!lastReadAt || m.created_at > lastReadAt),
    ).length;
  }, [messages, userId, lastReadAt]);

  const markAllRead = useCallback(() => {
    if (!projectId) return;
    const latest = messages.at(-1)?.created_at;
    const iso = latest ?? new Date().toISOString();
    writeLastRead(projectId, iso);
    setLastReadAt(iso);
  }, [projectId, messages]);

  const send = useCallback(
    async (body: string) => {
      if (!projectId) return;
      const trimmed = body.trim();
      if (!trimmed) return;
      if (trimmed.length > 2000) {
        setError("Mensagem muito longa (máx 2000)");
        return;
      }

      if (mode === "cliente") {
        try {
          const { data: sess } = await externalSupabase.auth.getSession();
          const token = sess.session?.access_token;
          if (!token) {
            setError("Sessão expirada");
            return;
          }
          await sendClienteMessage({ data: { accessToken: token, projectId, body: trimmed } });
          await load();
        } catch (e: any) {
          setError(e?.message ?? "Erro");
        }
        return;
      }

      try {
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) {
          setError("Sessão expirada");
          return;
        }
        await sendProfessional({ data: { accessToken: token, projectId, body: trimmed } });
      } catch (e: any) {
        setError(e?.message ?? "Erro");
        return;
      }
      await load();
    },
    [projectId, userId, load, mode, sendProfessional],
  );

  return {
    messages,
    userId,
    senderNames,
    loading,
    error,
    send,
    refresh: load,
    unreadCount,
    lastReadAt,
    markAllRead,
    hasMore,
    loadOlder,
    loadingOlder,
  };
}
