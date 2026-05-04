#!/usr/bin/env bash
# AutoRA.be — production deployment script
# Usage: ./deploy.sh [--skip-migrations] [--skip-functions] [--dry-run]
set -euo pipefail

# ─── Colours ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ─── Flags ──────────────────────────────────────────────────────────────────
SKIP_MIGRATIONS=false
SKIP_FUNCTIONS=false
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --skip-migrations) SKIP_MIGRATIONS=true ;;
    --skip-functions)  SKIP_FUNCTIONS=true ;;
    --dry-run)         DRY_RUN=true; warn "DRY RUN — no changes will be applied" ;;
  esac
done

# ─── Pre-flight checks ───────────────────────────────────────────────────────
info "Pre-flight checks…"
command -v supabase >/dev/null 2>&1 || error "supabase CLI not found. Install: npm i -g supabase"
command -v vercel   >/dev/null 2>&1 || error "vercel CLI not found. Install: npm i -g vercel"
command -v node     >/dev/null 2>&1 || error "node not found"

[ -f ".env" ] || error ".env not found — copy .env.example and fill in values"

# Fail-fast: ensure required secrets are set
required_vars=(
  SUPABASE_PROJECT_REF
  SUPABASE_DB_PASSWORD
  STRIPE_SECRET_KEY
  RESEND_API_KEY
)
for var in "${required_vars[@]}"; do
  [ -n "${!var:-}" ] || error "Environment variable $var is not set"
done

# ─── 1. Run database migrations ─────────────────────────────────────────────
if [ "$SKIP_MIGRATIONS" = false ]; then
  info "Applying database migrations…"
  if [ "$DRY_RUN" = false ]; then
    supabase db push --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
    info "Migrations applied ✓"
  else
    info "[DRY RUN] Would run: supabase db push"
  fi
else
  warn "Skipping migrations (--skip-migrations)"
fi

# ─── 2. Deploy Edge Functions ────────────────────────────────────────────────
if [ "$SKIP_FUNCTIONS" = false ]; then
  info "Deploying Edge Functions…"
  FUNCTIONS=(
    verify-car-pass
    get-upload-url
    create-listing
    delete-account
    export-user-data
    create-checkout
    create-boost-checkout
    customer-portal
    check-subscription
    send-contact-email
    explain-taxes
    notify-listing-status
    notify-seller
    match-new-vehicle
    send-push-notification
    car-chat
    expire-boosts
    check-rate-limit
  )

  for fn in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$fn" ]; then
      if [ "$DRY_RUN" = false ]; then
        supabase functions deploy "$fn" --project-ref "$SUPABASE_PROJECT_REF" --no-verify-jwt 2>/dev/null || \
          supabase functions deploy "$fn" --project-ref "$SUPABASE_PROJECT_REF"
        info "  $fn ✓"
      else
        info "  [DRY RUN] Would deploy: $fn"
      fi
    else
      warn "  Function directory not found, skipping: $fn"
    fi
  done
fi

# ─── 3. Set/refresh Edge Function secrets ────────────────────────────────────
info "Setting Edge Function secrets…"
if [ "$DRY_RUN" = false ]; then
  supabase secrets set \
    STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    RESEND_API_KEY="$RESEND_API_KEY" \
    ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://autora.be,https://www.autora.be}" \
    --project-ref "$SUPABASE_PROJECT_REF"
  info "Secrets updated ✓"
else
  info "[DRY RUN] Would set secrets: STRIPE_SECRET_KEY, RESEND_API_KEY, ALLOWED_ORIGINS"
fi

# ─── 4. Build frontend ───────────────────────────────────────────────────────
info "Building frontend…"
if [ "$DRY_RUN" = false ]; then
  npm ci --silent
  npm run build
  info "Build complete ✓"
else
  info "[DRY RUN] Would run: npm ci && npm run build"
fi

# ─── 5. Deploy to Vercel ─────────────────────────────────────────────────────
info "Deploying to Vercel (production)…"
if [ "$DRY_RUN" = false ]; then
  vercel --prod --yes
  info "Vercel deploy complete ✓"
else
  info "[DRY RUN] Would run: vercel --prod"
fi

info "🚀 Deployment complete!"
echo -e "${GREEN}AutoRA.be is live at https://autora.be${NC}"
