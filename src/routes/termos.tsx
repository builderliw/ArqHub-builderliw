import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — ArqHub" },
      { name: "description", content: "Termos de Uso da plataforma ArqHub: condições de uso, direitos, deveres e responsabilidades." },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <main className="min-h-screen bg-white text-[#1d1d1b]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao site</Link>
        <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: 10 de junho de 2026</p>

        <section className="prose prose-neutral mt-10 max-w-none">
          <h2>1. Aceitação</h2>
          <p>
            Ao criar uma conta ou utilizar a plataforma ArqHub, acessível em <strong>arqhub.world</strong>, você
            declara ter lido, compreendido e concordado com estes Termos e com a nossa{" "}
            <Link to="/privacidade">Política de Privacidade</Link>.
          </p>

          <h2>2. O serviço</h2>
          <p>
            A ArqHub oferece uma plataforma SaaS para gestão de escritórios de arquitetura, com módulos de
            projetos, clientes, equipe, cronograma, mensagens, financeiro e portal do cliente.
          </p>

          <h2>3. Conta e segurança</h2>
          <ul>
            <li>Você é responsável pelas informações fornecidas no cadastro e por mantê-las atualizadas;</li>
            <li>É responsável também por manter a confidencialidade da senha e por todas as atividades em sua conta;</li>
            <li>Notifique-nos imediatamente em caso de uso não autorizado.</li>
          </ul>

          <h2>4. Planos, pagamentos e cancelamento</h2>
          <ul>
            <li>Os planos pagos são processados via Mercado Pago, com cobrança recorrente conforme o ciclo escolhido;</li>
            <li>O cancelamento pode ser feito a qualquer momento e produzirá efeito no fim do ciclo vigente;</li>
            <li>Valores já pagos não são reembolsáveis, exceto quando exigido por lei.</li>
          </ul>

          <h2>5. Uso aceitável</h2>
          <p>É proibido utilizar a plataforma para:</p>
          <ul>
            <li>Atividades ilegais, fraudulentas ou que violem direitos de terceiros;</li>
            <li>Distribuir malware, spam ou conteúdo ofensivo;</li>
            <li>Tentar acessar áreas restritas, contas de terceiros ou realizar engenharia reversa.</li>
          </ul>

          <h2>6. Propriedade intelectual</h2>
          <p>
            A marca ArqHub, o software, o design e o conteúdo da plataforma são de propriedade exclusiva da ArqHub.
            Os dados, projetos e arquivos enviados por você permanecem de sua propriedade — você nos concede apenas
            a licença necessária para operar o serviço.
          </p>

          <h2>7. Disponibilidade e suporte</h2>
          <p>
            Empenhamo-nos para manter a plataforma disponível, mas não garantimos operação ininterrupta. Manutenções
            programadas serão comunicadas com antecedência sempre que possível.
          </p>

          <h2>8. Limitação de responsabilidade</h2>
          <p>
            A ArqHub não se responsabiliza por perdas indiretas, lucros cessantes ou danos decorrentes do uso ou da
            impossibilidade de uso da plataforma, na máxima extensão permitida pela lei aplicável.
          </p>

          <h2>9. Encerramento</h2>
          <p>
            Podemos suspender ou encerrar contas que violem estes Termos. Você pode encerrar sua conta a qualquer
            momento solicitando pelo e-mail abaixo.
          </p>

          <h2>10. Alterações</h2>
          <p>
            Estes Termos podem ser atualizados. A versão vigente estará sempre em <code>arqhub.world/termos</code>.
            Alterações relevantes serão comunicadas por e-mail.
          </p>

          <h2>11. Lei aplicável e foro</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do
            domicílio do usuário consumidor para dirimir controvérsias.
          </p>

          <h2>12. Contato</h2>
          <p>
            Dúvidas: <a href="mailto:contato@arqhub.world">contato@arqhub.world</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
