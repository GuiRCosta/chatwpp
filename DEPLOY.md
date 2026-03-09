# ZFlow CRM - Guia de Deploy em Producao

Guia passo a passo para deploy do ZFlow em uma VPS com Docker Swarm e Traefik.

## Pre-requisitos

### VPS - Requisitos minimos

| Recurso | Minimo | Recomendado | Observacao |
|---------|--------|-------------|------------|
| **CPU** | 1 vCPU | 2+ vCPUs | Build das imagens consome bastante CPU temporariamente |
| **RAM** | 1 GB | 2 GB+ | ZFlow em idle usa ~72 MB; com carga pode chegar a ~1.4 GB (limites configurados) |
| **Disco** | 10 GB | 20 GB+ | Imagens Docker (~800 MB), banco de dados, uploads de midia, logs |
| **SO** | Ubuntu 22.04+ | Ubuntu 24.04 LTS | Qualquer Linux com Docker 24+ funciona |
| **Rede** | IP publico fixo | IP publico fixo | Necessario para DNS e webhook do Meta |

#### Consumo real medido (idle, sem usuarios)

| Servico | CPU | RAM | Limite RAM |
|---------|-----|-----|------------|
| Frontend (Nginx) | ~0% | ~5 MB | 128 MB |
| Backend (Node.js) | ~0.1% | ~42 MB | 512 MB |
| PostgreSQL | ~0.1% | ~21 MB | 512 MB |
| Redis | ~0.4% | ~4 MB | 256 MB |
| **Total ZFlow** | **~0.6%** | **~72 MB** | **1408 MB** |

> **Nota**: O build das imagens Docker precisa de ~1 GB de RAM temporariamente.
> Se a VPS tiver pouca RAM, considere adicionar swap (`fallocate -l 2G /swapfile`).

#### VPS compartilhada (com outros servicos)

Se a VPS tambem roda Traefik, Supabase, n8n, etc., some os recursos:

| Stack | RAM estimada |
|-------|-------------|
| Traefik | ~65 MB |
| ZFlow | ~72 MB (idle) / ~1.4 GB (limite) |
| Supabase | ~2 GB |
| n8n | ~450 MB |
| Portainer | ~60 MB |
| **Total estimado** | **~4 GB (idle) / ~6 GB (pico)** |

Para esse cenario, recomendamos **4 GB RAM / 2 vCPUs / 40 GB disco** no minimo.

### Software na VPS
- Docker 24+ instalado
- Docker Swarm inicializado (`docker swarm init`)
- Traefik rodando como reverse proxy na rede overlay `IdevaNet`

### DNS
- Registro A apontando o dominio para o IP da VPS (ex: `crm.seudominio.com -> IP`)
- Traefik configurado com cert resolver Let's Encrypt (nome: `letsencryptresolver`)
- Propagacao DNS pode levar ate 24h (verificar com `dig +short seudominio.com`)

### Meta / WhatsApp Business API
- App ID, App Secret e Configuration ID do Facebook Developers Console
- Conta verificada no Meta Business Suite

---

## Arquitetura

O Traefik faz todo o roteamento por path. O nginx so serve arquivos estaticos da SPA.

```
Internet
   |
Traefik (HTTPS :443) ── rede: IdevaNet
   |
   ├── /api/*       → strip /api → Backend :7563 (API REST)
   ├── /socket.io/* →              Backend :7563 (WebSocket)
   ├── /webhook     →              Backend :7563 (Meta webhook)
   ├── /health      →              Backend :7563 (health check)
   ├── /public/*    →              Backend :7563 (uploads/midia)
   ├── /admin/queues→              Backend :7563 (Bull Board)
   └── /* (fallback)→              Frontend :8080 (SPA React)

Backend (Node.js :7563) ── redes: IdevaNet + zflow-internal
   |
   ├── PostgreSQL 15 ── rede: zflow-internal (alias: zflow-db)
   └── Redis 7 ──────── rede: zflow-internal (alias: zflow-redis)

Frontend (Nginx :8080) ── rede: IdevaNet
   └── Serve apenas arquivos estaticos (HTML/JS/CSS)
```

### Roteamento Traefik

| Path | Destino | Prioridade | Middleware |
|------|---------|------------|------------|
| `/api/*` | Backend :7563 | 20 | stripprefix `/api` |
| `/socket.io/*` | Backend :7563 | 20 | - |
| `/webhook` | Backend :7563 | 20 | - |
| `/health` | Backend :7563 | 20 | - |
| `/public/*` | Backend :7563 | 20 | - |
| `/admin/queues` | Backend :7563 | 20 | - |
| `/*` (fallback) | Frontend :8080 | 10 | security headers |

> Rotas mais especificas (prioridade 20) sao avaliadas primeiro.
> Tudo que nao casa com nenhuma rota vai pro frontend (prioridade 10) que serve a SPA.

### Redes Docker

| Rede | Tipo | Servicos |
|------|------|----------|
| `IdevaNet` | external overlay | Traefik, frontend, backend |
| `zflow-internal` | overlay | postgres, redis, backend |

> **Importante**: Os servicos postgres e redis usam aliases unicos (`zflow-db`, `zflow-redis`)
> para evitar colisao DNS com outros stacks na mesma rede IdevaNet (ex: Supabase).

---

## Passo 1: Preparar a VPS

### Instalar Docker (se necessario)

```bash
curl -fsSL https://get.docker.com | sh
```

### Inicializar Docker Swarm (se necessario)

```bash
docker swarm init
```

### Verificar rede Traefik

```bash
docker network ls | grep IdevaNet
```

Se a rede nao existir:
```bash
docker network create --driver overlay --attachable IdevaNet
```

---

## Passo 2: Copiar arquivos para a VPS

```bash
# Criar diretorio
ssh usuario@VPS_IP 'mkdir -p /opt/zflow'

# Copiar arquivos necessarios
scp -r backend/ usuario@VPS_IP:/opt/zflow/backend/
scp -r frontend/ usuario@VPS_IP:/opt/zflow/frontend/
scp docker-compose.yml usuario@VPS_IP:/opt/zflow/
scp .env.example usuario@VPS_IP:/opt/zflow/
```

Arquivos que devem estar presentes:

```
/opt/zflow/
  ├── .env                       # configuracao (criado no passo 3)
  ├── docker-compose.yml         # compose de producao
  ├── backend/
  │   ├── Dockerfile
  │   ├── package.json
  │   ├── package-lock.json
  │   ├── tsconfig.json
  │   ├── .sequelizerc
  │   ├── entrypoint.sh
  │   └── src/
  └── frontend/
      ├── Dockerfile
      ├── nginx.conf
      ├── package.json
      ├── package-lock.json
      ├── tsconfig.json
      └── src/
```

---

## Passo 3: Configurar variaveis de ambiente

```bash
ssh usuario@VPS_IP
cd /opt/zflow
cp .env.example .env
```

Editar `.env` com os valores de producao:

```bash
nano .env
```

### Variaveis obrigatorias

```env
# Dominio (sem https://)
DOMAIN=crm.seudominio.com
ACME_EMAIL=admin@seudominio.com

# PostgreSQL
POSTGRES_USER=zflow
POSTGRES_PASSWORD=<gerar com: openssl rand -hex 32>
POSTGRES_DB=zflow

# JWT (gerar secrets unicos)
JWT_SECRET=<gerar com: openssl rand -hex 64>
JWT_REFRESH_SECRET=<gerar com: openssl rand -hex 64>

# Redis
REDIS_PASSWORD=<gerar com: openssl rand -hex 32>

# Meta / WhatsApp Business API
META_APP_ID=<seu app id>
META_APP_SECRET=<seu app secret>
META_VERIFY_TOKEN=<gerar com: openssl rand -hex 32>
META_CONFIG_ID=<seu config id>

# Primeiro deploy
RUN_MIGRATIONS=true
RUN_SEEDS=true
```

### Gerar todos os secrets de uma vez

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -hex 32)"
echo "JWT_SECRET=$(openssl rand -hex 64)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)"
echo "REDIS_PASSWORD=$(openssl rand -hex 32)"
echo "META_VERIFY_TOKEN=$(openssl rand -hex 32)"
```

---

## Passo 4: Build das imagens Docker

```bash
cd /opt/zflow

# Build backend
docker build -t zflow-backend:latest -f backend/Dockerfile backend/

# Build frontend
docker build -t zflow-frontend:latest -f frontend/Dockerfile frontend/
```

> O build do backend pode emitir warnings de TypeScript. Isso e esperado
> e nao impede o funcionamento (`npm run build || true` no Dockerfile).

---

## Passo 5: Deploy

```bash
cd /opt/zflow

# Carregar variaveis de ambiente e fazer deploy
set -a && source .env && set +a
docker stack deploy -c docker-compose.yml zflow
```

### Verificar status

```bash
# Todos os servicos devem estar 1/1
docker service ls --filter name=zflow
```

Saida esperada:
```
NAME             REPLICAS   IMAGE
zflow_backend    1/1        zflow-backend:latest
zflow_frontend   1/1        zflow-frontend:latest
zflow_postgres   1/1        postgres:15-alpine
zflow_redis      1/1        redis:7-alpine
```

### Aguardar convergencia

Os servicos podem levar ate 60s para ficarem prontos (migrations + seeds no primeiro deploy).

```bash
# Acompanhar logs do backend
docker service logs -f zflow_backend

# Verificar se o backend esta saudavel
curl -s https://SEU_DOMINIO/health
# Deve retornar: {"status":"ok","timestamp":"..."}
```

---

## Passo 6: Verificar endpoints

| Endpoint | Status esperado | Descricao |
|----------|-----------------|-----------|
| `https://DOMINIO/` | 200 | SPA React (homepage/login) |
| `https://DOMINIO/login` | 200 | SPA (qualquer rota client-side) |
| `https://DOMINIO/health` | 200 | Health check backend (Traefik → Backend) |
| `https://DOMINIO/api/health` | 200 | API health (Traefik strip /api → Backend) |
| `https://DOMINIO/webhook` | 403 | Webhook Meta (requer token verificacao) |

```bash
# Testar tudo de uma vez
curl -s -o /dev/null -w "Homepage:     %{http_code}\n" https://DOMINIO/
curl -s -o /dev/null -w "Health:       %{http_code}\n" https://DOMINIO/health
curl -s -o /dev/null -w "API health:   %{http_code}\n" https://DOMINIO/api/health
curl -s -o /dev/null -w "Webhook:      %{http_code}\n" https://DOMINIO/webhook

# Testar login
curl -s -X POST https://DOMINIO/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nuvio.com","password":"admin123"}'
# Deve retornar: {"success":true,"data":{"token":"...","user":{...}}}
```

### Credenciais padrao (criadas pelo seed)

- **Email**: `admin@nuvio.com`
- **Senha**: `admin123`

> Troque a senha apos o primeiro login.

---

## Atualizacao via Git (deploy de atualizacoes)

### Flags obrigatorias

| Flag | Motivo |
|------|--------|
| `docker builder prune -af` | Limpa cache do BuildKit. Sem isso, `--no-cache` ainda usa layers cacheadas e o build completa em <1s sem aplicar mudancas |
| `--no-cache` | Forca rebuild de todas as layers do Dockerfile |
| `--no-resolve-image` | Impede que Docker Swarm puxe imagem do GHCR (stale). Forca uso da imagem local recem-construida |

> **CRITICO**: Sem `--no-resolve-image`, o Swarm ignora a imagem local e puxa do GHCR (que nao tem permissao de push, entao esta desatualizada). Sem `docker builder prune -af`, o BuildKit usa cache antigo mesmo com `--no-cache`.

### Atualizar apenas o backend

```bash
sshpass -p 'SENHA' ssh -o StrictHostKeyChecking=no root@72.61.25.109 \
  'cd /opt/nuvio && git pull origin main && \
   docker builder prune -af && \
   docker compose build --no-cache backend && \
   docker service update --no-resolve-image --image ghcr.io/guircosta/zflow-backend:main --force nuvio_backend'
```

### Atualizar apenas o frontend

> **IMPORTANTE**: O frontend usa `docker build` com `--build-arg` explicito (nao `docker compose build`).
> O `docker compose build` tem um bug com BuildKit que nao passa os build args de env vars corretamente,
> resultando em `VITE_META_APP_ID` vazio no bundle.

```bash
sshpass -p 'SENHA' ssh -o StrictHostKeyChecking=no root@72.61.25.109 \
  'cd /opt/nuvio && git pull origin main && \
   source .env && \
   docker builder prune -af && \
   docker build --no-cache \
     --build-arg VITE_META_APP_ID=$META_APP_ID \
     --build-arg VITE_META_CONFIG_ID=$META_CONFIG_ID \
     -t ghcr.io/guircosta/zflow-frontend:main ./frontend && \
   docker service update --no-resolve-image --image ghcr.io/guircosta/zflow-frontend:main --force nuvio_frontend'
```

### Atualizar ambos (comando unico)

Quando ambos precisam ser atualizados, use `git reset --hard` para evitar conflito do segundo `git pull`:

```bash
sshpass -p 'SENHA' ssh -o StrictHostKeyChecking=no root@72.61.25.109 \
  'cd /opt/nuvio && git reset --hard origin/main && git pull origin main && \
   source .env && \
   docker builder prune -af && \
   docker compose build --no-cache backend && \
   docker build --no-cache \
     --build-arg VITE_META_APP_ID=$META_APP_ID \
     --build-arg VITE_META_CONFIG_ID=$META_CONFIG_ID \
     -t ghcr.io/guircosta/zflow-frontend:main ./frontend && \
   docker service update --no-resolve-image --image ghcr.io/guircosta/zflow-backend:main --force nuvio_backend && \
   docker service update --no-resolve-image --image ghcr.io/guircosta/zflow-frontend:main --force nuvio_frontend'
```

### Verificacao pos-deploy

```bash
# Status dos services (todos devem estar 1/1)
sshpass -p 'SENHA' ssh root@72.61.25.109 'docker service ls | grep nuvio'

# Logs do backend (ultimas 20 linhas)
sshpass -p 'SENHA' ssh root@72.61.25.109 'docker service logs nuvio_backend --tail 20'

# Health check
curl -s https://crm.ideva.ai/api/health | jq
```

Procurar nos logs:
- `Nuvio backend running on port 7563` — OK
- `Redis connected` — OK
- `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` — Falta `trust proxy` no app.ts
- `Seeds skipped (may already exist)` — Normal, seeds ja foram aplicados

### Troubleshooting de atualizacao

| Problema | Causa | Solucao |
|----------|-------|---------|
| Build completa em <1s | BuildKit usou cache stale | Executar `docker builder prune -af` antes |
| `git pull` falha com "local changes" | Deploy anterior fez pull parcial | Usar `git reset --hard origin/main` |
| Service nao atualiza | Swarm puxou imagem antiga do GHCR | Verificar se usou `--no-resolve-image` |
| 504 Gateway Timeout | `express-rate-limit` crashando | Verificar `app.set("trust proxy", 1)` no app.ts |
| `Refresh token not provided` | Sessao expirou | Normal — usuario precisa fazer login novamente |
| `VITE_META_APP_ID` vazio no bundle | `docker compose build` nao passa build args | Usar `docker build --build-arg` explicito (ver comando do frontend acima) |
| FB popup "JSSDK nao ativada" | App ID errado no bundle | Verificar `grep -o APP_ID /assets/*.js` dentro do container |

---

## Operacoes comuns

### Rodar migrations manualmente

```bash
BACKEND_ID=$(docker ps --filter name=zflow_backend -q | head -1)
docker exec $BACKEND_ID npx sequelize db:migrate
```

### Ver logs

```bash
# Backend (ultimas 100 linhas)
docker service logs zflow_backend --tail 100

# Frontend (nginx)
docker service logs zflow_frontend --tail 50

# Seguir logs em tempo real
docker service logs -f zflow_backend
```

### Reiniciar um servico

```bash
docker service update --force zflow_backend
```

### Escalar (mais replicas)

```bash
docker service scale zflow_backend=2
```

### Remover stack completo

```bash
docker stack rm zflow

# Volumes sao preservados! Para remover dados tambem:
docker volume rm zflow_postgres_data zflow_redis_data zflow_backend_uploads zflow_backend_public zflow_backend_logs
```

---

## Redeploy completo (do zero)

Se precisar refazer tudo:

```bash
# 1. Remover stack
docker stack rm zflow

# 2. Aguardar remocao completa (10-15s)
sleep 15
docker service ls --filter name=zflow   # deve retornar vazio

# 3. Rebuild imagens
cd /opt/zflow
docker build -t zflow-backend:latest -f backend/Dockerfile backend/
docker build -t zflow-frontend:latest -f frontend/Dockerfile frontend/

# 4. Deploy novamente
set -a && source .env && set +a
docker stack deploy -c docker-compose.yml zflow
```

---

## Backup do banco de dados

### Criar backup

```bash
POSTGRES_ID=$(docker ps --filter name=zflow_postgres -q | head -1)
docker exec $POSTGRES_ID pg_dump -U zflow zflow > /opt/zflow/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
POSTGRES_ID=$(docker ps --filter name=zflow_postgres -q | head -1)
cat backup_arquivo.sql | docker exec -i $POSTGRES_ID psql -U zflow zflow
```

---

## Troubleshooting

### Servico nao sobe (0/1)

```bash
# Ver detalhes do erro
docker service ps zflow_SERVICO --no-trunc

# Ver logs do container que falhou
docker service logs zflow_SERVICO --tail 50
```

### Backend: "password authentication failed"

Se o backend esta em multiplas redes (IdevaNet + zflow-internal), o DNS pode resolver
`postgres` para outro servico de outro stack. Por isso usamos aliases unicos
`zflow-db` e `zflow-redis` em vez dos nomes genericos.

Verificar:
```bash
BACKEND_ID=$(docker ps --filter name=zflow_backend -q | head -1)
docker exec $BACKEND_ID wget -qO- http://zflow-db:5432 2>&1 | head -1
```

### API retorna "Token not provided" para rotas publicas

O Traefik precisa do middleware `stripprefix` para remover `/api` antes de encaminhar
ao backend. Verificar se as labels do backend no compose estao corretas:

```bash
docker service inspect zflow_backend --format '{{json .Spec.Labels}}' | python3 -m json.tool
```

### Certificado SSL nao emitido

```bash
# Verificar Traefik logs
docker service logs traefik_traefik --tail 50 2>&1 | grep -i "crm"

# Verificar DNS
dig +short crm.seudominio.com
# Deve retornar o IP da VPS
```

### Container reiniciando em loop

```bash
# Ver historico de tasks
docker service ps zflow_SERVICO

# Se muitos "Failed" com "non-zero exit (1)":
docker service logs zflow_SERVICO --tail 100
```

---

## Portas e recursos

| Servico | Porta interna | Memoria (limite) | Memoria (reserva) |
|---------|---------------|-------------------|--------------------|
| PostgreSQL | 5432 | 512M | 256M |
| Redis | 6379 | 256M | 64M |
| Backend | 7563 | 512M | 256M |
| Frontend | 8080 | 128M | 64M |
| **Total** | | **1408M** | **640M** |

> Nenhuma porta e exposta diretamente na VPS. Todo acesso externo passa pelo Traefik (443).

---

## Checklist de deploy

- [ ] DNS apontando para o IP da VPS
- [ ] Docker e Docker Swarm ativos
- [ ] Rede `IdevaNet` existe com Traefik rodando
- [ ] Arquivos copiados para `/opt/zflow/`
- [ ] `.env` configurado com secrets gerados
- [ ] Imagens buildadas com sucesso
- [ ] `docker stack deploy` executado com `.env` carregado (`set -a && source .env`)
- [ ] Todos os servicos em 1/1
- [ ] `https://DOMINIO/health` retorna 200
- [ ] `https://DOMINIO/api/health` retorna 200
- [ ] `https://DOMINIO/` carrega a SPA
- [ ] Login funciona com `admin@zflow.com` / `admin123`
- [ ] Certificado SSL valido (Let's Encrypt)
- [ ] `RUN_MIGRATIONS=false` e `RUN_SEEDS=false` no `.env` apos primeiro deploy
