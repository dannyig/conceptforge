#!/usr/bin/env bash
# manual-deploy.sh — fallback deployment script for when GitHub Actions is unavailable.
#
# Usage:
#   FLY_API_TOKEN=<token> ./scripts/manual-deploy.sh
#
# Requirements:
#   - Must be run from the repo root on the `main` branch
#   - FLY_API_TOKEN must be set in the environment
#   - flyctl must be installed (https://fly.io/docs/hands-on/install-flyctl/)
#   - pnpm must be installed
#
# This script replicates the CI/CD gate that GitHub Actions enforces:
#   1. Verify the current branch is `main`
#   2. Verify the working tree is clean (no uncommitted changes)
#   3. Pull the latest commits from origin/main
#   4. Verify FLY_API_TOKEN is set
#   5. Install dependencies
#   6. Run lint, typecheck, and unit tests — abort on any failure
#   7. Build the production bundle
#   8. Deploy to fly.io

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${YELLOW}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✔ $1${NC}"; }
fail() { echo -e "${RED}✖ $1${NC}"; exit 1; }

# ── 1. Branch check ────────────────────────────────────────────────────────────
step "Checking branch"
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  fail "Must deploy from 'main'. Current branch: '$BRANCH'. Checkout main and try again."
fi
ok "On branch: main"

# ── 2. Clean working tree ──────────────────────────────────────────────────────
step "Checking working tree"
if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Working tree has uncommitted changes. Commit or stash them before deploying."
fi
ok "Working tree is clean"

# ── 3. Pull latest main ────────────────────────────────────────────────────────
step "Pulling latest from origin/main"
git pull origin main
ok "Up to date with origin/main"

# ── 4. FLY_API_TOKEN ──────────────────────────────────────────────────────────
step "Checking FLY_API_TOKEN"
if [ -z "${FLY_API_TOKEN:-}" ]; then
  fail "FLY_API_TOKEN is not set. Export it before running:\n  export FLY_API_TOKEN=<your-token>"
fi
ok "FLY_API_TOKEN is set"

# ── 5. Install dependencies ────────────────────────────────────────────────────
step "Installing dependencies"
pnpm install --frozen-lockfile
ok "Dependencies installed"

# ── 6. Quality gate ────────────────────────────────────────────────────────────
step "Running lint"
pnpm lint || fail "Lint failed — fix errors before deploying"
ok "Lint passed"

step "Running typecheck"
pnpm typecheck || fail "Typecheck failed — fix type errors before deploying"
ok "Typecheck passed"

step "Running unit tests"
pnpm test || fail "Unit tests failed — fix failing tests before deploying"
ok "Unit tests passed"

# ── 7. Production build ────────────────────────────────────────────────────────
step "Building production bundle"
pnpm build || fail "Build failed — fix build errors before deploying"
ok "Build succeeded"

# ── 8. Deploy ──────────────────────────────────────────────────────────────────
VERSION=$(node -p "require('./package.json').version")
step "Deploying ConceptForge v${VERSION} to fly.io"
flyctl deploy --remote-only
ok "Deployed ConceptForge v${VERSION}"
