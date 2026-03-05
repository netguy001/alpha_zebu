# AlphaSync — Contabo VPS Deployment Guide

## Prerequisites

- A Contabo VPS (Ubuntu 22.04 or 24.04 recommended, minimum 2 vCPU / 4GB RAM)
- Domain `alphasync.app` + `www.alphasync.app` pointing to your server's IP (A records in DNS)
- SSH access to the server as root

---

## Step 1: Initial Server Setup

From your **local machine**, run the setup script against the server:

```bash
ssh root@YOUR_SERVER_IP 'bash -s' < deploy/setup-server.sh
```

This installs Docker, creates a `deploy` user, configures UFW firewall (SSH/HTTP/HTTPS only), installs fail2ban, and creates 2GB swap.

After this, SSH in as the deploy user:

```bash
ssh deploy@YOUR_SERVER_IP
```

---

## Step 2: Upload the Project

From your **local machine**, copy the project to the server:

```bash
# Option A: Git clone (recommended)
ssh deploy@YOUR_SERVER_IP "git clone https://github.com/netguy001/alphasync.git /opt/alphasync"

# Option B: rsync from local
rsync -avz --exclude node_modules --exclude __pycache__ --exclude .git \
  ./ deploy@YOUR_SERVER_IP:/opt/alphasync/
```

---

## Step 3: Configure Environment Variables

On the **server**:

```bash
cd /opt/alphasync

# Copy the production env template
cp deploy/.env.production .env

# Edit and fill in your secrets
nano .env
```

**You MUST change these values:**

| Variable | How to generate |
|---|---|
| `POSTGRES_PASSWORD` | `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `REDIS_PASSWORD` | `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `JWT_SECRET_KEY` | `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `BROKER_ENCRYPTION_KEY` | `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` |

Also fill in your Zebu/MYNT API credentials (`ZEBU_API_SECRET`, `ZEBU_VENDOR_CODE`).

---

## Step 4: Build and Start Services

**Option A — Build images locally on the server:**

```bash
cd /opt/alphasync

# Build backend image
docker build -t ghcr.io/netguy001/alphasync-backend:latest ./backend

# Build frontend image
docker build -t ghcr.io/netguy001/alphasync-frontend:latest ./frontend

# Run the first deploy script
bash deploy/first-deploy.sh
```

**Option B — Pull pre-built images from GHCR** (if you have CI/CD pushing images):

```bash
cd /opt/alphasync
bash deploy/first-deploy.sh
```

The first-deploy script will:
1. Validate your `.env` secrets
2. Pull/start PostgreSQL and Redis
3. Start the backend and run Alembic database migrations
4. Start the frontend and nginx

---

## Step 5: Setup SSL (HTTPS)

**Only run this after DNS is pointing to your server** (check with `dig www.alphasync.app`):

```bash
bash deploy/setup-ssl.sh
```

This will:
1. Temporarily switch nginx to HTTP-only mode
2. Obtain a Let's Encrypt SSL certificate for `alphasync.app` and `www.alphasync.app`
3. Restore the full SSL nginx config
4. Restart all services

After this, your site is live at **https://www.alphasync.app**

---

## Step 6: Verify

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check backend health
curl -s http://localhost:8000/api/health | python3 -m json.tool

# Check logs if something is wrong
docker compose -f docker-compose.prod.yml logs backend --tail 50
docker compose -f docker-compose.prod.yml logs nginx --tail 50
docker compose -f docker-compose.prod.yml logs db --tail 50
```

---

## Updating the Application

After pushing new code:

```bash
cd /opt/alphasync

# Pull latest code
git pull

# Rebuild images
docker build -t ghcr.io/netguy001/alphasync-backend:latest ./backend
docker build -t ghcr.io/netguy001/alphasync-frontend:latest ./frontend

# Run migrations and restart
docker compose -f docker-compose.prod.yml up -d backend
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose -f docker-compose.prod.yml up -d
```

---

## Useful Commands

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# Restart a specific service
docker compose -f docker-compose.prod.yml restart backend

# Enter the backend container
docker compose -f docker-compose.prod.yml exec backend bash

# Run Alembic migrations manually
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Connect to PostgreSQL
docker compose -f docker-compose.prod.yml exec db psql -U alphasync

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop everything AND delete data (DANGEROUS)
docker compose -f docker-compose.prod.yml down -v

# Renew SSL certificates manually
docker compose -f docker-compose.prod.yml exec certbot certbot renew

# View disk usage
docker system df
```

---

## Architecture (Production)

```
Internet
  │
  ▼
┌─────────────────┐
│  Nginx (:80/443)│  ← SSL termination, rate limiting
│  reverse proxy   │
└────┬────┬───────┘
     │    │
     ▼    ▼
┌────────┐ ┌──────────┐
│Frontend│ │ Backend  │
│ :80    │ │ :8000    │  ← gunicorn + 2 uvicorn workers
└────────┘ └──┬───┬───┘
              │   │
              ▼   ▼
         ┌──────┐ ┌───────┐
         │ PG16 │ │ Redis │
         │:5432 │ │ :6379 │
         └──────┘ └───────┘
```

All services are on an internal Docker network. Only nginx ports 80/443 are exposed to the internet.
