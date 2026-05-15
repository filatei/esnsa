# DEPLOYMENT GUIDE
## ESNSA Portal — esnsa.torama.money
## Server: Linode Ubuntu | Docker Compose | User: esnsa
## App root: /opt/esnsa/

---

## ARCHITECTURE

```
Internet → Apache (port 80/443)
             ├── Static files  → /var/www/esnsa/dist/   (React build)
             └── /api/*        → localhost:3031          (Docker proxy)

Docker (esnsa_net private network):
  esnsa-api   Node.js 20   :3031 (localhost only)
  esnsa-db    Postgres 14  (internal only)

Volumes:
  esnsa_pgdata   → Postgres data
  esnsa_uploads  → Uploaded reports/documents
```

---

## PHASE 1 — SERVER PREREQUISITES

```bash
# Verify Docker is installed
docker --version
docker compose version   # Need v2+

# Verify Apache is running
apache2 -v
sudo systemctl status apache2

# Verify Node is available (for frontend build only)
node --version   # 18+
npm --version
```

---

## PHASE 2 — CREATE THE esnsa USER

```bash
# Create system user
sudo adduser --disabled-password --gecos "" esnsa

# Add to docker group so esnsa can run containers
sudo usermod -aG docker esnsa

# Create app directory owned by esnsa
sudo mkdir -p /opt/esnsa
sudo chown esnsa:esnsa /opt/esnsa

# Create web root for frontend
sudo mkdir -p /var/www/esnsa/dist
sudo chown esnsa:esnsa /var/www/esnsa

# Create log directory
sudo mkdir -p /var/log/esnsa
sudo chown esnsa:esnsa /var/log/esnsa
```

---

## PHASE 3 — CLONE REPO + CONFIGURE ENV

```bash
# Switch to esnsa user
sudo -u esnsa -s

# Clone the repo into /opt/esnsa
git clone https://github.com/filatei/esnsa.git /opt/esnsa
cd /opt/esnsa

# Create the .env file from example
cp backend/.env.example .env
nano .env
```

Fill in the real values in `.env`:

```env
PORT=3031
NODE_ENV=production

DB_HOST=db
DB_PORT=5432
DB_NAME=esnsa_db
DB_USER=esnsa_user
DB_PASSWORD=CHOOSE_A_STRONG_PASSWORD

JWT_SECRET=GENERATE_A_64_CHAR_RANDOM_STRING
JWT_EXPIRES_IN=8h

ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE

UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10mb
```

Generate a strong JWT secret:
```bash
openssl rand -hex 64
```

---

## PHASE 4 — START DOCKER CONTAINERS

```bash
cd /opt/esnsa

# Build the API image and start all containers
docker compose up -d --build

# Verify containers are running
docker compose ps

# Check API health
curl http://localhost:3031/api/health
# Expected: {"status":"ok","service":"ESNSA-API",...}

# View logs
docker compose logs -f api
docker compose logs -f db
```

The schema runs automatically on first start via `docker-entrypoint-initdb.d/`.

---

## PHASE 5 — SEED THE DATABASE

```bash
cd /opt/esnsa

# Generate seed.sql with real bcrypt hashes (run on host with Node)
node backend/db/generate_seed.js

# Load seed data into the running DB container
docker compose exec -T db psql -U esnsa_user -d esnsa_db < backend/db/seed.sql

# Verify users loaded
docker compose exec db psql -U esnsa_user -d esnsa_db -c "SELECT officer_id, role FROM users;"
```

---

## PHASE 6 — BUILD + DEPLOY FRONTEND

```bash
cd /opt/esnsa/frontend

# Install dependencies
npm install

# Set production API URL
echo "VITE_API_BASE=https://esnsa.torama.money/api" > .env.production

# Build
npm run build

# Copy to Apache web root
cp -r dist/* /var/www/esnsa/dist/
```

---

## PHASE 7 — APACHE VIRTUAL HOST

Create file: `/etc/apache2/sites-available/esnsa.torama.money.conf`

```apache
<VirtualHost *:80>
    ServerName esnsa.torama.money
    DocumentRoot /var/www/esnsa/dist

    <Directory /var/www/esnsa/dist>
        Options -Indexes
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>

    # Proxy API to Docker container (port bound to 127.0.0.1)
    ProxyPreserveHost On
    ProxyPass        /api/     http://127.0.0.1:3031/api/
    ProxyPassReverse /api/     http://127.0.0.1:3031/api/
    ProxyPass        /uploads/ http://127.0.0.1:3031/uploads/
    ProxyPassReverse /uploads/ http://127.0.0.1:3031/uploads/

    ErrorLog  ${APACHE_LOG_DIR}/esnsa_error.log
    CustomLog ${APACHE_LOG_DIR}/esnsa_access.log combined
</VirtualHost>
```

```bash
sudo a2enmod proxy proxy_http rewrite headers
sudo a2ensite esnsa.torama.money.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

---

## PHASE 8 — SSL / HTTPS

```bash
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d esnsa.torama.money
```

---

## PHASE 9 — SECURITY

```bash
# .env must NOT be readable by others
chmod 600 /opt/esnsa/.env

# Port 3031 must NOT be open externally (Docker binds to 127.0.0.1)
sudo ufw status
# Only 22, 80, 443 should be open
```

---

## MAINTENANCE COMMANDS

```bash
# Restart API after code change
cd /opt/esnsa
git pull
docker compose up -d --build api

# Rebuild frontend after code change
cd /opt/esnsa/frontend
npm run build
cp -r dist/* /var/www/esnsa/dist/

# View live API logs
docker compose logs -f api

# Database backup
docker compose exec db pg_dump -U esnsa_user esnsa_db > backup_$(date +%F).sql

# Stop everything
docker compose down

# Stop and wipe database (destructive!)
docker compose down -v
```

---

## DNS SETUP

At your domain registrar for torama.money:
```
Type:  A
Name:  esnsa
Value: [Linode server IP]
TTL:   3600
```

Verify:
```bash
dig esnsa.torama.money
```
