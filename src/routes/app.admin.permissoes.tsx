import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Users, CreditCard, Shield, Activity, AlertCircle, MessageSquare } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-admin";

export const Route = createFileRoute("/app/admin/permissoes")({
  head: () => ({ meta: [{ title: "Permissões — Admin" }] }),
  component: Page,
});


function Page() {
  return (
    <AppShell role="admin" nav={adminNav} title="Permissões">
      <div className="mb-6">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Permissões</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Controle de acesso por papel.</p>
      </div>
      <div className="bg-white border border-border rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { role: "Admin Master", desc: "Acesso total à plataforma, usuários, planos e operações." },
          { role: "Profissional", desc: "Gerencia escritório, clientes, projetos e assinatura." },
          { role: "Cliente", desc: "Acompanha projetos, cronograma e mensagens." },
        ].map((p) => (
          <div key={p.role} className="rounded-lg border border-border p-4">
            <div className="t-label uppercase tracking-wider text-muted-foreground mb-1">{p.role}</div>
            <p className="text-[13px] text-ink">{p.desc}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        A configuração granular de permissões será disponibilizada em breve.
      </p>
    </AppShell>
  );
}
