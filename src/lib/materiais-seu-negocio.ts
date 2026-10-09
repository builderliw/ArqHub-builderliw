export type SeuNegocioMaterial = {
  id: string;
  title: string;
  description: string;
  format: "PDF" | "Planilha" | "Modelo";
  cover: string;
};

export const CATEGORY_SEU_NEGOCIO = "seu-negocio";

export const seuNegocioMaterials: SeuNegocioMaterial[] = [
  {
    id: "250-prompts-ia",
    title: "250 Prompts de IA para Construção Civil",
    description:
      "Aplique IA na gestão da sua obra com prompts prontos para diferentes etapas do projeto. Ganhe agilidade, reduza tarefas operacionais. Baixe agora!",
    format: "PDF",
    cover:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "sinapi-2026",
    title: "Tabela SINAPI 2026 — Download rápido e gratuito",
    description:
      "Pare de perder tempo no site da Caixa. Reunimos TODAS as Tabelas SINAPI 2026 disponíveis em um único arquivo, pronto para consulta e uso imediato.",
    format: "Planilha",
    cover:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "medicao-obras",
    title: "Planilha de Medição de Obras",
    description:
      "Acompanhe com precisão a evolução das suas obras. Com esse modelo gratuito, registre e acompanhe cada etapa da construção com clareza e eficiência.",
    format: "Planilha",
    cover:
      "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "sinapi-2025",
    title: "Tabela SINAPI 2025 — Baixe todas as versões",
    description:
      "Pare de perder tempo no site da Caixa. Reunimos TODAS as Tabelas SINAPI 2025 disponíveis em um único arquivo.",
    format: "Planilha",
    cover:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cronograma-fisico-financeiro",
    title: "Cronograma Físico-Financeiro de Obra",
    description:
      "Tenha previsibilidade total na sua obra! Com esse modelo gratuito, planeje e acompanhe cada etapa da construção com clareza, controle de custos e prazos.",
    format: "Planilha",
    cover:
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "diario-obra",
    title: "Modelo de Diário de Obra Grátis 2025",
    description:
      "Organize cada etapa da sua construção com eficiência, profissionalismo e zero dor de cabeça. Baixe agora e tenha controle total da sua obra.",
    format: "Modelo",
    cover:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "diagnostico-empresarial",
    title: "Diagnóstico empresarial para arquitetura & construção",
    description:
      "Faça o raio X completo da gestão do seu escritório e descubra onde está perdendo tempo e dinheiro.",
    format: "PDF",
    cover:
      "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cronograma-residencial",
    title: "Planilha de Cronograma de Obra Residencial",
    description:
      "Um modelo pronto de cronograma de obra residencial, com etapas, durações e responsáveis pré-configurados.",
    format: "Planilha",
    cover:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "orcamento-obra-residencial",
    title: "Planilha de Orçamento de Obra Residencial",
    description:
      "Um modelo pronto de orçamento de obra residencial para você nunca mais começar um orçamento do zero. Baixe agora.",
    format: "Planilha",
    cover:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "relatorio-visita-tecnica",
    title: "Relatório de visita técnica",
    description:
      "Tenha mais economia de tempo ao colher informações úteis para a gestão do seu projeto ou obra com este modelo de Relatório de Visita técnica 100% gratuito.",
    format: "Modelo",
    cover:
      "https://images.unsplash.com/photo-1503387837-b154d5074bd2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "checklist-vistoria-obra",
    title: "Checklist de vistoria de obra",
    description:
      "Obtenha o máximo de eficiência em seus projetos e obras com esse Checklist de vistoria de obra completo.",
    format: "PDF",
    cover:
      "https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "briefing-arquitetura",
    title: "Questionário de Briefing para arquitetura",
    description:
      "Saiba fazer as perguntas certas já na primeira reunião e otimize o seu trabalho. Este Briefing irá te ajudar a executar essa etapa de projeto de forma mais rápida e interativa.",
    format: "PDF",
    cover:
      "https://images.unsplash.com/photo-1542621334-a254cf47733d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "checklist-levantamento-arquitetonico",
    title: "Checklist de levantamento arquitetônico",
    description:
      "Receba o Checklist de levantamento arquitetônico completo e comece a usá-lo imediatamente para ter mais organização e clareza nesta etapa tão importante.",
    format: "PDF",
    cover:
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "calculadora-piso-revestimentos",
    title: "Calculadora de piso e revestimentos",
    description:
      "Calcule a quantidade de piso e revestimento para seu projeto ou obra e tenha uma estimativa muito mais rápida.",
    format: "Planilha",
    cover:
      "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "guia-gestao-obras",
    title: "Guia especial sobre Gestão de Obras",
    description:
      "Para que você possa cada vez mais aprimorar o seu trabalho, preparamos este guia com as diferentes tarefas e etapas da gestão de obras.",
    format: "PDF",
    cover:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
  },
];
