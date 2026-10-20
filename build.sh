#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Si-Cehat - Production Build Script (Hono + React Vite + Drizzle ORM)
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERR]${NC}  $*" >&2; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Options
SKIP_TYPECHECK=false
CLEAN_BUILD=false
WITH_MIGRATE=false
STANDALONE_SERVER=false

print_usage() {
  echo "Usage: ./build.sh [options]"
  echo ""
  echo "Options:"
  echo "  -s, --skip-typecheck   Skip TypeScript type checking step"
  echo "  -c, --clean            Clean previous build artifacts (dist/) before building"
  echo "  -m, --with-migrate     Run Drizzle database schema migration before building"
  echo "  --standalone           Also bundle Hono backend into dist/server.js using Bun bundler"
  echo "  -h, --help             Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./build.sh                     # Full production build (typecheck + vite build)"
  echo "  ./build.sh --skip-typecheck    # Fast build without typechecking"
  echo "  ./build.sh --clean             # Fresh build with cleaned dist folder"
}

for arg in "$@"; do
  case "$arg" in
    -s|--skip-typecheck)
      SKIP_TYPECHECK=true
      ;;
    -c|--clean)
      CLEAN_BUILD=true
      ;;
    -m|--with-migrate)
      WITH_MIGRATE=true
      ;;
    --standalone)
      STANDALONE_SERVER=true
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      warn "Unknown option: $arg"
      print_usage
      exit 1
      ;;
  esac
done

echo "============================================================"
echo "  Si-Cehat - Production Build (Hono + React Vite)"
echo "============================================================"

# 1. Check prerequisites
info "Checking build prerequisites..."
if ! command -v bun >/dev/null 2>&1; then
  error "Bun is not installed or not in PATH. Please install Bun: https://bun.sh/"
  exit 1
fi
success "Bun detected: v$(bun --version)"

# Check environment configuration
if [[ -f ".env" ]]; then
  success "Environment file (.env) found"
elif [[ -f ".env.local" ]]; then
  info "Using .env.local for configuration"
elif [[ -f ".env.production" ]]; then
  info "Using .env.production for configuration"
else
  warn "No .env or .env.local file detected. Build will proceed, but production runtime requires valid env."
fi

# 2. Clean previous build artifacts if requested
if [[ "$CLEAN_BUILD" == "true" ]]; then
  info "Cleaning previous build artifacts in dist/..."
  rm -rf dist
  success "dist/ directory cleaned"
fi

# 3. TypeScript Typecheck
if [[ "$SKIP_TYPECHECK" == "true" ]]; then
  warn "Skipping TypeScript typecheck (--skip-typecheck passed)."
else
  info "Running TypeScript typecheck (tsc --noEmit)..."
  if bun run typecheck; then
    success "TypeScript typecheck passed"
  else
    error "TypeScript typecheck failed! Fix the errors above or use --skip-typecheck to bypass."
    exit 1
  fi
fi

# 4. Optional: Run Database Migrations
if [[ "$WITH_MIGRATE" == "true" ]]; then
  info "Running database schema push (drizzle-kit push)..."
  if bun run db:migrate; then
    success "Database migration completed"
  else
    error "Database migration failed! Please check your database connection."
    exit 1
  fi
fi

# 5. Build Client Assets (Vite)
info "Building frontend client assets with Vite..."
if bunx vite build; then
  if [[ -f "dist/index.html" ]]; then
    success "Frontend build generated successfully in dist/"
  else
    error "Vite build completed, but dist/index.html was not found."
    exit 1
  fi
else
  error "Frontend build failed with Vite."
  exit 1
fi

# 6. Optional: Standalone Server Bundle
if [[ "$STANDALONE_SERVER" == "true" ]]; then
  info "Bundling backend server (src/server/index.ts -> dist/server.js)..."
  if bun build src/server/index.ts --target=bun --outfile=dist/server.js; then
    success "Server bundled into dist/server.js"
  else
    error "Server bundling failed."
    exit 1
  fi
fi

# 7. Build Summary
echo ""
echo "============================================================"
success "Build completed successfully!"
echo "============================================================"
if [[ -d "dist" ]]; then
  TOTAL_FILES=$(find dist -type f | wc -l)
  TOTAL_SIZE=$(du -sh dist | cut -f1)
  echo -e "${CYAN}[OUTPUT]${NC} Directory:   ${PROJECT_ROOT}/dist"
  echo -e "${CYAN}[OUTPUT]${NC} Total Files: ${TOTAL_FILES}"
  echo -e "${CYAN}[OUTPUT]${NC} Total Size:  ${TOTAL_SIZE}"
fi

echo ""
echo "Next steps:"
echo "  1. Start production server:"
echo "       bun run start"
echo "     or:"
echo "       NODE_ENV=production bun src/server/index.ts"
if [[ "$STANDALONE_SERVER" == "true" ]]; then
  echo "     (or for bundled server: bun dist/server.js)"
fi
echo "============================================================"
