#!/bin/bash
set -e

# Soltan Hokm — VPS Installer
# Run this from the project root after cloning the repo.
# Usage: sudo bash install.sh

if [ "$EUID" -ne 0 ]; then
  echo "Error: run with sudo — sudo bash install.sh"
  exit 1
fi

echo "=== Soltan Hokm Installer ==="

# --- Build frontend ---
echo "Building frontend..."
npm run build

# --- Build server ---
echo "Building server..."
cd server
go build -o soltanhokm-server .
cd ..

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

# --- Install Caddy config ---
echo "Installing Caddy config..."
cp Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy 2>/dev/null || echo "Warning: Caddy reload failed — make sure Caddy is installed and running"

echo ""
echo "=== Done ==="
echo "Server status:  systemctl status soltanhokm"
echo "View logs:      journalctl -u soltanhokm -f"
