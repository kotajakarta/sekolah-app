#!/bin/bash
# Script untuk deploy Frontend App (sekolah-app) menggunakan Podman Quadlet
set -e

APP_DIR="/webku/appsku/esantri/sekolah-app"

# Pastikan berada di direktori aplikasi
cd "$APP_DIR" || exit 1



echo "=== 2. Hapus versi compose (jika sebelumnya dipakai) ==="
podman-compose down 2>/dev/null || true
podman rm -f esantri-app 2>/dev/null || true

echo "=== 3. Build Aplikasi ==="
# Build menggunakan container sementara (ephemeral)
podman run --rm -v "$APP_DIR":/app:Z -w /app docker.io/library/node:22-alpine sh -c "npm install -g npm@12.0.1 && npm install && npm run build"

echo "=== 4. Setup Quadlet Container ==="
mkdir -p ~/.config/containers/systemd
cp esantri-app.container ~/.config/containers/systemd/

echo "=== 5. Reload & Restart Systemd ==="
systemctl --user daemon-reload
systemctl --user restart esantri-app.service


echo "=== Deployment Selesai! ==="
systemctl --user status esantri-app.service --no-pager
