// Dados da ferramenta de Laudo Técnico (modelos, checklists e manual de mercado).

export type LaudoTipo = {
  id: string;
  nome: string;
  resumo: string;
  finalidade: string;
  normas: string[];
  quemContrata: string[];
};

export const LAUDO_TIPOS: LaudoTipo[] = [
  {
    id: "avaliacao-imovel",
    nome: "Laudo de avaliação de imóvel (valor de mercado)",
    resumo:
      "Determina o valor de mercado, de locação ou de liquidação forçada do imóvel por método comparativo direto de dados de mercado, com pesquisa, tratamento das amostras e grau de fundamentação.",
    finalidade:
      "Inventário, partilha/divórcio, usucapião, dação em pagamento, venda, incorporação ao capital social, ITBI/ITCMD, garantia bancária e processos judiciais.",
    normas: [
      "NBR 14653-1 (procedimentos gerais)",
      "NBR 14653-2 (imóveis urbanos)",
      "NBR 14653-3 (imóveis rurais)",
      "IBAPE - Norma de Avaliação de Imóveis Urbanos",
    ],
    quemContrata: ["Proprietários", "Advogados e inventariantes", "Juízo (perícia)", "Empresas e contadores", "Investidores"],
  },
  {
    id: "regularizacao",
    nome: "Laudo para regularização de imóvel",
    resumo:
      "Atesta as condições construtivas, área real edificada e conformidade do imóvel para processos de regularização (Reurb, habite-se tardio, averbação em matrícula).",
    finalidade:
      "Instruir processo administrativo junto à Prefeitura, Cartório de Registro de Imóveis ou programa de regularização fundiária.",
    normas: ["NBR 13752 (perícias de engenharia)", "NBR 16747 (inspeção predial)", "Lei 13.465/2017 (Reurb)"],
    quemContrata: ["Proprietários", "Prefeituras", "Cartórios", "Escritórios de advocacia imobiliária"],
  },
  {
    id: "financiamento",
    nome: "Laudo de avaliação para financiamento imobiliário",
    resumo:
      "Determina o valor de mercado do imóvel e o estágio/qualidade da construção para liberação de crédito habitacional (SFH/SFI).",
    finalidade:
      "Subsidiar bancos (Caixa, BB, Itaú, Bradesco, Santander) na concessão de financiamento, medição de obra e liberação de parcelas.",
    normas: ["NBR 14653-1 e 14653-2 (avaliação de bens / imóveis urbanos)", "Normas internas do agente financeiro"],
    quemContrata: ["Bancos e agentes financeiros", "Empresas credenciadas de engenharia", "Compradores"],
  },
  {
    id: "compra-venda",
    nome: "Laudo técnico para compra e venda",
    resumo:
      "Diagnóstico do estado de conservação, patologias, instalações e valor de mercado antes de fechar negócio.",
    finalidade: "Dar segurança técnica ao comprador/vendedor e embasar negociação de preço e reformas.",
    normas: ["NBR 14653-2", "NBR 16747", "NBR 5674 (manutenção de edificações)"],
    quemContrata: ["Compradores e vendedores", "Imobiliárias", "Investidores"],
  },
  {
    id: "vistoria-cautelar",
    nome: "Laudo de vistoria cautelar de vizinhança",
    resumo:
      "Registra o estado dos imóveis vizinhos antes do início de obra, protegendo o construtor de reclamações indevidas de danos.",
    finalidade: "Prova pré-constituída em caso de alegação de danos causados pela obra.",
    normas: ["NBR 12722 (discriminação de serviços)", "NBR 13752", "IBAPE/SP - Norma de Vistoria Cautelar"],
    quemContrata: ["Construtoras e incorporadoras", "Condomínios", "Empreiteiros"],
  },
  {
    id: "locacao",
    nome: "Laudo de vistoria de entrada/saída (locação)",
    resumo:
      "Documenta ambiente por ambiente o estado do imóvel na entrada e na saída do inquilino, com fotos e checklist.",
    finalidade: "Evitar litígio sobre reparos e retenção de caução ao final da locação.",
    normas: ["Lei 8.245/1991 (Lei do Inquilinato)", "NBR 16280 (reformas)"],
    quemContrata: ["Imobiliárias", "Proprietários", "Administradoras de condomínio"],
  },
  {
    id: "inspecao-predial",
    nome: "Laudo de inspeção predial / patologias",
    resumo:
      "Avalia sistemas construtivos, classifica anomalias por grau de risco e emite plano de ação com prioridades.",
    finalidade: "Manutenção preventiva, defesa em ações judiciais e cumprimento de exigência de seguradoras.",
    normas: ["NBR 16747 (inspeção predial)", "NBR 5674", "IBAPE - Norma de Inspeção Predial Nacional"],
    quemContrata: ["Condomínios", "Síndicos profissionais", "Seguradoras", "Empresas e órgãos públicos"],
  },
];

export type ChecklistGrupo = { grupo: string; itens: string[] };

export const CHECKLIST_VISTORIA: ChecklistGrupo[] = [
  {
    grupo: "Documentação e identificação",
    itens: [
      "Matrícula atualizada do imóvel",
      "IPTU / inscrição imobiliária",
      "Projeto aprovado e alvará",
      "Habite-se / certidão de conclusão",
      "Convenção e regimento (se condomínio)",
      "ART/RRT do responsável técnico emitida",
    ],
  },
  {
    grupo: "Terreno e implantação",
    itens: [
      "Confrontações e recuos conferidos em campo",
      "Área do terreno x área da matrícula",
      "Topografia, taludes e contenções",
      "Drenagem superficial e escoamento",
      "Presença de árvores/APP ou restrição ambiental",
    ],
  },
  {
    grupo: "Estrutura",
    itens: [
      "Fissuras, trincas e rachaduras (mapeadas e medidas)",
      "Flechas em vigas e lajes",
      "Corrosão de armadura / desplacamento de concreto",
      "Recalque de fundação (portas/janelas emperradas)",
      "Alterações estruturais sem projeto",
    ],
  },
  {
    grupo: "Vedações, revestimentos e cobertura",
    itens: [
      "Descolamento de revestimento cerâmico (teste de percussão)",
      "Infiltrações, manchas e mofo",
      "Pintura e impermeabilização",
      "Telhas, cumeeiras, rufos e calhas",
      "Forros e elementos suspensos",
    ],
  },
  {
    grupo: "Instalações hidrossanitárias",
    itens: [
      "Vazamentos aparentes e pressão nos pontos",
      "Caixa d'água: tampa, limpeza e volume",
      "Esgoto: ligação na rede pública ou fossa",
      "Ralos, sifões e caixas de inspeção",
      "Louças, metais e registros funcionando",
    ],
  },
  {
    grupo: "Instalações elétricas e gás",
    itens: [
      "Quadro de distribuição: identificação e DR/DPS",
      "Aterramento",
      "Tomadas e interruptores testados",
      "Padrão de entrada compatível com a carga",
      "Instalação de gás: ventilação e teste de estanqueidade",
    ],
  },
  {
    grupo: "Segurança e acessibilidade",
    itens: [
      "Extintores, hidrantes e sinalização (AVCB/CLCB)",
      "Guarda-corpos e corrimãos (altura e vãos)",
      "Rotas de fuga desobstruídas",
      "Acessibilidade NBR 9050 (rampas, larguras, sanitário)",
      "Iluminação de emergência",
    ],
  },
  {
    grupo: "Registro fotográfico e medições",
    itens: [
      "Fotos de contexto (fachada, ruas, confrontantes)",
      "Fotos de detalhe com escala (trena/régua) em cada anomalia",
      "Fotos numeradas e referenciadas no texto",
      "Croqui/planta de locação das anomalias",
      "Medições de área conferidas com trena/laser",
    ],
  },
  {
    grupo: "Avaliação de valor (NBR 14653)",
    itens: [
      "Pesquisa de mercado com no mínimo 5 amostras comparáveis",
      "Fontes das amostras identificáveis (anúncio, corretor, transação)",
      "Homogeneização/tratamento das amostras justificado",
      "Fatores de oferta, localização, área e padrão aplicados",
      "Zoneamento e potencial construtivo verificados",
      "Infraestrutura urbana do entorno (asfalto, água, esgoto, transporte)",
      "Valorização/desvalorização por vizinhança e uso do entorno",
      "Grau de fundamentação e precisão declarados",
    ],
  },
];

export const MANUAL_SECOES: Array<{ titulo: string; paragrafos: string[]; lista?: string[] }> = [
  {
    titulo: "1. Quem pode emitir laudo técnico",
    paragrafos: [
      "Laudo é ato privativo de profissional habilitado: arquiteto e urbanista (com RRT no CAU) ou engenheiro civil/eng. de avaliações (com ART no CREA). Para avaliação de imóveis, o mercado exige comprovação de experiência e, em muitos casos, curso de Engenharia de Avaliações (IBAPE) ou pós em perícias.",
      "Todo laudo entregue deve ter registro de responsabilidade técnica (ART/RRT) vinculado, número sequencial, data, assinatura e identificação profissional. Sem isso o documento não tem valor formal.",
    ],
  },
  {
    titulo: "2. Como precificar o serviço",
    paragrafos: [
      "Existem três formas usuais de cobrança no mercado brasileiro:",
    ],
    lista: [
      "Valor fixo por vistoria (mais comum em locação e compra e venda): definido por faixa de área e deslocamento.",
      "Percentual sobre o valor avaliado (avaliação para financiamento e judicial): normalmente entre 0,3% e 1%, com piso mínimo.",
      "Hora técnica (perícias e casos complexos): honorário por hora + horas de deslocamento + custos de ensaios.",
      "Sempre inclua no orçamento: deslocamento, ensaios laboratoriais, ART/RRT, número de revisões inclusas e prazo de entrega.",
    ],
  },
  {
    titulo: "3. Onde oferecer o serviço",
    paragrafos: ["Os canais que mais geram demanda recorrente:"],
    lista: [
      "Imobiliárias e administradoras de locação — vistoria de entrada/saída em volume.",
      "Escritórios de advocacia imobiliária e de família — laudos para inventário, divórcio e usucapião.",
      "Construtoras e incorporadoras — vistoria cautelar de vizinhança antes de cada obra.",
      "Condomínios e síndicos profissionais — inspeção predial periódica (NBR 16747).",
      "Correspondentes bancários e corretores de crédito imobiliário — indicação de avaliações.",
      "Prefeituras e programas de Reurb — credenciamento e chamadas públicas.",
      "Seguradoras e empresas de sinistro — regulação de danos em imóveis.",
    ],
  },
  {
    titulo: "4. Como se credenciar em bancos e editais",
    paragrafos: [
      "Bancos raramente contratam o profissional pessoa física direto: a maior parte das avaliações é distribuída por empresas de engenharia credenciadas, que subcontratam profissionais na região. Existem dois caminhos:",
    ],
    lista: [
      "Caminho A — credenciar-se nas empresas de engenharia de avaliações que atendem Caixa, Banco do Brasil, Itaú, Bradesco e Santander. Procure por 'empresa credenciada de avaliação de imóveis + [seu estado]', envie currículo, ART/RRT ativo, CNPJ (MEI/ME serve), comprovação de experiência e cobertura geográfica.",
      "Caminho B — acompanhar chamamentos e credenciamentos públicos: portal de licitações da Caixa e do Banco do Brasil, ComprasNet/Portal de Compras Públicas, portais de licitação das prefeituras e Diário Oficial do seu município e estado. Busque por 'credenciamento', 'avaliação de imóveis', 'engenharia de avaliações' e 'laudo técnico'.",
      "Documentação típica exigida no credenciamento: CNPJ e contrato social, certidão de registro da empresa no CREA/CAU, certidão de acervo técnico (CAT) ou atestados de capacidade técnica, certidões negativas (federal, estadual, municipal, FGTS, trabalhista), comprovação de experiência mínima (geralmente 2 a 5 anos) e seguro/responsabilidade civil em alguns editais.",
      "Prepare um portfólio com 3 a 5 laudos-modelo (dados anonimizados). É o que mais acelera a aprovação.",
    ],
  },
  {
    titulo: "5. Fluxo de trabalho recomendado",
    paragrafos: [],
    lista: [
      "Briefing e definição da finalidade do laudo (a finalidade muda a norma aplicada).",
      "Proposta com escopo, prazo, valor e limitações claras.",
      "Coleta documental antes da visita.",
      "Vistoria em campo com checklist e registro fotográfico completo.",
      "Pesquisa de mercado (quando houver avaliação de valor) com no mínimo 5 amostras.",
      "Redação do laudo, conclusão objetiva e ressalvas.",
      "Emissão de ART/RRT, assinatura e entrega em PDF numerado.",
      "Arquivamento por no mínimo 5 anos (defesa técnica futura).",
    ],
  },
  {
    titulo: "6. Erros que geram responsabilização",
    paragrafos: [],
    lista: [
      "Concluir sem ressalvas em vistoria com acesso limitado (sempre declare o que não foi possível inspecionar).",
      "Atribuir culpa a terceiros — o laudo descreve fatos e nexo técnico, não julga.",
      "Usar amostras de mercado sem fonte identificável.",
      "Entregar laudo sem ART/RRT.",
      "Copiar texto de laudo antigo sem revisar dados do imóvel.",
    ],
  },
];
