#!/bin/bash
set -e

COMMIT_MSG="${1:-Update backend-api code}"

echo "=== 1. Menambahkan Perubahan ke Git ==="
git add .

echo "=== 2. Membuat Commit ==="
# Cegah error jika tidak ada perubahan baru untuk di-commit
if git diff-index --quiet HEAD --; then
    echo "Tidak ada perubahan yang perlu di-commit."
else
    git commit -m "$COMMIT_MSG"
fi

echo "=== 3. Mem-push ke GitHub ==="
# Gunakan flag --verbose agar terlihat progress upload-nya
git push --verbose origin main

# Menghentikan secara paksa proses di port 3000 jika ada
fuser -k -9 3000/tcp 2>/dev/null || true
pkill -9 -f "vite" 2>/dev/null || true
kill -9 $(lsof -t -i:3000) 2>/dev/null || true

npm run dev