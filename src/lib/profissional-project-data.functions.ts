import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AuthProjectInput = z.object({ accessToken: z.string().min(10), projectId: z.string().min(1) });
const ListInput = AuthProjectInput.extend({ limit: z.number().optional(), before: z.string().nullable().optional() });
const OfficeInput = z.object({ accessToken: z.string().min(10), officeId: z.string().min(1) });
const ProjectPatchInput = AuthProjectInput.extend({
  project: z.object({
    name: z.string().min(1).max(180),
    description: z.string().nullable().optional(),
    status: z.string().min(1).max(80),
    budget_cents: z.number().nullable().optional(),
    deadline: z.string().nullable().optional(),
    started_at: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    uf: z.string().nullable().optional(),
    cep: z.string().nullable().optional(),
    complement: z.string().nullable().optional(),
    area_m2: z.number().nullable().optional(),
    cover_url: z.string().nullable().optional(),
    portfolio_visible: z.boolean().optional(),
  }),
});
const ProjectCreateInput = OfficeInput.extend({
  project: z.object({
    client_id: z.string().min(1),
    name: z.string().min(1).max(180),
    description: z.string().nullable().optional(),
    status: z.string().min(1).max(80).optional(),
    budget_cents: z.number().nullable().optional(),
    deadline: z.string().nullable().optional(),
    started_at: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    uf: z.string().nullable().optional(),
    cep: z.string().nullable().optional(),
    complement: z.string().nullable().optional(),
    area_m2: z.number().nullable().optional(),
  }),
});
const SignedCoverUploadInput = AuthProjectInput.extend({
  fileName: z.string().min(1).max(180),
  contentType: z.string().min(1).max(120),
});
const DiaryActivitySchema = z.object({
  id: z.string().min(1).max(80),
  descricao: z.string().min(1).max(300),
  status: z.enum(["pendente", "andamento", "concluida"]),
});
const DiaryEntryInput = AuthProjectInput.extend({
  entry: z.object({
    id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weather: z.string().max(120).optional().default(""),
    atividades: z.array(DiaryActivitySchema).max(50).optional().default([]),
    observacao: z.string().max(5000).optional().default(""),
    photoPaths: z.array(z.string().min(1).max(600)).max(30).optional().default([]),
  }),
});

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export async function buildSenderLabels(
  externalAdmin: any,
  officeId: string,
  senderIds: string[],
  projectClientId?: string | null,
): Promise<Record<string, string>> {
  const labels: Record<string, string> = {};
  if (senderIds.length === 0) return labels;

  const { data: office } = await externalAdmin
    .from("offices")
    .select("id, owner_id, name")
    .eq("id", officeId)
    .maybeSingle();
  const officeName = office?.name ?? "Escritório";
  const ownerId = office?.owner_id ?? null;

  const { data: members } = await externalAdmin
    .from("office_members")
    .select("user_id, full_name, position")
    .eq("office_id", officeId)
    .in("user_id", senderIds);
  const memberByUser: Record<string, { full_name: string | null; position: string | null }> = {};
  for (const m of members ?? []) {
    if (m.user_id) memberByUser[m.user_id] = { full_name: m.full_name, position: m.position };
  }

  // Descobrir quais senders são o cliente do projeto (para não rotulá-los como escritório)
  const clientUserIds = new Set<string>();
  if (projectClientId) {
    const { data: links } = await externalAdmin
      .from("client_users")
      .select("user_id")
      .eq("client_id", projectClientId)
      .in("user_id", senderIds);
    for (const l of links ?? []) if (l.user_id) clientUserIds.add(l.user_id);
  }

  const missing: string[] = [];
  for (const id of senderIds) {
    if (id === ownerId) {
      labels[id] = officeName;
      continue;
    }
    const member = memberByUser[id];
    if (member) {
      const parts = [member.full_name?.trim() || "Membro"];
      if (member.position?.trim()) parts.push(member.position.trim());
      parts.push(officeName);
      labels[id] = parts.join(", ");
      continue;
    }
    missing.push(id);
  }

  if (missing.length > 0) {
    const { data: profs } = await externalAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", missing);
    const profileNames: Record<string, string> = {};
    for (const p of profs ?? []) profileNames[p.id] = p.full_name ?? "Usuário";
    for (const id of missing) {
      // Se não é o cliente do projeto, então é alguém do escritório (owner sem owner_id casado, admin, etc.)
      if (projectClientId && !clientUserIds.has(id)) {
        labels[id] = officeName;
      } else {
        labels[id] = profileNames[id] ?? "Usuário";
      }
    }
  }
  return labels;
}


/** Gate por módulo para membros com papel customizado (allowed_modules). */
function assertModuleAllowed(allowed: string[] | null | undefined, mod: string) {
  if (allowed && !allowed.includes(mod)) {
    throw new Error("Seu papel não tem acesso a este módulo.");
  }
}

async function auth(accessToken: string) {
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data, error } = await externalAdmin.auth.getUser(accessToken);
  if (error || !data?.user) throw new Error("Sessão expirada. Entre novamente.");
  return { externalAdmin, user: data.user };
}

async function ensureProjectAccess(externalAdmin: any, user: any, projectId: string) {
  const { data: project, error } = await externalAdmin
    .from("projects")
    .select("id, office_id, client_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!project?.office_id) throw new Error("Projeto não encontrado.");

  const { data: office } = await externalAdmin
    .from("offices")
    .select("id, owner_id")
    .eq("id", project.office_id)
    .maybeSingle();
  if (office?.owner_id === user.id) return { project, officeId: project.office_id, memberId: null };

  const email = normalizeEmail(user.email);
  const { data: members } = await externalAdmin
    .from("office_members")
    .select("id, status, user_id, email, allowed_modules")
    .eq("office_id", project.office_id)
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .limit(1);
  const member = members?.[0] ?? null;
  if (!member || member.status !== "active") throw new Error("Sem acesso a este projeto.");
  assertModuleAllowed(member.allowed_modules, "projetos");

  return { project, officeId: project.office_id, memberId: member.id };
}

async function ensureOfficeAccess(externalAdmin: any, user: any, officeId: string) {
  const { data: office } = await externalAdmin
    .from("offices")
    .select("id, owner_id")
    .eq("id", officeId)
    .maybeSingle();
  if (office?.owner_id === user.id) return;
  const email = normalizeEmail(user.email);
  const { data: members } = await externalAdmin
    .from("office_members")
    .select("id, allowed_modules")
    .eq("office_id", officeId)
    .eq("status", "active")
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .limit(1);
  if (!members?.length) throw new Error("Sem acesso a este escritório.");
  assertModuleAllowed(members[0].allowed_modules, "escritorio");
}

async function signProjectCover(externalAdmin: any, coverUrl: string | null | undefined) {
  if (!coverUrl) return "";
  if (/^https?:\/\//i.test(coverUrl)) return coverUrl;
  const { data } = await externalAdmin.storage.from("project-photos").createSignedUrl(coverUrl, 60 * 60);
  return data?.signedUrl ?? "";
}

function safeStorageName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

const DIARY_TITLE = "[Diário de obra]";
const DIARY_ALBUM = "outros";

function diaryCaption(id: string) {
  return `Diário de obra:${id}`;
}

function parseDiaryBody(body: string | null | undefined) {
  try {
    const parsed = JSON.parse(body || "{}");
    return {
      weather: String(parsed.weather ?? ""),
      atividades: Array.isArray(parsed.atividades) ? parsed.atividades : [],
      observacao: String(parsed.observacao ?? ""),
    };
  } catch {
    return { weather: "", atividades: [], observacao: body ?? "" };
  }
}

async function buildDiaryEntries(externalAdmin: any, notes: any[]) {
  const captions = notes.map((n) => diaryCaption(n.id));
  const photosByNote: Record<string, string[]> = {};
  if (notes.length > 0) {
    const { data: photos } = await externalAdmin
      .from("project_photos")
      .select("caption, storage_path, created_at")
      .in("caption", captions)
      .order("created_at", { ascending: true });
    for (const p of photos ?? []) {
      const { data: signed } = await externalAdmin.storage.from("project-photos").createSignedUrl(p.storage_path, 3600);
      if (!signed?.signedUrl) continue;
      const cap = String(p.caption ?? "");
      if (!photosByNote[cap]) photosByNote[cap] = [];
      photosByNote[cap].push(signed.signedUrl);
    }
  }
  return notes.map((n) => {
    const body = parseDiaryBody(n.body);
    return {
      id: n.id,
      date: n.noted_on,
      weather: body.weather,
      atividades: body.atividades,
      observacao: body.observacao,
      photos: photosByNote[diaryCaption(n.id)] ?? [],
      created_at: n.created_at,
    };
  });
}

async function readProjectDetails(externalAdmin: any, projectId: string) {
  const full = await externalAdmin
    .from("projects")
    .select("id, name, description, status, budget_cents, deadline, started_at, location, city, uf, cep, complement, area_m2, cover_url, portfolio_visible")
    .eq("id", projectId)
    .maybeSingle();
  if (!full.error) return full.data;

  const basic = await externalAdmin
    .from("projects")
    .select("id, name, description, status, budget_cents, deadline, location, city, area_m2")
    .eq("id", projectId)
    .maybeSingle();
  if (basic.error) throw new Error(basic.error.message);
  return basic.data;
}

export const getProfessionalProject = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const project = await readProjectDetails(externalAdmin, data.projectId);
    if (!project) throw new Error("Projeto não encontrado.");
    return { project: { ...project, cover_preview_url: await signProjectCover(externalAdmin, project.cover_url) } };
  });

export const createProfessionalProjectCoverUpload = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => SignedCoverUploadInput.parse(i))
  .handler(async ({ data }) => {
    if (!data.contentType.startsWith("image/")) throw new Error("Selecione uma imagem.");
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const fileName = safeStorageName(data.fileName);
    const path = `covers/${data.projectId}/${Date.now()}_${fileName}`;
    const { data: signed, error } = await externalAdmin.storage.from("project-photos").createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed?.token ?? "" };
  });

export const updateProfessionalProject = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ProjectPatchInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    const { officeId } = await ensureProjectAccess(externalAdmin, user, data.projectId);
    const before = await readProjectDetails(externalAdmin, data.projectId).catch(() => null);
    const { error } = await externalAdmin.from("projects").update(data.project).eq("id", data.projectId);
    if (error) throw new Error(error.message);
    const oldCover = before?.cover_url as string | null | undefined;
    const newCover = data.project.cover_url;
    if (oldCover && oldCover !== newCover && !/^https?:\/\//i.test(oldCover)) {
      await externalAdmin.storage.from("project-photos").remove([oldCover]);
    }
    const { logProjectActivity } = await import("@/lib/project-activity.functions");
    const changed = Object.keys(data.project).join(", ");
    await logProjectActivity(externalAdmin, {
      projectId: data.projectId, officeId, userId: user.id, userEmail: user.email,
      action: "project.updated", detail: changed ? `Campos: ${changed}` : undefined,
    });
    return { ok: true };
  });

export const deleteProfessionalProject = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    const { officeId } = await ensureProjectAccess(externalAdmin, user, data.projectId);
    const before = await readProjectDetails(externalAdmin, data.projectId).catch(() => null);
    const { logProjectActivity } = await import("@/lib/project-activity.functions");
    await logProjectActivity(externalAdmin, {
      projectId: data.projectId, officeId, userId: user.id, userEmail: user.email,
      action: "project.deleted", detail: (before as any)?.name ?? undefined,
    });
    const { error } = await externalAdmin.from("projects").delete().eq("id", data.projectId);
    if (error) throw new Error(error.message);
    const oldCover = before?.cover_url as string | null | undefined;
    if (oldCover && !/^https?:\/\//i.test(oldCover)) {
      await externalAdmin.storage.from("project-photos").remove([oldCover]);
    }
    return { ok: true };
  });

export const createProfessionalProject = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ProjectCreateInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureOfficeAccess(externalAdmin, user, data.officeId);
    const payload = {
      ...data.project,
      office_id: data.officeId,
      status: data.project.status ?? "briefing",
      started_at: data.project.started_at ?? new Date().toISOString(),
    };
    const { data: inserted, error } = await externalAdmin.from("projects").insert(payload).select("id, name").single();
    if (error) throw new Error(error.message);
    if (inserted?.id) {
      const { logProjectActivity } = await import("@/lib/project-activity.functions");
      await logProjectActivity(externalAdmin, {
        projectId: inserted.id, officeId: data.officeId, userId: user.id, userEmail: user.email,
        action: "project.created", detail: inserted.name ?? undefined,
      });
    }
    return { ok: true, id: inserted?.id };
  });

export const listProfessionalMessages = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ListInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    const { officeId, project } = await ensureProjectAccess(externalAdmin, user, data.projectId);
    const limit = Math.min(Math.max(data.limit ?? 50, 1), 500);
    let q = externalAdmin
      .from("project_messages")
      .select("id, project_id, sender_id, body, created_at")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data.before) q = q.lt("created_at", data.before);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const messages = (rows ?? []).slice().reverse();
    const ids = Array.from(new Set(messages.map((m: any) => m.sender_id))).filter(Boolean) as string[];
    const senderNames = await buildSenderLabels(externalAdmin, officeId, ids, project?.client_id ?? null);
    return { messages, userId: user.id, senderNames, hasMore: (rows?.length ?? 0) === limit };
  });

export const sendProfessionalMessage = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ body: z.string().min(1).max(2000) }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    const { officeId } = await ensureProjectAccess(externalAdmin, user, data.projectId);
    const body = data.body.trim();
    const { error } = await externalAdmin.from("project_messages").insert({
      project_id: data.projectId,
      sender_id: user.id,
      body,
    });
    if (error) throw new Error(error.message);
    const { logProjectActivity } = await import("@/lib/project-activity.functions");
    const preview = body.length > 80 ? body.slice(0, 80) + "…" : body;
    await logProjectActivity(externalAdmin, {
      projectId: data.projectId, officeId, userId: user.id, userEmail: user.email,
      action: "message.sent", detail: preview,
    });
    return { ok: true };
  });

export const listProfessionalMeetings = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { data: rows, error } = await externalAdmin
      .from("project_meetings")
      .select("id, project_id, title, scheduled_at, duration_min, location, mode, link, notes, status")
      .eq("project_id", data.projectId)
      .order("scheduled_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { meetings: rows ?? [] };
  });

export const saveProfessionalMeeting = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ meeting: z.record(z.string(), z.any()), id: z.string().nullable().optional() }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const payload = { ...data.meeting, project_id: data.projectId, created_by: user.id };
    const q = data.id
      ? await externalAdmin.from("project_meetings").update(payload).eq("id", data.id).eq("project_id", data.projectId)
      : await externalAdmin.from("project_meetings").insert(payload);
    if (q.error) throw new Error(q.error.message);
    return { ok: true };
  });

export const deleteProfessionalMeeting = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ id: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { error } = await externalAdmin.from("project_meetings").delete().eq("id", data.id).eq("project_id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listProfessionalNotes = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const [stagesRes, notesRes] = await Promise.all([
      externalAdmin.from("project_stages").select("id, title, order_index").eq("project_id", data.projectId).order("order_index", { ascending: true }),
      externalAdmin.from("project_notes").select("id, project_id, stage_id, meeting_id, title, body, visible_to_client, noted_on, created_at").eq("project_id", data.projectId).order("noted_on", { ascending: false }),
    ]);
    if (notesRes.error) throw new Error(notesRes.error.message);
    return { stages: stagesRes.data ?? [], notes: (notesRes.data ?? []).filter((n: any) => n.title !== DIARY_TITLE) };
  });

export const saveProfessionalNote = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ note: z.record(z.string(), z.any()), id: z.string().nullable().optional() }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const payload = { ...data.note, project_id: data.projectId, created_by: user.id };
    const q = data.id
      ? await externalAdmin.from("project_notes").update(payload).eq("id", data.id).eq("project_id", data.projectId)
      : await externalAdmin.from("project_notes").insert(payload);
    if (q.error) throw new Error(q.error.message);
    return { ok: true };
  });

export const deleteProfessionalNote = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ id: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { error } = await externalAdmin.from("project_notes").delete().eq("id", data.id).eq("project_id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listProfessionalDiaryEntries = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { data: notes, error } = await externalAdmin
      .from("project_notes")
      .select("id, body, noted_on, created_at")
      .eq("project_id", data.projectId)
      .eq("title", DIARY_TITLE)
      .order("noted_on", { ascending: false });
    if (error) throw new Error(error.message);
    return { entries: await buildDiaryEntries(externalAdmin, notes ?? []) };
  });

export const saveProfessionalDiaryEntry = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => DiaryEntryInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const body = JSON.stringify({
      weather: data.entry.weather,
      atividades: data.entry.atividades,
      observacao: data.entry.observacao,
    });

    const { data: existing } = await externalAdmin
      .from("project_notes")
      .select("id")
      .eq("id", data.entry.id)
      .eq("project_id", data.projectId)
      .maybeSingle();

    let noteId = data.entry.id;
    if (existing?.id) {
      const { error } = await externalAdmin
        .from("project_notes")
        .update({ body, noted_on: data.entry.date })
        .eq("id", existing.id)
        .eq("project_id", data.projectId);
      if (error) throw new Error(error.message);
    } else {
      const { data: note, error } = await externalAdmin
        .from("project_notes")
        .insert({
          id: data.entry.id,
          project_id: data.projectId,
          title: DIARY_TITLE,
          body,
          visible_to_client: true,
          noted_on: data.entry.date,
          created_by: user.id,
        })
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      noteId = note?.id ?? data.entry.id;
    }

    if (data.entry.photoPaths.length > 0) {
      const { error: photoError } = await externalAdmin.from("project_photos").insert(
        data.entry.photoPaths.map((path) => ({
          project_id: data.projectId,
          album: DIARY_ALBUM,
          storage_path: path,
          uploaded_by: user.id,
          caption: diaryCaption(noteId),
        })),
      );
      if (photoError) throw new Error(photoError.message);
    }
    return { ok: true };
  });

export const deleteProfessionalDiaryEntry = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const caption = diaryCaption(data.id);
    const { data: photos } = await externalAdmin.from("project_photos").select("id, storage_path").eq("project_id", data.projectId).eq("caption", caption);
    const { error } = await externalAdmin.from("project_notes").delete().eq("id", data.id).eq("project_id", data.projectId).eq("title", DIARY_TITLE);
    if (error) throw new Error(error.message);
    if (photos?.length) {
      await externalAdmin.storage.from("project-photos").remove(photos.map((p: any) => p.storage_path));
      await externalAdmin.from("project_photos").delete().in("id", photos.map((p: any) => p.id));
    }
    return { ok: true };
  });

export const listProfessionalDocuments = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    let q: any = await externalAdmin
      .from("project_documents")
      .select("id, name, storage_path, mime_type, size_bytes, visible_to_client, requires_approval, approval_status, approval_note, doc_kind, created_at")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (q.error) {
      q = await externalAdmin
        .from("project_documents")
        .select("id, name, storage_path, mime_type, size_bytes, visible_to_client, created_at")
        .eq("project_id", data.projectId)
        .order("created_at", { ascending: false });
    }
    if (q.error) throw new Error(q.error.message);
    return { documents: q.data ?? [] };
  });

export const createProfessionalDocumentRecord = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ document: z.record(z.string(), z.any()) }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    const { officeId } = await ensureProjectAccess(externalAdmin, user, data.projectId);
    let q = await externalAdmin.from("project_documents").insert({ ...data.document, project_id: data.projectId, uploaded_by: user.id });
    if (q.error) {
      const { requires_approval, approval_status, approval_note, doc_kind, ...basic } = data.document;
      q = await externalAdmin.from("project_documents").insert({ ...basic, project_id: data.projectId, uploaded_by: user.id });
    }
    if (q.error) throw new Error(q.error.message);
    try {
      const { logProjectActivity } = await import("@/lib/project-activity.functions");
      await logProjectActivity(externalAdmin, {
        projectId: data.projectId, officeId, userId: user.id, userEmail: user.email,
        action: "document.uploaded",
        detail: (data.document as any)?.name ?? undefined,
      });
    } catch {}
    return { ok: true };
  });

export const signProfessionalDocumentUrl = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ id: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { data: doc, error } = await externalAdmin.from("project_documents").select("storage_path").eq("id", data.id).eq("project_id", data.projectId).maybeSingle();
    if (error || !doc) throw new Error(error?.message ?? "Documento não encontrado.");
    const { data: signed, error: signError } = await externalAdmin.storage.from("project-documents").createSignedUrl(doc.storage_path, 60 * 60);
    if (signError) throw new Error(signError.message);
    return { url: signed?.signedUrl ?? "" };
  });

export const deleteProfessionalDocument = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ id: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    const { officeId } = await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { data: doc } = await externalAdmin.from("project_documents").select("storage_path, name").eq("id", data.id).eq("project_id", data.projectId).maybeSingle();
    const { error } = await externalAdmin.from("project_documents").delete().eq("id", data.id).eq("project_id", data.projectId);
    if (error) throw new Error(error.message);
    if (doc?.storage_path) await externalAdmin.storage.from("project-documents").remove([doc.storage_path]);
    try {
      const { logProjectActivity } = await import("@/lib/project-activity.functions");
      await logProjectActivity(externalAdmin, {
        projectId: data.projectId, officeId, userId: user.id, userEmail: user.email,
        action: "document.deleted",
        detail: (doc as any)?.name ?? undefined,
      });
    } catch {}
    return { ok: true };
  });


export const listProfessionalPhotos = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { data: rows, error } = await externalAdmin
      .from("project_photos")
      .select("id, project_id, album, storage_path, caption, created_at")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const photos = [];
    for (const p of rows ?? []) {
      const { data: signed } = await externalAdmin.storage.from("project-photos").createSignedUrl(p.storage_path, 3600);
      photos.push({ ...p, signedUrl: signed?.signedUrl });
    }
    return { photos };
  });

export const createProfessionalPhotoRecord = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ photo: z.record(z.string(), z.any()) }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { error } = await externalAdmin.from("project_photos").insert({ ...data.photo, project_id: data.projectId, uploaded_by: user.id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProfessionalPhoto = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ id: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { data: photo } = await externalAdmin.from("project_photos").select("storage_path").eq("id", data.id).eq("project_id", data.projectId).maybeSingle();
    const { error } = await externalAdmin.from("project_photos").delete().eq("id", data.id).eq("project_id", data.projectId);
    if (error) throw new Error(error.message);
    if (photo?.storage_path) await externalAdmin.storage.from("project-photos").remove([photo.storage_path]);
    return { ok: true };
  });

export const listProfessionalProducts = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { data: products, error } = await externalAdmin.from("project_products").select("*").eq("project_id", data.projectId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { products: products ?? [] };
  });

export const saveProfessionalProduct = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ product: z.record(z.string(), z.any()), id: z.string().nullable().optional() }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const payload = { ...data.product, project_id: data.projectId, created_by: user.id };
    const q = data.id
      ? await externalAdmin.from("project_products").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", data.id).eq("project_id", data.projectId)
      : await externalAdmin.from("project_products").insert(payload);
    if (q.error) throw new Error(q.error.message);
    return { ok: true };
  });

export const deleteProfessionalProduct = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ id: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { error } = await externalAdmin.from("project_products").delete().eq("id", data.id).eq("project_id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setProfessionalProductPurchased = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.extend({ id: z.string().min(1), purchased: z.boolean() }).parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { error } = await externalAdmin
      .from("project_products")
      .update({ purchased: data.purchased, purchased_at: data.purchased ? new Date().toISOString() : null, purchased_by: data.purchased ? user.id : null, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("project_id", data.projectId);
    if (error) throw new Error(error.message);
    await externalAdmin.from("product_activity_log").insert({
      project_id: data.projectId,
      product_id: data.id,
      action: data.purchased ? "purchased" : "unpurchased",
      actor_role: "office",
      actor_id: user.id,
    });
    return { ok: true };
  });

export const listProfessionalProductActivity = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthProjectInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);
    const { data: logs } = await externalAdmin.from("product_activity_log").select("id, product_id, action, actor_role, created_at").eq("project_id", data.projectId).order("created_at", { ascending: false }).limit(100);
    const ids = Array.from(new Set((logs ?? []).map((l: any) => l.product_id)));
    let names: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: products } = await externalAdmin.from("project_products").select("id, name").in("id", ids);
      names = Object.fromEntries((products ?? []).map((p: any) => [p.id, p.name]));
    }
    return { rows: ((logs ?? []) as any[]).map((l) => ({ ...l, product_name: names[l.product_id] ?? "—" })) };
  });

export const listProfessionalProductCategories = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => OfficeInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureOfficeAccess(externalAdmin, user, data.officeId);
    const { data: categories, error } = await externalAdmin.from("product_categories").select("*").eq("office_id", data.officeId).order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return { categories: categories ?? [] };
  });
// ---------- Cronograma (bypasses RLS recursion in projects) ----------
const AuthOnlyInput = z.object({ accessToken: z.string().min(10) });

export const listProfessionalCronograma = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthOnlyInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);

    // Resolve office (owner or active member)
    let officeId: string | null = null;
    const { data: ownerOffices } = await externalAdmin
      .from("offices")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    if (ownerOffices?.[0]?.id) {
      officeId = ownerOffices[0].id;
    } else {
      const email = normalizeEmail(user.email);
      const { data: members } = await externalAdmin
        .from("office_members")
        .select("office_id, status, user_id, email, allowed_modules")
        .or(`user_id.eq.${user.id},email.eq.${email}`)
        .eq("status", "active")
        .limit(1);
      if (members?.[0]) assertModuleAllowed(members[0].allowed_modules, "cronograma");
      officeId = members?.[0]?.office_id ?? null;
    }
    if (!officeId) return { projects: [], stages: [], meetings: [] };

    const { data: projs, error: pe } = await externalAdmin
      .from("projects")
      .select("id, name, status, deadline, client_id, created_at")
      .eq("office_id", officeId)
      .order("created_at", { ascending: false });
    if (pe) throw new Error(pe.message);

    const ids = (projs ?? []).map((p: any) => p.id);

    let clientsById: Record<string, string> = {};
    const clientIds = Array.from(new Set((projs ?? []).map((p: any) => p.client_id).filter(Boolean)));
    if (clientIds.length > 0) {
      const { data: clients } = await externalAdmin
        .from("clients")
        .select("id, name")
        .in("id", clientIds);
      clientsById = Object.fromEntries((clients ?? []).map((c: any) => [c.id, c.name]));
    }

    let stages: any[] = [];
    let meetings: any[] = [];
    if (ids.length > 0) {
      const [stagesRes, meetingsRes] = await Promise.all([
        externalAdmin
          .from("project_stages")
          .select("id, project_id, title, status, order_index, end_at")
          .in("project_id", ids)
          .order("order_index", { ascending: true }),
        externalAdmin
          .from("project_meetings")
          .select("id, project_id, title, scheduled_at, mode, location, link, status, notes")
          .in("project_id", ids)
          .neq("status", "cancelada")
          .order("scheduled_at", { ascending: true }),
      ]);
      stages = stagesRes.data ?? [];
      meetings = meetingsRes.data ?? [];
    }

    const projects = (projs ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      deadline: p.deadline ?? null,
      client_id: p.client_id ?? null,
      client_name: p.client_id ? (clientsById[p.client_id] ?? null) : null,
    }));

    return { officeId, projects, stages, meetings };
  });

const AuthInput = z.object({ accessToken: z.string().min(10) });

export const listProfessionalConversations = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);

    // Resolve the office the user belongs to (owner OR active member)
    const { data: ownerOffice } = await externalAdmin
      .from("offices")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);
    let officeId: string | null = ownerOffice?.[0]?.id ?? null;
    if (!officeId) {
      const email = (user.email ?? "").trim().toLowerCase();
      const { data: members } = await externalAdmin
        .from("office_members")
        .select("office_id, status, allowed_modules")
        .or(`user_id.eq.${user.id},email.eq.${email}`)
        .eq("status", "active")
        .limit(1);
      if (members?.[0]) assertModuleAllowed(members[0].allowed_modules, "mensagens");
      officeId = members?.[0]?.office_id ?? null;
    }
    if (!officeId) return { userId: user.id, conversations: [] };

    const { data: projects } = await externalAdmin
      .from("projects")
      .select("id, name, client_id")
      .eq("office_id", officeId);
    const projs = projects ?? [];
    if (projs.length === 0) return { userId: user.id, conversations: [] };

    const clientIds = Array.from(new Set(projs.map((p: any) => p.client_id).filter(Boolean)));
    const { data: clients } = clientIds.length
      ? await externalAdmin.from("clients").select("id, name, email").in("id", clientIds)
      : { data: [] as any[] };
    const clientMap = new Map((clients ?? []).map((c: any) => [c.id, c]));

    const ids = projs.map((p: any) => p.id);
    const { data: msgs } = await externalAdmin
      .from("project_messages")
      .select("project_id, sender_id, body, created_at")
      .in("project_id", ids)
      .order("created_at", { ascending: false });

    const byProj = new Map<string, any[]>();
    for (const m of msgs ?? []) {
      const arr = byProj.get(m.project_id) ?? [];
      arr.push(m);
      byProj.set(m.project_id, arr);
    }

    const conversations = projs
      .filter((p: any) => byProj.has(p.id))
      .map((p: any) => {
        const ms = byProj.get(p.id) ?? [];
        const ultima = ms[0];
        const c = p.client_id ? clientMap.get(p.client_id) : null;
        return {
          projectId: p.id,
          projectName: p.name,
          clientId: p.client_id ?? "",
          clientName: c?.name ?? c?.email ?? "Sem cliente",
          ultimaMensagem: ultima?.body ?? "",
          ultimaData: ultima?.created_at ?? "",
          ultimaSenderId: ultima?.sender_id ?? "",
          totalMensagens: ms.length,
          mensagensDeOutros: ms
            .filter((mm: any) => mm.sender_id !== user.id)
            .map((mm: any) => mm.created_at),
        };
      });

    return { userId: user.id, conversations };
  });

const STATUS_LABEL_PT: Record<string, string> = {
  design: "Em projeto",
  briefing: "Briefing",
  execution: "Execução",
  delivery: "Entrega",
  completed: "Concluído",
  paused: "Pausado",
};

export const listProfessionalProjects = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);

    const { data: ownerOffice } = await externalAdmin
      .from("offices")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);
    let officeId: string | null = ownerOffice?.[0]?.id ?? null;
    if (!officeId) {
      const email = (user.email ?? "").trim().toLowerCase();
      const { data: members } = await externalAdmin
        .from("office_members")
        .select("office_id, status, allowed_modules")
        .or(`user_id.eq.${user.id},email.eq.${email}`)
        .eq("status", "active")
        .limit(1);
      if (members?.[0]) assertModuleAllowed(members[0].allowed_modules, "projetos");
      officeId = members?.[0]?.office_id ?? null;
    }
    if (!officeId) return { officeId: null, projects: [] };

    const { data: projects } = await externalAdmin
      .from("projects")
      .select("id, name, status, client_id, budget_cents, deadline, created_at")
      .eq("office_id", officeId)
      .order("created_at", { ascending: false });
    const projs = projects ?? [];
    if (projs.length === 0) return { officeId, projects: [] };

    const clientIds = Array.from(new Set(projs.map((p: any) => p.client_id).filter(Boolean)));
    const { data: clients } = clientIds.length
      ? await externalAdmin.from("clients").select("id, name").in("id", clientIds)
      : { data: [] as any[] };
    const clientMap = new Map((clients ?? []).map((c: any) => [c.id, c.name]));

    const ids = projs.map((p: any) => p.id);
    const { data: stages } = await externalAdmin
      .from("project_stages")
      .select("project_id, status, progress, title, end_at")
      .in("project_id", ids);

    const byProj = new Map<string, any[]>();
    for (const s of stages ?? []) {
      const arr = byProj.get(s.project_id) ?? [];
      arr.push(s);
      byProj.set(s.project_id, arr);
    }

    const today = new Date().toISOString().slice(0, 10);
    const rows = projs.map((p: any) => {
      const ss = byProj.get(p.id) ?? [];
      const prog = ss.length > 0
        ? Math.round(ss.reduce((a, s) => a + (s.progress ?? 0), 0) / ss.length)
        : 0;
      const proxima = ss
        .filter((s: any) => s.end_at && s.status !== "done")
        .sort((a: any, b: any) => (a.end_at < b.end_at ? -1 : 1))[0];
      const faseAtual = ss.find((s: any) => s.status === "in_progress")?.title
        ?? STATUS_LABEL_PT[p.status] ?? "Em andamento";
      const overdue = p.deadline && p.deadline < today && p.status !== "completed";
      return {
        id: p.id,
        nome: p.name,
        cliente: clientMap.get(p.client_id) ?? "—",
        clientId: p.client_id ?? null,
        fase: faseAtual,
        progresso: prog,
        proximaEntrega: proxima?.end_at ?? p.deadline ?? null,
        status: overdue ? "Atenção" : STATUS_LABEL_PT[p.status] ?? "No prazo",
        rawStatus: p.status,
        budgetCents: p.budget_cents ?? 0,
      };

    });

    return { officeId, projects: rows };
  });

const SummaryInput = AuthInput.extend({ projectId: z.string().min(1) });

export const getProfessionalProjectSummary = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => SummaryInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    await ensureProjectAccess(externalAdmin, user, data.projectId);

    const [projRes, stagesRes, productsRes, meetingsRes, msgsRes, notesRes, docsRes] = await Promise.all([
      externalAdmin.from("projects").select("id, name, description, status, budget_cents, deadline, started_at, location, city, uf, area_m2, client_id, office_id, created_at").eq("id", data.projectId).maybeSingle(),
      externalAdmin.from("project_stages").select("id, title, status, progress, start_at, end_at, order_index").eq("project_id", data.projectId).order("order_index", { ascending: true }),
      externalAdmin.from("project_products").select("name, status, price_cents, quantity").eq("project_id", data.projectId).limit(500),
      externalAdmin.from("project_meetings").select("title, scheduled_at, status").eq("project_id", data.projectId).order("scheduled_at", { ascending: false }).limit(50),
      externalAdmin.from("project_messages").select("id", { count: "exact", head: true }).eq("project_id", data.projectId),
      externalAdmin.from("project_notes").select("title, body, noted_on").eq("project_id", data.projectId).neq("title", DIARY_TITLE).order("noted_on", { ascending: false }).limit(20),
      externalAdmin.from("project_documents").select("id, stage_id, name, mime_type, size_bytes, visible_to_client, created_at").eq("project_id", data.projectId).order("created_at", { ascending: false }).limit(500),
    ]);

    const project = projRes.data;
    if (!project) throw new Error("Projeto não encontrado.");

    const stages = stagesRes.data ?? [];
    const stageIds = stages.map((s: any) => s.id);
    let approvals: any[] = [];
    if (stageIds.length > 0) {
      const apRes = await externalAdmin
        .from("stage_approvals")
        .select("id, stage_id, client_user_id, status, note, created_at")
        .in("stage_id", stageIds)
        .order("created_at", { ascending: false });
      approvals = apRes.data ?? [];
    }
    const stageTitle: Record<string, string> = {};
    for (const s of stages) stageTitle[s.id] = s.title;
    const approvalsWithStage = approvals.map((a) => ({ ...a, stage_title: stageTitle[a.stage_id] ?? "—" }));

    const [clientRes, officeRes] = await Promise.all([
      project.client_id ? externalAdmin.from("clients").select("name, email, phone").eq("id", project.client_id).maybeSingle() : Promise.resolve({ data: null }),
      externalAdmin.from("offices").select("name").eq("id", project.office_id).maybeSingle(),
    ]);

    return {
      project,
      client: clientRes.data ?? null,
      office: officeRes.data ?? null,
      stages,
      products: productsRes.data ?? [],
      meetings: meetingsRes.data ?? [],
      notes: notesRes.data ?? [],
      documents: docsRes.data ?? [],
      approvals: approvalsWithStage,
      messagesCount: (msgsRes as any).count ?? 0,
    };
  });

// ============ Financial reports ============

async function resolveOwnerOfficeId(externalAdmin: any, user: any): Promise<string | null> {
  const { data: ownerOffice } = await externalAdmin
    .from("offices").select("id").eq("owner_id", user.id).limit(1);
  if (ownerOffice?.[0]?.id) return ownerOffice[0].id;
  const email = (user.email ?? "").trim().toLowerCase();
  const { data: members } = await externalAdmin
    .from("office_members")
    .select("office_id, status")
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .eq("status", "active")
    .limit(1);
  return members?.[0]?.office_id ?? null;
}

export const getOfficeFinancialReport = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    const officeId = await resolveOwnerOfficeId(externalAdmin, user);
    if (!officeId) return { officeId: null, office: null, projects: [], clients: [], products: [], totals: null };

    const [officeRes, projectsRes, clientsRes] = await Promise.all([
      externalAdmin.from("offices").select("id, name").eq("id", officeId).maybeSingle(),
      externalAdmin.from("projects").select("id, name, status, client_id, budget_cents, deadline, started_at, created_at").eq("office_id", officeId),
      externalAdmin.from("clients").select("id, name, email").eq("office_id", officeId),
    ]);
    const projects = projectsRes.data ?? [];
    const clients = clientsRes.data ?? [];
    const projectIds = projects.map((p: any) => p.id);
    const { data: products } = projectIds.length
      ? await externalAdmin.from("project_products").select("project_id, name, status, price_cents, quantity").in("project_id", projectIds)
      : { data: [] as any[] };

    return {
      officeId,
      office: officeRes.data ?? null,
      projects,
      clients,
      products: products ?? [],
    };
  });

const ClientReportInput = AuthInput.extend({ clientId: z.string().min(1) });

export const getClientFinancialReport = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ClientReportInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    const officeId = await resolveOwnerOfficeId(externalAdmin, user);
    if (!officeId) throw new Error("Escritório não encontrado.");

    const [officeRes, clientRes, projectsRes] = await Promise.all([
      externalAdmin.from("offices").select("id, name").eq("id", officeId).maybeSingle(),
      externalAdmin.from("clients").select("id, name, email, phone").eq("id", data.clientId).eq("office_id", officeId).maybeSingle(),
      externalAdmin.from("projects").select("id, name, status, budget_cents, deadline, started_at, created_at").eq("office_id", officeId).eq("client_id", data.clientId),
    ]);
    if (!clientRes.data) throw new Error("Cliente não encontrado.");
    const projects = projectsRes.data ?? [];
    const projectIds = projects.map((p: any) => p.id);
    const { data: products } = projectIds.length
      ? await externalAdmin.from("project_products").select("project_id, name, status, price_cents, quantity").in("project_id", projectIds)
      : { data: [] as any[] };

    return {
      office: officeRes.data ?? null,
      client: clientRes.data,
      projects,
      products: products ?? [],
    };
  });

// ============ Profissional dashboard (aggregated) ============

export const getProfissionalDashboard = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AuthInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);

    // Resolve office. Ownership wins — dono do escritório vê tudo.
    // Só é tratado como membro quando NÃO é dono de nenhum escritório.
    let isMember = false;
    let memberModules: string[] | null = null;
    let office: any = null;
    const email = (user.email ?? "").trim().toLowerCase();

    const { data: owned } = await externalAdmin
      .from("offices")
      .select("id, name, onboarding_completed")
      .eq("owner_id", user.id)
      .limit(1);
    office = owned?.[0] ?? null;

    if (!office) {
      const { data: mems } = await externalAdmin
        .from("office_members")
        .select("office_id, status, allowed_modules")
        .or(`user_id.eq.${user.id},email.eq.${email}`)
        .eq("status", "active")
        .limit(1);
      memberModules = (mems?.[0]?.allowed_modules as string[] | null) ?? null;
      const memId = mems?.[0]?.office_id;
      if (memId) {
        const { data: mo } = await externalAdmin
          .from("offices")
          .select("id, name, onboarding_completed")
          .eq("id", memId)
          .maybeSingle();
        office = mo ?? null;
        isMember = !!office;
      }
    }
    if (!office) {
      return {
        officeId: null,
        officeName: null,
        onboarded: false,
        projects: [],
        clients: [],
        stages: [],
        messages: [],
        unreadCount: 0,
        isMember: false,
        allowedModules: null as string[] | null,
      };
    }

    const officeId = office.id;
    const [projectsRes, clientsRes] = await Promise.all([
      externalAdmin
        .from("projects")
        .select("id, name, status, client_id, budget_cents, deadline, created_at")
        .eq("office_id", officeId)
        .order("created_at", { ascending: false }),
      externalAdmin
        .from("clients")
        .select("id, name, status, created_at")
        .eq("office_id", officeId)
        .order("created_at", { ascending: false }),
    ]);
    const projects = projectsRes.data ?? [];
    const clients = clientsRes.data ?? [];
    const projectIds = projects.map((p: any) => p.id);

    let stages: any[] = [];
    let approvals: any[] = [];
    let unreadCount = 0;
    let messages: any[] = [];
    if (projectIds.length > 0) {
      const [stagesRes, countRes, msgsRes] = await Promise.all([
        externalAdmin
          .from("project_stages")
          .select("id, project_id, status, progress, title, end_at")
          .in("project_id", projectIds),
        externalAdmin
          .from("project_messages")
          .select("id", { count: "exact", head: true })
          .in("project_id", projectIds)
          .neq("sender_id", user.id),
        externalAdmin
          .from("project_messages")
          .select("id, project_id, sender_name, content, created_at")
          .in("project_id", projectIds)
          .neq("sender_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      stages = stagesRes.data ?? [];
      unreadCount = countRes.count ?? 0;
      messages = msgsRes.data ?? [];
      if (stages.length) {
        const stageIds = stages.map((s: any) => s.id);
        const { data: ap } = await externalAdmin
          .from("stage_approvals")
          .select("id, stage_id, status")
          .in("stage_id", stageIds);
        approvals = ap ?? [];
      }
    }

    return {
      officeId,
      officeName: office.name ?? null,
      onboarded: !!office.onboarding_completed,
      projects,
      clients,
      stages,
      approvals,
      messages,
      unreadCount,
      isMember,
      allowedModules: isMember ? memberModules : null,

    };
  });
