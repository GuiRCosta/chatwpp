export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Politica de Privacidade
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Ultima atualizacao: 2 de marco de 2026
        </p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Introducao
            </h2>
            <p>
              A IDEVA Reserva ("nos", "nosso") opera a plataforma ZFlow CRM
              ("Servico"), acessivel em crm.ideva.ai. Esta politica descreve
              como coletamos, usamos, armazenamos e protegemos suas informacoes
              pessoais ao utilizar nosso Servico.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Dados que coletamos
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Dados de cadastro:</strong> nome, email e senha
                (armazenada de forma criptografada).
              </li>
              <li>
                <strong>Dados de contatos:</strong> nome, numero de telefone,
                email e tags dos contatos adicionados por voce ao CRM.
              </li>
              <li>
                <strong>Mensagens:</strong> conteudo de mensagens enviadas e
                recebidas via WhatsApp Business API, incluindo texto, imagens,
                audio, video e documentos.
              </li>
              <li>
                <strong>Dados de uso:</strong> logs de acesso, enderecos IP e
                informacoes do navegador para fins de seguranca e diagnostico.
              </li>
              <li>
                <strong>Dados do WhatsApp Business:</strong> numero de telefone
                comercial, ID da conta WABA e tokens de acesso para integracao
                com a API do Meta.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Como usamos seus dados
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer e manter o Servico de CRM e atendimento ao cliente.</li>
              <li>
                Enviar e receber mensagens via WhatsApp Business API em nome da
                sua empresa.
              </li>
              <li>Gerenciar campanhas de mensagens para seus contatos.</li>
              <li>Garantir a seguranca e integridade da plataforma.</li>
              <li>Cumprir obrigacoes legais e regulatorias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Compartilhamento de dados
            </h2>
            <p>
              Seus dados sao compartilhados exclusivamente com:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Meta Platforms, Inc.:</strong> para operacao da WhatsApp
                Business API (envio/recebimento de mensagens e gerenciamento de
                templates).
              </li>
              <li>
                <strong>Provedores de infraestrutura:</strong> servidores de
                hospedagem para armazenamento seguro dos dados.
              </li>
            </ul>
            <p className="mt-2">
              Nao vendemos, alugamos ou compartilhamos seus dados pessoais com
              terceiros para fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Armazenamento e seguranca
            </h2>
            <p>
              Seus dados sao armazenados em servidores protegidos com
              criptografia em transito (HTTPS/TLS) e em repouso. Senhas sao
              armazenadas com hash bcrypt. Tokens de acesso sao protegidos por
              JWT com rotacao automatica.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Seus direitos
            </h2>
            <p>Voce tem o direito de:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Acessar seus dados pessoais armazenados na plataforma.</li>
              <li>Solicitar a correcao de dados incorretos ou desatualizados.</li>
              <li>
                Solicitar a exclusao dos seus dados (veja nossa pagina de{" "}
                <a href="/data-deletion" className="text-blue-600 underline">
                  exclusao de dados
                </a>
                ).
              </li>
              <li>Revogar o acesso do aplicativo a sua conta WhatsApp Business.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Retencao de dados
            </h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Apos
              solicitacao de exclusao, seus dados serao removidos em ate 30 dias,
              exceto quando a retencao for exigida por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Cookies
            </h2>
            <p>
              Utilizamos cookies essenciais para autenticacao e manutencao da
              sessao. Nao utilizamos cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Alteracoes nesta politica
            </h2>
            <p>
              Podemos atualizar esta politica periodicamente. Alteracoes
              significativas serao comunicadas por email ou notificacao na
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              10. Contato
            </h2>
            <p>
              Para duvidas sobre esta politica ou sobre seus dados, entre em
              contato:
            </p>
            <p className="mt-2">
              <strong>IDEVA Reserva</strong>
              <br />
              Email: realfgstmkt@gmail.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
          ZFlow CRM &copy; {new Date().getFullYear()} IDEVA Reserva
        </div>
      </div>
    </div>
  )
}
