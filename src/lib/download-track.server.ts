// Server-only: registra um download no banco (nunca lança erro para o usuário).
export async function trackDownload(input: {
  kind: "material" | "premium";
  category?: string | null;
  slug: string;
  filename?: string | null;
  title?: string | null;
  accessLevel?: string | null;
  accessToken?: string | null;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    let userEmail: string | null = null;
    let userId: string | null = null;
    if (input.accessToken) {
      try {
        const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
        const { data } = await externalAdmin.auth.getUser(input.accessToken);
        userEmail = data?.user?.email ?? null;
        userId = data?.user?.id ?? null;
      } catch {
        /* ignore */
      }
    }
    await supabaseAdmin.from("download_events" as any).insert({
      kind: input.kind,
      category: input.category ?? null,
      slug: input.slug,
      filename: input.filename ?? null,
      title: input.title ?? input.filename ?? input.slug,
      access_level: input.accessLevel ?? null,
      user_email: userEmail,
      user_id: userId,
    });
  } catch {
    /* telemetria não pode quebrar o download */
  }
}
