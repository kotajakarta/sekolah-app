#!/bin/bash
# Script untuk mempermudah push perubahan sekolah-app ke GitHub
set -e

# Ambil parameter pesan commit dari argumen perintah, jika kosong pakai default
COMMIT_MSG="${1:-Update sekolah-app code}"

echo "=== 1. Menambahkan Perubahan ke Git ==="
git add .

echo "=== 2. Membuat Commit ==="
git commit -m "$COMMIT_MSG"

echo "=== 3. Mem-push ke GitHub ==="
git push origin main

echo "Push Berhasil! Kode terbaru sekolah-app sudah ada di GitHub."
