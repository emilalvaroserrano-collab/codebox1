#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# Eburon Codebox — Fresh machine install script
# ──────────────────────────────────────────────
# Installs all dependencies, starts services,
# configures the database, and builds the app.
# Run from the repo root.

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

echo "==> 1. Checking prerequisites..."

# Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js 18+ required. Install via: brew install node"
  exit 1
fi
NODE_MAJOR=$(node -e "console.log(process.version.slice(1).split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required (found v$NODE_MAJOR)"
  exit 1
fi
echo "  Node.js $(node -v) — OK"

# pnpm
if ! command -v pnpm &>/dev/null; then
  echo "  Installing pnpm..."
  npm install -g pnpm
fi
echo "  pnpm $(pnpm -v) — OK"

# Docker
if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker required. Install via: brew install --cask docker"
  exit 1
fi
echo "  Docker — OK"

# Ollama
if ! command -v ollama &>/dev/null; then
  echo "  Installing Ollama..."
  if [[ "$(uname)" == "Darwin" ]]; then
    brew install ollama
  else
    curl -fsSL https://ollama.com/install.sh | sh
  fi
fi
echo "  Ollama — OK"

# OpenCode CLI
if ! command -v opencode &>/dev/null; then
  echo "  Installing OpenCode CLI..."
  npm install -g opencode
fi
echo "  OpenCode CLI — OK"

# FreeBuff CLI (optional)
if ! command -v freebuff &>/dev/null; then
  echo "  [optional] Installing FreeBuff CLI..."
  npm install -g freebuff 2>/dev/null || echo "  [skip] FreeBuff not installed"
fi

echo ""
echo "==> 2. Installing project dependencies..."
pnpm install

echo ""
echo "==> 3. Setting up environment..."
if [ ! -f packages/desktop/.env ]; then
  cp packages/desktop/.env.example packages/desktop/.env
  echo "  Created packages/desktop/.env from .env.example"
  echo "  >> EDIT packages/desktop/.env and set DATABASE_URL"
  echo "  >> Default: postgresql://eburon:eburon@localhost:5432/eburon"
else
  echo "  packages/desktop/.env already exists — skipping"
fi

echo ""
echo "==> 4. Starting PostgreSQL..."
cd packages/desktop
docker compose up -d
echo "  Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U eburon &>/dev/null; then
    echo "  PostgreSQL is ready"
    break
  fi
  sleep 1
done
cd "$REPO_DIR"

echo ""
echo "==> 5. Pushing database schema..."
pnpm --filter @eburon/desktop exec prisma db push

echo ""
echo "==> 6. Pulling Ollama models..."
ollama pull qwen3.6:latest 2>/dev/null || ollama pull qwen2.5:latest
ollama pull gemma4:e4b 2>/dev/null || true
ollama pull ornith:9b 2>/dev/null || true
ollama pull orbit-ai:latest 2>/dev/null || true

echo ""
echo "==> 7. Building Electron main process..."
pnpm --filter @eburon/desktop exec node scripts/build-main.mjs

echo ""
echo "==> 8. Starting Vite dev server (background)..."
pnpm --filter @eburon/desktop exec vite --host &
VITE_PID=$!
echo "  Vite PID: $VITE_PID"
sleep 2

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Eburon Codebox is ready!                           ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Launch the app:                                     ║"
echo "║                                                      ║"
echo "║  DATABASE_URL=\"postgresql://eburon:eburon@localhost:5432/eburon\" \\"
echo "║  VITE_DEV_SERVER_URL=http://localhost:5173 \\"
echo "║  npx electron packages/desktop/dist-electron/main.cjs  ║"
echo "║                                                      ║"
echo "║  Or package for distribution:                       ║"
echo "║  pnpm --filter @eburon/desktop package:mac           ║"
echo "╚══════════════════════════════════════════════════════╝"
