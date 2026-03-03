# ZFlow CRM - Roadmap

## Visao Geral

Plataforma multi-canal de atendimento ao cliente com CRM integrado.

**Stack:** Node.js + Express + Sequelize (PostgreSQL) + Bull (Redis) | React 19 + Vite + Tailwind + Zustand
**Infraestrutura:** Docker Swarm + Traefik + Portainer | VPS 72.61.25.109 | crm.ideva.ai
**Integracao:** WhatsApp Business API (WABA) via Meta Graph API v25.0

---

## O Que Ja Foi Implementado

### Fase 1: Backend Core - Logica de Negocio (CONCLUIDA)

- [x] 32 models com Sequelize-TypeScript (decorators)
- [x] 25 rotas com Express Router
- [x] 23 services (CRUD + logica de negocio)
- [x] 34 migrations + 3 seeds
- [x] Validators com Yup (Auth, User, Contact, Ticket, Message, Campaign, Queue, Tag, Tenant, Setting, WhatsApp, Opportunity)
- [x] Middleware: isAuth (JWT), isAdmin, isSuperAdmin, errorHandler (AppError)
- [x] express-async-errors para catch automatico

### Fase 2: Integracao WhatsApp WABA (CONCLUIDA)

- [x] Client HTTP para Meta Graph API v25.0
- [x] Webhook receiver (verificacao GET + mensagens POST + assinatura HMAC-SHA256)
- [x] Envio: texto, midia, templates
- [x] Recebimento: texto, imagem, video, audio, documento, sticker, localizacao, contatos
- [x] Status sync (sent → delivered → read → failed)
- [x] Facebook Business Login (Embedded Signup)
- [x] OAuth token exchange + debugToken + subscribeApp
- [x] Media handler (download/upload com diretorio por tenant)
- [x] Templates WABA: sync com Meta API, cache local, listagem de aprovados

### Fase 3: Filas e Jobs - Bull (CONCLUIDA)

- [x] SendMessageJob (concurrency 5, retry 3x, backoff exponencial)
- [x] CampaignJob (concurrency 1, delay 2s, envio via sendTemplateMessage)
- [x] BulkDispatchJob (concurrency 1)
- [x] CleanupTicketsJob (cron 30min, fecha tickets inativos 24h)
- [x] ScheduledJobs (cron 1min para campanhas agendadas)
- [x] Bull Board dashboard (/admin/queues)

### Fase 4: Features Backend (CONCLUIDA)

- [x] Multi-tenancy (isolamento por tenantId em todos os models)
- [x] Autenticacao JWT (access 15min + refresh 7d + token versioning)
- [x] RBAC basico (superadmin, admin, super, user)
- [x] Contatos (CRUD, tags, campos customizados, busca, paginacao)
- [x] Tickets (lifecycle open/pending/closed, atribuicao, logs)
- [x] Mensagens (texto, midia, ACK status)
- [x] Filas (CRUD, saudacao, distribuicao)
- [x] Tags (CRUD, cores)
- [x] Respostas Rapidas (CRUD por usuario)
- [x] Galeria de Midias (CRUD, filtro por tipo)
- [x] Lista de Bloqueio (CRUD, duplicidade)
- [x] Notificacoes (CRUD, marcar lido)
- [x] TodoList (CRUD, toggle done)
- [x] Registro de Chamadas (CRUD, filtro tipo/contato)
- [x] Pipeline de Vendas (CRUD, stages ordenados)
- [x] Kanban (CRUD, colunas, cards)
- [x] Oportunidades (CRUD, valor, estagio, tags)
- [x] Campanhas (CRUD, templates WABA, agendamento, contatos)
- [x] AutoReply (CRUD, steps com reordenacao)
- [x] ChatFlow (CRUD, duplicate, JSONB flow)
- [x] User-WhatsApp (vinculacao usuarios a conexoes)

### Fase 5: Frontend (CONCLUIDA)

- [x] Scaffold (Vite 6 + React 19 + TypeScript + Tailwind 3.4)
- [x] shadcn/ui components (Radix UI + lucide-react + CVA)
- [x] Zustand stores (auth, ticket, chat, notification)
- [x] Axios com interceptor de refresh token
- [x] Socket.IO client com auth JWT
- [x] Login com refresh automatico
- [x] Dashboard (stats, skeleton loaders)
- [x] Tickets/Chat (lista + chat panel, media player, gravacao audio)
- [x] Contatos (DataTable, CRUD, tags)
- [x] CRM/Pipeline (Kanban drag-and-drop @dnd-kit)
- [x] Campanhas (lista com filtros, form com seletor de template WABA)
- [x] Configuracoes (4 tabs: Geral, Filas, WhatsApp, Usuarios)
- [x] Componentes: DataTable, SearchInput, StatusBadge, ConfirmDialog, ErrorBoundary
- [x] Audio: useAudioRecorder hook, AudioRecorder, AudioPreview, AudioPlayer
- [x] Sidebar colapsavel (toggle expand/collapse com estado persistido em localStorage + tooltips)
- [x] Design system alignment (tipografia, border-radius, badges, botoes, nav links, filter tabs, headings em 15 arquivos)
- [x] Header dinamico por rota (titulo muda conforme pagina ativa: Dashboard, Tickets, Contatos, CRM, Campanhas, Configuracoes)
- [x] Facebook SDK configurado (VITE_META_APP_ID e VITE_META_CONFIG_ID como GitHub Actions variables)

### Fase 8: Seguranca Quick Wins (CONCLUIDA)

- [x] Validacao de JWT_SECRET e JWT_REFRESH_SECRET no startup (crash se ausente ou default)
- [x] Verificacao de tokenVersion no isAuth middleware (revogacao imediata de sessoes)
- [x] Rate limiting em /auth/login (5 tentativas por 15min por IP)
- [x] Webhook signature verification obrigatoria (rejeita se META_APP_SECRET ausente)
- [x] Payload JSON/urlencoded reduzido de 50MB para 10MB
- [x] .env.example com todas variaveis documentadas

### Fase 9: Socket.IO Real-Time (CONCLUIDA)

- [x] useSocket reescrito: ticket:created/updated/deleted, message:created/updated conectados aos stores
- [x] ticketStore: addTicket (com filtros) e removeTicket
- [x] chatStore: updateMessage para ACK updates em tempo real
- [x] ChatPanel: joinTicket/leaveTicket rooms para receber mensagens do ticket aberto
- [x] Sidebar de tickets atualiza lastMessage e unreadMessages em tempo real

### Fase 6: Testes (CONCLUIDA)

- [x] Backend: 66 arquivos, 670 testes, cobertura 93.62% statements
- [x] Frontend: 29 arquivos, 301 testes, cobertura 90.42% statements
- [x] E2E: 5 specs Playwright (auth, contacts, dashboard, navigation, tickets)

### Fase 7: Deploy e CI/CD (CONCLUIDA)

- [x] Dockerfiles multi-stage (backend + frontend nginx)
- [x] Docker Compose Swarm-compatible (postgres, redis, backend, frontend, traefik)
- [x] Traefik v3.2 (SSL Let's Encrypt, HSTS, redirect HTTP→HTTPS)
- [x] Nginx proxy reverso (API, Socket.IO, webhook, uploads, Bull Board, SPA fallback)
- [x] GitHub Actions: CI (lint + test), Build & Push (GHCR), Deploy (SSH), Cleanup
- [x] Volumes persistentes, log rotation, health checks Docker
- [x] Script de backup com verificacao de integridade

---

## O Que Precisa Ser Implementado

### FASE A - Seguranca (CRITICO)

> Corrigir antes de qualquer feature nova. Vulnerabilidades que podem ser exploradas em producao.

#### A.1 Secrets e Tokens

| # | Item | Risco | Esforco |
|---|------|-------|---------|
| A.1.1 | ~~**Validar que JWT secrets foram configurados** no startup~~ | ~~Token forgery~~ | ~~1h~~ | **CONCLUIDO** |
| A.1.2 | **Encriptar wabaToken** no banco - armazenado em texto plano no model WhatsApp | Token leak via SQL injection ou backup | 4h |
| A.1.3 | **Mover tokens para httpOnly cookies** - localStorage vulneravel a XSS (qualquer script injetado rouba o token) | Session hijacking | 6h |
| A.1.4 | ~~**Criar `.env.example`** com todas variaveis obrigatorias documentadas~~ | ~~Misconfiguracao em deploy~~ | ~~1h~~ | **CONCLUIDO** |

#### A.2 Autenticacao

| # | Item | Risco | Esforco |
|---|------|-------|---------|
| A.2.1 | ~~**Verificar tokenVersion no isAuth middleware**~~ | ~~Sessao nao revogada~~ | ~~1h~~ | **CONCLUIDO** |
| A.2.2 | ~~**Rate limiting em `/auth/login`**~~ | ~~Brute force de senhas~~ | ~~1h~~ | **CONCLUIDO** |
| A.2.3 | **Account lockout** apos 5 tentativas falhas (desbloqueio por tempo ou admin) | Brute force continuado | 3h |
| A.2.4 | **Requisitos de complexidade de senha** - validator aceita minimo 6 chars sem regras | Senhas fracas | 1h |
| A.2.5 | **Implementar DTOs** - models expostos diretamente (passwordHash, tokenVersion, wabaToken vazam nas responses) | Data leak | 4h |

#### A.3 Webhook e Entrada

| # | Item | Risco | Esforco |
|---|------|-------|---------|
| A.3.1 | ~~**Tornar verificacao de assinatura do webhook obrigatoria**~~ | ~~Webhook spoofing~~ | ~~1h~~ | **CONCLUIDO** |
| A.3.2 | **Completar validators faltando** - Sem validacao: templates, galleries, todolists, calllogs, notifications, settings, chatflows, auto-replies | Injection/invalid data | 6h |
| A.3.3 | **Sanitizar HTML/XSS no frontend** - sem DOMPurify; cores de tags e mensagens injetadas sem sanitizacao | XSS persistente | 3h |
| A.3.4 | ~~**Reduzir limite de payload JSON** de 50MB para 10MB~~ | ~~DoS via payload~~ | ~~30min~~ | **CONCLUIDO** |
| A.3.5 | **Validar conteudo de uploads** alem do MIME type (magic bytes) | Upload de malware | 3h |
| A.3.6 | **Adicionar CSRF protection** - cookie-parser habilitado mas sem tokens CSRF | CSRF attack | 3h |

---

### FASE B - Estabilidade e Real-Time (ALTO)

> O sistema tem infraestrutura de socket mas NAO esta conectado aos stores do frontend.

#### B.1 Socket.IO - Conectar ao Frontend

| # | Item | Impacto | Esforco |
|---|------|---------|---------|
| B.1.1 | ~~**`ticket:updated`** - conectar ao ticketStore~~ | ~~Tickets nao atualizam em tempo real~~ | ~~1h~~ | **CONCLUIDO** |
| B.1.2 | ~~**`message:created`** - conectar ao chatStore~~ | ~~Mensagens novas nao aparecem sem refresh~~ | ~~1h~~ | **CONCLUIDO** |
| B.1.3 | ~~**`ticket:created`** - escutar no frontend~~ | ~~Novos tickets invisiveis~~ | ~~30min~~ | **CONCLUIDO** |
| B.1.4 | **`contact:created`** - Nao escutado no frontend | Contatos criados via webhook nao aparecem | 30min |
| B.1.5 | **Eventos de campanha** - started/updated/cancelled nao escutados | Status de campanha nao atualiza live | 30min |

#### B.2 Health Check e Resiliencia

| # | Item | Impacto | Esforco |
|---|------|---------|---------|
| B.2.1 | **Health check verificar PostgreSQL, Redis e Bull** - endpoint retorna 200 sem checar nada | Falha silenciosa de dependencias | 2h |
| B.2.2 | **Graceful shutdown** para conexoes DB/Redis/Bull/Socket | Requests perdidos em deploy | 3h |

#### B.3 Rotas Faltando no Frontend

| # | Item | Impacto | Esforco |
|---|------|---------|---------|
| B.3.1 | **`/contacts/new`** e **`/contacts/:id/edit`** no App.tsx | Navegacao quebrada | 30min |
| B.3.2 | **`/campaigns/new`** e **`/campaigns/:id/edit`** no App.tsx | Navegacao quebrada | 30min |
| B.3.3 | **`/campaigns/:id`** - pagina de detalhe (referenciada mas nao existe) | Nao da pra ver detalhes | 4h |

#### B.4 Feedback ao Usuario

| # | Item | Impacto | Esforco |
|---|------|---------|---------|
| B.4.1 | **Sistema de toast/snackbar** - Nenhum feedback visual para acoes (sucesso/erro) | UX confusa | 2h |
| B.4.2 | **Loading em transicoes de rota** | Sensacao de travamento | 1h |
| B.4.3 | **Forgot password** - link existe no login mas nao implementado | Usuarios trancados fora | 6h |

---

### FASE C - Estrutura e Qualidade (MEDIO)

> Refatoracoes para manutencao e escalabilidade.

#### C.1 API e Backend

| # | Item | Beneficio | Esforco |
|---|------|-----------|---------|
| C.1.1 | **API versioning** (`/api/v1/`) | Breaking changes sem impacto | 3h |
| C.1.2 | **Documentacao Swagger/OpenAPI** | Onboarding de devs, integradores | 8h |
| C.1.3 | **Rate limiting por rota** - `/auth/login` (5/15min), `/upload` (10/min), `/templates/sync` (2/min) | Protecao granular | 3h |
| C.1.4 | **Redis caching** para users, settings, queues, templates | Menos queries ao banco | 8h |
| C.1.5 | **Redis adapter para Socket.IO** | Horizontal scaling | 2h |
| C.1.6 | **Event emitter** para desacoplar services de socket emissions | Testabilidade | 6h |
| C.1.7 | **Constantes** para magic numbers (delay 2000ms, limites, timeouts) | Configurabilidade | 2h |
| C.1.8 | **Tipagem forte** para campos JSONB (customFields, templateComponents, flowData) | Type safety | 4h |

#### C.2 Frontend

| # | Item | Beneficio | Esforco |
|---|------|-----------|---------|
| C.2.1 | **Sidebar responsiva** com drawer mobile (collapse desktop ja implementado) | Usabilidade mobile | 2h |
| C.2.2 | **React Hook Form** para formularios | DX, performance, validacao consistente | 8h |
| C.2.3 | **DataTable scroll horizontal** em mobile | Tabelas visiveis em tela pequena | 2h |
| C.2.4 | **Chat panel adaptavel** para mobile (fullscreen) | Conversas legiveis em mobile | 4h |
| C.2.5 | **Dark mode** - CSS variables existem mas sem toggle | Preferencia do usuario | 4h |
| C.2.6 | **Dirty state warning** ao navegar com formulario nao salvo | Evitar perda de dados | 2h |

---

### FASE D - Features Novas (NORMAL)

> Funcionalidades que agregam valor ao produto.

#### D.1 Comunicacao e Notificacoes

- [ ] **Painel de notificacoes** - Dropdown no header com lista, marcar lido (pagina e placeholder)
- [ ] **Notificacoes por email** - Alertas para tickets novos, atribuicoes
- [ ] **Chat interno** - Comunicacao entre atendentes
- [ ] **Agendamento de campanhas no frontend** - Backend suporta `scheduledAt` mas UI nao expoe

#### D.2 CRM Avancado

- [ ] **Pagina de detalhe da oportunidade** com timeline de atividades
- [ ] **Probabilidade de fechamento** - Campo percentual no deal
- [ ] **Previsao de receita** - Soma ponderada por probabilidade x valor
- [ ] **Timeline de atividade** no contato e oportunidade
- [ ] **Campos customizados** - UI para gerenciar campos extras
- [ ] **Lead scoring** baseado em interacoes

#### D.3 Produtividade

- [ ] **Perfil do usuario** - Pagina placeholder "Em breve..."
- [ ] **Alterar senha** - Nao implementado
- [ ] **Import de contatos** - CSV, vCard
- [ ] **Export** - Contatos, tickets, relatorios em CSV/Excel
- [ ] **Operacoes em massa** - Deletar, tagear, mover multiplos registros
- [ ] **Merge de contatos** - Deduplicacao

#### D.4 Automacao

- [ ] **Builder visual de ChatFlow** - Model existe mas sem UI
- [ ] **Webhook outgoing** - ApiConfig existe mas nao implementado
- [ ] **SLA Management** - Tempo de resposta, escalonamento automatico

#### D.5 Relatorios

- [ ] **Dashboard de metricas** - Tickets por periodo, tempo medio de resposta, contatos novos
- [ ] **Relatorio de campanhas** - Taxa de entrega, leitura, erro
- [ ] **Relatorio de atendentes** - Tickets atendidos, tempo medio
- [ ] **Relatorio de pipeline** - Conversao por estagio, valor total, forecast

---

### FASE E - Avancado (LONGO PRAZO)

> Features de escala e diferenciacao.

#### E.1 Multi-canal

- [ ] **Email** - Integracao IMAP/SMTP como canal de atendimento
- [ ] **SMS** - Integracao com provedor SMS
- [ ] **Web chat widget** - Widget embeddable para sites
- [ ] **Instagram DM** - Via Meta Graph API
- [ ] **Facebook Messenger** - Via Meta Graph API

#### E.2 Inteligencia Artificial

- [ ] **Classificacao automatica** de tickets por assunto
- [ ] **Sugestao de resposta** baseada em historico
- [ ] **Analise de sentimento** das conversas
- [ ] **Resumo automatico** de conversas longas

#### E.3 Infraestrutura

- [ ] **Read replicas PostgreSQL** para leitura
- [ ] **CDN para midias** - S3/Cloudflare R2
- [ ] **Monitoramento** - Sentry (erros) + Uptime Kuma (disponibilidade)
- [ ] **Backup automatizado offsite** - PostgreSQL + Redis + midias

#### E.4 Mobile

- [ ] **PWA** - Service worker para push notifications e offline basico
- [ ] **App nativo** - React Native para iOS/Android

---

## Matriz de Prioridade

```
IMPACTO ALTO
  |
  |  [A] Seguranca          [D.5] Relatorios
  |  [B.1] Socket RT        [E.2] IA
  |  [B.4] Toasts           [E.1] Multi-canal
  |  [A.2.5] DTOs           [E.4] Mobile
  |  [B.2] Health Check     [D.4] ChatFlow Builder
  |  [C.1.1] API Version    [E.3] CDN/Replicas
  |
IMPACTO BAIXO
       ESFORCO BAIXO ------- ESFORCO ALTO
```

### Quick Wins (alto impacto, baixo esforco)

| Item | Esforco | Impacto |
|------|---------|---------|
| ~~Verificar tokenVersion no isAuth~~ | ~~1h~~ | ~~Seguranca critica~~ | **CONCLUIDO** |
| ~~Rate limit em /auth/login~~ | ~~1h~~ | ~~Brute force prevention~~ | **CONCLUIDO** |
| ~~Validar JWT secrets no startup~~ | ~~1h~~ | ~~Prevenir deploy inseguro~~ | **CONCLUIDO** |
| ~~Webhook signature obrigatoria~~ | ~~1h~~ | ~~Prevenir spoofing~~ | **CONCLUIDO** |
| ~~Conectar socket ticket:updated~~ | ~~1h~~ | ~~Real-time funcional~~ | **CONCLUIDO** |
| ~~Conectar socket message:created~~ | ~~1h~~ | ~~Chat em tempo real~~ | **CONCLUIDO** |
| Sistema de toast (sonner) | 2h | UX dramaticamente melhor |
| Rotas faltando no App.tsx | 1h | Navegacao funcional |
| ~~Reduzir payload limit 10MB~~ | ~~30min~~ | ~~DoS prevention~~ | **CONCLUIDO** |
| ~~.env.example~~ | ~~1h~~ | ~~DX e seguranca~~ | **CONCLUIDO** |

---

## Decisoes Tecnicas Pendentes

| Decisao | Opcoes | Recomendacao |
|---------|--------|--------------|
| Token storage | localStorage vs httpOnly cookie | httpOnly cookie |
| Form library | Manual vs React Hook Form | React Hook Form |
| Toast library | sonner vs react-hot-toast | sonner (shadcn compat) |
| API docs | Swagger vs Redoc | Swagger |
| Monitoramento | Sentry vs Datadog | Sentry (custo) |
| Media storage | Local fs vs S3 vs R2 | Cloudflare R2 |
| IA provider | OpenAI vs Claude vs local | Claude API |

---

## Guia Completo: Criar e Configurar Meta App (2026 - Graph API v25.0)

> O ZFlow usa a API oficial do WhatsApp (WABA) via Facebook Business Login (Embedded Signup).
> Este guia cobre TODOS os passos para criar o app do zero ate a producao.

### Pre-requisitos

Antes de comecar, voce precisa ter:

- [ ] Uma **Meta Business Account** (business.facebook.com) - pode criar durante o processo
- [ ] Uma **conta de desenvolvedor Meta** (developers.facebook.com) - gratuita
- [ ] Um **numero de telefone dedicado** que NAO esteja registrado em nenhum WhatsApp (pessoal ou Business App)
- [ ] Acesso ao numero para receber SMS ou ligacao de verificacao (OTP)
- [ ] Dominio com HTTPS configurado (o ZFlow ja tem: `crm.ideva.ai`)

---

### Etapa 1: Criar conta de desenvolvedor Meta

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Clique em **"Get Started"** (canto superior direito)
3. Aceite os termos de uso da plataforma Meta
4. Confirme seu email se solicitado
5. Pronto - voce sera redirecionado ao dashboard de desenvolvedor

---

### Etapa 2: Criar o App

1. No dashboard, clique em **"My Apps"** (menu superior) → **"Create App"**
2. Na tela "What do you want your app to do?":
   - Selecione **"Other"** → clique **"Next"**
3. Na tela "Select an app type":
   - Selecione **"Business"** → clique **"Next"**
4. Preencha os dados:
   - **App name:** `ZFlow CRM` (ou o nome que preferir)
   - **App contact email:** seu email
   - **Business portfolio:** selecione sua Meta Business Account (ou crie uma nova)
5. Clique em **"Create App"**
6. Confirme com a senha da sua conta Meta

> **Anote o App ID** que aparece no topo do dashboard (ex: `1038583949333550`).
> Esse valor vai para `META_APP_ID` no `.env`.

---

### Etapa 3: Obter o App Secret

1. No painel do app, va no menu lateral: **App Settings** → **Basic**
2. Em **"App Secret"**, clique em **"Show"** (vai pedir sua senha)
3. **Copie o App Secret**

> Esse valor vai para `META_APP_SECRET` no `.env`.

---

### Etapa 4: Adicionar o produto WhatsApp

1. No menu lateral, clique em **"Add Product"** (ou va em "Products" na sidebar)
2. Encontre **"WhatsApp"** na lista
3. Clique em **"Set Up"**
4. Aceite os **termos do WhatsApp Business** se solicitado
5. Selecione sua **Meta Business Account** para vincular

> Apos adicionar, o menu lateral tera uma nova secao **"WhatsApp"** com subitens.

---

### Etapa 5: Configurar o Webhook

O webhook e como o Meta envia mensagens recebidas para o ZFlow.

1. No menu lateral: **WhatsApp** → **Configuration**
2. Na secao **"Webhook"**, clique em **"Edit"**
3. Preencha:
   - **Callback URL:** `https://crm.ideva.ai/webhook`
   - **Verify Token:** o valor do `META_VERIFY_TOKEN` do `.env`
     - Se ainda nao gerou, gere com: `openssl rand -hex 32`
     - Coloque o MESMO valor aqui e no `.env`
4. Clique em **"Verify and Save"**

> **IMPORTANTE:** O backend precisa estar rodando e acessivel em `crm.ideva.ai` para o Meta
> verificar o webhook. O endpoint GET `/webhook` ja esta implementado no ZFlow.
> O Meta vai fazer um GET com `hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=XXXX`
> e o backend retorna o `hub.challenge` se o token bater.

5. Apos verificar, na secao **"Webhook fields"**, ative (clique em **"Manage"**):
   - [x] `messages` - receber mensagens, midias, localizacao, contatos, interativos
   - [x] `message_template_status_update` - saber quando templates sao aprovados/rejeitados

> **Dica:** Voce pode usar o botao "Test" ao lado de cada campo para enviar um payload de
> teste e verificar se o webhook esta funcionando.

---

### Etapa 6: Adicionar Facebook Login for Business

1. Volte para **"Add Product"** no menu lateral
2. Encontre **"Facebook Login for Business"** e clique em **"Set Up"**
3. Va no menu lateral: **Facebook Login for Business** → **Settings**
4. Em **"Client OAuth Settings"**, configure:
   - **Client OAuth login:** `Yes`
   - **Web OAuth login:** `Yes`
   - **Valid OAuth Redirect URIs:** `https://crm.ideva.ai`
   - **Allowed Domains for the JavaScript SDK:** `https://crm.ideva.ai`
5. Clique em **"Save Changes"**

---

### Etapa 7: Criar a Configuration (Embedded Signup)

Esta e a parte mais importante - gera o `config_id` que o frontend usa para abrir o popup do Meta.

1. No menu lateral: **Facebook Login for Business** → **Configurations**
2. Clique em **"+ Create Configuration"**
3. **Configuration name:** `ZFlow WhatsApp Signup` (ou similar)
4. **Login variation:** selecione **"Embedded Signup"** → clique **"Next"**
5. **Products:** selecione:
   - [x] **WhatsApp Cloud API**
   - [x] **Marketing Messages API for WhatsApp** (para campanhas)
   - Clique **"Next"**
6. **Permissions:** verifique que estao marcadas:
   - [x] `whatsapp_business_management` - gerenciar conta WABA
   - [x] `whatsapp_business_messaging` - enviar/receber mensagens
   - [x] `business_management` - gerenciar ativos do business
   - Clique **"Next"**
7. **Assets:** configure:
   - Tipo de ativo: **WhatsApp Account**
   - Permissao: **Manage Account** (gerenciar conta)
   - Clique **"Save"**
8. A configuracao sera criada e voce vera o **Configuration ID**

> **Anote o Configuration ID** (ex: `798225723298929`).
> Esse valor vai para `META_CONFIG_ID` no `.env`.

---

### Etapa 8: Configurar Permissoes do App

1. No menu lateral: **App Settings** → **Advanced**
2. Em **"Security"** → procure **"Require App Secret"** e ative
3. Va em **App Review** → **Permissions and Features**
4. Para cada permissao abaixo, clique **"Request"** ou verifique se ja esta ativa:

| Permissao | Descricao | Obrigatoria |
|-----------|-----------|:-----------:|
| `whatsapp_business_management` | Gerenciar WABA, numeros, templates | Sim |
| `whatsapp_business_messaging` | Enviar e receber mensagens via Cloud API | Sim |
| `business_management` | Gerenciar ativos do Meta Business | Sim |

> **Nota:** Em modo Development, todas as permissoes funcionam automaticamente para
> administradores/desenvolvedores/testers do app. So precisa de App Review para Live mode.

---

### Etapa 9: Adicionar Testers (modo Development)

Em modo Development, apenas usuarios adicionados como testers podem usar o Embedded Signup.

1. No menu lateral: **App Roles** → **Roles**
2. Clique em **"Add People"** → **"Add Testers"**
3. Adicione o email/Facebook de quem vai testar a conexao
4. O usuario convidado precisa aceitar em: **developers.facebook.com** → **Requests**

> Cada tester pode conectar seu numero de WhatsApp via Embedded Signup no ZFlow.

---

### Etapa 10: Atualizar variaveis de ambiente

Apos completar as etapas acima, atualize o `.env` na VPS:

```env
# -------------------------------------------
# Meta / WhatsApp Business API
# -------------------------------------------

# Etapa 2: App ID do dashboard (canto superior do Meta Developers)
META_APP_ID=1038583949333550

# Etapa 3: App Secret (Settings > Basic > App Secret > Show)
META_APP_SECRET=seu_app_secret_aqui

# Etapa 5: Verify Token (mesmo valor configurado no webhook)
META_VERIFY_TOKEN=seu_verify_token_aqui

# Etapa 7: Configuration ID (Facebook Login for Business > Configurations)
META_CONFIG_ID=798225723298929
```

> **IMPORTANTE:** As variaveis `VITE_META_APP_ID` e `VITE_META_CONFIG_ID` sao injetadas
> automaticamente pelo `docker-compose.yml` a partir de `META_APP_ID` e `META_CONFIG_ID`.
> Porem, como sao variaveis de **build-time** (Vite), e necessario **reconstruir a imagem
> do frontend** apos alterar esses valores.

---

### Etapa 11: Rebuild e Deploy

```bash
# Na VPS (SSH)
cd /opt/zflow

# Atualizar .env com os novos valores
nano .env

# Rebuild e deploy
docker compose build --no-cache frontend
docker compose up -d
```

Ou, se usa CI/CD via GitHub Actions:

```bash
# No repositorio local
git push origin main
# O workflow build-push.yml ja passa VITE_META_APP_ID e VITE_META_CONFIG_ID como build args
```

---

### Etapa 12: Testar a conexao

1. Acesse `https://crm.ideva.ai`
2. Faca login como admin (`admin@zflow.com`)
3. Va em **Configuracoes** → aba **WhatsApp**
4. Clique em **"Conectar WhatsApp"**
5. O popup do Facebook Embedded Signup deve abrir
6. Faca login com sua conta Meta (que tenha acesso ao Business Account)
7. Selecione ou crie um WhatsApp Business Account
8. Selecione ou registre o numero de telefone
9. Verifique o numero via SMS/ligacao (OTP)
10. Apos autorizar, a conexao aparecera na lista com status **"Conectado"**

> **Se o popup nao abrir:** verifique no console do navegador (F12) se o Facebook SDK carregou.
> O `VITE_META_APP_ID` precisa estar no bundle do frontend (reconstruir se necessario).

---

### Etapa 13: Ir para Live Mode (producao)

> **Em Development mode:** funciona para testers do app, ate 1.000 mensagens/dia, numeros de teste.
> **Em Live mode:** funciona para qualquer usuario, limites normais de mensagens.

Para ir para Live mode:

1. **Verificar Business** (se ainda nao verificado):
   - Va em [business.facebook.com](https://business.facebook.com) → **Settings** → **Security Center**
   - Inicie o processo de verificacao (CNPJ, dominio, etc.)
   - A verificacao pode levar de 1 a 5 dias uteis

2. **Preencher Privacy Policy URL e Terms of Service URL:**
   - No Meta Developers: **App Settings** → **Basic**
   - **Privacy Policy URL:** `https://crm.ideva.ai/privacy` (ou sua URL)
   - **Terms of Service URL:** `https://crm.ideva.ai/terms` (ou sua URL)
   - Esses campos sao obrigatorios para Live mode

3. **Ativar Live Mode:**
   - No topo do dashboard do app, mude o toggle de **"Development"** para **"Live"**
   - Se tiver permissoes pendentes de App Review, submeta primeiro

4. **Verificar Display Name do WhatsApp:**
   - O nome exibido no WhatsApp Business precisa ser aprovado pela Meta
   - Va em **WhatsApp** → **Overview** → verifique o status do display name

---

### Etapa 14: Testar webhook (mensagem real)

1. De outro celular, envie uma mensagem para o numero conectado via WhatsApp
2. No ZFlow, va em **Tickets** → a mensagem deve aparecer como um novo ticket
3. Responda pelo ZFlow → a resposta deve chegar no WhatsApp do celular
4. Verifique os ACKs (checks de entregue/lido) no chat

---

### Resumo das variaveis e onde encontrar

| Variavel | Onde encontrar | Usado por |
|----------|---------------|-----------|
| `META_APP_ID` | Meta Developers → Dashboard (topo) | Backend + Frontend |
| `META_APP_SECRET` | Meta Developers → App Settings → Basic → Show | Backend |
| `META_VERIFY_TOKEN` | Voce define (openssl rand -hex 32) → mesmo no webhook | Backend |
| `META_CONFIG_ID` | FBL → Configurations → Configuration ID | Frontend |

### Fluxo tecnico completo

```
[Frontend]                    [Meta]                      [Backend]
    |                           |                            |
    |-- Clica "Conectar" ------>|                            |
    |   (FB.login com           |                            |
    |    config_id)             |                            |
    |                           |                            |
    |<-- Popup Meta ------------|                            |
    |   (usuario autoriza,      |                            |
    |    seleciona numero,      |                            |
    |    verifica OTP)          |                            |
    |                           |                            |
    |<-- code + wabaId +        |                            |
    |    phoneNumberId          |                            |
    |                           |                            |
    |-- POST /whatsapp/onboard -|-------------------------->|
    |   { code, wabaId,         |                            |
    |     phoneNumberId }       |                            |
    |                           |                            |
    |                           |<-- exchangeCodeForToken ---|
    |                           |    (code → access_token)   |
    |                           |                            |
    |                           |<-- debugToken -------------|
    |                           |    (valida token + scopes) |
    |                           |                            |
    |                           |<-- getPhoneNumbers --------|
    |                           |    (busca display number)  |
    |                           |                            |
    |                           |<-- subscribeApp -----------|
    |                           |    (registra webhook)      |
    |                           |                            |
    |<-- 201 { connection } ----|---------------------------|
    |                           |                            |
    |                           |                            |
    |   [Mensagem recebida]     |                            |
    |                           |-- POST /webhook --------->|
    |                           |   (signature HMAC-SHA256)  |
    |                           |                            |
    |<-- Socket.IO event -------|------- processWebhook ----|
    |   ticket:created          |   (cria contato, ticket,   |
    |   message:created         |    salva mensagem)         |
```

### Troubleshooting

| Problema | Causa provavel | Solucao |
|----------|---------------|---------|
| Popup nao abre | SDK nao carregou | Verificar `VITE_META_APP_ID` no bundle; rebuild frontend |
| Popup abre mas erro "Invalid App" | App ID incorreto ou app nao publicado | Conferir `META_APP_ID`; adicionar dominio no FBL Settings |
| "Verify and Save" falha no webhook | Backend nao acessivel ou token incorreto | Verificar se `crm.ideva.ai/webhook` responde; conferir `META_VERIFY_TOKEN` |
| "Code exchange failed" no onboard | App Secret incorreto | Conferir `META_APP_SECRET` em Settings > Basic |
| Mensagens nao chegam | Webhook fields nao subscritos | Ativar `messages` em WhatsApp > Configuration > Webhook fields |
| Templates nao sincronizam | Token sem permissao | Verificar `whatsapp_business_management` nas permissoes |
| "Permission denied" no Embedded Signup | Usuario nao e tester do app | Adicionar em App Roles > Roles > Testers (modo Development) |
| Limite de 250 msg/dia | Business nao verificado | Completar verificacao em business.facebook.com > Security Center |

### Requisitos finais para producao

- [ ] Meta Business Account **verificada** (CNPJ/dominio)
- [ ] Meta App em **Live mode**
- [ ] Display name do WhatsApp **aprovado**
- [ ] Privacy Policy e Terms of Service URLs **preenchidos**
- [ ] Numero de telefone **dedicado** (nao registrado em outro WhatsApp)
- [ ] Webhook **verificado** e campos `messages` subscritos
- [ ] Frontend **reconstruido** com `VITE_META_APP_ID` e `VITE_META_CONFIG_ID` corretos
- [ ] Testar envio e recebimento de mensagem real

---

### Checklist de Configuracao do Meta App

> Marque [x] cada item conforme for completando. Siga na ordem.

#### Pre-requisitos

| # | Item | Status | Notas |
|---|------|:------:|-------|
| 0.1 | Ter uma Meta Business Account (business.facebook.com) | [ ] | Pode criar durante o processo |
| 0.2 | Ter uma conta de desenvolvedor Meta (developers.facebook.com) | [ ] | Gratuita |
| 0.3 | Ter um numero de telefone dedicado (nao registrado em outro WhatsApp) | [ ] | Nao pode ser numero pessoal |
| 0.4 | Ter acesso ao numero para receber SMS/ligacao (OTP) | [ ] | Para verificacao |
| 0.5 | Dominio com HTTPS configurado (`crm.ideva.ai`) | [ ] | Ja configurado no ZFlow |

#### Etapa 1: Conta de Desenvolvedor

| # | Item | Status | Onde |
|---|------|:------:|------|
| 1.1 | Acessar developers.facebook.com | [ ] | [Link direto](https://developers.facebook.com) |
| 1.2 | Clicar em "Get Started" | [ ] | Canto superior direito |
| 1.3 | Aceitar termos de uso da plataforma | [ ] | Popup de termos |
| 1.4 | Confirmar email (se solicitado) | [ ] | Verificar caixa de entrada |

#### Etapa 2: Criar o App

| # | Item | Status | Onde |
|---|------|:------:|------|
| 2.1 | Clicar em "My Apps" → "Create App" | [ ] | Menu superior |
| 2.2 | Selecionar "Other" → Next | [ ] | Tela "What do you want your app to do?" |
| 2.3 | Selecionar "Business" → Next | [ ] | Tela "Select an app type" |
| 2.4 | Preencher App name: `ZFlow CRM` | [ ] | Campo de texto |
| 2.5 | Preencher email de contato | [ ] | Campo de texto |
| 2.6 | Selecionar Business portfolio (Meta Business Account) | [ ] | Dropdown |
| 2.7 | Clicar em "Create App" e confirmar com senha | [ ] | Botao final |
| 2.8 | **Anotar o App ID** (topo do dashboard) | [ ] | → `.env` META_APP_ID |

#### Etapa 3: Obter App Secret

| # | Item | Status | Onde |
|---|------|:------:|------|
| 3.1 | Ir em App Settings → Basic | [ ] | Menu lateral |
| 3.2 | Em "App Secret", clicar em "Show" | [ ] | Vai pedir senha |
| 3.3 | **Copiar o App Secret** | [ ] | → `.env` META_APP_SECRET |

#### Etapa 4: Adicionar Produto WhatsApp

| # | Item | Status | Onde |
|---|------|:------:|------|
| 4.1 | Clicar em "Add Product" | [ ] | Menu lateral ou dashboard |
| 4.2 | Encontrar "WhatsApp" e clicar "Set Up" | [ ] | Lista de produtos |
| 4.3 | Aceitar termos do WhatsApp Business | [ ] | Popup (se aparecer) |
| 4.4 | Selecionar Meta Business Account para vincular | [ ] | Dropdown |
| 4.5 | Verificar que "WhatsApp" apareceu no menu lateral | [ ] | Sidebar |

#### Etapa 5: Configurar Webhook

| # | Item | Status | Onde |
|---|------|:------:|------|
| 5.1 | Ir em WhatsApp → Configuration | [ ] | Menu lateral |
| 5.2 | Na secao "Webhook", clicar em "Edit" | [ ] | Botao Edit |
| 5.3 | Preencher Callback URL: `https://crm.ideva.ai/webhook` | [ ] | Campo de texto |
| 5.4 | Preencher Verify Token (mesmo do `.env` META_VERIFY_TOKEN) | [ ] | Campo de texto |
| 5.5 | Clicar em "Verify and Save" | [ ] | **Backend precisa estar rodando!** |
| 5.6 | Verificacao com sucesso (status verde) | [ ] | Se falhar: ver Troubleshooting |
| 5.7 | Clicar em "Manage" nos Webhook Fields | [ ] | Botao ao lado dos campos |
| 5.8 | Ativar campo `messages` | [ ] | Toggle/checkbox |
| 5.9 | Ativar campo `message_template_status_update` | [ ] | Toggle/checkbox |
| 5.10 | (Opcional) Clicar em "Test" para enviar payload de teste | [ ] | Botao Test ao lado |

#### Etapa 6: Adicionar Facebook Login for Business

| # | Item | Status | Onde |
|---|------|:------:|------|
| 6.1 | Ir em "Add Product" novamente | [ ] | Menu lateral |
| 6.2 | Encontrar "Facebook Login for Business" e clicar "Set Up" | [ ] | Lista de produtos |
| 6.3 | Ir em Facebook Login for Business → Settings | [ ] | Menu lateral |
| 6.4 | Ativar "Client OAuth login": Yes | [ ] | Toggle |
| 6.5 | Ativar "Web OAuth login": Yes | [ ] | Toggle |
| 6.6 | Adicionar `https://crm.ideva.ai` em "Valid OAuth Redirect URIs" | [ ] | Campo de texto + Add |
| 6.7 | Adicionar `https://crm.ideva.ai` em "Allowed Domains for the JavaScript SDK" | [ ] | Campo de texto + Add |
| 6.8 | Clicar em "Save Changes" | [ ] | Botao inferior |

#### Etapa 7: Criar Configuration (Embedded Signup)

| # | Item | Status | Onde |
|---|------|:------:|------|
| 7.1 | Ir em Facebook Login for Business → Configurations | [ ] | Menu lateral |
| 7.2 | Clicar em "+ Create Configuration" | [ ] | Botao no topo |
| 7.3 | Preencher nome: `ZFlow WhatsApp Signup` | [ ] | Campo de texto |
| 7.4 | Login variation: selecionar "Embedded Signup" → Next | [ ] | Radio button |
| 7.5 | Products: marcar "WhatsApp Cloud API" | [ ] | Checkbox |
| 7.6 | Products: marcar "Marketing Messages API for WhatsApp" → Next | [ ] | Checkbox |
| 7.7 | Permissions: verificar `whatsapp_business_management` marcada | [ ] | Checkbox |
| 7.8 | Permissions: verificar `whatsapp_business_messaging` marcada | [ ] | Checkbox |
| 7.9 | Permissions: verificar `business_management` marcada → Next | [ ] | Checkbox |
| 7.10 | Assets: tipo "WhatsApp Account", permissao "Manage Account" | [ ] | Dropdown |
| 7.11 | Clicar em "Save" | [ ] | Botao final |
| 7.12 | **Anotar o Configuration ID** | [ ] | → `.env` META_CONFIG_ID |

#### Etapa 8: Permissoes do App

| # | Item | Status | Onde |
|---|------|:------:|------|
| 8.1 | Ir em App Review → Permissions and Features | [ ] | Menu lateral |
| 8.2 | Verificar `whatsapp_business_management` ativa | [ ] | Lista de permissoes |
| 8.3 | Verificar `whatsapp_business_messaging` ativa | [ ] | Lista de permissoes |
| 8.4 | Verificar `business_management` ativa | [ ] | Lista de permissoes |
| 8.5 | (Opcional) Ir em App Settings → Advanced → Ativar "Require App Secret" | [ ] | Toggle |

#### Etapa 9: Adicionar Testers (Development Mode)

| # | Item | Status | Onde |
|---|------|:------:|------|
| 9.1 | Ir em App Roles → Roles | [ ] | Menu lateral |
| 9.2 | Clicar em "Add People" → "Add Testers" | [ ] | Botao |
| 9.3 | Adicionar email/Facebook de quem vai testar | [ ] | Campo de texto |
| 9.4 | Tester aceitar convite em developers.facebook.com → Requests | [ ] | Outro usuario |

#### Etapa 10: Atualizar .env na VPS

| # | Item | Status | Onde |
|---|------|:------:|------|
| 10.1 | Conectar na VPS via SSH | [ ] | `ssh root@72.61.25.109` |
| 10.2 | Editar `/opt/zflow/.env` | [ ] | `nano /opt/zflow/.env` |
| 10.3 | Preencher/atualizar `META_APP_ID` (Etapa 2.8) | [ ] | Valor do App ID |
| 10.4 | Preencher/atualizar `META_APP_SECRET` (Etapa 3.3) | [ ] | Valor do App Secret |
| 10.5 | Preencher/atualizar `META_VERIFY_TOKEN` (Etapa 5.4) | [ ] | Valor do Verify Token |
| 10.6 | Preencher/atualizar `META_CONFIG_ID` (Etapa 7.12) | [ ] | Valor do Configuration ID |
| 10.7 | Salvar o arquivo | [ ] | Ctrl+O → Enter → Ctrl+X |

#### Etapa 11: Rebuild e Deploy

| # | Item | Status | Onde |
|---|------|:------:|------|
| 11.1 | Reconstruir imagem do frontend (variaveis VITE_* sao build-time) | [ ] | `docker compose build --no-cache frontend` |
| 11.2 | Subir os containers | [ ] | `docker compose up -d` |
| 11.3 | Verificar logs do backend | [ ] | `docker compose logs -f backend` |
| 11.4 | Verificar se `crm.ideva.ai` carrega normalmente | [ ] | Navegador |

#### Etapa 12: Testar Conexao via Embedded Signup

| # | Item | Status | Onde |
|---|------|:------:|------|
| 12.1 | Acessar `https://crm.ideva.ai` e fazer login | [ ] | Navegador |
| 12.2 | Ir em Configuracoes → aba WhatsApp | [ ] | Menu lateral |
| 12.3 | Clicar em "Conectar WhatsApp" | [ ] | Botao na pagina |
| 12.4 | Popup do Facebook Embedded Signup abre corretamente | [ ] | Popup do Meta |
| 12.5 | Fazer login com conta Meta (que tenha acesso ao Business Account) | [ ] | Dentro do popup |
| 12.6 | Selecionar ou criar WhatsApp Business Account | [ ] | Dentro do popup |
| 12.7 | Selecionar ou registrar numero de telefone | [ ] | Dentro do popup |
| 12.8 | Verificar numero via SMS/ligacao (OTP) | [ ] | Celular |
| 12.9 | Autorizar e concluir | [ ] | Botao no popup |
| 12.10 | Conexao aparece na lista com status "Conectado" (verde) | [ ] | Pagina de settings |

#### Etapa 13: Ir para Live Mode

| # | Item | Status | Onde |
|---|------|:------:|------|
| 13.1 | Verificar Business em business.facebook.com → Settings → Security Center | [ ] | Enviar CNPJ/dominio |
| 13.2 | Aguardar aprovacao da verificacao (1-5 dias uteis) | [ ] | Email de confirmacao |
| 13.3 | Preencher Privacy Policy URL em App Settings → Basic | [ ] | Ex: `https://crm.ideva.ai/privacy` |
| 13.4 | Preencher Terms of Service URL em App Settings → Basic | [ ] | Ex: `https://crm.ideva.ai/terms` |
| 13.5 | Mudar toggle de "Development" para "Live" (topo do dashboard) | [ ] | Toggle no header |
| 13.6 | Submeter App Review se tiver permissoes pendentes | [ ] | App Review → Submit |
| 13.7 | Verificar Display Name do WhatsApp aprovado | [ ] | WhatsApp → Overview |

#### Etapa 14: Testar Mensagem Real

| # | Item | Status | Onde |
|---|------|:------:|------|
| 14.1 | De outro celular, enviar mensagem para o numero conectado | [ ] | WhatsApp pessoal |
| 14.2 | Mensagem aparece como novo ticket no ZFlow (pagina Tickets) | [ ] | `crm.ideva.ai/tickets` |
| 14.3 | Responder pelo ZFlow → resposta chega no WhatsApp do celular | [ ] | Chat do ZFlow |
| 14.4 | ACKs funcionam (1 check = enviado, 2 = entregue, azul = lido) | [ ] | Chat do ZFlow |
| 14.5 | Enviar imagem do celular → aparece como midia no ZFlow | [ ] | Chat do ZFlow |
| 14.6 | Enviar audio do celular → aparece com player no ZFlow | [ ] | Chat do ZFlow |
| 14.7 | Testar campanha: criar campanha com template → iniciar → mensagem chega | [ ] | Campanhas |
| 14.8 | Testar sync de templates: POST /templates/sync retorna templates aprovados | [ ] | API ou CampaignForm |

---

## Arquitetura Atual

```
                    [Traefik - crm.ideva.ai]
                    SSL + HSTS + Redirect
                         |
                    [Nginx - Frontend]
                    SPA + Proxy Reverso
                    /api/* → backend
                    /socket.io → backend
                    /public → backend
                         |
                    [Express - Backend]
                    Port 7563
                    JWT Auth + RBAC
              +----------+----------+
              |          |          |
         [PostgreSQL] [Redis]  [Socket.IO]
          32 models   Bull Q    Rooms:
          34 migra.   5 jobs    tenant/user/ticket
              |
         [Meta Graph API v25.0]
         Webhooks | Messages | Templates | Media
```

---

---

## Checklist de Teste Manual (UI / Funcionalidades / Botoes)

> Testar cada funcionalidade acessando crm.ideva.ai. Marcar [x] quando validado.

### 1. Login (`/login`)

| # | Teste | Status |
|---|-------|--------|
| 1.1 | Exibir campos email e senha | [ ] |
| 1.2 | Botao "Entrar" com credenciais validas → redireciona para `/dashboard` | [ ] |
| 1.3 | Botao "Entrar" com credenciais invalidas → exibe mensagem de erro | [ ] |
| 1.4 | Botao "Entrar" com campos vazios → exibe validacao | [ ] |
| 1.5 | Link "Esqueceu a senha?" visivel (placeholder - nao implementado) | [ ] |
| 1.6 | Refresh token automatico apos expirar access token (15min) | [ ] |
| 1.7 | Redirecionar para `/login` se nao autenticado | [ ] |

### 2. Sidebar (navegacao lateral)

| # | Teste | Status |
|---|-------|--------|
| 2.1 | Logo ZFlow visivel no topo | [ ] |
| 2.2 | Link "Dashboard" → navega para `/dashboard` | [ ] |
| 2.3 | Link "Tickets" → navega para `/tickets` | [ ] |
| 2.4 | Link "Contatos" → navega para `/contacts` | [ ] |
| 2.5 | Link "CRM" → navega para `/crm` | [ ] |
| 2.6 | Link "Campanhas" → navega para `/campaigns` | [ ] |
| 2.7 | Link "Configuracoes" → navega para `/settings` | [ ] |
| 2.8 | Rota ativa destacada visualmente | [ ] |
| 2.9 | Secao do usuario no rodape (nome + perfil) | [ ] |
| 2.10 | Botao de collapse/expand na borda direita do sidebar | [ ] |
| 2.11 | Sidebar colapsado mostra apenas icones com tooltips | [ ] |
| 2.12 | Estado do sidebar persistido entre recarregamentos (localStorage) | [ ] |
| 2.13 | Transicao suave ao expandir/colapsar (300ms) | [ ] |

### 3. Header (barra superior)

| # | Teste | Status |
|---|-------|--------|
| 3.1 | Titulo da pagina atual exibido | [ ] |
| 3.2 | Icone de sino (notificacoes) com badge de contagem | [ ] |
| 3.3 | Clique no sino → navega para `/notifications` | [ ] |
| 3.4 | Dropdown do usuario (avatar/nome) | [ ] |
| 3.5 | Item "Perfil" no dropdown → navega para `/profile` | [ ] |
| 3.6 | Item "Sair" no dropdown → logout e redireciona para `/login` | [ ] |

### 4. Dashboard (`/dashboard`)

| # | Teste | Status |
|---|-------|--------|
| 4.1 | Saudacao por horario (Bom dia/Boa tarde/Boa noite) + nome do usuario | [ ] |
| 4.2 | Card "Tickets Abertos" com numero correto | [ ] |
| 4.3 | Card "Contatos" com numero correto | [ ] |
| 4.4 | Card "Campanhas Ativas" com numero correto | [ ] |
| 4.5 | Card "Oportunidades" com numero correto | [ ] |
| 4.6 | Skeleton loaders durante carregamento | [ ] |
| 4.7 | Clique em cada card navega para respectiva pagina | [ ] |

### 5. Tickets (`/tickets`)

#### 5.1 Lista de Tickets (painel esquerdo)

| # | Teste | Status |
|---|-------|--------|
| 5.1.1 | Tabs de filtro: Abertos, Pendentes, Fechados, Todos | [ ] |
| 5.1.2 | Clique em tab filtra tickets corretamente | [ ] |
| 5.1.3 | Campo de busca filtra por nome/numero do contato | [ ] |
| 5.1.4 | Busca com debounce (500ms) | [ ] |
| 5.1.5 | Cada ticket mostra: avatar, nome, ultima mensagem, hora, badge nao lido | [ ] |
| 5.1.6 | Clique em ticket seleciona e abre chat no painel direito | [ ] |
| 5.1.7 | Ticket selecionado destacado visualmente | [ ] |
| 5.1.8 | Paginacao / scroll infinito funciona | [ ] |

#### 5.2 Painel de Chat (painel direito)

| # | Teste | Status |
|---|-------|--------|
| 5.2.1 | Header do chat: nome do contato, numero, status do ticket | [ ] |
| 5.2.2 | Mensagens exibidas com baloes (azul = enviada, cinza = recebida) | [ ] |
| 5.2.3 | Separadores de data entre mensagens de dias diferentes | [ ] |
| 5.2.4 | Indicadores de ACK: 1 check (enviada), 2 checks (entregue), 2 checks azul (lida) | [ ] |
| 5.2.5 | Horario de cada mensagem exibido | [ ] |
| 5.2.6 | Auto-scroll para ultima mensagem ao abrir ticket | [ ] |
| 5.2.7 | Scroll para cima carrega mensagens antigas (paginacao) | [ ] |
| 5.2.8 | Campo de texto para digitar mensagem | [ ] |
| 5.2.9 | Botao Enviar (aparece quando tem texto) → envia mensagem | [ ] |
| 5.2.10 | Enter envia mensagem, Shift+Enter quebra linha | [ ] |
| 5.2.11 | Botao Microfone (aparece quando textarea vazio) → inicia gravacao | [ ] |
| 5.2.12 | Gravacao de audio: barra animada + timer + botao cancelar (lixeira) + botao parar | [ ] |
| 5.2.13 | Apos parar gravacao: AudioPreview com play/pause + barra de progresso + descartar + enviar | [ ] |
| 5.2.14 | Enviar audio → mensagem de audio aparece no chat | [ ] |
| 5.2.15 | AudioPlayer inline: play/pause, barra de progresso, duracao, velocidade (1x/1.5x/2x) | [ ] |
| 5.2.16 | Mensagem de imagem exibida como thumbnail clicavel | [ ] |
| 5.2.17 | Mensagem de video exibida com player | [ ] |
| 5.2.18 | Mensagem de documento exibida com icone + nome do arquivo | [ ] |
| 5.2.19 | Botao de acao no header: Fechar ticket / Reabrir ticket | [ ] |
| 5.2.20 | Estado vazio quando nenhum ticket selecionado | [ ] |

### 6. Contatos (`/contacts`)

#### 6.1 Lista de Contatos

| # | Teste | Status |
|---|-------|--------|
| 6.1.1 | Botao "Novo Contato" → navega para formulario de criacao | [ ] |
| 6.1.2 | Campo de busca filtra contatos por nome/numero/email | [ ] |
| 6.1.3 | DataTable exibe colunas: Nome, Numero, Email, Tags, Criado em | [ ] |
| 6.1.4 | Clique em linha da tabela → abre formulario de edicao | [ ] |
| 6.1.5 | Tags exibidas como badges coloridos | [ ] |
| 6.1.6 | Paginacao funciona (20 itens por pagina) | [ ] |
| 6.1.7 | Botao de deletar contato na tabela | [ ] |
| 6.1.8 | ConfirmDialog ao deletar: "Tem certeza?" com botao Confirmar/Cancelar | [ ] |
| 6.1.9 | Estado vazio: "Nenhum contato encontrado" quando lista vazia | [ ] |

#### 6.2 Formulario de Contato (`/contacts/new` e `/contacts/:id/edit`)

| # | Teste | Status |
|---|-------|--------|
| 6.2.1 | Campo "Nome" (obrigatorio) - validacao em tempo real | [ ] |
| 6.2.2 | Campo "Numero" (obrigatorio) - validacao em tempo real | [ ] |
| 6.2.3 | Campo "Email" (opcional) - validacao de formato email | [ ] |
| 6.2.4 | Botao "Salvar" → cria/atualiza contato e redireciona para lista | [ ] |
| 6.2.5 | Botao "Voltar" → retorna a lista sem salvar | [ ] |
| 6.2.6 | Mensagens de erro por campo quando validacao falha | [ ] |
| 6.2.7 | Loading state no botao durante salvamento | [ ] |
| 6.2.8 | Formulario pre-preenchido ao editar contato existente | [ ] |

### 7. CRM / Pipeline (`/crm`)

| # | Teste | Status |
|---|-------|--------|
| 7.1 | Dropdown selector de pipeline (se mais de um) | [ ] |
| 7.2 | Colunas do kanban = estagios do pipeline selecionado | [ ] |
| 7.3 | Cada coluna mostra: nome do estagio, cor, contagem de oportunidades, valor total | [ ] |
| 7.4 | Cards de oportunidade mostram: titulo, contato, valor (R$), tags, data | [ ] |
| 7.5 | Drag-and-drop de card entre colunas → move oportunidade de estagio | [ ] |
| 7.6 | Drag-and-drop dentro da mesma coluna → reordena | [ ] |
| 7.7 | Botao "Nova Oportunidade" → abre dialog de criacao | [ ] |
| 7.8 | Dialog de criacao: campos titulo, contato, valor, estagio | [ ] |
| 7.9 | Botao "Criar" no dialog → cria oportunidade e aparece no kanban | [ ] |
| 7.10 | Botao "Cancelar" no dialog → fecha sem criar | [ ] |
| 7.11 | Estado vazio quando pipeline nao tem oportunidades | [ ] |

### 8. Campanhas (`/campaigns`)

#### 8.1 Lista de Campanhas

| # | Teste | Status |
|---|-------|--------|
| 8.1.1 | Botao "Nova Campanha" → navega para formulario | [ ] |
| 8.1.2 | Tabs de filtro: Todas, Pendentes, Em Andamento, Concluidas, Canceladas | [ ] |
| 8.1.3 | Clique em tab filtra campanhas corretamente | [ ] |
| 8.1.4 | Campo de busca filtra por nome da campanha | [ ] |
| 8.1.5 | Cada campanha mostra: nome, status badge, contagem de contatos, data | [ ] |
| 8.1.6 | StatusBadge com cores corretas (cinza=pendente, amarelo=andamento, verde=concluida, vermelho=cancelada, roxo=na fila, azul=agendada) | [ ] |
| 8.1.7 | Botao "Ver" → navega para detalhes da campanha | [ ] |
| 8.1.8 | Botao "Editar" → navega para formulario de edicao | [ ] |
| 8.1.9 | Botao "Iniciar" (visivel apenas em status pendente) → inicia campanha | [ ] |
| 8.1.10 | Botao "Cancelar" (visivel em pendente/em andamento) → abre ConfirmDialog | [ ] |
| 8.1.11 | ConfirmDialog de cancelamento com botao "Cancelar campanha" (destructive) | [ ] |
| 8.1.12 | Botao "Deletar" → abre ConfirmDialog de exclusao | [ ] |
| 8.1.13 | Paginacao funciona (20 itens por pagina) | [ ] |
| 8.1.14 | Estado vazio com botao "Criar primeira campanha" | [ ] |

#### 8.2 Formulario de Campanha (`/campaigns/new` e `/campaigns/:id/edit`)

| # | Teste | Status |
|---|-------|--------|
| 8.2.1 | Campo "Nome da campanha" (obrigatorio) | [ ] |
| 8.2.2 | Dropdown "Conexao WhatsApp" → lista conexoes disponiveis | [ ] |
| 8.2.3 | Botao "Sincronizar templates" → chama POST /templates/sync, mostra loading | [ ] |
| 8.2.4 | Dropdown "Template" → lista templates aprovados da conexao selecionada | [ ] |
| 8.2.5 | Ao selecionar template → exibe preview (header, body, footer, botoes) | [ ] |
| 8.2.6 | Se template tem variaveis ({{1}}, {{2}}) → exibe inputs para parametros | [ ] |
| 8.2.7 | Secao de selecao de contatos: busca + adicionar/remover | [ ] |
| 8.2.8 | Campo de busca de contatos filtra por nome/numero | [ ] |
| 8.2.9 | Clique em contato na busca → adiciona a lista de selecionados | [ ] |
| 8.2.10 | Botao X em contato selecionado → remove da lista | [ ] |
| 8.2.11 | Contador de contatos selecionados visivel | [ ] |
| 8.2.12 | Botao "Criar Campanha" / "Salvar" → cria/atualiza e redireciona | [ ] |
| 8.2.13 | Botao "Cancelar" → volta para lista sem salvar | [ ] |
| 8.2.14 | Validacao: nome e template obrigatorios | [ ] |

### 9. Configuracoes (`/settings`)

#### 9.1 Tab Geral

| # | Teste | Status |
|---|-------|--------|
| 9.1.1 | Tab "Geral" selecionada por padrao | [ ] |
| 9.1.2 | Campos de configuracao do sistema exibidos | [ ] |
| 9.1.3 | Botao "Salvar" → persiste configuracoes | [ ] |

#### 9.2 Tab Filas

| # | Teste | Status |
|---|-------|--------|
| 9.2.1 | Lista de filas existentes com nome e cor | [ ] |
| 9.2.2 | Botao "Nova Fila" → abre dialog de criacao | [ ] |
| 9.2.3 | Dialog: campo "Nome" + color picker | [ ] |
| 9.2.4 | Botao "Criar" → cria fila e atualiza lista | [ ] |
| 9.2.5 | Botao "Deletar" fila → ConfirmDialog + remove da lista | [ ] |

#### 9.3 Tab WhatsApp

| # | Teste | Status |
|---|-------|--------|
| 9.3.1 | Lista de conexoes WhatsApp com nome, numero, status (badge) | [ ] |
| 9.3.2 | Botao "Conectar WhatsApp" → abre Facebook Embedded Signup (popup) | [ ] |
| 9.3.3 | Popup Meta: usuario autoriza e seleciona numero de telefone | [ ] |
| 9.3.4 | Apos autorizacao: conexao criada automaticamente na lista | [ ] |
| 9.3.5 | Status badge: "Conectado" (verde) / "Desconectado" (vermelho) | [ ] |
| 9.3.6 | Botao "Deletar" conexao → ConfirmDialog + remove | [ ] |
| 9.3.7 | Selecao de usuarios vinculados a conexao (UserWhatsApp) | [ ] |

#### 9.4 Tab Usuarios (somente admin)

| # | Teste | Status |
|---|-------|--------|
| 9.4.1 | Tab visivel apenas para perfil admin/super | [ ] |
| 9.4.2 | Lista de usuarios com nome, email, perfil | [ ] |
| 9.4.3 | Botao "Novo Usuario" → abre dialog/form de criacao | [ ] |
| 9.4.4 | Campos: nome, email, senha, perfil (dropdown) | [ ] |
| 9.4.5 | Botao "Criar" → cria usuario | [ ] |
| 9.4.6 | Botao "Editar" usuario → formulario pre-preenchido | [ ] |
| 9.4.7 | Botao "Deletar" usuario → ConfirmDialog + remove | [ ] |

### 10. Paginas Placeholder

| # | Teste | Status |
|---|-------|--------|
| 10.1 | `/notifications` → exibe "Notificacoes - Em breve..." | [ ] |
| 10.2 | `/profile` → exibe "Perfil - Em breve..." | [ ] |

### 11. Funcionalidades Transversais

| # | Teste | Status |
|---|-------|--------|
| 11.1 | URL invalida redireciona para `/` | [ ] |
| 11.2 | ErrorBoundary captura erros React e exibe tela de fallback com botao "Recarregar" | [ ] |
| 11.3 | Token refresh automatico em 401 (sem redirect para login) | [ ] |
| 11.4 | Logout limpa localStorage e redireciona para login | [ ] |
| 11.5 | Socket.IO conecta automaticamente apos login | [ ] |
| 11.6 | Socket.IO reconecta automaticamente apos desconexao (ate 5 tentativas) | [ ] |
| 11.7 | Notificacoes real-time via socket incrementam badge no header | [ ] |

### 12. Testes de API (via curl/Postman)

| # | Teste | Endpoint | Status |
|---|-------|----------|--------|
| 12.1 | Health check | GET /health | [ ] |
| 12.2 | Login | POST /auth/login | [ ] |
| 12.3 | Refresh token | POST /auth/refresh | [ ] |
| 12.4 | Listar contatos | GET /contacts | [ ] |
| 12.5 | Criar contato | POST /contacts | [ ] |
| 12.6 | Listar tickets | GET /tickets | [ ] |
| 12.7 | Listar campanhas | GET /campaigns | [ ] |
| 12.8 | Criar campanha | POST /campaigns | [ ] |
| 12.9 | Iniciar campanha | POST /campaigns/:id/start | [ ] |
| 12.10 | Cancelar campanha | POST /campaigns/:id/cancel | [ ] |
| 12.11 | Sync templates | POST /templates/sync | [ ] |
| 12.12 | Listar templates | GET /templates | [ ] |
| 12.13 | Webhook verify | GET /webhook?hub.mode=subscribe&... | [ ] |
| 12.14 | Upload de arquivo | POST /upload (multipart) | [ ] |
| 12.15 | Listar filas | GET /queues | [ ] |
| 12.16 | Listar pipelines | GET /pipelines | [ ] |
| 12.17 | Listar oportunidades | GET /opportunities | [ ] |

---

*Ultima atualizacao: 3 de marco de 2026 (seguranca quick wins + socket.IO real-time concluidos)*
