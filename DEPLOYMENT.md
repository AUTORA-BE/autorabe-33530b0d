# AutoRA.be — Deployment Guide

## Architecture

| Layer | Technology | Host |
|-------|-----------|------|
| Frontend | React 18 + Vite | Vercel |
| Database | PostgreSQL 15 (Supabase) | Supabase Cloud |
| Edge Functions | Deno (TypeScript) | Supabase Edge |
| Storage | Object storage | Supabase Storage |
| Email | Transactional email | Resend |
| Payments | Stripe |  Stripe |
| Monitoring | Sentry | Sentry.io |

---

## Prerequisites

Install these CLI tools globally:

```bash
npm install -g supabase vercel
```

Log in:

```bash
supabase login
vercel login
```

---

## Environment Variables

### Frontend (Vercel project settings)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ |
| `VITE_SENTRY_DSN` | Sentry DSN (optional) | ⬜ |
| `VITE_APP_VERSION` | App version (e.g. `1.0.0`) | ⬜ |
| `VITE_MAINTENANCE_MODE` | Set to `"true"` to show maintenance page | ⬜ |

### Edge Functions (Supabase secrets)

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  RESEND_API_KEY=re_... \
  ALLOWED_ORIGINS=https://autora.be,https://www.autora.be \
  --project-ref <PROJECT_REF>
```

---

## First-Time Setup

### 1. Link Supabase project

```bash
supabase link --project-ref <PROJECT_REF>
```

### 2. Apply all migrations

```bash
supabase db push
```

### 3. Link Vercel project

```bash
vercel link
```

### 4. Set environment variables in Vercel

Via dashboard or CLI:

```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
```

---

## Standard Deployment

Use the deployment script for a full deploy:

```bash
# Full deploy (migrations + functions + frontend)
./deploy.sh

# Skip DB migrations (frontend + functions only)
./deploy.sh --skip-migrations

# Preview what would happen without applying changes
./deploy.sh --dry-run
```

### Manual steps (if needed)

```bash
# 1. Apply migrations
supabase db push --project-ref <REF>

# 2. Deploy a specific Edge Function
supabase functions deploy verify-car-pass --project-ref <REF>

# 3. Deploy all functions
for fn in supabase/functions/*/; do
  supabase functions deploy "$(basename $fn)" --project-ref <REF>
done

# 4. Build + deploy frontend
npm run build && vercel --prod
```

---

## Rollback Procedures

### Frontend rollback (Vercel)

List recent deployments and promote a previous one:

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-id>
```

Or use the Vercel dashboard → Deployments → select a build → "Promote to Production".

### Database rollback

Supabase migrations are **not automatically reversible**. Before applying risky migrations:

1. Take a manual snapshot in the Supabase dashboard (Database → Backups → Create backup)
2. To restore: Dashboard → Database → Backups → select snapshot → Restore

For schema-only rollback, write a reverse migration:

```sql
-- Example: reverse migration 20260504192030_lock_approved_listings
DROP TRIGGER IF EXISTS car_listings_lock_approved ON public.car_listings;
DROP FUNCTION IF EXISTS public.guard_sensitive_listing_updates();
ALTER TABLE public.car_listings DROP COLUMN IF EXISTS needs_review;
```

Save as `supabase/migrations/<timestamp>_rollback_lock_approved.sql` and push.

### Edge Function rollback

Redeploy a previous version by checking out the prior commit and running:

```bash
git checkout <previous-sha> -- supabase/functions/<function-name>
supabase functions deploy <function-name> --project-ref <REF>
git restore supabase/functions/<function-name>
```

---

## Maintenance Mode

To put the site in maintenance mode without a full deployment:

```bash
# Enable
vercel env add VITE_MAINTENANCE_MODE production
# Enter: true

# Force redeploy to pick up the env var
vercel --prod --force

# Disable (remove the variable)
vercel env rm VITE_MAINTENANCE_MODE production
vercel --prod --force
```

The maintenance page (`src/pages/Maintenance.tsx`) shows a bilingual FR/NL message.

---

## Health Checks

- **Frontend health**: `https://autora.be/api/health` (Vercel serverless)
- **Supabase status**: https://status.supabase.com

### UptimeRobot setup

1. Create a free account at https://uptimerobot.com
2. Add monitor: **HTTP(S)** → URL: `https://autora.be/api/health`
3. Check interval: **5 minutes**
4. Alert contacts: your email / Slack webhook
5. Keyword check: `"status":"ok"` (optional, for degraded detection)

---

## Monitoring

### Sentry

1. Create a project at https://sentry.io (React type)
2. Copy the DSN
3. `vercel env add VITE_SENTRY_DSN production` → paste DSN
4. Redeploy — errors will appear in your Sentry dashboard

### Logs

```bash
# Edge Function logs (live stream)
supabase functions logs verify-car-pass --project-ref <REF>

# Vercel function logs
vercel logs --prod
```

---

## CI/CD (GitHub Actions — optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```
