import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Save,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/platform-settings.functions";
import { externalSupabase } from "@/integrations/external-supabase/client";

async function getExternalToken(): Promise<string> {
  const { data } = await externalSupabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Sessão expirada. Faça login novamente.");
  return t;
}

export const Route = createFileRoute("/app/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Admin ArqHub" }] }),
  component: AdminConfiguracoesPage,
});


type FormState = {
  platform_name: string;
  support_email: string;
  enable_signups: boolean;
  enable_payments: boolean;
  maintenance_mode: boolean;
  announcement: string;
};

const defaultForm: FormState = {
  platform_name: "ArqHub",
  support_email: "suporte@arqhub.world",
  enable_signups: true,
  enable_payments: true,
  maintenance_mode: false,
  announcement: "",
};

function AdminConfiguracoesPage() {
  const getFn = useServerFn(getPlatformSettings);
  const updateFn = useServerFn(updatePlatformSettings);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => getFn({ data: { accessToken: await getExternalToken() } }),
  });

  const [form, setForm] = useState<FormState>(defaultForm);

  useEffect(() => {
    if (data) {
      setForm({
        platform_name: data.platform_name,
        support_email: data.support_email,
        enable_signups: data.enable_signups,
        enable_payments: data.enable_payments,
        maintenance_mode: data.maintenance_mode,
        announcement: data.announcement ?? "",
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () =>
      updateFn({
        data: {
          accessToken: await getExternalToken(),
          platform_name: form.platform_name.trim(),
          support_email: form.support_email.trim(),
          enable_signups: form.enable_signups,
          enable_payments: form.enable_payments,
          maintenance_mode: form.maintenance_mode,
          announcement: form.announcement.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao salvar"),
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <AppShell role="admin" nav={adminNav} title="Configurações">
      <div className="mb-6">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Configurações da plataforma</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Ajuste o nome, contato de suporte e sinalizadores globais.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <section className="rounded-xl border border-border bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="text-[14px] font-semibold text-ink">Identidade & contato</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="platform_name">Nome da plataforma</Label>
              <Input
                id="platform_name"
                value={form.platform_name}
                maxLength={80}
                onChange={(e) => set("platform_name", e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support_email">E-mail de suporte</Label>
              <Input
                id="support_email"
                type="email"
                value={form.support_email}
                maxLength={160}
                onChange={(e) => set("support_email", e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="announcement">Aviso global (opcional)</Label>
              <Textarea
                id="announcement"
                value={form.announcement}
                maxLength={500}
                rows={3}
                placeholder="Ex.: Manutenção programada domingo às 22h."
                onChange={(e) => set("announcement", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h3 className="mb-4 text-[14px] font-semibold text-ink">Flags principais</h3>
          <div className="space-y-4">
            {[
              { key: "enable_signups" as const, label: "Cadastros abertos", desc: "Permite novos cadastros de escritórios." },
              { key: "enable_payments" as const, label: "Pagamentos ativos", desc: "Libera checkout e contratação de planos." },
              { key: "maintenance_mode" as const, label: "Modo manutenção", desc: "Exibe aviso e limita acesso a áreas críticas." },
            ].map((f) => (
              <div key={f.key} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="text-[13px] font-medium text-ink">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
                <Switch
                  checked={form[f.key]}
                  onCheckedChange={(v) => set(f.key, v)}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-2 lg:col-span-3">
          <Button type="submit" disabled={isLoading || mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Salvar alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
