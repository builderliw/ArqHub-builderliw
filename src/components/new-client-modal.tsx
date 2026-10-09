import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, Loader2, Plus, Trash2, User, FolderPlus, ChevronRight, ChevronLeft, Crown } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import { createProfessionalProject } from "@/lib/profissional-project-data.functions";
import { enableClientPortal } from "@/lib/cliente-portal.functions";

type ProjetoDraft = {
  name: string;
  location: string;
  cidade: string;
  uf: string;
  cep: string;
  complement: string;
  area_m2: string;
  project_type: string;
  estimated_duration: string;
  phase: string;
  status: "briefing" | "em_andamento" | "pausado" | "finalizado";
};

const emptyProjeto = (): ProjetoDraft => ({
  name: "",
  location: "",
  cidade: "",
  uf: "",
  cep: "",
  complement: "",
  area_m2: "",
  project_type: "residencial",
  estimated_duration: "",
  phase: "Briefing",
  status: "briefing",
});

type ClientEdit = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  has_portal?: boolean | null;
  status?: string | null;
};

/** VIP = tem portal. Persistido somente em has_portal. */
export function clientIsVip(c?: { has_portal?: boolean | null; status?: string | null } | null) {
  if (!c) return false;
  return c.has_portal === true;
}


export function NewClientModal({
  officeId,
  editClient,
  onClose,
  onCreated,
}: {
  officeId: string;
  editClient?: ClientEdit;
  onClose: () => void;
  onCreated: () => void;
}) {
  const isEdit = !!editClient;
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);

  // Cliente — split "Nome e Apelido" if present
  const initialNameApelido = (() => {
    const full = editClient?.name ?? "";
    const m = full.match(/^(.*?)\s+e\s+(.+)$/i);
    return m ? { n: m[1], a: m[2] } : { n: full, a: "" };
  })();
  const [name, setName] = useState(initialNameApelido.n);
  const [apelido, setApelido] = useState(initialNameApelido.a);
  const [email, setEmail] = useState(editClient?.email ?? "");
  const [phone, setPhone] = useState(editClient?.phone ?? "");
  const [cep, setCep] = useState(editClient?.cep ?? "");
  const [rua, setRua] = useState(editClient?.rua ?? "");
  const [numero, setNumero] = useState(editClient?.numero ?? "");
  const [complemento, setComplemento] = useState(editClient?.complemento ?? "");
  const [bairro, setBairro] = useState(editClient?.bairro ?? "");
  const [cidade, setCidade] = useState(editClient?.cidade ?? "");
  const [uf, setUf] = useState(editClient?.uf ?? "");

  const [wantsPortal, setWantsPortal] = useState<boolean>(
    editClient ? clientIsVip(editClient) : true,
  );


  // Projetos
  const [projetos, setProjetos] = useState<ProjetoDraft[]>([]);
  const createProject = useServerFn(createProfessionalProject);
  const createPortal = useServerFn(enableClientPortal);

  function addProjeto() { setProjetos((p) => [...p, emptyProjeto()]); }
  function removeProjeto(i: number) { setProjetos((p) => p.filter((_, idx) => idx !== i)); }
  function updateProjeto(i: number, patch: Partial<ProjetoDraft>) {
    setProjetos((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function goNext() {
    if (!name.trim()) { toast.error("Informe o nome do cliente."); return; }
    if (isEdit) { void submit(); return; }
    setStep(2);
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const fullName = apelido.trim()
        ? `${name.trim()} e ${apelido.trim()}`
        : name.trim();
      const isVip = wantsPortal && !!email.trim();
      const baseClient = {
        office_id: officeId,
        name: fullName,
        email: email.trim() || null,
        phone: phone.trim() || null,
      };
      const addressFields = {
        cep: cep.trim() || null,
        rua: rua.trim() || null,
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
        uf: uf.trim() || null,
      };
      // Coluna opcional (pode não existir ainda no banco) — tentada primeiro, com fallback.
      const portalField = { has_portal: isVip };

      if (isEdit && editClient) {
        // UPDATE
        const basePatch = {
          name: fullName,
          email: email.trim() || null,
          phone: phone.trim() || null,
        };
        const r = await externalSupabase
          .from("clients")
          .update({ ...basePatch, ...addressFields, ...portalField })
          .eq("id", editClient.id);
        if (r.error) {
          const r2 = await externalSupabase
            .from("clients")
            .update({ ...basePatch, ...addressFields })
            .eq("id", editClient.id);
          if (r2.error) {
            const r3 = await externalSupabase.from("clients").update(basePatch).eq("id", editClient.id);
            if (r3.error) throw r3.error;
            toast.success("Dados pessoais salvos. Endereço requer migração do banco.");
          } else {
            toast.success("Cliente atualizado.");
          }
        } else {
          toast.success("Cliente atualizado.");
        }

        // Sincroniza o status VIP/portal no servidor (fonte da verdade)
        const jaEraVip = clientIsVip(editClient);
        if (isVip !== jaEraVip) {
          try {
            const { data: sess } = await externalSupabase.auth.getSession();
            const token = sess.session?.access_token;
            if (!token) throw new Error("Sessão expirada. Entre novamente.");
            const res = await createPortal({
              data: { accessToken: token, clientId: editClient.id, enabled: isVip },
            });
            toast.success(
              !isVip
                ? "Cliente alterado para comum (portal desativado)."
                : res.alreadyExisted
                  ? `Portal já existia para ${res.email}. Cliente marcado como VIP.`
                  : `Portal VIP criado para ${res.email}.`,
            );
          } catch (err: any) {
            toast.error(err?.message ?? "Não foi possível atualizar o portal do cliente.");
          }
        }

        onCreated();
        onClose();
        return;
      }

      let createdId: string | null = null;
      {
        const attempts = [
          { ...baseClient, ...addressFields, ...portalField },
          { ...baseClient, ...addressFields },
          baseClient,
        ];
        let lastError: any = null;
        for (const payload of attempts) {
          const r = await externalSupabase.from("clients").insert(payload).select("id").single();
          if (!r.error) { createdId = r.data!.id; lastError = null; break; }
          lastError = r.error;
        }
        if (!createdId) throw lastError;
      }

      const clientId = createdId!;

      if (wantsPortal && email.trim()) {
        try {
          const { data: sess } = await externalSupabase.auth.getSession();
          const token = sess.session?.access_token;
          if (token) {
            const res = await createPortal({ data: { accessToken: token, clientId } });
            toast.success(
              res.alreadyExisted
                ? `Portal já existia para ${res.email}.`
                : `Portal criado para ${res.email}. O cliente define a senha no primeiro acesso.`,
            );
          }
        } catch (err: any) {
          toast.error(err?.message ?? "Cliente criado, mas o portal não pôde ser criado.");
        }
      }



      const validProjetos = projetos.filter((p) => p.name.trim());
      if (validProjetos.length > 0) {
        const { data: sess } = await externalSupabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) throw new Error("Sessão expirada");
        for (const p of validProjetos) {
          await createProject({ data: { accessToken: token, officeId, project: {
            client_id: clientId,
            name: p.name.trim(),
            status: p.status,
            location: p.location.trim() || null,
            city: p.cidade.trim() || null,
            uf: p.uf.trim() || null,
            cep: p.cep.trim() || null,
            complement: p.complement.trim() || null,
            area_m2: p.area_m2 ? Number(p.area_m2.replace(",", ".")) : null,
            description: [p.project_type, p.estimated_duration, p.phase].filter(Boolean).join(" · ") || null,
            started_at: new Date().toISOString(),
          } } });
        }
      }

      toast.success(`Cliente criado${validProjetos.length ? ` com ${validProjetos.length} projeto(s)` : ""}.`);
      onCreated();
      onClose();
    } catch (e: any) {
      const msg = [e?.message, e?.hint, e?.details].filter(Boolean).join(" — ");
      toast.error(msg || "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl border border-border max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              {step === 1 ? <User className="h-4 w-4" /> : <FolderPlus className="h-4 w-4" />}
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-ink leading-tight">
                {isEdit ? "Editar cliente" : (step === 1 ? "Novo cliente" : "Projetos do cliente")}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isEdit ? "Atualize os dados do cliente" : `Etapa ${step} de 2`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 ? (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nome *">
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex.: Guilherme" />
                </Field>
                <Field label="Apelido / Parceiro(a)">
                  <input value={apelido} onChange={(e) => setApelido(e.target.value)} className={inputCls} placeholder="Ex.: Nino" />
                </Field>
              </div>
              <p className="text-[11px] text-muted-foreground -mt-1.5">
                Será salvo como <span className="font-medium text-ink">{apelido.trim() ? `“${name || "Nome"} e ${apelido}”` : `“${name || "Nome"}”`}</span> para personalizar o atendimento.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="E-mail">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Telefone">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="(11) 99999-0000" />
                </Field>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-muted-foreground mb-1.5">Tipo de cliente</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      vip: true,
                      title: "Cliente VIP",
                      desc: "Com portal de acesso. A senha é definida pelo cliente no primeiro acesso.",
                    },
                    {
                      vip: false,
                      title: "Cliente comum",
                      desc: "Sem portal. Você gerencia tudo internamente no painel.",
                    },
                  ].map((o) => {
                    const active = wantsPortal === o.vip;
                    return (
                      <button
                        type="button"
                        key={o.title}
                        onClick={() => setWantsPortal(o.vip)}
                        className={`text-left rounded-xl border p-3 transition-colors ${
                          active
                            ? o.vip
                              ? "border-amber-300 bg-amber-50"
                              : "border-primary/40 bg-primary/5"
                            : "border-border bg-white hover:bg-secondary/40"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {o.vip ? (
                            <Crown className={`h-4 w-4 ${active ? "text-amber-500" : "text-muted-foreground"}`} />
                          ) : (
                            <User className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                          )}
                          <span className="text-[12.5px] font-semibold text-ink">{o.title}</span>
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-1">{o.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {wantsPortal && !email.trim() && (
                  <p className="text-[11px] text-amber-600 mt-1.5">
                    Informe um e-mail para habilitar o portal do cliente VIP.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="CEP"><input value={cep} onChange={(e) => setCep(e.target.value)} className={inputCls} /></Field>
                <Field label="Rua" className="col-span-2"><input value={rua} onChange={(e) => setRua(e.target.value)} className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Número"><input value={numero} onChange={(e) => setNumero(e.target.value)} className={inputCls} /></Field>
                <Field label="Complemento" className="col-span-2"><input value={complemento} onChange={(e) => setComplemento(e.target.value)} className={inputCls} placeholder="Apto, bloco..." /></Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Bairro" className="col-span-1"><input value={bairro} onChange={(e) => setBairro(e.target.value)} className={inputCls} /></Field>
                <Field label="Cidade" className="col-span-1"><input value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputCls} /></Field>
                <Field label="UF"><input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} maxLength={2} className={inputCls} /></Field>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {projetos.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center">
                  <FolderPlus className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-[12.5px] text-muted-foreground">
                    Nenhum projeto vinculado. Você pode adicionar agora ou depois.
                  </p>
                </div>
              )}

              {projetos.map((p, i) => (
                <div key={i} className="rounded-xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-semibold text-ink">Projeto {i + 1}</span>
                    <button onClick={() => removeProjeto(i)} className="text-muted-foreground hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <Field label="Nome do projeto *">
                      <input value={p.name} onChange={(e) => updateProjeto(i, { name: e.target.value })} className={inputCls} placeholder="Ex.: Apto Vila Madalena" />
                    </Field>
                    <Field label="Endereço da obra">
                      <input value={p.location} onChange={(e) => updateProjeto(i, { location: e.target.value })} className={inputCls} placeholder="Rua, número" />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Cidade"><input value={p.cidade} onChange={(e) => updateProjeto(i, { cidade: e.target.value })} className={inputCls} /></Field>
                      <Field label="UF"><input value={p.uf} onChange={(e) => updateProjeto(i, { uf: e.target.value.toUpperCase() })} maxLength={2} className={inputCls} /></Field>
                      <Field label="CEP"><input value={p.cep} onChange={(e) => updateProjeto(i, { cep: e.target.value })} className={inputCls} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Metros quadrados">
                        <input value={p.area_m2} onChange={(e) => updateProjeto(i, { area_m2: e.target.value })} className={inputCls} placeholder="Ex.: 120" />
                      </Field>
                      <Field label="Tipo de projeto">
                        <select value={p.project_type} onChange={(e) => updateProjeto(i, { project_type: e.target.value })} className={inputCls}>
                          <option value="residencial">Residencial</option>
                          <option value="comercial">Comercial</option>
                          <option value="corporativo">Corporativo</option>
                          <option value="interiores">Interiores</option>
                          <option value="reforma">Reforma</option>
                          <option value="paisagismo">Paisagismo</option>
                          <option value="outro">Outro</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Tempo estimado">
                        <input value={p.estimated_duration} onChange={(e) => updateProjeto(i, { estimated_duration: e.target.value })} className={inputCls} placeholder="Ex.: 6 meses" />
                      </Field>
                      <Field label="Fase atual">
                        <input value={p.phase} onChange={(e) => updateProjeto(i, { phase: e.target.value })} className={inputCls} placeholder="Ex.: Estudo" />
                      </Field>
                      <Field label="Status">
                        <select value={p.status} onChange={(e) => updateProjeto(i, { status: e.target.value as ProjetoDraft["status"] })} className={inputCls}>
                          <option value="briefing">Briefing</option>
                          <option value="em_andamento">Em andamento</option>
                          <option value="pausado">Pausado</option>
                          <option value="finalizado">Finalizado</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addProjeto}
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-border text-[13px] font-medium text-primary hover:bg-primary/5"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar {projetos.length === 0 ? "projeto" : "outro projeto"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border bg-secondary/30">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="px-3 h-9 text-[13px] text-muted-foreground hover:bg-secondary rounded-md">
                Cancelar
              </button>
              {isEdit ? (
                <button onClick={() => void submit()} disabled={busy} className="inline-flex items-center gap-1.5 px-4 h-9 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:opacity-90 disabled:opacity-50">
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Salvar alterações
                </button>
              ) : (
                <button onClick={goNext} className="inline-flex items-center gap-1.5 px-4 h-9 bg-ink text-white rounded-md text-[13px] font-medium hover:bg-black">
                  Continuar <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 px-3 h-9 text-[13px] text-muted-foreground hover:bg-secondary rounded-md">
                <ChevronLeft className="h-3.5 w-3.5" /> Voltar
              </button>
              <button onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 px-4 h-9 bg-primary text-primary-foreground rounded-md text-[13px] font-medium disabled:opacity-50">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Salvar cliente
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-9 px-3 text-[13px] border border-border rounded-md bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
