#!/bin/bash
set -e

# Soltan Hokm — VPS Installer
# Run from the project root: sudo bash install.sh
# Local dev: bash install.sh --dev

DEV_MODE=false
if [[ "$1" == "--dev" ]]; then
  DEV_MODE=true
fi

if [ "$EUID" -ne 0 ] && [ "$DEV_MODE" = false ]; then
  echo "Error: run with sudo — sudo bash install.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Soltan Hokm Installer ==="

# --- Check requirements ---
for cmd in node npm go; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd is not installed."
    exit 1
  fi
done

# --- Build frontend ---
echo "Building frontend..."
if [ "$DEV_MODE" = true ]; then
  npm install && npm run build
else
  SUDO_USER="${SUDO_USER:-root}"
  su -l "$SUDO_USER" -c "cd $SCRIPT_DIR && npm install && npm run build"
fi

# --- Build server ---
echo "Building server..."
cd server
go build -o soltanhokm-server .
cd "$SCRIPT_DIR"

if [ "$DEV_MODE" = true ]; then
  echo ""
  echo "=== Build Complete (dev mode) ==="
  echo ""
  echo "Server binary: server/soltanhokm-server"
  echo "Frontend dist: dist/"
  echo ""
  echo "To run locally:"
  echo "  cd server && ./soltanhokm-server"
  exit 0
fi

# --- Deploy frontend ---
echo "Deploying frontend to /var/www/soltanhokm/ ..."
mkdir -p /var/www/soltanhokm
rm -rf /var/www/soltanhokm/*
cp -r dist/* /var/www/soltanhokm/

# --- Deploy server ---
echo "Deploying server to /opt/soltanhokm/ ..."
systemctl stop soltanhokm 2>/dev/null || true
mkdir -p /opt/soltanhokm
cp server/soltanhokm-server /opt/soltanhokm/
chmod +x /opt/soltanhokm/soltanhokm-server

# --- Install systemd service ---
echo "Installing systemd service..."
cp soltanhokm.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable soltanhokm
systemctl restart soltanhokm

echo ""
echo "=== Installed ==="
echo ""
echo "Server is running on port 5566."
echo ""
echo "To finish setup, add this to your Caddyfile (/etc/caddy/Caddyfile):"
echo ""
echo "  yourdomain.com {"
echo "      reverse_proxy localhost:5566"
echo "  }"
echo ""
echo "Then reload Caddy:"
echo ""
echo "  sudo systemctl reload caddy"
echo ""
echo "Useful commands:"
echo "  systemctl status soltanhokm"
echo "  journalctl -u soltanhokm -f"
