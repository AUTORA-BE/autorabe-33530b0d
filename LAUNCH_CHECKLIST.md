# AutoRA.be — Pre-Launch Checklist

Mark each item ✅ before deploying to production.

---

## 1. Security

- [ ] **CORS allowlist** — `ALLOWED_ORIGINS` secret set in Supabase Edge Functions (`https://autora.be,https://www.autora.be`)
- [ ] **HTTP security headers** — `vercel.json` deployed; verify with https://securityheaders.com
- [ ] **CSP** — No `unsafe-eval`; `unsafe-inline` scoped to required hosts only
- [ ] **HSTS** — `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` present in response
- [ ] **RLS** — All public-facing tables have Row Level Security enabled; verify in Supabase dashboard → Authentication → Policies
- [ ] **Storage** — `vehicle-photos` bucket: mime type + size limits applied (migration `20260504192000`)
- [ ] **Signed upload URLs** — `get-upload-url` function deployed; frontend uses it for all file uploads
- [ ] **XSS guard** — DB trigger `car_listings_xss_guard` present and active
- [ ] **Car-Pass** — `car_pass_verified` is a generated column; `verify-car-pass` function deployed
- [ ] **Listing lock** — `car_listings_lock_approved` trigger present; sensitive edits revert to `pending_review`

## 2. Legal & Compliance (RGPD / Belgian law)

- [ ] **Mentions légales** — `/legal` page live with correct editor name, address, hosting details
- [ ] **CGU** — `/terms` page live and reviewed by a legal professional
- [ ] **Politique de confidentialité** — `/privacy` page covers all data collected, retention periods, contact for requests
- [ ] **CGV** — If charging users (Stripe), a `/cgv` page must exist before taking any payment
- [ ] **Cookie banner** — FR/NL banner blocks non-essential cookies until user consents; `localStorage` consent flag checked
- [ ] **RGPD** — Right to erasure works end-to-end: account deletion cascades all data + storage + Stripe subscriptions
- [ ] **VAT** — Belgian VAT number (if applicable) displayed in Mentions légales and invoices

## 3. Payments (Stripe)

- [ ] **Live keys** — `STRIPE_SECRET_KEY` (production `sk_live_...`) set in Supabase secrets
- [ ] **Publishable key** — `VITE_STRIPE_PUBLISHABLE_KEY` (production `pk_live_...`) set in Vercel env
- [ ] **Webhook** — Stripe webhook endpoint configured; `STRIPE_WEBHOOK_SECRET` set
- [ ] **Test transactions** — End-to-end Stripe checkout tested with a real card in live mode
- [ ] **Stripe dashboard** — Business details, bank account, and tax settings completed

## 4. Email (Resend)

- [ ] **Domain verified** — `autora.be` DNS records (SPF, DKIM, DMARC) added and verified in Resend dashboard
- [ ] **From address** — All emails sent from `noreply@autora.be` (not `onboarding@resend.dev`)
- [ ] **RESEND_API_KEY** — Production key set in Supabase secrets
- [ ] **Email templates** — Alert notification, listing status, contact reply tested end-to-end

## 5. Performance

- [ ] **Lighthouse** — Run `npx lighthouse https://autora.be --view`; score ≥ 85 on Performance, ≥ 90 on Accessibility
- [ ] **Core Web Vitals** — LCP < 2.5s, CLS < 0.1, FID/INP < 200ms
- [ ] **PostGIS** — Migration `20260504191930` applied; `listings_within_radius` uses `ST_DWithin`
- [ ] **Cursor pagination** — Homepage / infinite scroll uses `useVehicleSearchCursor` hook
- [ ] **Image optimization** — All listing photos served via Supabase Storage CDN; WebP preferred
- [ ] **PWA** — Service worker active; offline page served from cache

## 6. Monitoring & Observability

- [ ] **Health endpoint** — `https://autora.be/api/health` returns `{"status":"ok"}`
- [ ] **UptimeRobot** — Monitor configured at 5-min interval; alert email set
- [ ] **Sentry** — `VITE_SENTRY_DSN` set in Vercel; test error captured successfully
- [ ] **Supabase logs** — Edge Function log drain enabled if >50 req/s expected
- [ ] **Vercel analytics** — Speed Insights active (`@vercel/speed-insights` installed)

## 7. Deployment & Operations

- [ ] **Migrations applied** — `supabase db push` run against production project; all migrations green
- [ ] **Edge Functions deployed** — All 18 functions deployed to production project
- [ ] **Secrets set** — All required secrets in Supabase project settings
- [ ] **Custom domain** — `autora.be` + `www.autora.be` pointed to Vercel; SSL auto-provisioned
- [ ] **Rollback plan** — Team knows how to: (a) promote prior Vercel deployment, (b) restore Supabase backup
- [ ] **Maintenance mode** — Tested: `VITE_MAINTENANCE_MODE=true` shows maintenance page

## 8. Content & SEO

- [ ] **Sitemap** — `/sitemap.xml` accessible and submitted to Google Search Console
- [ ] **robots.txt** — No important pages blocked; `/admin/*` disallowed
- [ ] **OG tags** — `og:title`, `og:description`, `og:image` present on key pages
- [ ] **Canonical URLs** — No duplicate content issues; `<link rel="canonical">` on all pages
- [ ] **hreflang** — FR/NL language variants declared
- [ ] **404 page** — Custom 404 with search bar and suggestions displayed for unknown routes

## 9. Quality Assurance

- [ ] **Unit tests** — `npm run test` — 37/37 passing
- [ ] **TypeScript** — `npm run build` — 0 errors
- [ ] **ESLint** — `npm run lint` — 0 errors (warnings acceptable)
- [ ] **Mobile** — Tested on iOS Safari + Android Chrome; BottomNav, PWA install prompt, touch interactions
- [ ] **Auth flow** — Sign up → verify email → log in → log out tested
- [ ] **Listing flow** — Create → Car-Pass verify → admin approve → public visible
- [ ] **Contact form** — Submission triggers email to `autoracontact@gmail.com`

## 10. Post-Launch (Day 1)

- [ ] **Smoke test** — Visit 10 random listings; check photos load, prices display, contact works
- [ ] **Admin panel** — Log in as admin; review queue accessible at `/admin`
- [ ] **Sentry** — No new error spikes in first hour
- [ ] **UptimeRobot** — No alerts in first hour
- [ ] **Google Analytics / Plausible** — First real sessions visible
- [ ] **Announce** — Notify early users, post on social media

---

**Sign-off**: The following people have reviewed and approved this checklist:

| Role | Name | Date |
|------|------|------|
| Tech Lead | | |
| Legal | | |
| Product | | |
