#!/bin/bash
# Script lokal untuk menarik kode sekolah-app terbaru dan memperbarui packages
set -e

echo "=== 1. Menarik Kode Terbaru dari GitHub ==="
git pull origin main

echo "=== 2. Memperbarui Node Packages (Jika ada perubahan) ==="
npm install --no-audit --no-fund

echo "Sinkronisasi Selesai! Aplikasi sekolah-app Anda siap digunakan."
