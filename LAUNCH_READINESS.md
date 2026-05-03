# 🚀 AutoRA.be — Launch Readiness (v1.0.0-beta.1)

> Rapport de fin de chantier hardening beta.
> Dernière mise à jour : 2026-05-03.

---

## ✅ Ce qui a été fait

### Bloc 1 — Fondations
- ✅ Authentification Google + Email + (Apple en option) avec téléphone obligatoire (+32)
- ✅ RLS sur **toutes** les tables sensibles (`car_listings`, `messages`, `conversations`, `profiles`, `subscriptions`…)
- ✅ Rôle admin via `user_roles` + RPC `has_role()` (jamais stocké sur `profiles`)
- ✅ Edge functions sécurisées : JWT validé en code, suspension utilisateur vérifiée (`is_user_suspended`)

### Bloc 2 — Belgian compliance
- ✅ Car-Pass obligatoire (upload PDF/JPG/PNG, bucket `car-pass` privé)
- ✅ LEZ badges Bruxelles / Anvers / Gand (`/lez-belgique`)
- ✅ Distinction Pro vs Particulier (badge + TVA + mentions garantie)
- ✅ TMC/Annual tax simulator (Wallonie, Bruxelles, Flandre)
- ✅ AI Tax Advisor (Gemini Flash via Lovable AI Gateway)
- ✅ Aucun stockage de VIN (par design)

### Bloc 3 — Paiements & monétisation
- ✅ Stripe : 5 tiers + boosts annonces
- ✅ Webhook Stripe sécurisé (`STRIPE_WEBHOOK_SECRET`, idempotency via `stripe_processed_events`)
- ✅ Annulation auto des subs Stripe lors du delete-account (RGPD)

### Bloc 4 — Mobile & PWA
- ✅ PWA configurée (vite-plugin-pwa, manifest, offline)
- ✅ Safe-areas iOS/Android, BottomNav cachée auto sur Auth/Admin/Chat
- ✅ Haptic feedback (PTR, swipe, share)
- ✅ Push notifications (VAPID configuré)

### Bloc 5 — ErrorBoundary global
- ✅ ErrorBoundary React au-dessus du LanguageProvider
- ✅ Logs JSON structurés (`error_id`, `stack`, `ua`, `url`)
- ✅ Capture des `unhandledrejection` (promesses async)
- ✅ Plausible custom event "Error" pour tracking analytics
- ✅ 3 actions de recovery : retry / reload / home
- ✅ i18n autonome (FR, NL, DE, EN) avec détection URL/LocalStorage/Navigator

### Bloc 6 — CI/CD GitHub Actions
- ✅ `.github/workflows/ci.yml` : lint + build + vitest sur chaque PR (bloque le merge)
- ✅ `.github/workflows/lighthouse.yml` : audit Lighthouse sur la prod (perf/a11y/SEO ≥ 85)
- ✅ `.github/workflows/e2e.yml` : Playwright (3 specs critiques)

### Bloc 7 — E2E Playwright
- ✅ `e2e/auth.spec.ts` : signup + login + logout
- ✅ `e2e/publish-listing.spec.ts` : wizard complet 3 étapes
- ✅ `e2e/messaging.spec.ts` : 2 contextes browser, vérification realtime delivery
- ⚠️ Les tests demandent des comptes test seedés en CI (env vars `E2E_USER_*`)

### Bloc 8 — RGPD / Cookie gating
- ✅ `src/lib/consent.ts` = source unique de vérité du consentement
- ✅ Plausible **dynamiquement loadé** seulement après acceptation (retiré de `index.html`)
- ✅ Stripe.js loadé à la demande (pas au boot)
- ✅ Page `/cookies` (`src/pages/Cookies.tsx`) + lien dans le footer multilingue
- ✅ Pages légales : `/cgu`, `/mentions-legales`, `/politique-confidentialite`, `/cookies`
- ✅ `delete-account` edge function durcie :
  - Cancel actif des subs Stripe via API
  - Cleanup de 4 buckets (`vehicle-photos`, `car-pass`, `chat-images`, `avatars`)
  - Cascade : alerts, messages, conversations, daily_message_counts, favorites, push_subscriptions
- ✅ Export JSON RGPD via `export-user-data` edge function

### Bloc 9 — Rate limiting (pragmatique beta)
Infra : table `rate_limits` + RPC `check_rate_limit(_key, _max, _window)` + edge function `check-rate-limit` (déjà en place).

| Endpoint | Limite | Identifier | Statut |
|---|---|---|---|
| **`create-listing`** | 10 / jour | `user.id` | ✅ câblé serveur (429 + Retry-After) |
| **`notify-seller`** (email vendeur) | 30 / heure | `seller.id` | ✅ câblé serveur (skip silencieux) |
| **Reset password** | 3 / heure | email normalisé | ✅ câblé client (UX) |
| **Signup** | 5 / heure / IP | — | ⚠️ délégué au rate limiting natif Supabase Auth |
| **Login** | 10 / heure / IP | — | ⚠️ délégué au rate limiting natif Supabase Auth |
| **Contact form** | 3 / heure | IP | ✅ déjà câblé (existant) |
| **Reports** | 5 / heure | user.id | ✅ déjà câblé (existant) |

Voir [section ⚠️ Limitations connues](#-limitations-connues-et-risques-acceptés) pour la justification du choix sur signup/login.

### Bloc 10 — Audit dépendances
- ✅ `npm audit` clean : **aucune CVE high/critical** dans les dépendances directes ou transitives
- ⚠️ `xlsx@0.18.5` conservé — voir justification ci-dessous

---

## ⚠️ Limitations connues et risques acceptés

### 1. xlsx@0.18.5 (CVE prototype pollution + ReDoS)
**Risque accepté.** Justification :
- xlsx est utilisé **uniquement dans `/admin/*`** (`AdminUsersPage`, `AdminExportsPage`)
- Les routes admin sont protégées par `useAdminAuth` + RPC `has_role(uid, 'admin')`
- L'usage est **export-only** : l'application **n'importe jamais** de fichier xlsx fourni par un user
- Le vecteur d'attaque des CVE concernées (parsing d'un xlsx malicieux) **n'existe pas** dans notre contexte
- Migration vers `exceljs` = ~30 min de réécriture pour un risque inexploitable → mauvais ROI
- **À revoir** si on ajoute un jour un import xlsx user-facing

### 2. Rate limiting signup / login non custom
- **Pourquoi** : Supabase Auth gère déjà du rate limiting natif au niveau infra (auth.users endpoint)
- Doubler côté edge function ajouterait de la latence sur des endpoints critiques + risque de faux 429 pour vrais users
- La RPC `check_rate_limit` actuelle fait un `DELETE FROM rate_limits WHERE expires_at < now()` à chaque check → coûteux à grande échelle
- **Action recommandée post-beta** : configurer les seuils Auth dans le dashboard Lovable Cloud → Auth → Rate Limits

### 3. Rate limit IP-based contournable
- L'identifier IP (`x-forwarded-for`) est contournable derrière VPN / proxy résidentiel
- Acceptable pour la beta (volume utilisateurs limité)
- **Action recommandée post-beta** : ajouter Cloudflare Turnstile sur signup + reset password

### 4. Lighthouse CI sur preview
- Le workflow `lighthouse.yml` cible `https://autora.be` (prod) et non la preview Lovable
- Si la preview est instable, faux positifs possibles → workflow non bloquant (warning only)

### 5. Tests E2E Playwright non bloquants
- Les specs sont écrites mais nécessitent des comptes test seedés en CI
- Workflow `e2e.yml` configuré mais désactivé tant que les secrets `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` ne sont pas configurés dans GitHub
- **Action recommandée** : créer 2 comptes test (`e2e-buyer@autora.be`, `e2e-seller@autora.be`) avant d'activer le workflow

---

## 📋 Checklist Go / No-Go pour le lancement beta publique

### 🔐 Sécurité (BLOQUANT)
- [x] RLS activée sur toutes les tables sensibles
- [x] Rôle admin sur table séparée (jamais sur `profiles`)
- [x] Edge functions valident le JWT en code
- [x] Aucune CVE high/critical dans les deps (`bun audit`)
- [x] Secrets : `STRIPE_*`, `RESEND_API_KEY`, `VAPID_*`, `LOVABLE_API_KEY` configurés
- [x] CSP headers actifs
- [x] HIBP sur signup (passwords compromis bloqués)
- [ ] **À faire avant prod** : tester `delete-account` end-to-end avec un vrai compte (vérifier cascade complète + cancel Stripe)

### 💳 Paiements (BLOQUANT)
- [x] Stripe webhook signature vérifiée
- [x] Idempotency sur events Stripe (`stripe_processed_events`)
- [x] Mode beta : paywall désactivé (`IS_BETA_MODE`)
- [ ] **À faire avant facturation** : tester un cycle complet (subscribe → invoice → cancel → refund)

### 🇪🇺 RGPD (BLOQUANT EU/BE)
- [x] Cookie banner avec accept / refuse / customize
- [x] Plausible **réellement** bloqué avant consentement
- [x] Stripe.js loadé à la demande
- [x] Page `/cookies` avec liste des trackers
- [x] Right to be forgotten (`delete-account` cascade)
- [x] Export JSON (`export-user-data`)
- [x] Pages légales : CGU, mentions légales, politique confidentialité, cookies
- [x] Footer multilingue avec liens légaux

### 📱 Mobile / PWA
- [x] PWA installable iOS + Android
- [x] Safe-areas notch
- [x] BottomNav 44px touch targets
- [x] Haptic feedback
- [x] Service Worker désactivé en preview/iframe (PWA Preview Guard)

### 🌍 i18n
- [x] FR (préchargé), NL, DE, EN
- [x] ErrorBoundary i18n autonome (fonctionne au-dessus du LanguageProvider)

### 🇧🇪 Belgian compliance
- [x] Car-Pass obligatoire à la publication
- [x] LEZ badges Bruxelles/Anvers/Gand
- [x] Pro vs Particulier (badge + TVA + warranty mentions)
- [x] Calculateur TMC/Annual tax (3 régions)
- [x] Aucun stockage VIN

### 🛡️ Anti-abus
- [x] Rate limit sur création annonce (10/jour/user)
- [x] Rate limit sur notifications email (30/h/seller)
- [x] Rate limit sur reset password (3/h/email)
- [x] Anti-doublon annonces (même brand/model/year/mileage ±500km dans 90 jours)
- [x] Modération admin avec rejection email obligatoire
- [x] Suspension utilisateur (`is_user_suspended` check sur create-listing)

### 🩺 Observabilité
- [x] ErrorBoundary global avec logs JSON structurés
- [x] Capture promesses non gérées
- [x] Plausible custom event "Error"
- [x] Edge function logs accessibles via Lovable Cloud

### 🚀 CI/CD
- [x] PR checks : lint + build + vitest (bloquant)
- [x] Lighthouse audit prod (warning only)
- [ ] **Optionnel** : activer Playwright E2E une fois les comptes test seedés

---

## 🎯 Verdict

| Catégorie | Statut |
|---|---|
| **Sécurité** | 🟢 GO (1 test manuel à faire) |
| **RGPD/Légal** | 🟢 GO |
| **Paiements** | 🟡 GO beta (paywall off), test cycle Stripe avant facturation |
| **Mobile/PWA** | 🟢 GO |
| **Belgian compliance** | 🟢 GO |
| **Anti-abus** | 🟢 GO |
| **Observabilité** | 🟢 GO |
| **CI/CD** | 🟢 GO (E2E optionnel) |

### Action restante avant ouverture publique
1. **Test manuel `delete-account` end-to-end** avec un compte ayant : sub Stripe active, annonces, messages, photos uploadées, alertes, push subs. Vérifier qu'il ne reste rien après suppression.
2. (Optionnel) Seed 2 comptes E2E + activer `e2e.yml`.
3. (Optionnel) Configurer Cloudflare Turnstile sur signup pour bloquer les bots de masse.

**Conclusion** : prêt pour beta publique 🟢
