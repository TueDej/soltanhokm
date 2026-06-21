# Deploy guide — Soltan Hokm (Go backend + React frontend)
#
# Prerequisites on VPS:
#   - Go 1.21+ (for building server, or build locally and upload binary)
#   - Caddy (reverse proxy + static file serving)
#   - Node.js 18+ only needed for local build

# ============================================
# 1. BUILD (local machine)
# ============================================
npm run build            # creates dist/
cd server
go build -o soltanhokm-server .
cd ..

# ============================================
# 2. UPLOAD TO VPS
# ============================================
scp -r dist/ root@your-vps:/var/www/soltanhokm/
scp server/soltanhokm-server root@your-vps:/opt/soltanhokm/

# ============================================
# 3. CADDY CONFIGURATION
# ============================================
# Copy Caddyfile to /etc/caddy/Caddyfile on the VPS.
# Replace 'yourdomain.com' with your actual domain.
#
# The config:
#   - Serves React frontend from /var/www/soltanhokm
#   - Proxies WebSocket connections to Go server on port 5566

sudo cp Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile    # edit domain name
sudo systemctl reload caddy

# ============================================
# 4. SYSTEMD SERVICE (Go server)
# ============================================
# Copy soltanhokm.service to /etc/systemd/system/

sudo cp soltanhokm.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable soltanhokm
sudo systemctl start soltanhokm

# Check status:
sudo systemctl status soltanhokm

# ============================================
# 5. VERIFY
# ============================================
# - Visit https://yourdomain.com
# - "Play vs Bots" works (local mode, no server needed)
# - "Play Online" creates/joins rooms via WebSocket
# - Open two browser tabs to test multiplayer
