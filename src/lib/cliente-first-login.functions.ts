import { createServerFn } from "@tanstack/react-start";

// Verifica se o e-mail está cadastrado como cliente em algum escritório
// e se já existe usuário de autenticação para esse e-mail.
export const checkClientLoginState = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => {
    if (!input?.email || typeof input.email !== "string") {
      throw new Error("email obrigatório");
    }
    return { email: input.email.trim().toLowerCase() };
  })
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: client } = await externalAdmin
      .from("clients")
      .select("id")
      .ilike("email", data.email)
      .limit(1)
      .maybeSingle();
    if (!client) return { ok: false as const, reason: "not_found" as const };

    const { data: list } = await externalAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const exists = !!list?.users?.find((u) => (u.email ?? "").toLowerCase() === data.email);
    return { ok: true as const, hasAuthUser: exists };
  });

// Define/atualiza a senha do cliente APÓS ele ter verificado o e-mail
// via OTP do Supabase (accessToken emitido por verifyOtp). Sem prova de
// posse do e-mail (accessToken válido cujo email bate com um `clients.email`),
// a operação é recusada — evita takeover de conta pré-registrando senha.
export const finalizeClientPassword = createServerFn({ method: "POST" })
  .inputValidator((input: { accessToken: string; password: string }) => {
    if (!input?.accessToken || typeof input.accessToken !== "string") {
      throw new Error("accessToken obrigatório");
    }
    if (!input?.password || input.password.length < 6) {
      throw new Error("Senha deve ter ao menos 6 caracteres");
    }
    return { accessToken: input.accessToken, password: input.password };
  })
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    // Valida o accessToken → confirma posse do e-mail
    const { data: userInfo, error: userErr } = await externalAdmin.auth.getUser(data.accessToken);
    if (userErr || !userInfo?.user?.email) {
      return { ok: false as const, reason: "invalid_token" as const };
    }
    const email = userInfo.user.email.toLowerCase();

    // Confirma que este e-mail é realmente um cliente cadastrado
    const { data: client } = await externalAdmin
      .from("clients")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    if (!client) return { ok: false as const, reason: "not_found" as const };

    // Atualiza a senha via admin API (usuário já foi criado pelo verifyOtp)
    const { error: updErr } = await externalAdmin.auth.admin.updateUserById(userInfo.user.id, {
      password: data.password,
    });
    if (updErr) {
      return { ok: false as const, reason: "update_failed" as const, message: updErr.message };
    }
    return { ok: true as const, userId: userInfo.user.id };
  });
