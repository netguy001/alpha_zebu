#!/bin/bash
# ============================================================
#  AlphaSync — SSL Certificate Setup (Let's Encrypt)
#  Run AFTER DNS is pointing to the server
#  Usage: bash /opt/alphasync/deploy/setup-ssl.sh
# ============================================================
set -euo pipefail

DOMAIN="www.alphasync.app"
DOMAIN_ALT="alphasync.app"
APP_DIR="/opt/alphasync"
EMAIL="admin@alphasync.app"  # Change to your email

echo "=========================================="
echo "  AlphaSync — SSL Setup"
echo "=========================================="

# ── Step 1: Start with HTTP-only nginx for ACME challenge ───
echo "→ Creating temporary HTTP-only nginx config..."
cp $APP_DIR/deploy/nginx/prod.conf $APP_DIR/deploy/nginx/prod.conf.bak
cat > $APP_DIR/deploy/nginx/prod.conf <<'HTTPCONF'
server {
    listen 80;
    server_name alphasync.app www.alphasync.app;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'AlphaSync — SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
HTTPCONF

# ── Step 2: Start nginx + certbot containers ────────────────
echo "→ Starting nginx for ACME challenge..."
cd $APP_DIR
docker compose -f docker-compose.prod.yml up -d nginx

# Wait for nginx to be ready
sleep 5

# ── Step 3: Obtain SSL certificate ─────────────────────────
echo "→ Requesting SSL certificate from Let's Encrypt..."
docker compose -f docker-compose.prod.yml run --rm certbot \
    certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d $DOMAIN_ALT

# ── Step 4: Restore full production nginx config ────────────
echo "→ Restoring production nginx config with SSL..."
# The deploy workflow copies the full prod.conf, but for first-time setup
# we need to re-copy it from the checked-out repo
if [ -f $APP_DIR/deploy/nginx/prod.conf.bak ]; then
    mv $APP_DIR/deploy/nginx/prod.conf.bak $APP_DIR/deploy/nginx/prod.conf
fi

# ── Step 5: Restart everything ──────────────────────────────
echo "→ Starting all services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "=========================================="
echo "  ✅ SSL setup complete!"
echo "=========================================="
echo ""
echo "  https://$DOMAIN is now live"
echo "  Certificates will auto-renew via certbot container"
echo ""
