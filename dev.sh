#!/bin/bash
# Script untuk push ke github
set -e

# Ambil parameter pesan commit dari argumen perintah, jika kosong pakai default
COMMIT_MSG="${1:-Update sekolah-app code}"

echo "=== 1. Menambahkan Perubahan ke Git ==="
git add .

echo "=== 2. Membuat Commit ==="
git commit -m "$COMMIT_MSG"

echo "=== 3. Mem-push ke GitHub ==="
git push origin main


# Script untuk menjalankan sekolah-app secara lokal untuk pengembangan
echo "=== Menghentikan proses di port 3000 (jika ada) ==="
fuser -k 3000/tcp 2>/dev/null || kill -9 $(lsof -t -i:3000) 2>/dev/null || true
echo "=== Menjalankan Sekolah App Lokal ==="
npm run dev
