import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SettingsSchema = z.object({
  platform_name: z.string().trim().min(1).max(80),
  support_email: z.string().trim().email().max(160),
  enable_signups: z.boolean(),
  enable_payments: z.boolean(),
  maintenance_mode: z.boolean(),
  announcement: z.string().trim().max(500).nullable().optional(),
});

export type PlatformSettings = z.infer<typeof SettingsSchema>;

const TokenInput = z.object({ accessToken: z.string().min(10) });

export const getPlatformSettings = createServerFn({ method: "POST" })
  .inputValidator((d) => TokenInput.parse(d))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: row, error } = await supabaseAdmin
      .from("platform_settings")
      .select("platform_name, support_email, enable_signups, enable_payments, maintenance_mode, announcement")
      .eq("id", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      row ?? {
        platform_name: "ArqHub",
        support_email: "suporte@arqhub.world",
        enable_signups: true,
        enable_payments: true,
        maintenance_mode: false,
        announcement: null,
      }
    );
  });

export const updatePlatformSettings = createServerFn({ method: "POST" })
  .inputValidator((d) => TokenInput.merge(SettingsSchema).parse(d))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    await assertAdminByToken(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { accessToken: _t, ...payload } = data;
    const { error } = await supabaseAdmin.from("platform_settings").upsert({
      id: true,
      ...payload,
      announcement: payload.announcement ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
