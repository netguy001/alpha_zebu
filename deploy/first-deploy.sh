#!/bin/bash
# ============================================================
#  AlphaSync — First-time deployment (run on server)
#  Usage: ssh deploy@YOUR_SERVER 'bash /opt/alphasync/deploy/first-deploy.sh'
# ============================================================
set -euo pipefail

APP_DIR="/opt/alphasync"
cd $APP_DIR

echo "=========================================="
echo "  AlphaSync — First Deployment"
echo "=========================================="

# ── Verify .env exists ──────────────────────────────────────
if [ ! -f .env ]; then
    echo "❌ ERROR: $APP_DIR/.env not found!"
    echo "   Copy deploy/.env.production to .env and fill in secrets first."
    exit 1
fi

# Validate critical secrets are set
source .env
for var in POSTGRES_PASSWORD JWT_SECRET_KEY BROKER_ENCRYPTION_KEY; do
    val="${!var:-}"
    if [ -z "$val" ] || [[ "$val" == *"CHANGE_ME"* ]]; then
        echo "❌ ERROR: $var is not set or still has default value in .env"
        exit 1
    fi
done

echo "→ .env validated"

# ── Login to GHCR ──────────────────────────────────────────
echo "→ Pulling images..."
docker compose -f docker-compose.prod.yml pull

# ── Start database first ───────────────────────────────────
echo "→ Starting database and redis..."
docker compose -f docker-compose.prod.yml up -d db redis
echo "  Waiting for DB to initialize..."
sleep 10

# ── Start backend ──────────────────────────────────────────
echo "→ Starting backend..."
docker compose -f docker-compose.prod.yml up -d backend
sleep 10

# ── Run database migrations ────────────────────────────────
echo "→ Running Alembic migrations..."
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# ── Start frontend + nginx ─────────────────────────────────
echo "→ Starting frontend and nginx..."
docker compose -f docker-compose.prod.yml up -d

# ── Verify ─────────────────────────────────────────────────
echo ""
echo "→ Checking services..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "  ✅ First deployment complete!"
echo "=========================================="
echo ""
echo "  Now run setup-ssl.sh to enable HTTPS"
echo ""
