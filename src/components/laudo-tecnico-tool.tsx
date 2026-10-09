import { useMemo, useState } from "react";
import {
  FileDown,
  FileText,
  ClipboardCheck,
  Loader2,
  ListChecks,
  ScrollText,
  BookOpen,
  Camera,
  Eye,
  X,
  Trash2,
  Images,
} from "lucide-react";
import { toast } from "sonner";
import { CHECKLIST_VISTORIA, LAUDO_TIPOS, MANUAL_SECOES } from "@/lib/laudo-tecnico";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { createLaudoFotoUploadUrl, deleteLaudoFoto } from "@/lib/laudo-fotos.functions";

const BUCKET = "laudo-fotos";

type Foto = {
  id: string;
  name: string;
  dataUrl: string;
  legenda: string;
  path?: string;
  uploading?: boolean;
};

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    r.readAsDataURL(file);
  });
}


type FormState = Record<string, string>;

const CAMPOS: Array<{ secao: string; campos: Array<{ k: string; label: string; area?: boolean; options?: string[] }> }> = [
  {
    secao: "Identificação do laudo",
    campos: [
      { k: "numero", label: "Número do laudo" },
      { k: "data", label: "Data da emissão" },
      { k: "finalidade", label: "Finalidade", options: LAUDO_TIPOS.map((t) => t.nome) },
      { k: "solicitante", label: "Solicitante" },
      { k: "solicitanteDoc", label: "CPF/CNPJ do solicitante" },
      { k: "dataVistoria", label: "Data da vistoria" },
    ],
  },
  {
    secao: "Responsável técnico",
    campos: [
      { k: "respNome", label: "Nome do profissional" },
      { k: "respTitulo", label: "Título profissional", options: ["Arquiteto e Urbanista", "Engenheiro Civil", "Engenheiro de Avaliações"] },
      { k: "respRegistro", label: "CAU/CREA nº" },
      { k: "respArt", label: "ART/RRT nº" },
      { k: "respEmail", label: "E-mail" },
      { k: "respTelefone", label: "Telefone" },
    ],
  },
  {
    secao: "Dados do imóvel",
    campos: [
      { k: "endereco", label: "Endereço completo" },
      { k: "bairro", label: "Bairro" },
      { k: "cidadeUf", label: "Cidade / UF" },
      { k: "matricula", label: "Matrícula / Cartório" },
      { k: "inscricao", label: "Inscrição imobiliária (IPTU)" },
      { k: "tipoImovel", label: "Tipo do imóvel", options: ["Casa", "Apartamento", "Sobrado", "Terreno", "Sala comercial", "Galpão", "Rural"] },
      { k: "areaTerreno", label: "Área do terreno (m²)" },
      { k: "areaConstruida", label: "Área construída (m²)" },
      { k: "anoConstrucao", label: "Ano de construção" },
      { k: "padrao", label: "Padrão construtivo", options: ["Baixo", "Normal/Médio", "Alto", "Luxo"] },
      { k: "ocupacao", label: "Situação de ocupação", options: ["Ocupado pelo proprietário", "Locado", "Vago", "Em obras"] },
      { k: "conservacao", label: "Estado de conservação", options: ["Novo", "Regular", "Reparos simples", "Reparos importantes", "Sem valor / demolição"] },
    ],
  },
  {
    secao: "Descrição técnica",
    campos: [
      { k: "descricaoGeral", label: "Descrição geral da edificação", area: true },
      { k: "sistemas", label: "Sistemas construtivos (estrutura, vedação, cobertura, instalações)", area: true },
      { k: "anomalias", label: "Anomalias e patologias observadas (com grau de risco)", area: true },
      { k: "documentacaoAnalisada", label: "Documentação analisada", area: true },
      { k: "metodologia", label: "Metodologia e normas aplicadas", area: true },
    ],
  },
  {
    secao: "Avaliação de valor (quando aplicável)",
    campos: [
      { k: "metodoAvaliacao", label: "Método", options: ["Comparativo direto de dados de mercado", "Involutivo", "Evolutivo", "Custo de reedição", "Não aplicável"] },
      { k: "amostras", label: "Amostras pesquisadas (nº e fontes)", area: true },
      { k: "valorTerreno", label: "Valor do terreno (R$)" },
      { k: "valorBenfeitorias", label: "Valor das benfeitorias (R$)" },
      { k: "valorTotal", label: "Valor total de mercado (R$)" },
      { k: "grauFundamentacao", label: "Grau de fundamentação (NBR 14653)", options: ["I", "II", "III"] },
    ],
  },
  {
    secao: "Conclusão",
    campos: [
      { k: "conclusao", label: "Conclusão técnica", area: true },
      { k: "recomendacoes", label: "Recomendações e prazos", area: true },
      { k: "ressalvas", label: "Ressalvas e limitações da vistoria", area: true },
      { k: "localData", label: "Local e data da assinatura" },
    ],
  },
];

function today() {
  return new Date().toLocaleDateString("pt-BR");
}

function initialForm(): FormState {
  const f: FormState = {};
  for (const s of CAMPOS) for (const c of s.campos) f[c.k] = "";
  f.data = today();
  f.dataVistoria = today();
  f.respTitulo = "Arquiteto e Urbanista";
  f.metodologia =
    "Vistoria in loco com inspeção visual, registro fotográfico e medições diretas, conforme NBR 13752 (perícias de engenharia), NBR 16747 (inspeção predial) e NBR 14653 (avaliação de bens), no que couber à finalidade deste laudo.";
  f.ressalvas =
    "A vistoria foi realizada de forma não destrutiva, limitada aos elementos acessíveis na data da visita. Não foram executados ensaios laboratoriais nem abertura de elementos construtivos, salvo indicação expressa neste laudo.";
  return f;
}

export function LaudoTecnicoTool() {
  const [tab, setTab] = useState<"modelo" | "checklist" | "fotos" | "manual">("modelo");
  const [form, setForm] = useState<FormState>(initialForm);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [obs, setObs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [preview, setPreview] = useState(false);


  const totalItens = useMemo(
    () => CHECKLIST_VISTORIA.reduce((a, g) => a + g.itens.length, 0),
    [],
  );
  const marcados = Object.values(checked).filter(Boolean).length;

  function up(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function addFotos(files: FileList | null) {
    if (!files?.length) return;
    const { data: sess } = await externalSupabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      toast.error("Faça login novamente para enviar fotos.");
      return;
    }
    for (const file of Array.from(files).slice(0, 20)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: envie apenas imagens.`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name}: máximo 8 MB por foto.`);
        continue;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const dataUrl = await readAsDataUrl(file);
        setFotos((p) => [...p, { id, name: file.name, dataUrl, legenda: "", uploading: true }]);
        const prep = await createLaudoFotoUploadUrl({
          data: {
            externalAccessToken: token,
            filename: file.name,
            contentType: file.type || "image/jpeg",
            size: file.size,
            laudoNumero: form.numero || null,
          },
        });
        const { error } = await externalSupabase.storage
          .from(BUCKET)
          .uploadToSignedUrl(prep.path, prep.token, file, {
            contentType: file.type || "image/jpeg",
          });
        if (error) throw error;
        setFotos((p) => p.map((f) => (f.id === id ? { ...f, path: prep.path, uploading: false } : f)));
        toast.success(`${file.name} enviada.`);
      } catch (e: any) {
        setFotos((p) => p.filter((f) => f.id !== id));
        toast.error(`Falha ao enviar ${file.name}: ${e?.message ?? e}`);
      }
    }
  }

  async function removeFoto(f: Foto) {
    setFotos((p) => p.filter((x) => x.id !== f.id));
    if (f.path) {
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      try {
        await deleteLaudoFoto({ data: { externalAccessToken: token, path: f.path } });
      } catch {
        // ignore
      }
    }
  }


  function paragraphs() {

    const out: Array<{ text: string; heading?: boolean; bold?: boolean }> = [];
    out.push({ text: "LAUDO TÉCNICO", heading: true });
    if (form.numero) out.push({ text: `Laudo nº ${form.numero} — emitido em ${form.data || today()}`, bold: true });
    for (const s of CAMPOS) {
      const preenchidos = s.campos.filter((c) => form[c.k]?.trim());
      if (!preenchidos.length) continue;
      out.push({ text: s.secao.toUpperCase(), heading: true });
      for (const c of preenchidos) out.push({ text: `${c.label}: ${form[c.k]}` });
    }
    const grupos = CHECKLIST_VISTORIA.filter((g) => g.itens.some((_, i) => checked[`${g.grupo}-${i}`]));
    if (grupos.length) {
      out.push({ text: "CHECKLIST DE VISTORIA VERIFICADO", heading: true });
      for (const g of grupos) {
        out.push({ text: g.grupo, bold: true });
        g.itens.forEach((it, i) => {
          const key = `${g.grupo}-${i}`;
          if (checked[key]) out.push({ text: `[X] ${it}${obs[key] ? ` — ${obs[key]}` : ""}` });
        });
      }
    }
    out.push({ text: "", bold: false });
    out.push({ text: form.localData || "", bold: true });
    out.push({ text: "_________________________________________" });
    out.push({
      text: `${form.respNome || ""} — ${form.respTitulo || ""}${form.respRegistro ? ` — ${form.respRegistro}` : ""}${form.respArt ? ` — ART/RRT ${form.respArt}` : ""}`,
      bold: true,
    });
    return out;
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 56;
      const width = doc.internal.pageSize.getWidth() - margin * 2;
      let y = margin;
      for (const p of paragraphs()) {
        doc.setFont("times", p.bold || p.heading ? "bold" : "normal");
        doc.setFontSize(p.heading ? 13 : 11);
        const lines = doc.splitTextToSize(p.text || " ", width);
        for (const line of lines) {
          if (y > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += p.heading ? 18 : 15;
        }
        y += p.heading ? 6 : 6;
      }
      if (fotos.length) {
        doc.addPage();
        y = margin;
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        doc.text("REGISTRO FOTOGRÁFICO", margin, y);
        y += 24;
        const imgW = width;
        const imgH = 240;
        for (let i = 0; i < fotos.length; i++) {
          const f = fotos[i];
          if (y + imgH + 40 > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }
          try {
            doc.addImage(f.dataUrl, "JPEG", margin, y, imgW, imgH, undefined, "FAST");
          } catch {
            /* formato não suportado */
          }
          y += imgH + 14;
          doc.setFont("times", "normal");
          doc.setFontSize(10);
          const cap = doc.splitTextToSize(`Foto ${i + 1} — ${f.legenda || f.name}`, width);
          for (const line of cap) {
            doc.text(line, margin, y);
            y += 13;
          }
          y += 12;
        }
      }
      doc.save(`laudo-tecnico-${form.numero || "sem-numero"}.pdf`);

    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + (e?.message ?? e));
    }
    setBusy(false);
  }

  async function downloadDocx() {
    setBusy(true);
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import("docx");
      const { saveAs } = await import("file-saver");
      const children = paragraphs().map(
        (p) =>
          new Paragraph({
            alignment: p.heading ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
            spacing: { after: p.heading ? 160 : 120 },
            children: [
              new TextRun({
                text: p.text,
                bold: p.bold || p.heading,
                size: p.heading ? 26 : 22,
                font: "Times New Roman",
              }),
            ],
          }),
      );
      const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
      saveAs(blob, `laudo-tecnico-${form.numero || "sem-numero"}.docx`);
    } catch (e: any) {
      toast.error("Erro ao gerar Word: " + (e?.message ?? e));
    }
    setBusy(false);
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <TabBtn active={tab === "modelo"} onClick={() => setTab("modelo")} icon={<ScrollText className="h-4 w-4" />}>
          Modelo do laudo
        </TabBtn>
        <TabBtn active={tab === "checklist"} onClick={() => setTab("checklist")} icon={<ListChecks className="h-4 w-4" />}>
          Checklist de vistoria ({marcados}/{totalItens})
        </TabBtn>
        <TabBtn active={tab === "fotos"} onClick={() => setTab("fotos")} icon={<Camera className="h-4 w-4" />}>
          Fotos do laudo ({fotos.length})
        </TabBtn>
        <TabBtn active={tab === "manual"} onClick={() => setTab("manual")} icon={<BookOpen className="h-4 w-4" />}>
          Manual do serviço
        </TabBtn>

      </div>

      {tab === "modelo" && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPreview(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 border border-border rounded-md text-[13px] font-medium bg-white hover:bg-secondary"
            >
              <Eye className="h-3.5 w-3.5" /> Visualizar laudo
            </button>

            <button
              onClick={downloadDocx}
              disabled={busy}
              className="inline-flex items-center gap-1.5 h-9 px-3 border border-border rounded-md text-[13px] font-medium bg-white hover:bg-secondary disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} Word
            </button>
            <button
              onClick={downloadPdf}
              disabled={busy}
              className="inline-flex items-center gap-1.5 h-9 px-3 bg-primary text-white rounded-md text-[13px] font-medium hover:bg-primary-dark disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />} Baixar laudo em PDF
            </button>
          </div>

          {CAMPOS.map((s) => (
            <section key={s.secao} className="rounded-xl border border-border bg-white p-4 sm:p-5">
              <h3 className="t-h4 text-ink">{s.secao}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {s.campos.map((c) => (
                  <div key={c.k} className={c.area ? "sm:col-span-2" : ""}>
                    <label className="t-caption font-semibold text-foreground/70">{c.label}</label>
                    {c.area ? (
                      <textarea
                        rows={4}
                        value={form[c.k] ?? ""}
                        onChange={(e) => up(c.k, e.target.value)}
                        maxLength={4000}
                        className="mt-1 w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    ) : c.options ? (
                      <select
                        value={form[c.k] ?? ""}
                        onChange={(e) => up(c.k, e.target.value)}
                        className="mt-1 w-full h-10 px-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">Selecione…</option>
                        {c.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={form[c.k] ?? ""}
                        onChange={(e) => up(c.k, e.target.value)}
                        maxLength={300}
                        className="mt-1 w-full h-10 px-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === "checklist" && (
        <div className="mt-5 space-y-4">
          <p className="t-body-sm text-muted-foreground">
            Marque em campo o que foi verificado. Os itens marcados entram automaticamente no laudo gerado.
          </p>
          {CHECKLIST_VISTORIA.map((g) => (
            <section key={g.grupo} className="rounded-xl border border-border bg-white p-4 sm:p-5">
              <h3 className="t-h4 text-ink flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" /> {g.grupo}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {g.itens.map((it, i) => {
                  const key = `${g.grupo}-${i}`;
                  return (
                    <li key={key} className="rounded-lg border border-border/70 p-3">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!checked[key]}
                          onChange={(e) => setChecked((c) => ({ ...c, [key]: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                        />
                        <span className="text-sm text-ink">{it}</span>
                      </label>
                      {checked[key] && (
                        <input
                          value={obs[key] ?? ""}
                          onChange={(e) => setObs((o) => ({ ...o, [key]: e.target.value }))}
                          placeholder="Observação (opcional)"
                          maxLength={300}
                          className="mt-2 w-full h-9 px-3 bg-surface border border-border rounded-md text-[13px] focus:outline-none focus:border-primary"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {tab === "fotos" && (
        <div className="mt-5 space-y-4">
          <section className="rounded-xl border border-border bg-white p-4 sm:p-5">
            <h3 className="t-h4 text-ink flex items-center gap-2">
              <Images className="h-4 w-4 text-primary" /> Registro fotográfico
            </h3>
            <p className="mt-1.5 t-body-sm text-muted-foreground">
              As fotos ficam salvas na sua conta e entram no final do laudo em PDF, numeradas com a legenda.
            </p>
            <label className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface px-4 py-8 cursor-pointer hover:border-primary transition-colors">
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold text-ink">Enviar fotos da vistoria</span>
              <span className="t-caption text-muted-foreground">JPG ou PNG, até 8 MB por foto</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void addFotos(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            {fotos.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fotos.map((f, i) => (
                  <div key={f.id} className="rounded-lg border border-border overflow-hidden bg-surface">
                    <div className="relative">
                      <img src={f.dataUrl} alt={f.legenda || f.name} className="h-40 w-full object-cover" />
                      {f.uploading && (
                        <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        </div>
                      )}
                      <button
                        onClick={() => void removeFoto(f)}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 border border-border flex items-center justify-center hover:bg-white"
                        aria-label="Remover foto"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                    <div className="p-2.5">
                      <div className="t-caption text-muted-foreground">Foto {i + 1}</div>
                      <input
                        value={f.legenda}
                        onChange={(e) =>
                          setFotos((p) => p.map((x) => (x.id === f.id ? { ...x, legenda: e.target.value } : x)))
                        }
                        placeholder="Legenda da foto"
                        maxLength={200}
                        className="mt-1 w-full h-9 px-2.5 bg-white border border-border rounded-md text-[13px] focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-ink/60 p-3 sm:p-6 overflow-y-auto" onClick={() => setPreview(false)}>
          <div
            className="mx-auto max-w-3xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-white px-5 py-3 rounded-t-2xl">
              <h3 className="t-h4 text-ink">Pré-visualização do laudo</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadPdf}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 h-9 px-3 bg-primary text-white rounded-md text-[13px] font-medium hover:bg-primary-dark disabled:opacity-60"
                >
                  <FileDown className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => setPreview(false)}
                  className="h-9 w-9 rounded-md border border-border flex items-center justify-center hover:bg-secondary"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="px-6 py-6 space-y-2 font-serif text-[13.5px] leading-relaxed text-ink">
              {paragraphs().map((p, i) =>
                p.heading ? (
                  <h4 key={i} className="pt-3 text-[14px] font-bold tracking-wide">
                    {p.text}
                  </h4>
                ) : (
                  <p key={i} className={p.bold ? "font-semibold" : ""}>
                    {p.text}
                  </p>
                ),
              )}
              {fotos.length > 0 && (
                <>
                  <h4 className="pt-4 text-[14px] font-bold tracking-wide">REGISTRO FOTOGRÁFICO</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {fotos.map((f, i) => (
                      <figure key={f.id}>
                        <img src={f.dataUrl} alt={f.legenda || f.name} className="w-full rounded-md border border-border" />
                        <figcaption className="mt-1 text-[12px] text-muted-foreground">
                          Foto {i + 1} — {f.legenda || f.name}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "manual" && (

        <div className="mt-5 space-y-5">
          <section className="rounded-xl border border-border bg-white p-4 sm:p-5">
            <h3 className="t-h4 text-ink">Tipos de laudo e para quem vender</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {LAUDO_TIPOS.map((t) => (
                <article key={t.id} className="rounded-lg border border-border p-4 bg-surface">
                  <h4 className="text-sm font-semibold text-ink">{t.nome}</h4>
                  <p className="mt-1.5 t-body-sm text-muted-foreground">{t.resumo}</p>
                  <p className="mt-2 text-[12.5px] text-muted-foreground">
                    <strong className="text-ink">Finalidade:</strong> {t.finalidade}
                  </p>
                  <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                    <strong className="text-ink">Normas:</strong> {t.normas.join("; ")}
                  </p>
                  <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                    <strong className="text-ink">Quem contrata:</strong> {t.quemContrata.join(", ")}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {MANUAL_SECOES.map((s) => (
            <section key={s.titulo} className="rounded-xl border border-border bg-white p-4 sm:p-5">
              <h3 className="t-h4 text-ink">{s.titulo}</h3>
              {s.paragrafos.map((p, i) => (
                <p key={i} className="mt-3 t-body-sm text-muted-foreground">
                  {p}
                </p>
              ))}
              {s.lista && (
                <ul className="mt-3 space-y-2">
                  {s.lista.map((li, i) => (
                    <li key={i} className="flex gap-2 t-body-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium transition-colors ${
        active ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:text-ink"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
