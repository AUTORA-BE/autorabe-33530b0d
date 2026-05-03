# Bloc 9 + 10 + Rapport final — Lancement beta

## Bloc 9 — Rate limiting (option B pragmatique)

Infra déjà en place (`rate_limits` table + RPC `check_rate_limit` + edge function `check-rate-limit`), mais pas câblée. On câble uniquement là où le risque métier est réel.

1. **`supabase/functions/create-listing/index.ts`** : ajouter check `listing_create` (10/jour/user) en début de handler. Retour 429 propre si dépassé.
2. **`supabase/functions/notify-seller/index.ts`** : ajouter check `message_send` (30/h/user). Retour 429 propre si dépassé.
3. **Reset password (côté client)** : ajouter `checkServerRateLimit('password_reset', email)` dans le formulaire reset (3/h/email) — UX, évite spam involontaire.
4. **Étendre `limits` map** dans `check-rate-limit/index.ts` avec les nouvelles clés (`listing_create`, `message_send`, `password_reset`).
5. **Skip signup/login** : Supabase Auth a déjà du rate limiting natif côté infra. Documenter dans le rapport.

## Bloc 10 — xlsx CVE (option C accepter le risque)

1. Aucune modification de code.
2. Documenter dans `LAUNCH_READINESS.md` : usage admin-only, vecteur d'attaque inexistant (export uniquement, jamais d'import xlsx user), risque accepté.

## Rapport final

Créer `LAUNCH_READINESS.md` à la racine avec :

- **Section ✅ Done** : ErrorBoundary, CI/CD, RGPD/cookie gating, delete-account hardening, rate-limit câblé sur listing/message/reset, audit dépendances clean.
- **Section ⚠️ Limitations connues** : 
  - Lighthouse CI peut produire faux positifs sur preview Lovable
  - Rate limit IP-based contournable derrière VPN (acceptable pour beta)
  - xlsx@0.18.5 conservé (admin-only, vecteur inexploitable)
  - Playwright E2E reporté post-beta
- **Section 📋 Checklist Go/No-Go** : 
  - Auth (Google + email + phone obligatoire) ✅
  - Paiements Stripe (5 tiers + webhooks) ✅
  - RGPD (cookie gating + delete cascade + export JSON) ✅
  - Mobile PWA (safe-area + offline) ✅
  - Sécurité (RLS, has_role, no VIN storage) ✅
  - i18n FR/NL/DE/EN ✅
  - Belgian compliance (Car-Pass, LEZ, TMC) ✅
  - Monitoring : ErrorBoundary + console structuré ✅
  - À faire avant prod : tester delete-account end-to-end avec un vrai compte test

## Détails techniques

- Rate limit côté edge : `await fetch(SUPABASE_URL + '/functions/v1/check-rate-limit', { body: { action, identifier: user.id } })` puis if `!allowed` → 429 avec header `Retry-After: 3600`.
- Pour `create-listing` et `notify-seller`, l'`identifier` = `user.id` (pas l'IP) car déjà authentifié.
- Pour `password_reset`, identifier = email normalisé (lowercase + trim).
- Update `mem://technical/security-architecture` pour documenter les 3 nouveaux points de rate-limit câblés.

## Fichiers touchés

- `supabase/functions/check-rate-limit/index.ts` (étendre `limits`)
- `supabase/functions/create-listing/index.ts` (check + 429)
- `supabase/functions/notify-seller/index.ts` (check + 429)
- `src/features/auth/**` formulaire reset password (1 appel checkServerRateLimit)
- `LAUNCH_READINESS.md` (nouveau, racine)
- `mem://technical/security-architecture` (mise à jour)

Estimation : ~25 min de build, pas de migration DB nécessaire (table + RPC déjà OK).
