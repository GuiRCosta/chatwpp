export function DataDeletion() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Exclusao de Dados do Usuario
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Ultima atualizacao: 2 de marco de 2026
        </p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Como solicitar a exclusao dos seus dados
            </h2>
            <p>
              A IDEVA Reserva respeita seu direito a privacidade e a exclusao
              dos seus dados pessoais. Para solicitar a remocao dos seus dados
              da plataforma ZFlow CRM, siga as instrucoes abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Opcao 1: Solicitar por email
            </h2>
            <p>
              Envie um email para{" "}
              <a
                href="mailto:realfgstmkt@gmail.com"
                className="text-blue-600 underline"
              >
                realfgstmkt@gmail.com
              </a>{" "}
              com o assunto <strong>"Exclusao de Dados - ZFlow CRM"</strong> e
              inclua:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Nome completo associado a conta.</li>
              <li>Email utilizado no cadastro.</li>
              <li>
                Descricao dos dados que deseja excluir (conta completa,
                mensagens, contatos, etc.).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Opcao 2: Solicitar ao administrador
            </h2>
            <p>
              Se voce e um usuario da plataforma, solicite ao administrador da
              sua organizacao que remova sua conta e dados pelo painel de
              Configuracoes do ZFlow CRM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              O que sera excluido
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dados de perfil (nome, email, credenciais).</li>
              <li>Mensagens enviadas e recebidas.</li>
              <li>Contatos associados a sua conta.</li>
              <li>Historico de tickets e atendimentos.</li>
              <li>Dados de campanhas criadas.</li>
              <li>Tokens de acesso ao WhatsApp Business API.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Prazo para exclusao
            </h2>
            <p>
              Apos receber sua solicitacao, processaremos a exclusao em ate{" "}
              <strong>30 dias uteis</strong>. Voce recebera uma confirmacao por
              email quando a exclusao for concluida.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Dados retidos por obrigacao legal
            </h2>
            <p>
              Alguns dados podem ser retidos por periodo adicional quando
              exigido por lei ou regulamentacao aplicavel (ex: registros fiscais,
              obrigacoes contratuais). Nesses casos, os dados serao mantidos
              apenas pelo periodo legalmente exigido e depois excluidos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Revogar acesso do Facebook/WhatsApp
            </h2>
            <p>
              Alem de solicitar a exclusao no ZFlow, voce pode revogar o acesso
              do aplicativo diretamente nas configuracoes do Facebook:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>
                Acesse{" "}
                <a
                  href="https://www.facebook.com/settings/?tab=business_tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Configuracoes do Facebook → Integracao com Empresas
                </a>
                .
              </li>
              <li>Encontre "CRM by Ideva" na lista de aplicativos.</li>
              <li>Clique em "Remover" para revogar o acesso.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Contato
            </h2>
            <p>
              Para duvidas sobre a exclusao de dados:
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
