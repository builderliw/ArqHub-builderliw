import { useEffect, useMemo, useState } from "react";
import { FileDown, FileText, Send, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { createProfessionalDocumentRecord } from "@/lib/profissional-project-data.functions";

type Cliente = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cidade?: string | null;
  uf?: string | null;
  rua?: string | null;
  numero?: string | null;
};

type Projeto = {
  id: string;
  name: string;
  description?: string | null;
  budget_cents?: number | null;
  deadline?: string | null;
  location?: string | null;
  city?: string | null;
};

type FormState = {
  // Contratante
  clienteNome: string;
  clienteNacionalidade: string;
  clienteEstadoCivil: string;
  clienteProfissao: string;
  clienteRg: string;
  clienteCpf: string;
  clienteEndereco: string;
  clienteEmail: string;
  clienteTelefone: string;
  // Contratado (escritório)
  arqNome: string;
  arqRazaoSocial: string;
  arqCnpj: string;
  arqNacionalidade: string;
  arqEstadoCivil: string;
  arqCauUf: string;
  arqCauNumero: string;
  arqCpfCnpj: string;
  arqEndereco: string;
  arqEmail: string;
  arqTelefone: string;
  // Responsável técnico
  respNome: string;
  respCpf: string;
  respTelefone: string;
  // Obra
  enderecoObra: string;
  // Revisões / valores
  revisoes: string;
  valorHora: string;
  prazoFase1: string;
  prazoFase2: string;
  prazoFase3: string;
  prazoResposta: string;
  valorTotal: string;
  entrada: string;
  parcela2: string;
  parcela3: string;
  avisoRescisao: string;
  multaRescisao: string;
  cidadeData: string;
  data: string;
};

function brl(cents?: number | null) {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayBr() {
  return new Date().toLocaleDateString("pt-BR");
}

export function ProjectContratoTab({ cliente, projetos }: { cliente: Cliente; projetos: Projeto[] }) {
  const [projectId, setProjectId] = useState<string>(projetos[0]?.id ?? "");
  const projeto = useMemo(() => projetos.find((p) => p.id === projectId) ?? projetos[0], [projetos, projectId]);

  const initial = useMemo<FormState>(() => {
    const endCliente = [cliente.rua, cliente.numero, cliente.cidade, cliente.uf].filter(Boolean).join(", ");
    const endObra = projeto?.location || [projeto?.city].filter(Boolean).join(", ") || endCliente;
    return {
      clienteNome: cliente.name || "",
      clienteNacionalidade: "Brasileiro(a)",
      clienteEstadoCivil: "",
      clienteProfissao: "",
      clienteRg: "",
      clienteCpf: "",
      clienteEndereco: endCliente,
      clienteEmail: cliente.email || "",
      clienteTelefone: cliente.phone || "",
      arqNome: "",
      arqRazaoSocial: "",
      arqCnpj: "",
      arqNacionalidade: "Brasileiro(a)",
      arqEstadoCivil: "",
      arqCauUf: "",
      arqCauNumero: "",
      arqCpfCnpj: "",
      arqEndereco: "",
      arqEmail: "",
      arqTelefone: "",
      respNome: "",
      respCpf: "",
      respTelefone: "",
      enderecoObra: endObra,
      revisoes: "2",
      valorHora: "",
      prazoFase1: "15",
      prazoFase2: "20",
      prazoFase3: "30",
      prazoResposta: "5",
      valorTotal: brl(projeto?.budget_cents ?? null),
      entrada: "",
      parcela2: "",
      parcela3: "",
      avisoRescisao: "15",
      multaRescisao: "10",
      cidadeData: [cliente.cidade, cliente.uf].filter(Boolean).join(" - "),
      data: todayBr(),
    };
  }, [cliente, projeto]);

  const [form, setForm] = useState<FormState>(initial);
  useEffect(() => { setForm(initial); }, [initial]);

  // Preenche automaticamente os dados do escritório contratado + responsável técnico.
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: u } = await externalSupabase.auth.getUser();
      if (!u.user) return;
      const { data: office } = await externalSupabase
        .from("offices")
        .select(
          "id, name, razao_social, cnpj, cau, phone, whatsapp, email, cep, rua, numero, complemento, bairro, city, estado",
        )
        .eq("owner_id", u.user.id)
        .limit(1)
        .maybeSingle();
      if (!office || cancel) return;
      const o = office as Record<string, any>;
      const endereco = [
        [o.rua, o.numero].filter(Boolean).join(", "),
        o.complemento,
        o.bairro,
        [o.city, o.estado].filter(Boolean).join(" - "),
        o.cep,
      ]
        .filter((s) => s && String(s).trim())
        .join(", ");
      const telefone = o.phone || o.whatsapp || "";

      const { data: profile } = await externalSupabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.user.id)
        .maybeSingle();
      if (cancel) return;

      setForm((f) => ({
        ...f,
        arqNome: f.arqNome || o.name || "",
        arqRazaoSocial: f.arqRazaoSocial || o.razao_social || "",
        arqCnpj: f.arqCnpj || o.cnpj || "",
        arqCpfCnpj: f.arqCpfCnpj || o.cnpj || "",
        arqCauNumero: f.arqCauNumero || o.cau || "",
        arqCauUf: f.arqCauUf || o.estado || "",
        arqEndereco: f.arqEndereco || endereco,
        arqEmail: f.arqEmail || o.email || "",
        arqTelefone: f.arqTelefone || telefone,
        respNome: f.respNome || (profile as any)?.full_name || u.user.email || "",
        respTelefone: f.respTelefone || telefone,
      }));
    })();
    return () => { cancel = true; };
  }, [cliente.id]);

  function up<K extends keyof FormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const paragraphs = useMemo(() => buildContract(form), [form]);
  const [sending, setSending] = useState(false);
  const createDoc = useServerFn(createProfessionalDocumentRecord);

  async function buildPdfDoc() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 56;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    for (const p of paragraphs) {
      if (p.signatureGap) { y += 48; continue; }
      if (p.signatureLine) {
        if (y > doc.internal.pageSize.getHeight() - margin - 40) { doc.addPage(); y = margin; }
        const lineW = 220;
        doc.setDrawColor(0);
        doc.line(margin, y, margin + lineW, y);
        y += 14;
        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.text(p.text, margin, y);
        y += 24;
        continue;
      }
      const style = p.bold || p.heading ? "bold" : "normal";
      doc.setFont("times", style);
      doc.setFontSize(p.heading ? 13 : 11);
      const lines = doc.splitTextToSize(p.text, width);
      for (const line of lines) {
        if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += p.heading ? 18 : 15;
      }
      y += p.heading ? 6 : 8;
    }
    return doc;
  }

  async function downloadPdf() {
    const doc = await buildPdfDoc();
    doc.save(`contrato-${slug(cliente.name)}.pdf`);
  }

  async function downloadDocx() {
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import("docx");
      const { saveAs } = await import("file-saver");
      const children = paragraphs.map((p) => {
        if (p.signatureGap) {
          return new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: "" })] });
        }
        if (p.signatureLine) {
          return new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 200, after: 240 },
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 6 } },
            children: [new TextRun({ text: p.text, bold: true, size: 22, font: "Times New Roman" })],
          });
        }
        return new Paragraph({
          alignment: p.heading ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
          spacing: { after: p.heading ? 160 : 120 },
          children: [new TextRun({ text: p.text, bold: p.bold || p.heading, size: p.heading ? 26 : 22, font: "Times New Roman" })],
        });
      });
      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `contrato-${slug(cliente.name)}.docx`);
    } catch (e: any) {
      toast.error("Erro ao gerar Word: " + (e?.message ?? e));
    }
  }

  async function sendToClient() {
    if (!projeto?.id) return;
    if (!confirm("Enviar este contrato para o painel do cliente?")) return;
    setSending(true);
    try {
      const doc = await buildPdfDoc();
      const blob = doc.output("blob");
      const { data: sess } = await externalSupabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      const fileName = `contrato-${slug(cliente.name)}-${Date.now()}.pdf`;
      const path = `${projeto.id}/contratos/${fileName}`;
      const up = await externalSupabase.storage.from("project-documents").upload(path, blob, { contentType: "application/pdf" });
      if (up.error) throw up.error;
      await createDoc({ data: { accessToken: token, projectId: projeto.id, document: {
        name: `Contrato - ${cliente.name}`,
        storage_path: path,
        mime_type: "application/pdf",
        size_bytes: blob.size,
        visible_to_client: true,
        doc_kind: "contrato",
        requires_approval: true,
        approval_status: "pending",
      } } });
      toast.success("Contrato enviado ao painel do cliente.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar contrato");
    }
    setSending(false);
  }

  if (projetos.length === 0) {
    return <div className="text-sm text-muted-foreground">Cadastre um projeto para este cliente antes de gerar o contrato.</div>;
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
            className="h-9 px-3 text-[13px] border border-border rounded-md bg-white">
            {projetos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadDocx}
              className="inline-flex items-center gap-1.5 px-3 h-9 border border-border rounded-md text-[13px] font-medium hover:bg-secondary">
              <FileText className="h-3.5 w-3.5" /> Word
            </button>
            <button onClick={downloadPdf}
              className="inline-flex items-center gap-1.5 px-3 h-9 border border-border rounded-md text-[13px] font-medium hover:bg-secondary">
              <FileDown className="h-3.5 w-3.5" /> PDF
            </button>
            <button onClick={sendToClient} disabled={sending}
              className="inline-flex items-center gap-1.5 px-3 h-9 bg-ink text-white rounded-md text-[13px] font-medium hover:bg-black disabled:opacity-60">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Enviar ao cliente
            </button>
          </div>
        </div>

        <Section title="Contratante">
          <Grid>
            <Input label="Nome" value={form.clienteNome} onChange={(v) => up("clienteNome", v)} />
            <Select label="Nacionalidade" value={form.clienteNacionalidade} onChange={(v) => up("clienteNacionalidade", v)} options={NACIONALIDADES} />
            <Select label="Estado civil" value={form.clienteEstadoCivil} onChange={(v) => up("clienteEstadoCivil", v)} options={ESTADOS_CIVIS} />
            <Select label="Profissão" value={form.clienteProfissao} onChange={(v) => up("clienteProfissao", v)} options={PROFISSOES} />
            <Input label="RG" value={form.clienteRg} onChange={(v) => up("clienteRg", v)} />
            <Input label="CPF" value={form.clienteCpf} onChange={(v) => up("clienteCpf", v)} />
          </Grid>
          <Input label="Endereço residencial" value={form.clienteEndereco} onChange={(v) => up("clienteEndereco", v)} />
          <Grid>
            <Input label="E-mail" value={form.clienteEmail} onChange={(v) => up("clienteEmail", v)} />
            <Input label="Telefone" value={form.clienteTelefone} onChange={(v) => up("clienteTelefone", v)} />
          </Grid>
        </Section>

        <Section title="Contratado (Escritório)">
          <Grid>
            <Input label="Nome do escritório" value={form.arqNome} onChange={(v) => up("arqNome", v)} />
            <Input label="Razão social" value={form.arqRazaoSocial} onChange={(v) => up("arqRazaoSocial", v)} />
            <Input label="CNPJ" value={form.arqCnpj} onChange={(v) => up("arqCnpj", v)} />
            <Input label="Telefone" value={form.arqTelefone} onChange={(v) => up("arqTelefone", v)} />
          </Grid>
          <Input label="Endereço do escritório" value={form.arqEndereco} onChange={(v) => up("arqEndereco", v)} />
          <Grid>
            <Input label="E-mail" value={form.arqEmail} onChange={(v) => up("arqEmail", v)} />
            <Select label="Nacionalidade" value={form.arqNacionalidade} onChange={(v) => up("arqNacionalidade", v)} options={NACIONALIDADES} />
          </Grid>
        </Section>

        <Section title="Arquiteto/Engenheiro responsável">
          <Grid>
            <Input label="Nome" value={form.respNome} onChange={(v) => up("respNome", v)} />
            <Input label="CPF" value={form.respCpf} onChange={(v) => up("respCpf", v)} />
            <Input label="Telefone" value={form.respTelefone} onChange={(v) => up("respTelefone", v)} />
            <Select label="Estado civil" value={form.arqEstadoCivil} onChange={(v) => up("arqEstadoCivil", v)} options={ESTADOS_CIVIS} />
            <Select label="CAU/CREA UF" value={form.arqCauUf} onChange={(v) => up("arqCauUf", v)} options={UFS} allowCustom={false} placeholder="UF" />
            <Input label="CAU/CREA número" value={form.arqCauNumero} onChange={(v) => up("arqCauNumero", v)} />
          </Grid>
        </Section>


        <Section title="Obra e prazos">
          <Input label="Endereço da obra" value={form.enderecoObra} onChange={(v) => up("enderecoObra", v)} />
          <Grid>
            <Select label="Revisões gratuitas" value={form.revisoes} onChange={(v) => up("revisoes", v)} options={NUM_1_10} />
            <Input label="Valor hora técnica (R$)" value={form.valorHora} onChange={(v) => up("valorHora", v)} />
            <Select label="Prazo Fase 1 (dias úteis)" value={form.prazoFase1} onChange={(v) => up("prazoFase1", v)} options={DIAS_PRAZO} />
            <Select label="Prazo Fase 2 (dias úteis)" value={form.prazoFase2} onChange={(v) => up("prazoFase2", v)} options={DIAS_PRAZO} />
            <Select label="Prazo Fase 3 (dias úteis)" value={form.prazoFase3} onChange={(v) => up("prazoFase3", v)} options={DIAS_PRAZO} />
            <Select label="Prazo resposta cliente (dias úteis)" value={form.prazoResposta} onChange={(v) => up("prazoResposta", v)} options={DIAS_RESPOSTA} />
          </Grid>
        </Section>

        <Section title="Valores">
          <Grid>
            <Input label="Valor total" value={form.valorTotal} onChange={(v) => up("valorTotal", v)} />
            <Input label="Entrada" value={form.entrada} onChange={(v) => up("entrada", v)} />
            <Input label="Parcela 2" value={form.parcela2} onChange={(v) => up("parcela2", v)} />
            <Input label="Parcela 3" value={form.parcela3} onChange={(v) => up("parcela3", v)} />
          </Grid>
        </Section>

        <Section title="Rescisão e assinatura">
          <Grid>
            <Select label="Aviso prévio (dias)" value={form.avisoRescisao} onChange={(v) => up("avisoRescisao", v)} options={DIAS_PRAZO} />
            <Select label="Multa (%)" value={form.multaRescisao} onChange={(v) => up("multaRescisao", v)} options={PERCENTUAIS} />
            <Input label="Cidade - UF" value={form.cidadeData} onChange={(v) => up("cidadeData", v)} />
            <Input label="Data" value={form.data} onChange={(v) => up("data", v)} />
          </Grid>
        </Section>
      </div>

      <div className="border border-border rounded-lg bg-white p-6 h-fit max-h-[80vh] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          {paragraphs.map((p, i) => {
            if (p.signatureGap) return <div key={i} className="h-16" />;
            if (p.signatureLine) return (
              <div key={i} className="mt-2 mb-6 max-w-[320px]">
                <div className="border-t border-ink pt-1.5 text-[13px] font-semibold text-ink">{p.text}</div>
              </div>
            );
            return (
              <p key={i} className={p.heading ? "font-semibold text-ink mt-4" : "text-[13px] text-ink leading-relaxed text-justify"}>
                {p.text}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cliente";
}

type Para = { text: string; heading?: boolean; bold?: boolean; signatureLine?: boolean; signatureGap?: boolean };

function buildContract(f: FormState): Para[] {
  const v = (s: string, ph: string) => (s.trim() ? s : `[${ph}]`);
  return [
    { text: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ARQUITETURA", heading: true },
    { text: "1. DAS PARTES", heading: true },
    { text: `CONTRATANTE: ${v(f.clienteNome, "Nome do Cliente")}, ${v(f.clienteNacionalidade, "Nacionalidade")}, ${v(f.clienteEstadoCivil, "Estado Civil")}, ${v(f.clienteProfissao, "Profissão")}, portador do RG nº ${v(f.clienteRg, "Número")} e inscrito no CPF sob o nº ${v(f.clienteCpf, "Número")}, residente e domiciliado na ${v(f.clienteEndereco, "Endereço Residencial Completo")}, com e-mail ${v(f.clienteEmail, "E-mail")} e telefone ${v(f.clienteTelefone, "Telefone")}.` },
    { text: `CONTRATADO: ${v(f.arqNome, "Nome do Escritório")}, razão social ${v(f.arqRazaoSocial, "Razão Social")}, inscrito no CNPJ sob o nº ${v(f.arqCnpj, "CNPJ")}, com endereço profissional na ${v(f.arqEndereco, "Endereço Comercial Completo")}, telefone ${v(f.arqTelefone, "Telefone")} e e-mail ${v(f.arqEmail, "E-mail")}.` },
    { text: `RESPONSÁVEL TÉCNICO: ${v(f.respNome, "Nome do Arquiteto/Engenheiro")}, ${v(f.arqNacionalidade, "Nacionalidade")}, ${v(f.arqEstadoCivil, "Estado Civil")}, registrado no CAU/CREA ${v(f.arqCauUf, "UF")} sob o nº ${v(f.arqCauNumero, "Número")}, inscrito no CPF sob o nº ${v(f.respCpf, "CPF")}, telefone ${v(f.respTelefone, "Telefone")}.` },
    { text: "2. DO OBJETO E ENDEREÇO DA OBRA", heading: true },
    { text: `Cláusula 1ª. O presente contrato tem por objeto a prestação de serviços de arquitetura para o imóvel localizado na ${v(f.enderecoObra, "Endereço Completo do Local do Projeto/Obra")}.` },
    { text: "3. DO ESCOPO DOS SERVIÇOS", heading: true },
    { text: "Cláusula 2ª. Os serviços serão divididos nas seguintes etapas e entregáveis:" },
    { text: "Fase 1 - Estudo Preliminar: definição do conceito e zoneamento (plantas de layout e conceito visual)." },
    { text: "Fase 2 - Anteprojeto: modelagem e volumetria do espaço (maquete eletrônica/imagens 3D)." },
    { text: "Fase 3 - Projeto Executivo: detalhamento técnico para execução (plantas baixas, cortes, paginação de piso, pontos de iluminação e gesso)." },
    { text: `Cláusula 3ª (Revisões). O CONTRATANTE terá direito a até ${v(f.revisoes, "Número")} rodadas de alterações gratuitas durante a Fase 1 e Fase 2. Alterações que excedam esse limite serão cobradas à parte, no valor de R$ ${v(f.valorHora, "Valor")} por hora técnica.` },
    { text: "Cláusula 4ª (Exclusões). Estão expressamente excluídos: projetos complementares (estrutural, elétrico, hidráulico, climatização, automação); taxas de órgãos públicos, prefeitura ou condomínio; acompanhamento diário ou gerenciamento da execução da obra." },
    { text: "4. DOS PRAZOS E CRONOGRAMA", heading: true },
    { text: `Cláusula 5ª. Os prazos contarão em dias úteis, iniciando-se após o pagamento da primeira parcela e envio do briefing: Fase 1: ${v(f.prazoFase1, "Número")} dias úteis; Fase 2: ${v(f.prazoFase2, "Número")} dias úteis após aprovação da Fase 1; Fase 3: ${v(f.prazoFase3, "Número")} dias úteis após aprovação da Fase 2.` },
    { text: `Cláusula 6ª (Resposta do Cliente). O CONTRATANTE terá o prazo de até ${v(f.prazoResposta, "Número")} dias úteis para analisar e aprovar cada etapa entregue. O silêncio do cliente após este prazo será considerado aprovação tácita.` },
    { text: "Cláusula 7ª (Suspensão). O atraso do CONTRATANTE no envio de informações, aprovações ou pagamentos suspende automaticamente o cronograma de entrega do CONTRATADO." },
    { text: "5. DOS DIREITOS AUTORAIS E DA PROPRIEDADE INTELECTUAL", heading: true },
    { text: "Cláusula 8ª (Direitos Autorais). Os projetos, desenhos, memoriais e especificações elaborados pelo(a) CONTRATADO(A) são de sua propriedade intelectual e autoral exclusiva, protegidos pela Lei nº 9.610/98 e pelas resoluções do CAU." },
    { text: `Cláusula 9ª (Direito de Uso). O(A) CONTRATANTE adquire apenas o direito de uso do projeto estritamente para a execução da obra objeto deste contrato, no endereço indicado na Cláusula 1ª, sendo expressamente vedada sua alteração, cessão a terceiros, reprodução parcial ou total, ou reaplicação em outro local sem autorização prévia e por escrito do(a) autor(a).` },
    { text: "Cláusula 10ª (Divulgação). Fica autorizado ao CONTRATADO o direito de fotografar e filmar a obra finalizada e utilizar as imagens em seu portfólio, site e redes sociais para fins de divulgação profissional, preservando a identidade do CONTRATANTE." },
    { text: "6. DOS VALORES E FORMA DE PAGAMENTO", heading: true },
    { text: `Cláusula 11ª. Pelos serviços contratados, o CONTRATANTE pagará o valor total de ${v(f.valorTotal, "Valor Total")}, dividido em: Entrada de ${v(f.entrada, "Valor")} na assinatura; Parcela 2 de ${v(f.parcela2, "Valor")} na entrega da Fase 2; Parcela 3 de ${v(f.parcela3, "Valor")} na entrega do Projeto Executivo final.` },
    { text: "7. DA RESCISÃO E MULTA", heading: true },
    { text: `Cláusula 12ª. Qualquer das partes poderá rescindir o contrato mediante aviso prévio por escrito de ${v(f.avisoRescisao, "Número")} dias. Em caso de rescisão sem justa causa por iniciativa do cliente, serão devidos os valores das etapas já executadas, acrescidos de multa de ${v(f.multaRescisao, "Número")}% sobre o saldo remanescente.` },
    { text: "Por estarem justos e contratados, as partes assinam o presente instrumento em 2 (duas) vias de igual teor." },
    { text: `${v(f.cidadeData, "Cidade - UF")}, ${v(f.data, "Data")}.` },
    { text: "", signatureGap: true },
    { text: "CONTRATANTE", signatureLine: true },
    { text: "", signatureGap: true },
    { text: `CONTRATADO (Arquiteto - CAU nº ${v(f.arqCauNumero, "Número")})`, signatureLine: true },
  ];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-white">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-9 px-3 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </label>
  );
}

/** Dropdown com opção de digitar valor livre ("Outro..."). */
function Select({
  label, value, onChange, options, allowCustom = true, placeholder = "Selecione",
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; allowCustom?: boolean; placeholder?: string;
}) {
  const known = options.includes(value);
  const [custom, setCustom] = useState(!!value && !known);
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {custom ? (
        <div className="mt-1 flex gap-1.5">
          <input value={value} onChange={(e) => onChange(e.target.value)} autoFocus
            className="w-full h-9 px-3 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="button" onClick={() => { setCustom(false); onChange(""); }}
            className="h-9 px-2 text-[11px] border border-border rounded-md hover:bg-secondary shrink-0">Lista</button>
        </div>
      ) : (
        <select
          value={known ? value : ""}
          onChange={(e) => {
            if (e.target.value === "__custom__") { setCustom(true); onChange(""); return; }
            onChange(e.target.value);
          }}
          className="mt-1 w-full h-9 px-2 text-[13px] border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
          {allowCustom && <option value="__custom__">Outro (digitar)…</option>}
        </select>
      )}
    </label>
  );
}

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const NACIONALIDADES = ["Brasileiro(a)", "Português(a)", "Argentino(a)", "Estrangeiro(a)"];
const ESTADOS_CIVIS = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Separado(a)", "Viúvo(a)"];
const NUM_1_10 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const DIAS_PRAZO = ["3", "5", "7", "10", "15", "20", "30", "45", "60", "90"];
const DIAS_RESPOSTA = ["2", "3", "5", "7", "10", "15"];
const PERCENTUAIS = ["5", "10", "15", "20", "25", "30", "50"];
const PROFISSOES = [
  "Administrador(a)", "Advogado(a)", "Analista de sistemas", "Arquiteto(a)", "Comerciante",
  "Contador(a)", "Empresário(a)", "Enfermeiro(a)", "Engenheiro(a)", "Estudante",
  "Funcionário(a) público(a)", "Médico(a)", "Professor(a)", "Aposentado(a)", "Autônomo(a)",
];

