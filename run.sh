#!/usr/bin/env bash
# Start the local trading console (single user, loopback only).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/frontend"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but not on PATH." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Starting console..."
exec npm run dev
