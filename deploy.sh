#!/bin/bash
# Script untuk deploy Frontend App (sekolah-app) menggunakan Podman Quadlet
set -e

APP_DIR="/data/podman-hosting/apps/sekolah-app"

# Pastikan berada di direktori aplikasi
cd "$APP_DIR" || exit 1

echo "=== 1. Menarik Update Terbaru (git pull) ==="
git fetch origin main
git reset --hard origin/main
git clean -fd

echo "=== 2. Hapus versi compose (jika sebelumnya dipakai) ==="
podman-compose down 2>/dev/null || true
podman rm -f daimi-app 2>/dev/null || true

echo "=== 3. Build Aplikasi ==="
# Build menggunakan container sementara (ephemeral)
podman run --rm -v "$APP_DIR":/app:Z -w /app docker.io/library/node:20-alpine sh -c "npm install && npm run build"

echo "=== 4. Setup Quadlet Container ==="
mkdir -p ~/.config/containers/systemd
cp daimi-app.container ~/.config/containers/systemd/

echo "=== 5. Reload & Restart Systemd ==="
systemctl --user daemon-reload
systemctl --user restart daimi-app.service


echo "=== Deployment Selesai! ==="
systemctl --user status daimi-app.service --no-pager
