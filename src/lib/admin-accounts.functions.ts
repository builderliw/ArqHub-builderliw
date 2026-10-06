import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({ accessToken: z.string().min(10) });

export type AuthAccount = {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string | null;
};

/**
 * Lista TODAS as contas de autenticação (mesmo sem perfil/escritório criado),
 * para que o admin veja o e-mail de quem apenas iniciou o acesso.
 */
export const listAuthAccounts = createServerFn({ method: "POST" })
  .inputValidator((d) => Schema.parse(d))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const accounts: AuthAccount[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data: res, error } = await externalAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      const users = res?.users ?? [];
      for (const u of users) {
        accounts.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at ?? null,
          last_sign_in_at: u.last_sign_in_at ?? null,
          email_confirmed_at: (u as { email_confirmed_at?: string | null }).email_confirmed_at ?? null,
          provider: (u.app_metadata?.provider as string | undefined) ?? null,
        });
      }
      if (users.length < 200) break;
    }

    return { accounts };
  });
