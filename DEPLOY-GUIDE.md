# ZFlow - Guia de Deploy em Producao

## Pre-requisitos

- VPS com Docker instalado (Ubuntu 22.04+ recomendado)
- Docker Swarm inicializado (`docker swarm init`)
- Dominio apontando para o IP da VPS (DNS A record)
- Conta no GitHub com acesso ao repositorio
- Conta no Meta Developers (para integracao WhatsApp)

---

## Etapa 1: Preparar a VPS

### 1.1 Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 1.2 Inicializar Docker Swarm

```bash
docker swarm init
```

### 1.3 Criar diretorio do projeto

```bash
sudo mkdir -p /opt/zflow
sudo chown $USER:$USER /opt/zflow
```

### 1.4 Copiar docker-compose.yml para a VPS

```bash
scp docker-compose.yml user@SEU_IP:/opt/zflow/
```

---

## Etapa 2: Configurar DNS

No painel do seu provedor de dominio (Cloudflare, Route 53, etc.):

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | `zflow.seudominio.com` | IP da VPS | Auto |
| A | `traefik.zflow.seudominio.com` | IP da VPS | Auto |

> Aguarde a propagacao DNS (pode levar ate 24h, geralmente minutos).

---

## Etapa 3: Gerar Secrets de Seguranca

Execute na VPS (ou localmente) para gerar valores seguros:

```bash
# Senha do PostgreSQL
echo "POSTGRES_PASSWORD=$(openssl rand -hex 32)"

# JWT Secret (autenticacao)
echo "JWT_SECRET=$(openssl rand -hex 64)"

# JWT Refresh Secret (refresh token)
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)"

# Senha do Redis
echo "REDIS_PASSWORD=$(openssl rand -hex 32)"

# Token de verificacao do Webhook Meta
echo "META_VERIFY_TOKEN=$(openssl rand -hex 32)"

# Credencial do Dashboard Traefik
# Vai pedir uma senha - guarde-a
htpasswd -nB admin
# Saida: admin:$2y$05$... (copie esse valor)
# IMPORTANTE: no .env, duplique cada $ -> $$
# Exemplo: admin:$$2y$$05$$abc...
```

> Guarde todos esses valores em um local seguro (1Password, Bitwarden, etc.)

---

## Etapa 4: Configurar Variaveis Meta (Facebook Business Login)

### 4.1 Criar App no Meta Developers

1. Acesse **https://developers.facebook.com**
2. Clique em **"Meus Apps"** > **"Criar App"**
3. Selecione tipo **"Business"**
4. Preencha nome (ex: "ZFlow") e email de contato
5. Clique em **"Criar App"**

### 4.2 Obter META_APP_ID

1. No painel do App, o **App ID** aparece no topo da pagina
2. Tambem disponivel em: **Configuracoes** > **Basico** > **ID do App**

```
META_APP_ID=123456789012345
```

### 4.3 Obter META_APP_SECRET

1. Va em **Configuracoes** > **Basico**
2. Clique em **"Mostrar"** ao lado de **Chave Secreta do App**
3. Confirme sua senha do Facebook

```
META_APP_SECRET=abc123def456ghi789...
```

### 4.4 Adicionar produto WhatsApp ao App

1. No menu lateral, clique em **"Adicionar produto"**
2. Encontre **"WhatsApp"** e clique em **"Configurar"**
3. Associe a uma **Conta Business** (Business Manager) existente ou crie uma

### 4.5 Configurar Webhook

1. Va em **WhatsApp** > **Configuracao**
2. Em **Webhook**, clique em **"Editar"**
3. Preencha:
   - **URL de callback**: `https://SEU_DOMINIO/api/webhook/meta`
   - **Token de verificacao**: o valor que voce gerou em `META_VERIFY_TOKEN`
4. Clique em **"Verificar e salvar"**
5. Em **Campos do webhook**, inscreva-se em:
   - `messages`
   - `message_deliveries`
   - `message_reads`

```
META_VERIFY_TOKEN=valor-gerado-na-etapa-3
```

### 4.6 Obter META_CONFIG_ID (Embedded Signup)

1. Va em **WhatsApp** > **Embedded Signup**
2. Crie uma nova **configuracao** (ou use existente)
3. Configure as permissoes necessarias:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
4. O **Configuration ID** aparece na lista de configuracoes

```
META_CONFIG_ID=987654321098765
```

### 4.7 Configurar dominio no Facebook Login

1. Va em **Facebook Login** > **Configuracoes**
2. Em **URIs de redirecionamento OAuth validos**, adicione:
   - `https://SEU_DOMINIO`
3. Em **Dominios permitidos**, adicione:
   - `https://SEU_DOMINIO`

### 4.8 Modo do App

- Para **testes iniciais**: mantenha o app em **modo Desenvolvimento**
  - Apenas administradores/desenvolvedores do app podem usar
- Para **producao**: solicite **Verificacao do App** na Meta
  - Va em **Verificacao do App** > solicite as permissoes necessarias
  - O processo leva de dias a semanas

---

## Etapa 5: Configurar Secrets no GitHub

Para o CI/CD funcionar, adicione secrets no repositorio:

1. Va em **github.com/GuiRCosta/chatwpp** > **Settings** > **Secrets and variables** > **Actions**
2. Adicione os seguintes **Repository secrets**:

| Secret | Onde encontrar | Exemplo |
|--------|---------------|---------|
| `VPS_HOST` | IP ou dominio da VPS | `203.0.113.50` |
| `VPS_USER` | Usuario SSH da VPS | `deploy` |
| `VPS_SSH_KEY` | Chave privada SSH (veja abaixo) | `-----BEGIN OPENSSH...` |
| `GHCR_PAT` | GitHub PAT com `read:packages` (veja abaixo) | `ghp_xxxx...` |

### 5.1 Gerar chave SSH para deploy

```bash
# Na sua maquina local
ssh-keygen -t ed25519 -f ~/.ssh/zflow_deploy -C "zflow-deploy"

# Copiar chave publica para a VPS
ssh-copy-id -i ~/.ssh/zflow_deploy.pub user@SEU_IP

# O conteudo de ~/.ssh/zflow_deploy (chave PRIVADA) vai no secret VPS_SSH_KEY
cat ~/.ssh/zflow_deploy
```

### 5.2 Gerar GitHub PAT (Personal Access Token)

1. Va em **github.com** > **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
2. Clique em **"Generate new token (classic)"**
3. Selecione permissoes:
   - `read:packages`
   - `write:packages` (para push de imagens)
4. Copie o token gerado → cole no secret `GHCR_PAT`

### 5.3 Criar Environment "production"

1. Va em **Settings** > **Environments** > **New environment**
2. Nome: `production`
3. (Opcional) Adicione **Required reviewers** para aprovar deploys manualmente

---

## Etapa 6: Criar o .env na VPS

```bash
ssh user@SEU_IP
nano /opt/zflow/.env
```

Cole o conteudo abaixo, substituindo os valores:

```env
# Application
DOMAIN=zflow.seudominio.com
ACME_EMAIL=seu-email@exemplo.com

# PostgreSQL
POSTGRES_USER=zflow
POSTGRES_PASSWORD=VALOR_GERADO_ETAPA_3
POSTGRES_DB=zflow

# JWT
JWT_SECRET=VALOR_GERADO_ETAPA_3
JWT_REFRESH_SECRET=VALOR_GERADO_ETAPA_3

# Redis
REDIS_PASSWORD=VALOR_GERADO_ETAPA_3

# Meta / WhatsApp
META_APP_ID=VALOR_DA_ETAPA_4.2
META_APP_SECRET=VALOR_DA_ETAPA_4.3
META_VERIFY_TOKEN=VALOR_GERADO_ETAPA_3
META_CONFIG_ID=VALOR_DA_ETAPA_4.6

# Traefik Dashboard
# Lembre-se: duplique $ -> $$ no hash
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$05$$HASH_AQUI

# Registry (GHCR)
REGISTRY=ghcr.io/guircosta/
TAG=latest

# Primeiro deploy
RUN_MIGRATIONS=true
RUN_SEEDS=true

# Limites
USER_LIMIT=10
CONNECTIONS_LIMIT=5
MIN_SLEEP_BUSINESS_HOURS=1000
MAX_SLEEP_BUSINESS_HOURS=3000
```

> Apos o primeiro deploy, altere `RUN_SEEDS=false` para evitar dados duplicados.

---

## Etapa 7: Deploy

### Opcao A: Deploy automatico (CI/CD)

1. Faca push na branch `main`
2. GitHub Actions executa: **CI** → **Build & Push** → **Deploy**
3. Acompanhe em **Actions** no repositorio

### Opcao B: Deploy manual via GitHub

1. Va em **Actions** > **Deploy** > **Run workflow**
2. Selecione a tag (padrao: `main`)
3. Clique em **"Run workflow"**

### Opcao C: Deploy manual direto na VPS

```bash
ssh user@SEU_IP
cd /opt/zflow

# Login no registry
echo "SEU_GHCR_PAT" | docker login ghcr.io -u GuiRCosta --password-stdin

# Pull das imagens
docker pull ghcr.io/guircosta/zflow-backend:latest
docker pull ghcr.io/guircosta/zflow-frontend:latest

# Deploy
docker stack deploy -c docker-compose.yml zflow
```

---

## Etapa 8: Verificar o Deploy

### 8.1 Checar servicos

```bash
docker stack services zflow
# Todos devem mostrar 1/1 replicas
```

### 8.2 Checar logs

```bash
# Backend
docker service logs zflow_backend --tail 50 -f

# Frontend
docker service logs zflow_frontend --tail 50 -f

# Traefik
docker service logs zflow_traefik --tail 50 -f
```

### 8.3 Testar endpoints

```bash
# Health check
curl https://SEU_DOMINIO/api/health

# Frontend (deve retornar HTML)
curl -I https://SEU_DOMINIO
```

### 8.4 Testar WhatsApp (FBL)

1. Acesse `https://SEU_DOMINIO`
2. Faca login com o usuario seed (se rodou seeds)
3. Va em **Configuracoes** > **WhatsApp**
4. Clique em **"Conectar WhatsApp"**
5. Complete o fluxo de Embedded Signup
6. Envie uma mensagem de teste para o numero conectado

---

## Resumo das Variaveis

| Variavel | Origem | Obrigatoria |
|----------|--------|:-----------:|
| `DOMAIN` | Seu dominio | Sim |
| `ACME_EMAIL` | Seu email | Sim |
| `POSTGRES_PASSWORD` | `openssl rand -hex 32` | Sim |
| `JWT_SECRET` | `openssl rand -hex 64` | Sim |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 64` | Sim |
| `REDIS_PASSWORD` | `openssl rand -hex 32` | Sim |
| `META_APP_ID` | Meta Developers > App ID | Sim |
| `META_APP_SECRET` | Meta Developers > Configuracoes > Basico | Sim |
| `META_VERIFY_TOKEN` | `openssl rand -hex 32` (voce define) | Sim |
| `META_CONFIG_ID` | Meta Developers > WhatsApp > Embedded Signup | Sim |
| `TRAEFIK_DASHBOARD_AUTH` | `htpasswd -nB admin` | Sim |
| `VPS_HOST` | IP da VPS (GitHub Secret) | Sim |
| `VPS_USER` | Usuario SSH (GitHub Secret) | Sim |
| `VPS_SSH_KEY` | Chave privada SSH (GitHub Secret) | Sim |
| `GHCR_PAT` | GitHub PAT (GitHub Secret) | Sim |
| `RUN_MIGRATIONS` | `true` no primeiro deploy | Sim |
| `RUN_SEEDS` | `true` apenas no primeiro deploy | Sim |
