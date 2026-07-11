#!/bin/bash
# Script untuk menjalankan backend-api secara lokal untuk pengembangan

echo "=== Menghentikan proses di port 3000 (jika ada) ==="
fuser -k 3000/tcp 2>/dev/null || kill -9 $(lsof -t -i:3000) 2>/dev/null || true
echo "=== Menjalankan Sekolah App Lokal ==="
npm run dev
