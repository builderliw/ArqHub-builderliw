import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import { createProfessionalProject, updateProfessionalProject } from "@/lib/profissional-project-data.functions";

type Cliente = { id: string; name: string; email: string | null };

type ProjectEdit = {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  budget_cents: number | null;
  deadline: string | null;
};

export function NewProjectModal({
  officeId,
  presetClientId,
  editProject,
  onClose,
  onCreated,
}: {
  officeId: string;
  presetClientId?: string;
  editProject?: ProjectEdit;
  onClose: () => void;
  onCreated: () => void;
}) {
  const isEdit = !!editProject;
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [busy, setBusy] = useState(false);

  // form
  const [name, setName] = useState(editProject?.name ?? "");
  const [description, setDescription] = useState(editProject?.description ?? "");
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [clientId, setClientId] = useState(editProject?.client_id ?? presetClientId ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [budget, setBudget] = useState(
    editProject?.budget_cents != null ? (editProject.budget_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [deadline, setDeadline] = useState(editProject?.deadline ?? "");
  const createProject = useServerFn(createProfessionalProject);
  const updateProject = useServerFn(updateProfessionalProject);

  useEffect(() => {
    (async () => {
      const { data } = await externalSupabase
        .from("clients")
        .select("id, name, email")
        .eq("office_id", officeId)
        .order("name");
      setClientes((data ?? []) as Cliente[]);
      if (isEdit) {
        setLoadingClients(false);
        return;
      }
      if ((data ?? []).length === 0) setClientMode("new");
      else if (presetClientId) setClientId(presetClientId);
      else if (data && data.length > 0) setClientId(data[0].id);
      setLoadingClients(false);
    })();
  }, [officeId, presetClientId, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const budgetCents = budget ? Math.round(parseFloat(budget.replace(",", ".")) * 100) : null;
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");

      if (isEdit && editProject) {
        await updateProject({ data: { accessToken: token, projectId: editProject.id, project: {
          name: name.trim(),
          description: description.trim() || null,
          status: "briefing",
          budget_cents: budgetCents,
          deadline: deadline || null,
        } } });
        toast.success("Projeto atualizado.");
        onCreated();
        onClose();
        return;
      }

      let finalClientId = clientId;
      if (clientMode === "new") {
        if (!newClientName.trim()) {
          toast.error("Informe o nome do cliente.");
          setBusy(false);
          return;
        }
        const { data: nc, error: cErr } = await externalSupabase
          .from("clients")
          .insert({
            office_id: officeId,
            name: newClientName.trim(),
            email: newClientEmail.trim() || null,
            status: "active",
          })
          .select("id")
          .single();
        if (cErr) throw cErr;
        finalClientId = nc.id;
      }

      await createProject({ data: { accessToken: token, officeId, project: {
        client_id: finalClientId,
        name: name.trim(),
        description: description.trim() || null,
        status: "briefing",
        budget_cents: budgetCents,
        deadline: deadline || null,
        started_at: new Date().toISOString(),
      } } });

      toast.success("Projeto criado.");
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar projeto");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg sm:rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{isEdit ? "Editar" : "Novo"}</div>
            <h3 className="text-[14px] font-semibold text-ink">{isEdit ? "Editar projeto" : "Criar projeto"}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nome do projeto *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Casa Vila Madalena"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Breve descrição do projeto"
            />
          </div>

          {!isEdit && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Cliente *</label>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setClientMode("existing")}
                  disabled={clientes.length === 0}
                  className={`px-2 py-0.5 rounded-md ${clientMode === "existing" ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary"} disabled:opacity-40`}
                >
                  Existente
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode("new")}
                  className={`px-2 py-0.5 rounded-md ${clientMode === "new" ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  Novo
                </button>
              </div>
            </div>
            {clientMode === "existing" ? (
              loadingClients ? (
                <div className="text-[12px] text-muted-foreground">Carregando...</div>
              ) : (
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] border border-border rounded-md bg-white"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email && `· ${c.email}`}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <div className="space-y-2">
                <input
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full h-10 px-3 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="email@cliente.com (opcional)"
                  className="w-full h-10 px-3 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}
          </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Orçamento (R$)</label>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Prazo final</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/30">
          <button
            type="button"
            onClick={onClose}
            className="px-3 h-9 text-[13px] font-medium text-muted-foreground hover:text-ink rounded-md hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 h-9 bg-ink text-white rounded-md text-[13px] font-medium hover:bg-black disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? "Salvar alterações" : "Criar projeto"}
          </button>
        </div>
      </form>
    </div>
  );
}
