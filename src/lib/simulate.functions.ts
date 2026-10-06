import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SimulateSchema = z.object({
  accessToken: z.string().min(10),
  screen: z
    .string()
    .trim()
    .min(1, "Informe a tela.")
    .max(100, "Tela deve ter no máximo 100 caracteres.")
    .regex(/^[\p{L}\p{N}\s\-_()./]+$/u, "Tela contém caracteres inválidos."),
  route: z
    .string()
    .trim()
    .min(1, "Informe a rota.")
    .max(200, "Rota deve ter no máximo 200 caracteres.")
    .regex(
      /^\/[a-zA-Z0-9\-_/.]*$/,
      "A rota deve começar com / e conter apenas letras, números, hífens, underscores, barras e pontos."
    ),
  count: z
    .number()
    .int("Quantidade deve ser um número inteiro.")
    .min(1, "Quantidade mínima é 1.")
    .max(500, "Quantidade máxima é 500."),
});

export const simulateErrorsFn = createServerFn({ method: "POST" })
  .inputValidator((input) => SimulateSchema.parse(input))
  .handler(async ({ data }) => {
    const { assertAdminByToken } = await import("@/lib/admin-auth.server");
    const { userId, email } = await assertAdminByToken(data.accessToken);
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const inserts = Array.from({ length: data.count }, (_, i) => ({
      level: "error" as const,
      source: "client" as const,
      screen: data.screen,
      route: data.route,
      message: `Erro simulado para teste de alertas (#${i + 1})`,
      user_id: userId,
      user_email: email,
      details: { simulated: true, index: i + 1 },
    }));

    const { error } = await externalAdmin.from("app_logs" as any).insert(inserts);
    if (error) throw new Error(error.message);
    return { inserted: data.count };
  });
