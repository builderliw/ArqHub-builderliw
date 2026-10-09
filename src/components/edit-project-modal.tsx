import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, Loader2, Trash2, Upload, ImageIcon } from "lucide-react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { getSession } from "@/lib/session";
import { toast } from "sonner";
import {
  createProfessionalProjectCoverUpload,
  deleteProfessionalProject,
  getProfessionalProject,
  updateProfessionalProject,
} from "@/lib/profissional-project-data.functions";

const STATUS_OPTIONS = [
  { value: "briefing", label: "Briefing" },
  { value: "design", label: "Em projeto" },
  { value: "execution", label: "Execução" },
  { value: "delivery", label: "Entrega" },
  { value: "completed", label: "Concluído" },
  { value: "paused", label: "Pausado" },
];

export function EditProjectModal({
  projectId,
  onClose,
  onSaved,
}: {
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("briefing");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");
  const [complement, setComplement] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [portfolioVisible, setPortfolioVisible] = useState(false);
  const getProject = useServerFn(getProfessionalProject);
  const createCoverUpload = useServerFn(createProfessionalProjectCoverUpload);
  const updateProject = useServerFn(updateProfessionalProject);
  const deleteProject = useServerFn(deleteProfessionalProject);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { toast.error("Sessão expirada"); setLoading(false); return; }
      try {
        const result = await getProject({ data: { accessToken: token, projectId } });
        const data = result.project as any;
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setStatus(data.status ?? "briefing");
      setBudget(data.budget_cents ? (data.budget_cents / 100).toString().replace(".", ",") : "");
      setDeadline(data.deadline ?? "");
      const started = (data as any).started_at as string | null;
      setStartedAt(started ? started.slice(0, 10) : "");
      setLocation((data as any).location ?? "");
      setCity((data as any).city ?? "");
      setUf((data as any).uf ?? "");
      setCep((data as any).cep ?? "");
      setComplement((data as any).complement ?? "");
      setAreaM2((data as any).area_m2?.toString() ?? "");
      const cu = (data as any).cover_url ?? "";
      setCoverUrl(cu);
      setCoverPreview((data as any).cover_preview_url ?? "");
      setPortfolioVisible(!!(data as any).portfolio_visible);
      } catch (e: any) {
        toast.error(e?.message ?? "Erro ao carregar projeto.");
      }
      setLoading(false);
    })();
  }, [projectId, getProject]);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 8MB."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      const signed = await createCoverUpload({ data: { accessToken: token, projectId, fileName: `banner.${ext}`, contentType: file.type } });
      const { error } = await externalSupabase.storage
        .from("project-photos")
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
      if (error) throw error;
      setCoverUrl(signed.path);
      setCoverPreview(URL.createObjectURL(file));
      toast.success("Banner enviado.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  async function removeCover() {
    if (!coverUrl) return;
    setCoverUrl("");
    setCoverPreview("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const budgetCents = budget ? Math.round(parseFloat(budget.replace(",", ".")) * 100) : null;
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      await updateProject({ data: { accessToken: token, projectId, project: {
        name: name.trim(),
        description: description.trim() || null,
        status,
        budget_cents: budgetCents,
        deadline: deadline || null,
        started_at: startedAt ? new Date(startedAt + "T00:00:00").toISOString() : null,
        location: location.trim() || null,
        city: city.trim() || null,
        uf: uf.trim().toUpperCase() || null,
        cep: cep.trim() || null,
        complement: complement.trim() || null,
        area_m2: areaM2 ? parseFloat(areaM2.replace(",", ".")) : null,
        cover_url: coverUrl.trim() || null,
        portfolio_visible: portfolioVisible,
      } } });
      toast.success("Projeto atualizado.");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar projeto.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Excluir este projeto? Esta ação não pode ser desfeita.")) return;
    setBusy(true);
    try {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      await deleteProject({ data: { accessToken: token, projectId } });
      toast.success("Projeto excluído.");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir projeto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-lg sm:rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Editar</div>
            <h3 className="text-[14px] font-semibold text-ink">Projeto</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary"><X className="h-4 w-4"/></button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-[13px] text-muted-foreground">Carregando...</div>
        ) : (
          <>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nome do projeto *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md focus:ring-2 focus:ring-primary/30 outline-none"/>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Descrição</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="mt-1 w-full px-3 py-2 text-[13px] border border-border rounded-md focus:ring-2 focus:ring-primary/30 outline-none"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Área (m²)</label>
                  <input value={areaM2} onChange={(e) => setAreaM2(e.target.value)} inputMode="decimal"
                    className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none"/>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md bg-white">
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Endereço do projeto</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Rua, número"
                  className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none"/>
              </div>
              <div className="grid grid-cols-[1fr_80px] gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Cidade</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo"
                    className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none"/>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">UF</label>
                  <input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0,2))} maxLength={2} placeholder="SP"
                    className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none uppercase"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">CEP</label>
                  <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000"
                    className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none"/>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Complemento</label>
                  <input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto 101"
                    className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none"/>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Orçamento (R$)</label>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" placeholder="0,00"
                  className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Data de início</label>
                  <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)}
                    className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none"/>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Previsão de entrega</label>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    className="mt-1 w-full h-10 px-3 text-[13px] border border-border rounded-md outline-none"/>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Banner do projeto</label>
                <p className="text-[11px] text-muted-foreground">Aparece no banner do portal do cliente.</p>
                {coverPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={coverPreview} alt="" className="w-full h-32 object-cover" />
                    <button type="button" onClick={removeCover}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-md p-1.5 shadow-sm">
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 border border-dashed border-border rounded-lg text-muted-foreground">
                    <ImageIcon className="h-5 w-5 mr-2" /> <span className="text-[12px]">Sem banner</span>
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 px-3 h-9 border border-border rounded-md text-[13px] font-medium hover:bg-secondary cursor-pointer">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Upload className="h-3.5 w-3.5"/>}
                  {uploading ? "Enviando..." : "Enviar imagem"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}/>
                </label>

                <label className="mt-3 flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                  <input type="checkbox" checked={portfolioVisible} onChange={(e) => setPortfolioVisible(e.target.checked)}
                    className="h-4 w-4 rounded border-border"/>
                  Exibir este projeto no portfólio público
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border bg-secondary/30">
              {getSession()?.isMember ? <span /> : (
                <button type="button" onClick={remove} disabled={busy}
                  className="inline-flex items-center gap-1 px-3 h-9 text-[13px] text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5"/> Excluir
                </button>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-3 h-9 text-[13px] text-muted-foreground hover:bg-secondary rounded-md">Cancelar</button>
                <button type="submit" disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 h-9 bg-ink text-white rounded-md text-[13px] font-medium disabled:opacity-50">
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}Salvar alterações
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
