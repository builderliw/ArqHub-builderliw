import { createServerFn } from "@tanstack/react-start";

async function authUser(accessToken: string) {
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data, error } = await externalAdmin.auth.getUser(accessToken);
  if (error || !data?.user) throw new Error("unauthenticated");
  return { user: data.user, externalAdmin };
}

async function resolveCoverUrl(externalAdmin: any, value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const { data } = await externalAdmin.storage.from("project-photos").createSignedUrl(value, 60 * 60 * 24);
  return data?.signedUrl ?? null;
}

const DIARY_TITLE = "[Diário de obra]";

function diaryAlbum(id: string) {
  return `diario:${id}`;
}

function diaryCaption(id: string) {
  return `Diário de obra:${id}`;
}

function normalizeDiaryActivities(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (typeof item === "string") {
        const descricao = item.trim();
        return descricao ? { id: `atividade-${index}`, descricao, status: "pendente" } : null;
      }
      const raw = item as Record<string, unknown>;
      const descricao = String(raw.descricao ?? raw.description ?? raw.title ?? "").trim();
      if (!descricao) return null;
      const rawStatus = String(raw.status ?? "pendente");
      const status = ["pendente", "andamento", "concluida"].includes(rawStatus) ? rawStatus : "pendente";
      return { id: String(raw.id ?? `atividade-${index}`), descricao, status };
    })
    .filter(Boolean);
}

function parseDiaryBody(body: string | null | undefined) {
  try {
    const parsed = JSON.parse(body || "{}");
    return {
      weather: String(parsed.weather ?? ""),
      atividades: normalizeDiaryActivities(parsed.atividades ?? parsed.activities),
      observacao: String(parsed.observacao ?? ""),
    };
  } catch {
    return { weather: "", atividades: [], observacao: body ?? "" };
  }
}

async function buildDiaryEntries(externalAdmin: any, notes: any[]) {
  const projectIds = Array.from(new Set(notes.map((n) => n.project_id).filter(Boolean)));
  const photosByNote: Record<string, string[]> = {};
  const photosByDay: Record<string, string[]> = {};
  if (projectIds.length > 0) {
    const { data: photos } = await externalAdmin
      .from("project_photos")
      .select("project_id, album, storage_path, caption, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: true });
    for (const p of photos ?? []) {
      const { data: signed } = await externalAdmin.storage.from("project-photos").createSignedUrl(p.storage_path, 3600);
      if (!signed?.signedUrl) continue;
      const matched = notes.find((n) => p.album === diaryAlbum(n.id) || String(p.caption ?? "") === diaryCaption(n.id));
      if (matched) {
        if (!photosByNote[matched.id]) photosByNote[matched.id] = [];
        photosByNote[matched.id].push(signed.signedUrl);
        continue;
      }
      const day = String(p.created_at ?? "").slice(0, 10);
      const key = `${p.project_id}:${day}`;
      if (!photosByDay[key]) photosByDay[key] = [];
      photosByDay[key].push(signed.signedUrl);
    }
  }
  return notes.map((n) => {
    const body = parseDiaryBody(n.body);
    const exactPhotos = photosByNote[n.id] ?? [];
    const dayPhotos = photosByDay[`${n.project_id}:${n.noted_on}`] ?? [];
    return {
      id: n.id,
      project_id: n.project_id,
      date: n.noted_on,
      weather: body.weather,
      atividades: body.atividades,
      observacao: body.observacao,
      photos: exactPhotos.length > 0 ? exactPhotos : dayPhotos,
      created_at: n.created_at,
    };
  });
}

function noteTitleToActivity(title: string | null | undefined, body: string | null | undefined) {
  const cleanTitle = String(title ?? "").replace(/^\[[^\]]+\]\s*/, "").trim();
  return cleanTitle || String(body ?? "").trim();
}

function applyActivityFallback(entries: any[], notes: any[]) {
  const byDay: Record<string, any[]> = {};
  for (const note of notes) {
    const descricao = noteTitleToActivity(note.title, note.body);
    if (!descricao) continue;
    const key = `${note.project_id}:${note.noted_on}`;
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push({ id: `note-${note.id}`, descricao, status: "andamento" });
  }
  return entries.map((entry) => entry.atividades.length > 0 ? entry : {
    ...entry,
    atividades: byDay[`${entry.project_id}:${entry.date}`] ?? [],
  });
}

async function resolveClientIds(externalAdmin: any, userId: string, email: string | null) {
  const { data: links } = await externalAdmin
    .from("client_users")
    .select("client_id")
    .eq("user_id", userId);
  let ids: string[] = (links ?? []).map((l: any) => l.client_id);
  if (ids.length === 0 && email) {
    const { data: rows } = await externalAdmin
      .from("clients")
      .select("id")
      .ilike("email", email.trim());
    ids = (rows ?? []).map((c: any) => c.id);
  }
  return ids;
}

export const getClienteSnapshot = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string }) => {
    if (!i?.accessToken) throw new Error("accessToken obrigatório");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    const clientIds = await resolveClientIds(externalAdmin, user.id, user.email ?? null);
    if (clientIds.length === 0) {
      return { userId: user.id, projeto: null, etapas: [], aprovacoes: {}, documentos: [] };
    }

    const { data: projects } = await externalAdmin
      .from("projects")
      .select("id, name, description, office_id, client_id, started_at, deadline, created_at, location, city, uf, cep, complement, cover_url, area_m2, status")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false })
      .limit(1);
    const project = projects?.[0];
    if (!project) {
      return { userId: user.id, projeto: null, etapas: [], aprovacoes: {}, documentos: [] };
    }

    const { data: clientRow } = await externalAdmin
      .from("clients")
      .select("name, email, phone, cidade, uf, rua, numero, bairro, cep, complemento")
      .eq("id", project.client_id)
      .maybeSingle();


    const [stagesRes, officeRes, docsRes, meetingsRes] = await Promise.all([
      externalAdmin
        .from("project_stages")
        .select("id, title, description, status, progress, order_index, start_at, end_at")
        .eq("project_id", project.id)
        .order("order_index", { ascending: true }),
      externalAdmin.from("offices").select("name, logo_url").eq("id", project.office_id).maybeSingle(),
      externalAdmin
        .from("project_documents")
        .select("id, name, storage_path, mime_type, size_bytes, created_at, requires_approval, approval_status, approval_note, doc_kind")
        .eq("project_id", project.id)
        .eq("visible_to_client", true)
        .order("created_at", { ascending: false }),
      externalAdmin
        .from("project_meetings")
        .select("id, title, scheduled_at, duration_min, location, mode, link, notes, status, client_status, client_note, client_decided_at")
        .eq("project_id", project.id)
        .order("scheduled_at", { ascending: true }),
    ]);

    const stages = stagesRes.data ?? [];
    const currentIdx = stages.findIndex(
      (s: any) => s.status !== "done" && s.status !== "completed",
    );
    const etapas = stages.map((s: any, i: number) => ({
      ...s,
      done: s.status === "done" || s.status === "completed",
      atual: i === currentIdx,
    }));

    const stageIds = stages.map((s: any) => s.id);
    const aprovacoes: Record<string, any> = {};
    if (stageIds.length > 0) {
      const { data: ap } = await externalAdmin
        .from("stage_approvals")
        .select("id, stage_id, status, note, created_at")
        .in("stage_id", stageIds)
        .eq("client_user_id", user.id)
        .order("created_at", { ascending: false });
      for (const a of ap ?? []) {
        if (!aprovacoes[a.stage_id]) aprovacoes[a.stage_id] = a;
      }
    }

    const progressoGeral =
      etapas.length > 0
        ? Math.round(
            etapas.reduce((a: number, e: any) => a + (e.done ? 100 : e.progress ?? 0), 0) /
              etapas.length,
          )
        : 0;

    return {
      userId: user.id,
      projeto: {
        id: project.id,
        name: project.name,
        description: project.description,
        escritorio: officeRes.data?.name ?? "—",
        escritorio_logo: (officeRes.data as any)?.logo_url ?? null,
        started_at: project.started_at,
        deadline: (project as any).deadline ?? null,
        created_at: project.created_at,
        location: (project as any).location ?? null,
        city: (project as any).city ?? null,
        uf: (project as any).uf ?? null,
        cep: (project as any).cep ?? null,
        complement: (project as any).complement ?? null,
        cover_url: await resolveCoverUrl(externalAdmin, (project as any).cover_url),
        area_m2: (project as any).area_m2 ?? null,
        status: (project as any).status ?? null,
        cliente_name: clientRow?.name ?? null,
        cliente_cidade: (clientRow as any)?.cidade ?? null,
        cliente_uf: (clientRow as any)?.uf ?? null,
        progressoGeral,

      },
      etapas,
      aprovacoes,
      documentos: docsRes.data ?? [],
      reunioes: meetingsRes.data ?? [],
    };
  });

async function ensureProjectAccess(externalAdmin: any, userId: string, email: string | null, projectId: string) {
  const clientIds = await resolveClientIds(externalAdmin, userId, email);
  if (clientIds.length === 0) throw new Error("forbidden");
  const { data: p } = await externalAdmin
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!p || !clientIds.includes(p.client_id)) throw new Error("forbidden");
}

export const listClienteMessages = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string; projectId: string; limit?: number; before?: string | null; officeId?: string | null }) => {
    if (!i?.accessToken || !i?.projectId) throw new Error("params");
    const limit = Math.min(Math.max(i.limit ?? 50, 1), 500);
    return { ...i, limit, before: i.before ?? null, officeId: i.officeId ?? null };
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    await ensureProjectAccess(externalAdmin, user.id, user.email ?? null, data.projectId);

    // If officeId is provided, aggregate messages across ALL client projects under that office
    let projectIds: string[] = [data.projectId];
    if (data.officeId) {
      const clientIds = await resolveClientIds(externalAdmin, user.id, user.email ?? null);
      if (clientIds.length > 0) {
        const { data: ps } = await externalAdmin
          .from("projects")
          .select("id")
          .in("client_id", clientIds)
          .eq("office_id", data.officeId);
        const ids = (ps ?? []).map((p: any) => p.id);
        if (ids.length > 0) projectIds = ids;
      }
    }

    let q = externalAdmin
      .from("project_messages")
      .select("id, project_id, sender_id, body, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.before) q = q.lt("created_at", data.before);

    const { data: msgs } = await q;
    const ordered = (msgs ?? []).slice().reverse();

    // Find office for these projects to build sender labels
    let officeId: string | null = data.officeId ?? null;
    let projectClientId: string | null = null;
    {
      const { data: proj } = await externalAdmin
        .from("projects")
        .select("office_id, client_id")
        .eq("id", data.projectId)
        .maybeSingle();
      if (!officeId) officeId = proj?.office_id ?? null;
      projectClientId = proj?.client_id ?? null;
    }
    const ids = Array.from(new Set(ordered.map((m: any) => m.sender_id))).filter(Boolean) as string[];
    let names: Record<string, string> = {};
    if (officeId && ids.length > 0) {
      const { buildSenderLabels } = await import("./profissional-project-data.functions");
      names = await buildSenderLabels(externalAdmin, officeId, ids, projectClientId);
    } else if (ids.length > 0) {
      const { data: profs } = await externalAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      for (const p of profs ?? []) names[p.id] = p.full_name ?? "Usuário";
    }
    return {
      userId: user.id,
      messages: ordered,
      senderNames: names,
      hasMore: (msgs?.length ?? 0) === data.limit,
    };
  });

export const getClienteMensagensMeta = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string }) => {
    if (!i?.accessToken) throw new Error("accessToken obrigatório");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    const clientIds = await resolveClientIds(externalAdmin, user.id, user.email ?? null);
    if (clientIds.length === 0) return { projects: [] as Array<{ projectId: string; lastFromOtherAt: string | null }> };

    const { data: projects } = await externalAdmin
      .from("projects")
      .select("id")
      .in("client_id", clientIds);
    const ids = (projects ?? []).map((p: any) => p.id);
    if (ids.length === 0) return { projects: [] };

    const { data: msgs } = await externalAdmin
      .from("project_messages")
      .select("project_id, created_at, sender_id")
      .in("project_id", ids)
      .neq("sender_id", user.id)
      .order("created_at", { ascending: false });

    const byProject: Record<string, string> = {};
    for (const m of msgs ?? []) {
      if (!byProject[m.project_id]) byProject[m.project_id] = m.created_at;
    }
    return {
      projects: ids.map((pid) => ({ projectId: pid, lastFromOtherAt: byProject[pid] ?? null })),
    };
  });

export const listClienteProjectsForMessages = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string }) => {
    if (!i?.accessToken) throw new Error("accessToken obrigatório");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    const clientIds = await resolveClientIds(externalAdmin, user.id, user.email ?? null);
    if (clientIds.length === 0) return { projects: [] as any[] };

    const { data: projects } = await externalAdmin
      .from("projects")
      .select("id, name, office_id, created_at")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false });
    const projs = projects ?? [];
    if (projs.length === 0) return { projects: [] };

    const officeIds = Array.from(new Set(projs.map((p: any) => p.office_id).filter(Boolean)));
    const { data: offices } = officeIds.length
      ? await externalAdmin.from("offices").select("id, name, logo_url").in("id", officeIds)
      : { data: [] as any[] };
    const oMap = new Map((offices ?? []).map((o: any) => [o.id, o]));

    const ids = projs.map((p: any) => p.id);
    const { data: msgs } = await externalAdmin
      .from("project_messages")
      .select("project_id, sender_id, body, created_at")
      .in("project_id", ids)
      .order("created_at", { ascending: false });

    const lastByProject = new Map<string, any>();
    const unreadByProject = new Map<string, number>();
    for (const m of msgs ?? []) {
      if (!lastByProject.has(m.project_id)) lastByProject.set(m.project_id, m);
      if (m.sender_id !== user.id) {
        unreadByProject.set(m.project_id, (unreadByProject.get(m.project_id) ?? 0) + 1);
      }
    }

    return {
      projects: projs.map((p: any) => {
        const o = oMap.get(p.office_id);
        const last = lastByProject.get(p.id);
        return {
          id: p.id,
          name: p.name,
          office_id: p.office_id,
          office_name: o?.name ?? "—",
          office_logo: o?.logo_url ?? null,
          last_body: last?.body ?? null,
          last_at: last?.created_at ?? null,
          last_from_other: last ? last.sender_id !== user.id : false,
          unread: unreadByProject.get(p.id) ?? 0,
        };
      }),
    };
  });



export const sendClienteMessage = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string; projectId: string; body: string }) => {
    if (!i?.accessToken || !i?.projectId) throw new Error("params");
    const body = (i.body ?? "").trim();
    if (!body) throw new Error("empty");
    if (body.length > 2000) throw new Error("too_long");
    return { accessToken: i.accessToken, projectId: i.projectId, body };
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    await ensureProjectAccess(externalAdmin, user.id, user.email ?? null, data.projectId);
    const { error } = await externalAdmin.from("project_messages").insert({
      project_id: data.projectId,
      sender_id: user.id,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitClienteApproval = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string; stageId: string; status: string; note: string | null }) => {
    if (!i?.accessToken || !i?.stageId) throw new Error("params");
    if (!["approved", "rejected", "changes_requested"].includes(i.status)) throw new Error("status");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    const { data: stage } = await externalAdmin
      .from("project_stages")
      .select("project_id")
      .eq("id", data.stageId)
      .maybeSingle();
    if (!stage) throw new Error("not_found");
    await ensureProjectAccess(externalAdmin, user.id, user.email ?? null, stage.project_id);
    const { error } = await externalAdmin.from("stage_approvals").insert({
      stage_id: data.stageId,
      client_user_id: user.id,
      status: data.status,
      note: data.note,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signClienteDocUrl = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string; storagePath: string }) => {
    if (!i?.accessToken || !i?.storagePath) throw new Error("params");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    // Confirm the doc belongs to a project the user can access
    const { data: doc } = await externalAdmin
      .from("project_documents")
      .select("project_id, visible_to_client")
      .eq("storage_path", data.storagePath)
      .maybeSingle();
    if (!doc || !doc.visible_to_client) throw new Error("not_found");
    await ensureProjectAccess(externalAdmin, user.id, user.email ?? null, doc.project_id);
    const { data: signed, error } = await externalAdmin.storage
      .from("project-documents")
      .createSignedUrl(data.storagePath, 60 * 60);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const listClienteDiaryEntries = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string; projectId: string }) => {
    if (!i?.accessToken || !i?.projectId) throw new Error("params");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    await ensureProjectAccess(externalAdmin, user.id, user.email ?? null, data.projectId);
    const [diaryRes, visibleNotesRes] = await Promise.all([
      externalAdmin
        .from("project_notes")
        .select("id, project_id, body, noted_on, created_at")
        .eq("project_id", data.projectId)
        .eq("title", DIARY_TITLE)
        .order("noted_on", { ascending: false }),
      externalAdmin
        .from("project_notes")
        .select("id, project_id, title, body, noted_on")
        .eq("project_id", data.projectId)
        .eq("visible_to_client", true)
        .neq("title", DIARY_TITLE),
    ]);
    if (diaryRes.error) throw new Error(diaryRes.error.message);
    if (visibleNotesRes.error) throw new Error(visibleNotesRes.error.message);
    const entries = await buildDiaryEntries(externalAdmin, diaryRes.data ?? []);
    return { entries: applyActivityFallback(entries, visibleNotesRes.data ?? []) };
  });

export const listClienteRecentActivity = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string }) => {
    if (!i?.accessToken) throw new Error("accessToken obrigatório");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    const clientIds = await resolveClientIds(externalAdmin, user.id, user.email ?? null);
    if (clientIds.length === 0) return { items: [] as any[] };

    const { data: projects } = await externalAdmin
      .from("projects")
      .select("id, name, office_id")
      .in("client_id", clientIds);
    const projs = projects ?? [];
    if (projs.length === 0) return { items: [] };
    const projectIds = projs.map((p: any) => p.id);
    const pMap = new Map(projs.map((p: any) => [p.id, p]));

    const officeIds = Array.from(new Set(projs.map((p: any) => p.office_id).filter(Boolean)));
    const { data: offices } = officeIds.length
      ? await externalAdmin.from("offices").select("id, name, logo_url").in("id", officeIds)
      : { data: [] as any[] };
    const oMap = new Map((offices ?? []).map((o: any) => [o.id, o]));

    const [msgsRes, docsRes, prodsRes, meetsRes] = await Promise.all([
      externalAdmin
        .from("project_messages")
        .select("id, project_id, sender_id, body, created_at")
        .in("project_id", projectIds)
        .neq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15),
      externalAdmin
        .from("project_documents")
        .select("id, project_id, name, created_at")
        .in("project_id", projectIds)
        .eq("visible_to_client", true)
        .order("created_at", { ascending: false })
        .limit(15),
      externalAdmin
        .from("project_products")
        .select("id, project_id, name, created_at")
        .in("project_id", projectIds)
        .eq("visible_to_client", true)
        .order("created_at", { ascending: false })
        .limit(15),
      externalAdmin
        .from("project_meetings")
        .select("id, project_id, title, scheduled_at, created_at, client_status, status")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    const items: any[] = [];
    for (const m of msgsRes.data ?? []) {
      const p: any = pMap.get(m.project_id);
      const o: any = p ? oMap.get(p.office_id) : null;
      items.push({
        id: `msg:${m.id}`,
        type: "message",
        title: o?.name ?? "Escritório",
        text: (m.body ?? "").slice(0, 120),
        project_name: p?.name ?? "",
        office_logo: o?.logo_url ?? null,
        created_at: m.created_at,
        link: "/app/cliente/mensagens",
      });
    }
    for (const d of docsRes.data ?? []) {
      const p: any = pMap.get(d.project_id);
      const o: any = p ? oMap.get(p.office_id) : null;
      items.push({
        id: `doc:${d.id}`,
        type: "document",
        title: o?.name ?? "Escritório",
        text: `adicionou um documento: ${d.name}`,
        project_name: p?.name ?? "",
        office_logo: o?.logo_url ?? null,
        created_at: d.created_at,
        link: "/app/cliente/documentos",
      });
    }
    for (const pr of prodsRes.data ?? []) {
      const p: any = pMap.get(pr.project_id);
      const o: any = p ? oMap.get(p.office_id) : null;
      items.push({
        id: `prod:${pr.id}`,
        type: "product",
        title: o?.name ?? "Escritório",
        text: `adicionou um produto: ${pr.name}`,
        project_name: p?.name ?? "",
        office_logo: o?.logo_url ?? null,
        created_at: pr.created_at,
        link: "/app/cliente/produtos",
      });
    }
    for (const mt of meetsRes.data ?? []) {
      const p: any = pMap.get(mt.project_id);
      const o: any = p ? oMap.get(p.office_id) : null;
      const when = new Date(mt.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      items.push({
        id: `meet:${mt.id}`,
        type: "meeting",
        title: o?.name ?? "Escritório",
        text: mt.client_status === "pending"
          ? `agendou uma reunião: ${mt.title} (${when}) — confirme sua presença`
          : `reunião ${mt.client_status === "accepted" ? "confirmada" : "atualizada"}: ${mt.title}`,
        project_name: p?.name ?? "",
        office_logo: o?.logo_url ?? null,
        created_at: mt.created_at,
        link: "/app/cliente/aprovacoes",
      });
    }
    items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return { items: items.slice(0, 30) };
  });

export const submitClienteDocApproval = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string; documentId: string; status: string; note: string | null }) => {
    if (!i?.accessToken || !i?.documentId) throw new Error("params");
    if (!["approved", "rejected", "changes_requested"].includes(i.status)) throw new Error("status");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    const { data: doc } = await externalAdmin
      .from("project_documents")
      .select("project_id, requires_approval, visible_to_client")
      .eq("id", data.documentId)
      .maybeSingle();
    if (!doc || !doc.visible_to_client || !doc.requires_approval) throw new Error("not_found");
    await ensureProjectAccess(externalAdmin, user.id, user.email ?? null, doc.project_id);
    const { error } = await externalAdmin
      .from("project_documents")
      .update({
        approval_status: data.status,
        approval_note: data.note,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq("id", data.documentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitClienteMeetingDecision = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string; meetingId: string; decision: string; note: string | null }) => {
    if (!i?.accessToken || !i?.meetingId) throw new Error("params");
    if (!["accepted", "declined"].includes(i.decision)) throw new Error("decision");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);
    const { data: m } = await externalAdmin
      .from("project_meetings")
      .select("project_id")
      .eq("id", data.meetingId)
      .maybeSingle();
    if (!m) throw new Error("not_found");
    await ensureProjectAccess(externalAdmin, user.id, user.email ?? null, m.project_id);
    const { error } = await externalAdmin
      .from("project_meetings")
      .update({
        client_status: data.decision,
        client_note: data.note,
        client_decided_at: new Date().toISOString(),
        client_decided_by: user.id,
      })
      .eq("id", data.meetingId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
