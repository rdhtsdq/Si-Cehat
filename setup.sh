#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Si-Cehat Project Setup Script (Hono + React Vite + Drizzle ORM)
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERR]${NC}  $*" >&2; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

SKIP_DB=false
for arg in "$@"; do
  case "$arg" in
    --skip-db)
      SKIP_DB=true
      ;;
    -h|--help)
      echo "Usage: ./setup.sh [--skip-db]"
      echo ""
      echo "Options:"
      echo "  --skip-db   Skip database connectivity check, schema push, and seeding"
      echo "  -h, --help  Show this help message"
      exit 0
      ;;
  esac
done

echo "============================================================"
echo "  Si-Cehat - Development Environment Setup (Hono + Vite)"
echo "============================================================"

# 1. Check prerequisites
info "Checking prerequisites..."
if ! command -v bun >/dev/null 2>&1; then
  error "Bun is not installed. Please install Bun first: https://bun.sh/"
  exit 1
fi
success "Bun detected: v$(bun --version)"

if command -v psql >/dev/null 2>&1; then
  success "PostgreSQL client (psql) detected: $(psql --version)"
else
  warn "psql CLI not found in PATH (PostgreSQL connectivity will be checked via Bun/Drizzle)."
fi

# 2. Configure environment variables
info "Checking environment configuration..."
ENV_FILE=".env"
if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f ".env.local" ]]; then
    info "Found existing .env.local, copying to .env..."
    cp .env.local "$ENV_FILE"
  elif [[ -f ".env.example" ]]; then
    info "Creating .env from .env.example..."
    cp .env.example "$ENV_FILE"
  else
    error ".env.example not found! Cannot initialize environment file."
    exit 1
  fi
  success "Created $ENV_FILE"
else
  success "$ENV_FILE already exists"
fi

# Auto-generate AUTH_SECRET if still using the placeholder
if grep -q 'AUTH_SECRET="your-super-secret-auth-key-change-me"' "$ENV_FILE" 2>/dev/null; then
  info "Generating random AUTH_SECRET in $ENV_FILE..."
  if command -v openssl >/dev/null 2>&1; then
    NEW_SECRET="$(openssl rand -base64 33)"
  else
    NEW_SECRET="$(bun -e 'console.log(Buffer.from(crypto.getRandomValues(new Uint8Array(33))).toString("base64"))')"
  fi
  ESCAPED_SECRET="${NEW_SECRET//\//\\/}"
  sed -i "s/AUTH_SECRET=\"your-super-secret-auth-key-change-me\"/AUTH_SECRET=\"${ESCAPED_SECRET}\"/" "$ENV_FILE"
  success "Generated new AUTH_SECRET"
fi

# 3. Install dependencies
info "Installing project dependencies with Bun..."
bun install
success "Dependencies installed"

# 4. Check PostgreSQL connection & run Drizzle schema push / seed
if [[ "$SKIP_DB" == "true" ]]; then
  warn "Skipping database checks, migrations, and seed (--skip-db passed)."
else
  info "Checking PostgreSQL connection using DATABASE_URL..."
  if bun -e '
    import { pgSql } from "./src/server/db/index.ts";
    try {
      await pgSql`SELECT 1`;
      await pgSql.end();
      process.exit(0);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  ' >/dev/null 2>&1; then
    success "Database connection established"

    info "Pushing Drizzle schema to PostgreSQL..."
    bun run db:migrate
    success "Database schema synced"

    info "Seeding initial database content..."
    bun run db:seed
    success "Database seeded"
  else
    warn "Could not connect to PostgreSQL using DATABASE_URL in $ENV_FILE."
    warn "Make sure PostgreSQL is running and DATABASE_URL is configured properly."
    warn "Once your database is ready, run:"
    echo "    bun run db:migrate"
    echo "    bun run db:seed"
  fi
fi

# 5. Verify TypeScript types
info "Running TypeScript typecheck..."
bun run typecheck
success "Typecheck passed"

echo ""
echo "============================================================"
success "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review $ENV_FILE and set AI_API_KEY if using AI chat."
echo "  2. Start the development server:"
echo "       bun run dev"
echo "============================================================"
