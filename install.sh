#!/bin/bash
set -e

# Soltan Hokm — VPS Installer
# Run from the project root: sudo bash install.sh

if [ "$EUID" -ne 0 ]; then
  echo "Error: run with sudo — sudo bash install.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Soltan Hokm Installer ==="

# --- Build frontend (as original user to avoid npm root issues) ---
echo "Building frontend..."
SUDO_USER="${SUDO_USER:-root}"
su -l "$SUDO_USER" -c "cd $SCRIPT_DIR && npm run build"

# --- Build server ---
echo "Building server..."
cd server
go build -o soltanhokm-server .
cd "$SCRIPT_DIR"

# --- Deploy frontend ---
echo "Deploying frontend to /var/www/soltanhokm/ ..."
mkdir -p /var/www/soltanhokm
rm -rf /var/www/soltanhokm/*
cp -r dist/* /var/www/soltanhokm/

# --- Deploy server ---
echo "Deploying server to /opt/soltanhokm/ ..."
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
