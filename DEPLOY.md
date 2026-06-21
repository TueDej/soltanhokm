# Deploying Soltan Hokm

## Prerequisites

- **Node.js 18+** and **Go 1.21+** (for building)
- A VPS with **Caddy** and **systemd**
- SSH access to the VPS

## 1. Build

From the project root on your local machine:

```bash
npm run build
cd server && go build -o soltanhokm-server .
```

This produces `dist/` (frontend) and `server/soltanhokm-server` (binary).

## 2. Upload

```bash
# Frontend files
scp -r dist/ root@YOUR_VPS:/var/www/soltanhokm/

# Server binary
scp server/soltanhokm-server root@YOUR_VPS:/opt/soltanhokm/
```

## 3. Server (systemd)

Copy the service file and start it:

```bash
scp soltanhokm.service root@YOUR_VPS:/etc/systemd/system/
ssh root@YOUR_VPS "systemctl daemon-reload && systemctl enable --now soltanhokm"
```

The server runs on port `5566` by default. To change it, edit the `PORT` variable in `soltanhokm.service`.

Verify it's running:

```bash
ssh root@YOUR_VPS "systemctl status soltanhokm"
```

## 4. Reverse Proxy (Caddy)

Copy the Caddyfile and edit the domain:

```bash
scp Caddyfile root@YOUR_VPS:/etc/caddy/Caddyfile
ssh root@YOUR_VPS "nano /etc/caddy/Caddyfile"  # update domain + certs
ssh root@YOUR_VPS "systemctl reload caddy"
```

The Caddyfile proxies all traffic (including WebSocket at `/ws`) to the Go server on `localhost:5566`, and serves static files from `/var/www/soltanhokm`.

## 5. Verify

1. Visit `https://YOUR_DOMAIN`
2. **Play vs 3 Bots** should work immediately (no server needed)
3. **Play Online** should create/join rooms via WebSocket
4. Open two browser tabs to test multiplayer

## Updating

To deploy a new version, repeat steps 1–2 (build + upload), then restart the server:

```bash
ssh root@YOUR_VPS "systemctl restart soltanhokm"
```

No Caddy restart is needed unless the Caddyfile changed.
