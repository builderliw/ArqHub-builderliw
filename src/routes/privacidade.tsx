import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — ArqHub" },
      { name: "description", content: "Política de Privacidade da plataforma ArqHub: como coletamos, usamos e protegemos seus dados." },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-white text-[#1d1d1b]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao site</Link>
        <h1 className="mt-6 font-display text-4xl md:text-5xl tracking-tight">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: 10 de junho de 2026</p>

        <section className="prose prose-neutral mt-10 max-w-none">
          <h2>1. Quem somos</h2>
          <p>
            A ArqHub (“ArqHub”, “nós”) é uma plataforma de gestão para escritórios de arquitetura e seus clientes,
            acessível em <strong>arqhub.world</strong>. Esta política descreve como coletamos, usamos, armazenamos
            e protegemos as informações pessoais dos usuários.
          </p>

          <h2>2. Dados que coletamos</h2>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, CPF/CNPJ, foto de perfil.</li>
            <li><strong>Dados profissionais:</strong> escritório, CAU/CREA, equipe, projetos e clientes vinculados.</li>
            <li><strong>Dados de uso:</strong> registros de acesso, IP, dispositivo, páginas visitadas.</li>
            <li><strong>Dados de pagamento:</strong> processados por parceiros (Mercado Pago); não armazenamos dados de cartão.</li>
          </ul>

          <h2>3. Como usamos seus dados</h2>
          <p>Utilizamos seus dados para:</p>
          <ul>
            <li>Operar e disponibilizar a plataforma e seus recursos;</li>
            <li>Autenticar usuários e proteger contas (inclusive via Login com Google);</li>
            <li>Processar pagamentos e emitir comprovantes;</li>
            <li>Enviar comunicações operacionais (confirmações, alertas, recuperação de senha);</li>
            <li>Cumprir obrigações legais e prevenir fraudes.</li>
          </ul>

          <h2>4. Login com Google</h2>
          <p>
            Ao entrar com sua conta Google, recebemos apenas seu nome, e-mail e foto de perfil — dados estritamente
            necessários para criar e identificar sua conta. Não acessamos sua agenda, Drive ou outros serviços
            Google. Você pode revogar o acesso a qualquer momento em sua Conta Google.
          </p>

          <h2>5. Compartilhamento</h2>
          <p>Não vendemos dados pessoais. Compartilhamos informações apenas com:</p>
          <ul>
            <li>Provedores de infraestrutura (hospedagem, banco de dados, e-mail transacional);</li>
            <li>Processadores de pagamento (Mercado Pago);</li>
            <li>Autoridades, quando exigido por lei.</li>
          </ul>

          <h2>6. Armazenamento e segurança</h2>
          <p>
            Os dados são armazenados em infraestrutura criptografada. Aplicamos controles de acesso, autenticação
            forte e monitoramento contínuo. Apesar disso, nenhum sistema é 100% seguro — incidentes serão
            comunicados conforme exigido pela LGPD.
          </p>

          <h2>7. Seus direitos (LGPD)</h2>
          <p>Você pode, a qualquer momento, solicitar:</p>
          <ul>
            <li>Confirmação e acesso aos seus dados;</li>
            <li>Correção de dados incompletos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou exclusão;</li>
            <li>Portabilidade;</li>
            <li>Revogação do consentimento.</li>
          </ul>
          <p>
            Envie sua solicitação para <a href="mailto:contato@arqhub.world">contato@arqhub.world</a>.
          </p>

          <h2>8. Retenção</h2>
          <p>
            Mantemos seus dados pelo tempo necessário para prestar o serviço e cumprir obrigações legais. Após o
            encerramento da conta, dados podem ser retidos por até 5 anos para fins fiscais e legais.
          </p>

          <h2>9. Cookies</h2>
          <p>
            Utilizamos cookies essenciais para autenticação e funcionamento da plataforma. Não usamos cookies de
            publicidade de terceiros.
          </p>

          <h2>10. Alterações desta política</h2>
          <p>
            Esta política pode ser atualizada. A versão vigente estará sempre disponível em
            <code> arqhub.world/privacidade</code>.
          </p>

          <h2>11. Contato</h2>
          <p>
            Dúvidas: <a href="mailto:contato@arqhub.world">contato@arqhub.world</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
