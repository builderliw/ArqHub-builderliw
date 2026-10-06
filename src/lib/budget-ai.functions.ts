import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * IA de Orçamento do ArqHub - Protocolo de Execução
 */
const SYSTEM_PROMPT = `Você é a IA de Orçamento do ArqHub, especializada em arquitetura, interiores, reformas e construção civil no Brasil.

Sua função é transformar um briefing de projeto em um orçamento técnico estruturado, transparente e editável, utilizando composições de custos, quantitativos, preços unitários, mão de obra, materiais, equipamentos, encargos, perdas e demais custos necessários.

1. INTERPRETAÇÃO DO BRIEFING
Analise o briefing fornecido pelo usuário e identifique automaticamente: tipo de projeto, obra, ambientes, áreas, serviços, materiais, acabamentos, quantidades, mão de obra e equipamentos. Sinalize informações ausentes: "Informação necessária para melhorar a precisão do orçamento."

2. ESTRUTURAÇÃO DO ORÇAMENTO
Organize por categorias (Serviços preliminares, Infraestrutura, Acabamentos, etc.). Crie novas categorias se necessário.

3. COMPOSIÇÕES E PREÇOS
- Priorize: Preço informado > Preço do escritório > ArqHub > Base técnica (SINAPI/SICRO/CUB) > Estimativa.
- NUNCA invente preços. Se não houver fonte, classifique como "Preço estimado" ou solicite cotação.
- Considere a localização (Município/UF) como variável obrigatória.

4. QUANTITATIVOS E PERDAS
- Calcule automaticamente áreas e volumes. Apresente a fórmula.
- Aplique perdas técnicas justificadas (ex: 5-15% para revestimentos).

5. CUSTO DIRETO E INDIRETO
Calcule Materiais + Mão de Obra + Equipamentos + Serviços + Logística = Custo Direto.
Custo Indireto (Administração, taxas, seguros) e BDI devem ser mostrados separadamente.

6. NÍVEL DE CONFIANÇA
Classifique como: 🟢 Alta precisão, 🟡 Estimativa ou 🔴 Baixa precisão.

7. FORMATO DE SAÍDA
Retorne o orçamento estritamente em formato JSON para que a interface possa renderizar as tabelas e KPIs.
Estrutura desejada:
{
  "summary": { "total": number, "costPerM2": number, "confidence": "alta" | "media" | "baixa", "confidenceReason": string },
  "categories": [
    {
      "name": string,
      "total": number,
      "items": [
        { "description": string, "unit": string, "quantity": number, "unitPrice": number, "total": number, "source": string, "type": "real" | "estimado" }
      ]
    }
  ],
  "kpis": { "materials": number, "labor": number, "equipment": number, "indirect": number, "bdi": number },
  "alerts": string[],
  "missingInfo": string[]
}`;

export const generateAiBudget = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        briefing: z.string(),
        location: z.string(),
        bdi: z.number().optional(),
        standard: z.enum(["economico", "normal", "alto"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    // Em produção, aqui chamamos o AI Gateway com o SYSTEM_PROMPT
    // Por enquanto, vamos simular uma resposta estruturada baseada no briefing
    
    // Simulação de delay
    await new Promise(r => setTimeout(r, 2000));

    const isReforma = data.briefing.toLowerCase().includes("reforma");
    
    // Mock response
    return {
      summary: {
        total: 85240.50,
        costPerM2: 2131.01,
        confidence: "media",
        confidenceReason: "Preços de acabamentos baseados em estimativas de mercado para a região de " + data.location
      },
      categories: [
        {
          name: "Serviços Preliminares",
          total: 4500.00,
          items: [
            { description: "Limpeza de terreno e instalação de canteiro", unit: "un", quantity: 1, unitPrice: 2500, total: 2500, source: "SINAPI", type: "real" },
            { description: "Locação da obra", unit: "m²", quantity: 40, unitPrice: 50, total: 2000, source: "SINAPI", type: "real" }
          ]
        },
        {
          name: "Infraestrutura",
          total: 12500.00,
          items: [
            { description: "Escavação manual de valas", unit: "m³", quantity: 15, unitPrice: 150, total: 2250, source: "ArqHub", type: "real" },
            { description: "Concreto armado para fundação", unit: "m³", quantity: 8, unitPrice: 1281.25, total: 10250, source: "Composição", type: "real" }
          ]
        },
        {
          name: "Acabamentos",
          total: 68240.50,
          items: [
            { description: "Piso Porcelanato 80x80", unit: "m²", quantity: 45, unitPrice: 120, total: 5400, source: "Estimado", type: "estimado" },
            { description: "Pintura acrílica fosca 2 demãos", unit: "m²", quantity: 120, unitPrice: 45, total: 5400, source: "SINAPI", type: "real" }
          ]
        }
      ],
      kpis: {
        materials: 45200.00,
        labor: 32000.00,
        equipment: 3500.00,
        indirect: 2540.50,
        bdi: 2000.00
      },
      alerts: [
        "A marcenaria não foi detalhada no briefing, valor não incluso.",
        "Custos de logística para " + data.location + " podem variar conforme fornecedor escolhido."
      ],
      missingInfo: [
        "Definir marca e modelo das louças e metais.",
        "Confirmar se haverá automação residencial."
      ]
    };
  });
