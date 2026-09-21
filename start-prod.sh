#!/usr/bin/env bash
# Jalankan server dalam mode production.
#
# .env dimuat ulang di sini karena environment container bisa sudah berisi salinan
# lama (nilai diinjeksi saat sesi dimulai), dan dotenv secara default tidak menimpa
# env yang sudah ada — akibatnya APP_SECRET lama yang terlalu pendek tetap dipakai.
set -euo pipefail

cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

export NODE_ENV=production
export PORT="${PORT:-12000}"

if [ ! -f dist/server.cjs ]; then
  echo "[deploy] dist/server.cjs belum ada, menjalankan build..." >&2
  npm run build
fi

exec node dist/server.cjs
