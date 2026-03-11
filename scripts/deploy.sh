#!/usr/bin/env bash
set -euo pipefail

# Nuvio CRM - Deploy Script
# Uso: ./scripts/deploy.sh [backend|frontend|all]
#
# Resolve problemas conhecidos do Docker Swarm + BuildKit:
# 1. docker compose build nao passa build args corretamente
# 2. docker tag com BuildKit cria manifests duplicados
# 3. Swarm fixa digest antigo e ignora tags atualizados

COMPONENT="${1:-all}"
DEPLOY_DIR="/opt/nuvio"

cd "$DEPLOY_DIR"

source .env

BACKEND_IMAGE="ghcr.io/guircosta/zflow-backend:main"
FRONTEND_TAG="nuvio-frontend-build"
FRONTEND_IMAGE="ghcr.io/guircosta/zflow-frontend:main"

log() {
  echo "[deploy] $(date '+%H:%M:%S') $*"
}

deploy_backend() {
  log "Building backend..."
  docker builder prune -af >/dev/null 2>&1
  docker compose build --no-cache backend
  log "Deploying backend..."
  docker service update --no-resolve-image --image "$BACKEND_IMAGE" --force nuvio_backend
  log "Backend deployed."
}

deploy_frontend() {
  log "Building frontend with VITE_META_APP_ID=$META_APP_ID..."
  docker builder prune -af >/dev/null 2>&1

  # Build com tag unica (evita conflito de manifests BuildKit)
  docker build --no-cache \
    --build-arg VITE_META_APP_ID="$META_APP_ID" \
    --build-arg VITE_META_CONFIG_ID="$META_CONFIG_ID" \
    -t "$FRONTEND_TAG" ./frontend

  # Verificar se o App ID esta no bundle
  if ! docker run --rm "$FRONTEND_TAG" sh -c "grep -q '$META_APP_ID' /usr/share/nginx/html/assets/*.js"; then
    log "ERRO: META_APP_ID nao encontrado no bundle. Abortando deploy."
    exit 1
  fi
  log "App ID verificado no bundle."

  # Remover imagens antigas do frontend para evitar conflito de digest
  docker rmi "$FRONTEND_IMAGE" 2>/dev/null || true
  docker image prune -f >/dev/null 2>&1

  # Atualizar servico usando a tag unica diretamente
  log "Deploying frontend..."
  docker service update --no-resolve-image --image "$FRONTEND_TAG" --force nuvio_frontend

  # Verificar container rodando
  sleep 10
  local container_id
  container_id=$(docker ps --filter name=nuvio_frontend -q | head -1)
  if [ -z "$container_id" ]; then
    log "ERRO: Container frontend nao encontrado."
    exit 1
  fi

  if docker exec "$container_id" sh -c "grep -q '$META_APP_ID' /usr/share/nginx/html/assets/*.js"; then
    log "Frontend deployed e verificado com sucesso."
  else
    log "ERRO: Container rodando com App ID incorreto!"
    exit 1
  fi
}

log "Pulling latest code..."
git pull origin main || { git reset --hard origin/main && git pull origin main; }

case "$COMPONENT" in
  backend)
    deploy_backend
    ;;
  frontend)
    deploy_frontend
    ;;
  all)
    deploy_backend
    deploy_frontend
    ;;
  *)
    echo "Uso: $0 [backend|frontend|all]"
    exit 1
    ;;
esac

log "Deploy concluido."
