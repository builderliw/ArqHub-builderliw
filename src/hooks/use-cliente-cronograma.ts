import { useCallback, useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import {
  getClienteSnapshot,
  submitClienteApproval,
  signClienteDocUrl,
  submitClienteDocApproval,
  submitClienteMeetingDecision,
} from "@/lib/cliente-data.functions";

export type Etapa = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  order_index: number;
  start_at: string | null;
  end_at: string | null;
  done: boolean;
  atual: boolean;
};

export type Approval = {
  id: string;
  stage_id: string;
  status: "approved" | "rejected" | "changes_requested";
  note: string | null;
  created_at: string;
};

export type Documento = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  stage_id?: string | null;
  requires_approval?: boolean;
  approval_status?: "none" | "pending" | "approved" | "rejected" | "changes_requested" | string;
  approval_note?: string | null;
  doc_kind?: string | null;
};

export type Projeto = {
  id: string;
  name: string;
  description: string | null;
  escritorio: string;
  escritorio_logo?: string | null;
  started_at: string | null;
  created_at: string;
  location?: string | null;
  city?: string | null;
  uf?: string | null;
  cep?: string | null;
  complement?: string | null;
  area_m2?: number | null;
  status?: string | null;
  cliente_name?: string | null;
  cliente_cidade?: string | null;
  cliente_uf?: string | null;
  progressoGeral: number;
};


export type Reuniao = {
  id: string;
  title: string;
  scheduled_at: string;
  duration_min: number;
  location: string | null;
  mode: "presencial" | "online" | "telefone";
  link: string | null;
  notes: string | null;
  status: "agendada" | "realizada" | "cancelada" | "remarcada";
  client_status: "pending" | "accepted" | "declined";
  client_note: string | null;
  client_decided_at: string | null;
};

export type CronogramaData = {
  loading: boolean;
  error: string | null;
  userId: string | null;
  projeto: Projeto | null;
  etapas: Etapa[];
  aprovacoes: Record<string, Approval | undefined>;
  documentos: Documento[];
  reunioes: Reuniao[];
  refresh: () => Promise<void>;
};

export function useClienteCronograma(): CronogramaData {
  const [state, setState] = useState<Omit<CronogramaData, "refresh">>({
    loading: true,
    error: null,
    userId: null,
    projeto: null,
    etapas: [],
    aprovacoes: {},
    documentos: [],
    reunioes: [],
  });

  const load = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setState({
          loading: false,
          error: "Sessão expirada",
          userId: null,
          projeto: null,
          etapas: [],
          aprovacoes: {},
          documentos: [],
          reunioes: [],
        });
        return;
      }

      const snap = await getClienteSnapshot({ data: { accessToken: token } });
      setState({
        loading: false,
        error: null,
        userId: snap.userId,
        projeto: snap.projeto as Projeto | null,
        etapas: snap.etapas as Etapa[],
        aprovacoes: snap.aprovacoes as Record<string, Approval>,
        documentos: snap.documentos as Documento[],
        reunioes: (snap as any).reunioes ?? [],
      });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message ?? "Erro" }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: re-buscar snapshot sempre que o escritório alterar etapas/aprovações.
  useEffect(() => {
    if (!state.projeto?.id) return;
    const projectId = state.projeto.id;
    const channel = externalSupabase
      .channel(`cliente-cronograma-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_stages", filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stage_approvals" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_documents", filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_meetings", filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .subscribe();
    // Fallback: polling leve a cada 45s caso o Realtime não esteja publicado.
    const interval = setInterval(() => load(), 45000);
    return () => {
      externalSupabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [state.projeto?.id, load]);

  return { ...state, refresh: load };
}

export async function submitApproval(args: {
  stageId: string;
  userId: string;
  status: Approval["status"];
  note: string | null;
}) {
  const { data: sess } = await externalSupabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Sessão expirada");
  await submitClienteApproval({
    data: { accessToken: token, stageId: args.stageId, status: args.status, note: args.note },
  });
}

export async function getDocSignedUrl(storagePath: string) {
  const { data: sess } = await externalSupabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Sessão expirada");
  const r = await signClienteDocUrl({ data: { accessToken: token, storagePath } });
  return r.url;
}

export async function submitDocApproval(args: {
  documentId: string;
  status: "approved" | "rejected" | "changes_requested";
  note: string | null;
}) {
  const { data: sess } = await externalSupabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Sessão expirada");
  await submitClienteDocApproval({
    data: { accessToken: token, documentId: args.documentId, status: args.status, note: args.note },
  });
}

export function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function submitMeetingDecision(args: {
  meetingId: string;
  decision: "accepted" | "declined";
  note: string | null;
}) {
  const { data: sess } = await externalSupabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Sessão expirada");
  await submitClienteMeetingDecision({
    data: { accessToken: token, meetingId: args.meetingId, decision: args.decision, note: args.note },
  });
}
