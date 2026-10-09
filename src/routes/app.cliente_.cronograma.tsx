import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Calendar,
  ClipboardCheck, ArrowLeft, CheckCircle2, Building2, Clock, Scale,
  ShoppingBag,
BellRing, CalendarClock , Images } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import etapa1 from "@/assets/etapa-1-briefing.jpg";
import etapa2 from "@/assets/etapa-2-preliminar.jpg";
import etapa3 from "@/assets/etapa-3-anteprojeto.jpg";
import etapa4 from "@/assets/etapa-4-legal.jpg";
import etapa5 from "@/assets/etapa-5-executivo.jpg";
import etapa6 from "@/assets/etapa-6-obra.jpg";

export const Route = createFileRoute("/app/cliente_/cronograma")({
  head: () => ({ meta: [{ title: "Cronograma do projeto — ArqHub" }] }),
  component: CronogramaCliente,
});

const nav: NavGroup[] = [
  { label: "Interface", items: [{ to: "/app/cliente", label: "Início", icon: LayoutDashboard }, { to: "/app/cliente/meu-projeto", label: "Meu projeto", icon: FolderOpen }] },
  {
    label: "Acompanhamento",
    items: [
      { to: "/app/cliente/agenda", label: "Agenda", icon: CalendarClock },
      { to: "/app/cliente/aprovacoes", label: "Aprovações", icon: ClipboardCheck },
      { to: "/app/cliente/cronograma", label: "Cronograma", icon: Calendar },
      { to: "/app/cliente/documentos", label: "Documentos", icon: FolderOpen },
      { to: "/app/cliente/galeria", label: "Galeria", icon: Images },
      { to: "/app/cliente/produtos", label: "Produtos", icon: ShoppingBag },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { to: "/app/cliente/mensagens", label: "Mensagens", icon: MessageSquare },
      { to: "/app/cliente/notificacoes", label: "Notificações", icon: BellRing },
    ],
  },
  { label: "Financeiro", items: [{ to: "/app/meus-pagamentos", label: "Meus pagamentos", icon: FileText }] },
];

type Etapa = {
  numero: number;
  nome: string;
  imagem: string;
  resumo: string;
  acontece: string[];
  deverEscritorio: string[];
  direitoCliente: string[];
  prazo: string;
};

const ETAPAS: Etapa[] = [
  {
    numero: 1,
    nome: "Briefing e Levantamento",
    imagem: etapa1,
    resumo: "Entendimento das necessidades, estilo de vida e orçamento, com levantamento técnico do imóvel.",
    acontece: [
      "Reunião de briefing para mapear desejos, rotina e referências.",
      "Visita técnica e medição do imóvel (com fotos e checagem de instalações).",
      "Alinhamento de escopo, orçamento estimado e prazos gerais.",
    ],
    deverEscritorio: [
      "Conduzir reunião estruturada e registrar tudo por escrito.",
      "Entregar o levantamento técnico e o briefing consolidado.",
      "Apresentar contrato com escopo, honorários e cronograma.",
    ],
    direitoCliente: [
      "Receber o briefing consolidado para validação.",
      "Tirar dúvidas sobre contrato, escopo e formas de pagamento.",
      "Solicitar ajustes antes de assinar o contrato.",
    ],
    prazo: "Próxima etapa em até 7 dias após a assinatura do contrato.",
  },
  {
    numero: 2,
    nome: "Estudo Preliminar",
    imagem: etapa2,
    resumo: "Primeiras propostas de layout e organização dos ambientes a partir do briefing.",
    acontece: [
      "Desenvolvimento de 1 a 2 opções de layout (plantas baixas).",
      "Estudo de fluxos, dimensionamento e funcionalidade dos espaços.",
      "Apresentação com explicação das soluções e ajustes.",
    ],
    deverEscritorio: [
      "Apresentar layouts respeitando briefing e orçamento.",
      "Explicar prós e contras de cada opção.",
      "Registrar alterações solicitadas em ata de reunião.",
    ],
    direitoCliente: [
      "Solicitar até 2 rodadas de ajustes no layout sem custo extra.",
      "Receber registro das decisões aprovadas em cada reunião.",
      "Aprovar formalmente o layout antes de avançar.",
    ],
    prazo: "Próxima etapa em até 15 dias após a aprovação do layout.",
  },
  {
    numero: 3,
    nome: "Anteprojeto",
    imagem: etapa3,
    resumo: "Detalhamento da proposta com materiais, paleta, mobiliário e imagens 3D.",
    acontece: [
      "Especificação de materiais, revestimentos e marcenaria.",
      "Imagens 3D realistas dos ambientes principais.",
      "Definição da paleta de cores e mood do projeto.",
    ],
    deverEscritorio: [
      "Entregar imagens 3D de boa qualidade dos ambientes acordados.",
      "Apresentar amostras físicas de revestimentos quando possível.",
      "Manter o projeto dentro do orçamento aprovado.",
    ],
    direitoCliente: [
      "Aprovar cada ambiente individualmente em 3D.",
      "Pedir trocas de materiais com impacto de custo informado.",
      "Receber lista preliminar de fornecedores e referências.",
    ],
    prazo: "Próxima etapa em até 20 dias após aprovação do 3D.",
  },
  {
    numero: 4,
    nome: "Projeto Legal",
    imagem: etapa4,
    resumo: "Documentação para aprovação em órgãos públicos e no condomínio, quando aplicável.",
    acontece: [
      "Elaboração das pranchas para prefeitura, bombeiros ou condomínio.",
      "Protocolo, acompanhamento de exigências e respostas técnicas.",
      "Emissão de ART/RRT do responsável técnico.",
    ],
    deverEscritorio: [
      "Cumprir as normas vigentes e prazos de resposta dos órgãos.",
      "Informar o cliente sobre exigências e custos de aprovação.",
      "Entregar cópias dos documentos protocolados.",
    ],
    direitoCliente: [
      "Acompanhar o andamento dos protocolos em tempo real.",
      "Receber ART/RRT em seu nome ao final da aprovação.",
      "Ser informado de qualquer exigência que altere prazo ou custo.",
    ],
    prazo: "Tempo médio de 30 a 90 dias, conforme o órgão.",
  },
  {
    numero: 5,
    nome: "Projeto Executivo",
    imagem: etapa5,
    resumo: "Detalhamento técnico completo para que a obra seja executada sem dúvidas.",
    acontece: [
      "Plantas de elétrica, hidráulica, iluminação, marcenaria e detalhamentos.",
      "Memorial descritivo e caderno de especificações.",
      "Compatibilização entre projetos complementares.",
    ],
    deverEscritorio: [
      "Entregar projeto executivo completo em formato digital e impresso.",
      "Esclarecer dúvidas técnicas com a equipe de obra.",
      "Garantir que as especificações estejam disponíveis para orçamento.",
    ],
    direitoCliente: [
      "Receber arquivos finais (PDF e DWG) do projeto executivo.",
      "Solicitar até 3 orçamentos com base no caderno de especificações.",
      "Receber suporte para escolha da empreiteira ou marceneiro.",
    ],
    prazo: "Próxima etapa em até 30 dias após aprovação do anteprojeto.",
  },
  {
    numero: 6,
    nome: "Acompanhamento de Obra",
    imagem: etapa6,
    resumo: "Visitas técnicas, fiscalização e ajustes para garantir a execução conforme projeto.",
    acontece: [
      "Visitas técnicas periódicas à obra com relatório fotográfico.",
      "Acompanhamento de marceneiros e fornecedores.",
      "Validação de medidas em loco e ajustes pontuais no projeto.",
    ],
    deverEscritorio: [
      "Emitir relatório de visita após cada ida à obra.",
      "Comunicar desvios entre obra e projeto imediatamente.",
      "Estar disponível em canal direto durante a obra.",
    ],
    direitoCliente: [
      "Receber relatório de cada visita técnica.",
      "Solicitar visitas extras conforme contrato.",
      "Receber o termo de entrega ao final da obra (as-built).",
    ],
    prazo: "Conforme o cronograma de obra acordado com a empreiteira.",
  },
];

function CronogramaCliente() {
  return (
    <AppShell role="cliente" nav={nav} title="Cronograma do projeto">
      <div className="pt-1 mb-2 flex h-8 items-center text-[11.5px] text-muted-foreground">
        <Link to="/app/cliente" className="inline-flex items-center gap-1 hover:text-ink transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Meu projeto
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Cronograma</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-border rounded-xl p-6 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-ink leading-tight">Como funciona o seu projeto</h2>
            <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed max-w-2xl">
              Conheça as 6 etapas de um projeto de arquitetura. Em cada uma você confere o que acontece,
              o que o escritório deve entregar, quais são os seus direitos e o prazo até a próxima fase.
            </p>
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div className="space-y-4">
        {ETAPAS.map((e) => (
          <EtapaCard key={e.numero} etapa={e} />
        ))}
      </div>

      <div className="mt-6 mb-2 text-center text-[11.5px] text-muted-foreground">
        Dúvidas? Fale com o escritório pela aba{" "}
        <Link to="/app/cliente" hash="mensagens" className="text-blue-600 hover:underline">Mensagens</Link>.
      </div>
    </AppShell>
  );
}

function EtapaCard({ etapa }: { etapa: Etapa }) {
  return (
    <article className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <div className="relative aspect-[4/3] md:aspect-auto md:h-full bg-muted">
          <img
            src={etapa.imagem}
            alt={etapa.nome}
            loading="lazy"
            width={800}
            height={512}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur text-[11px] font-semibold text-ink shadow-sm">
            Etapa {etapa.numero} de {ETAPAS.length}
          </div>
        </div>

        <div className="p-5 md:p-6">
          <h3 className="text-[15px] font-semibold text-ink leading-tight">{etapa.nome}</h3>
          <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">{etapa.resumo}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <InfoBlock
              icon={<Building2 className="h-3.5 w-3.5" />}
              title="O que acontece"
              items={etapa.acontece}
              tint="slate"
            />
            <InfoBlock
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              title="Dever do escritório"
              items={etapa.deverEscritorio}
              tint="emerald"
            />
            <InfoBlock
              icon={<Scale className="h-3.5 w-3.5" />}
              title="Direito do cliente"
              items={etapa.direitoCliente}
              tint="blue"
            />
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-700">
                <Clock className="h-3.5 w-3.5" /> Prazo
              </div>
              <p className="text-[12px] text-ink mt-1.5 leading-relaxed">{etapa.prazo}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoBlock({
  icon, title, items, tint,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tint: "slate" | "emerald" | "blue";
}) {
  const tintMap = {
    slate: "text-slate-700",
    emerald: "text-emerald-700",
    blue: "text-blue-700",
  } as const;
  return (
    <div>
      <div className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide ${tintMap[tint]}`}>
        {icon} {title}
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-[12px] text-ink leading-snug flex gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/60 shrink-0" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
