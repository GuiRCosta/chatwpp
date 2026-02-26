# ZFlow - Roadmap

## Visao Geral

Plataforma multi-canal de atendimento ao cliente com CRM integrado.

---

## Fase 1: Backend Core - Logica de Negocio

> **Status: CONCLUIDA**

### 1.1 Validators (Yup Schemas)
- [x] Auth (login, refresh)
- [x] User (create, update)
- [x] Tenant (create, update)
- [x] Contact (create, update)
- [x] Queue (create, update)
- [x] Tag (create, update)
- [x] Ticket (create, update)
- [x] Message (create)
- [x] Setting (update)
- [x] WhatsApp (create, update)

### 1.2 Auth Module
- [x] AuthService (login, refresh, logout, hash/compare password)
- [x] AuthController
- [x] Rotas conectadas ao controller

### 1.3 Tenant Module
- [x] TenantService (CRUD + paginacao)
- [x] TenantController
- [x] Rotas conectadas ao controller

### 1.4 User Module
- [x] UserService (CRUD + paginacao + soft delete)
- [x] UserController
- [x] Rotas conectadas ao controller

### 1.5 Contact Module
- [x] ContactService (CRUD + paginacao + filtros + soft delete)
- [x] ContactController
- [x] Rotas conectadas ao controller

### 1.6 Queue Module
- [x] QueueService (CRUD + associar usuarios)
- [x] QueueController
- [x] Rotas conectadas ao controller

### 1.7 Tag Module
- [x] TagService (CRUD + associar contatos)
- [x] TagController
- [x] Rotas conectadas ao controller

### 1.8 Ticket Module
- [x] TicketService (CRUD + status transitions + assign + logs)
- [x] TicketController
- [x] Rotas conectadas ao controller

### 1.9 Message Module
- [x] MessageService (create + list por ticket + paginacao)
- [x] MessageController
- [x] Rotas conectadas ao controller

### 1.10 Setting Module
- [x] SettingService (get/update por tenant)
- [x] SettingController
- [x] Rotas conectadas ao controller

### 1.11 WhatsApp Module
- [x] WhatsAppService (CRUD de conexoes)
- [x] WhatsAppController
- [x] Rotas conectadas ao controller

---

## Fase 2: Database Migrations & Seeds

> **Status: CONCLUIDA**

- [x] Migration: CreateTenants
- [x] Migration: CreateUsers
- [x] Migration: CreateContacts
- [x] Migration: CreateQueues
- [x] Migration: CreateUserQueues
- [x] Migration: CreateWhatsApps
- [x] Migration: CreateTags
- [x] Migration: CreateContactTags
- [x] Migration: CreateTickets
- [x] Migration: CreateMessages
- [x] Migration: CreateSettings
- [x] Migration: CreateTicketNotes
- [x] Migration: CreateTicketLogs
- [x] Migration: demais tabelas (ChatFlow, AutoReply, Campaign, etc.)
- [x] Seed: SuperAdmin padrao
- [x] Seed: Tenant padrao
- [x] Seed: Settings iniciais

---

## Fase 3: Integracao WhatsApp (WABA + FBL)

> **Status: CONCLUIDA**

### 3.1 Meta Cloud API (Concluido)
- [x] Client HTTP para Meta Graph API (v25.0)
- [x] Webhook receiver (verificacao + mensagens)
- [x] Envio de mensagens de texto
- [x] Envio de mensagens de midia
- [x] Templates de mensagem
- [x] Sincronizacao de status (enviado, entregue, lido)
- [x] Gerenciamento de conexao (connect/disconnect)

### 3.2 Facebook Business Login - Embedded Signup (Concluido)
- [x] Backend: endpoint OAuth callback (trocar code por access token)
- [x] Backend: buscar phone numbers e WABA ID automaticamente via Graph API
- [x] Backend: validar token e permissoes (debugToken)
- [x] Backend: registrar webhook automaticamente para o phone number (subscribeApp)
- [x] Backend: guard de duplicidade por phoneNumberId por tenant
- [x] Frontend: integrar Facebook JS SDK (lib/facebook.ts)
- [x] Frontend: botao "Conectar WhatsApp" com Embedded Signup flow
- [x] Frontend: callback de sucesso (salvar conexao automaticamente)
- [x] Frontend: timeout e cleanup do message handler (5 min)
- [x] Env vars: META_APP_ID, META_APP_SECRET, META_CONFIG_ID, VITE_META_APP_ID, VITE_META_CONFIG_ID
- [x] Remover fluxo manual de input de token/phoneNumberId

---

## Fase 4: Filas e Jobs (Bull)

> **Status: CONCLUIDA**

- [x] Configuracao Bull + Redis (config/redis.ts, libs/queues.ts)
- [x] Job: Envio de mensagens (SendMessageJob - retry 3x, backoff exponencial)
- [x] Job: Disparo em massa (BulkDispatchJob - delay 1.5s entre mensagens)
- [x] Job: Campanhas (CampaignJob - delay 2s, cron a cada 1 min)
- [x] Job: Limpeza de tickets inativos (CleanupTicketsJob - cron a cada 30 min)
- [x] Bull Board dashboard (/admin/queues)
- [x] Scheduled Jobs com node-cron (campanhas agendadas + limpeza)
- [x] Integracao MessageService com fila send-message
- [x] Graceful shutdown (Redis, filas, cron)

---

## Fase 5: Features Avancadas

> **Status: CONCLUIDA**

### 5.1 Features Core (Concluido)
- [x] ChatFlow (fluxos automatizados - CRUD + duplicate + JSONB flow)
- [x] AutoReply (respostas automaticas - CRUD + Steps com reordenacao)
- [x] FastReply (respostas rapidas - CRUD por usuario)
- [x] Pipeline/Kanban CRM (CRUD + Stages com reorder)
- [x] Oportunidades (CRUD + move entre stages + filtros)
- [x] Campanhas de marketing (CRUD + start/cancel/schedule + fila Bull)
- [x] Galeria de midias (CRUD + filtro por mediaType)
- [x] Notifications (CRUD + markAsRead/markAllAsRead + socket)
- [x] Lista de banidos (CRUD + validacao duplicidade)
- [x] Log de chamadas (CRUD + filtro por tipo/contato)
- [x] TodoList interno (CRUD + toggle done + filtro)
- [x] 12 rotas registradas em routes/index.ts
- [x] Fix Campaign ENUM: adicionado "scheduled" e "queued"

### 5.2 Gravacao e Envio de Audio (PTT / Voice Message) (Concluido)
- [x] Backend: endpoint generico POST /upload (multer, aceita audio/image/video/document)
- [x] Backend: UploadController move arquivo para public/{tenantId}/{hash}.{ext}
- [x] Backend: audio/webm adicionado ao allowedMimes (Safari)
- [x] Backend: MessageValidator.body opcional quando mediaType presente
- [x] Frontend: lib/audio.ts (supportsOggOpus, getRecordingMimeType, formatDuration, getExtensionFromMime)
- [x] Frontend: lib/mediaUpload.ts (uploadMedia via FormData -> /upload)
- [x] Frontend: useAudioRecorder hook (idle/recording/recorded, MediaRecorder API)
- [x] Frontend: AudioRecorder component (3 estados: mic, barra de gravacao, preview)
- [x] Frontend: AudioPreview component (play/pause + progress bar + duracao + send/discard)
- [x] Frontend: AudioPlayer component inline (play/pause + progress + velocidade 1x/1.5x/2x)
- [x] Frontend: ChatPanel MessageBubble renderiza AudioPlayer para mediaType="audio"
- [x] Frontend: ChatPanel MessageBubble renderiza img/video/document para outros mediaTypes
- [x] Frontend: Mic button quando textarea vazia, Send button quando tem texto
- [x] Frontend: chatStore.sendAudioMessage (upload + POST /messages com mediaUrl/mediaType)
- [x] Frontend: proxy /public -> backend no vite.config.ts
- [x] Chrome/Firefox: grava OGG/Opus (PTT nativo WhatsApp)
- [x] Safari: grava WebM (enviado como audio regular, nao PTT)
- [x] Backend: webhook ja recebia audios (downloadAndSaveMedia) - nenhuma alteracao necessaria
- [x] 10 testes UploadController, 8 testes MessageValidator, 17 testes audio.ts, 3 testes mediaUpload.ts, 10 testes useAudioRecorder, 6 testes AudioPreview, 11 testes AudioRecorder, 9 testes AudioPlayer, 1 teste chatStore.sendAudioMessage

---

## Fase 6: Frontend (React + Vite + Shadcn/ui)

> **Status: CONCLUIDA**

- [x] Scaffold do projeto (Vite 6 + React 19 + TypeScript + Tailwind CSS 3.4)
- [x] Design system extraido (Inter font, tokens de cor, Lucide icons)
- [x] Shadcn/ui components (Button, Input, Card, Dialog, Select, Tabs, etc.)
- [x] Infra: API client (Axios + interceptors), Socket.IO, Zustand stores
- [x] Auth (login, refresh automatico, PrivateRoute guard)
- [x] Layout principal (Sidebar escura, Header com notificacoes, AppLayout)
- [x] Dashboard (cards metricas, saudacao por horario)
- [x] Componentes compartilhados (DataTable, SearchInput, StatusBadge, ConfirmDialog)
- [x] Modulo de Tickets/Chat (lista com filtros, chat em tempo real, envio de midia)
- [x] Modulo de Contatos (CRUD com DataTable, busca, paginacao)
- [x] Modulo CRM (Pipeline selector, Kanban drag-and-drop com @dnd-kit)
- [x] Modulo de Campanhas (lista com filtros, form com selecao de contatos, start/cancel)
- [x] Modulo de Configuracoes (4 tabs: Geral, Filas, WhatsApp, Usuarios)
- [x] Rotas configuradas no React Router v7

---

## Fase 7: Testes

> **Status: CONCLUIDA**

### 7.1 Backend (Vitest)
- [x] Setup Vitest + @vitest/coverage-v8
- [x] Testes unitarios: 18 services (Auth, User, Contact, Ticket, Message, Campaign, Queue, Tag, Tenant, Setting, WhatsApp, ChatFlow, AutoReply, FastReply, BanList, CallLog, Gallery, Notification, Opportunity, Pipeline, Kanban, TodoList)
- [x] Testes unitarios: 6 validators (Auth, User, Contact, Ticket, Message, Campaign, Opportunity)
- [x] Testes unitarios: 5 jobs (SendMessage, BulkDispatch, Campaign, CleanupTickets, ScheduledJobs)
- [x] Testes unitarios: 2 middleware (errorHandler, isAuth)
- [x] Testes unitarios: helpers (AppError)
- [x] Testes unitarios: libs (queues, socket, waba/wabaClient, waba/webhookHandler, waba/webhookSignature, waba/mediaHandler)
- [x] Testes de integracao: 20 controllers (Auth, User, Contact, Ticket, Message, Campaign, Setting, Queue, Tag, Tenant, WhatsApp, Webhook, AutoReply, BanList, CallLog, ChatFlow, FastReply, Gallery, Kanban, Notification, Opportunity, Pipeline, TodoList)
- [x] 66 arquivos de teste, 670 testes passando
- [x] Cobertura: 93.62% statements, 89.75% branches, 96.11% functions

### 7.2 Frontend (Vitest + Testing Library + MSW)
- [x] Setup Vitest + jsdom + @testing-library/react + MSW v2
- [x] Testes unitarios: 4 stores (authStore, chatStore, notificationStore, ticketStore)
- [x] Testes unitarios: 2 hooks (useAuth, useSocket)
- [x] Testes unitarios: 4 libs (api, facebook, socket, utils)
- [x] Testes unitarios: 4 componentes compartilhados (ConfirmDialog, DataTable, SearchInput, StatusBadge)
- [x] Testes unitarios: 3 componentes layout (AppLayout, Header, Sidebar)
- [x] Testes unitarios: 12 pages (Dashboard, Login, ContactList, ContactForm, TicketList, ChatPanel, CampaignList, CampaignForm, PipelineView, KanbanBoard, Settings, SettingsTabs)
- [x] 29 arquivos de teste, 301 testes passando
- [x] Cobertura: 90.42% statements, 83.98% branches, 80.85% functions

### 7.3 E2E (Playwright)
- [x] Setup Playwright + Chromium
- [x] 5 specs: auth, contacts, dashboard, navigation, tickets
- [x] Configuracao webServer (backend + frontend)

---

## Fase 8: Deploy (VPS + Portainer + Docker Swarm + Traefik)

> **Status: CONCLUIDA**

### 8.1 Dockerfiles Multi-stage
- [x] Dockerfile backend (multi-stage: build + production com usuario non-root)
- [x] Dockerfile frontend (multi-stage: build Vite + nginxinc/nginx-unprivileged)
- [x] .dockerignore para backend e frontend
- [x] Entrypoint script com flags RUN_MIGRATIONS/RUN_SEEDS

### 8.2 Docker Compose (Swarm-compatible)
- [x] docker-compose.yml com deploy configs (replicas, resources, restart_policy, reservations)
- [x] Servico: backend (API + Socket.IO + entrypoint controlavel)
- [x] Servico: frontend (Nginx non-root com proxy reverso)
- [x] Servico: postgres (volume persistente + tuning basico)
- [x] Servico: redis (volume persistente + healthcheck seguro via REDISCLI_AUTH)
- [x] Servico: traefik v3.2 (reverse proxy + SSL Let's Encrypt)
- [x] Labels Traefik para roteamento (dominio unico com Nginx routing interno)
- [x] 2 redes overlay: zflow-public (Traefik + Frontend) + zflow-internal (isolada)
- [x] Log rotation (json-file driver com max-size 10m, max-file 5)

### 8.3 Traefik
- [x] Entrypoints HTTP (80) e HTTPS (443)
- [x] Redirect HTTP -> HTTPS automatico
- [x] SSL automatico via Let's Encrypt (ACME HTTP challenge)
- [x] Dashboard Traefik em traefik.${DOMAIN} (protegido com basicAuth)
- [x] Middleware: HSTS, frameDeny, contentTypeNosniff

### 8.4 Monitoramento & Saude
- [x] Health check endpoint no backend (/health) - ja existia
- [x] Health checks Docker para todos servicos (postgres, redis, backend, frontend)
- [x] Log rotation configurado no docker-compose
- [x] Restart policies (on-failure com max_attempts e delay)

### 8.5 Portainer
- [x] Stack deploy via Portainer (docker-compose.yml compativel com docker stack deploy)
- [x] Variaveis de ambiente via .env (DOMAIN, ACME_EMAIL, etc.)
- [x] Rolling update (order: start-first para zero-downtime)

### 8.6 Backup & Persistencia
- [x] Volume nomeado para PostgreSQL (postgres_data)
- [x] Volume nomeado para Redis (redis_data)
- [x] Volumes para uploads, public e logs do backend
- [x] Volume para certificados Let's Encrypt (letsencrypt)
- [x] Script de backup automatizado com verificacao de integridade (gzip -t)

### 8.7 Nginx (Proxy Reverso Interno)
- [x] Proxy /api/* -> backend (strip prefix)
- [x] Proxy /socket.io -> backend (WebSocket upgrade)
- [x] Proxy /webhook -> backend (direto)
- [x] Proxy /public -> backend (arquivos estaticos/uploads)
- [x] Proxy /admin/queues -> backend (Bull Board)
- [x] SPA fallback (try_files -> index.html)
- [x] Gzip compression
- [x] Cache de assets estaticos (1 ano, immutable)
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)

---

## Fase 9: CI/CD & Git

> **Status: PENDENTE**

### 9.1 Repositorio Git
- [ ] Inicializar repositorio
- [ ] .gitignore (node_modules, dist, .env, uploads)
- [ ] Commit inicial com todo o projeto

### 9.2 GitHub Actions
- [ ] Workflow: lint (ESLint)
- [ ] Workflow: test (Vitest + cobertura)
- [ ] Workflow: build (Docker build + push para registry)
- [ ] Workflow: deploy (SSH na VPS ou webhook Portainer)

### 9.3 Registry de Imagens
- [ ] Configurar Docker Registry (GitHub Container Registry ou Docker Hub)
- [ ] Tags de imagem por branch/version (latest, v1.0.0)
- [ ] Limpeza de imagens antigas
