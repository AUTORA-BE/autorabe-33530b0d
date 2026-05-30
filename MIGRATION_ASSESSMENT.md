# MIGRATION_ASSESSMENT.md
**Audit honnête : Lovable Cloud → Supabase externe (compte client)**
Mode lecture seule. Aucun fichier modifié. Toutes les affirmations sont sourcées (`chemin:ligne`). Les inconnues sont marquées **À VÉRIFIER**.

---

## Section 1 — Surface d'usage de `@lovable.dev/cloud-auth-js`

**Imports** — `rg "@lovable.dev/cloud-auth-js" src/` → **1 seul fichier** :
- [src/integrations/lovable/index.ts:3](src/integrations/lovable/index.ts:3)
  ```ts
  import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
  ```
  Wrapper de 38 lignes total. Expose `lovable.auth.signInWithOAuth(provider, opts)`. À l'intérieur :
  - [src/integrations/lovable/index.ts:15](src/integrations/lovable/index.ts:15) → `lovableAuth.signInWithOAuth(provider, { redirect_uri, extraParams })`
  - [src/integrations/lovable/index.ts:31](src/integrations/lovable/index.ts:31) → `supabase.auth.setSession(result.tokens)`

**Call sites côté app** — `rg "lovable\.auth" src/` → **2 hits seulement** :
- [src/features/auth/hooks/useAuth.ts:209](src/features/auth/hooks/useAuth.ts:209) — `signInWithGoogle` → `lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin })`
- [src/features/auth/hooks/useAuth.ts:234](src/features/auth/hooks/useAuth.ts:234) — `signInWithApple` → `lovable.auth.signInWithOAuth('apple', { redirect_uri: window.location.origin })`

**Méthodes Lovable Auth réellement appelées : 1** (`signInWithOAuth`).
**Tout le reste** (`signInWithPassword`, `signUp`, `signOut`, `resetPasswordForEmail`, `getSession`, `onAuthStateChange`, `resend`) passe déjà directement par `supabase.auth.*` natif dans `useAuth.ts` :
- [src/features/auth/hooks/useAuth.ts:29](src/features/auth/hooks/useAuth.ts:29) — `supabase.auth.onAuthStateChange`
- [src/features/auth/hooks/useAuth.ts:38](src/features/auth/hooks/useAuth.ts:38) — `supabase.auth.getSession`
- [src/features/auth/hooks/useAuth.ts:52](src/features/auth/hooks/useAuth.ts:52) — `supabase.auth.signInWithPassword`
- [src/features/auth/hooks/useAuth.ts:84](src/features/auth/hooks/useAuth.ts:84) — `supabase.auth.signUp`
- [src/features/auth/hooks/useAuth.ts:149](src/features/auth/hooks/useAuth.ts:149) — `supabase.auth.signOut`
- [src/features/auth/hooks/useAuth.ts:184](src/features/auth/hooks/useAuth.ts:184) — `supabase.auth.resetPasswordForEmail`
- [src/features/auth/hooks/useAuth.ts:259](src/features/auth/hooks/useAuth.ts:259) — `supabase.auth.resend`

**Verdict §1** : dépendance ultra-mince. **38 lignes à réécrire dans un seul fichier**, 2 call sites inchangeables (`lovable.auth.signInWithOAuth(...)` → `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })`). Pré-requis hors-code : déclarer les apps OAuth Google + Apple côté dashboard Supabase et coller les credentials (Apple Developer = friction admin réelle, ~24-48h).

---

## Section 2 — Surface d'usage de `LOVABLE_API_KEY` et autres deps Lovable côté edge functions

`rg "LOVABLE_API_KEY" supabase/functions/ src/` → **0 hit dans `src/`, 6 fichiers dans `supabase/functions/`**.

### 2.1 AI Gateway (vrai usage IA)

| Fichier | Endpoint | Modèle |
|---|---|---|
| [supabase/functions/car-chat/index.ts:67](supabase/functions/car-chat/index.ts:67) | `https://ai.gateway.lovable.dev/v1/chat/completions` | `google/gemini-2.5-flash` (stream) |
| [supabase/functions/explain-taxes/index.ts:96](supabase/functions/explain-taxes/index.ts:96) | idem | idem |

Le chatbot fiscal IA **n'est PAS le seul usage AI Gateway** — il y a aussi `car-chat` (chatbot véhicule général). Les deux frappent le même endpoint, même modèle, même format OpenAI-compatible.

### 2.2 Usages NON-AI de `LOVABLE_API_KEY` (secret partagé Lovable Cloud)

| Fichier | Ligne | Rôle |
|---|---|---|
| [supabase/functions/auth-email-hook/index.ts:148-152](supabase/functions/auth-email-hook/index.ts:148) | webhook | `verifyWebhookRequest({ secret: apiKey })` — HMAC pour vérifier que l'appel vient bien de Lovable |
| [supabase/functions/auth-email-hook/index.ts:96](supabase/functions/auth-email-hook/index.ts:96) | preview | `Authorization: Bearer ${apiKey}` (endpoint `/preview` interne) |
| [supabase/functions/handle-email-suppression/index.ts:51-55](supabase/functions/handle-email-suppression/index.ts:51) | webhook | `verifyWebhookRequest({ secret: apiKey })` — HMAC bounce/complaint |
| [supabase/functions/preview-transactional-email/index.ts:30-37](supabase/functions/preview-transactional-email/index.ts:30) | preview | Bearer égalité directe avec `apiKey` |
| [supabase/functions/process-email-queue/index.ts:269](supabase/functions/process-email-queue/index.ts:269) | **envoi email** | `sendLovableEmail({ ... }, { apiKey, sendUrl })` |

### 2.3 ⚠️ Découverte majeure manquée par toute analyse rapide

L'edge function `process-email-queue` **n'utilise pas `LOVABLE_API_KEY` comme simple bearer de cron** — elle l'utilise pour APPELER l'API Lovable d'envoi d'emails :

- [supabase/functions/process-email-queue/index.ts:1](supabase/functions/process-email-queue/index.ts:1) — `import { sendLovableEmail } from 'npm:@lovable.dev/email-js'`
- [supabase/functions/process-email-queue/index.ts:269](supabase/functions/process-email-queue/index.ts:269) — `{ apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') }` (commentaire l.266-268 : "falls back to the default Lovable API endpoint (https://api.lovable.dev)")

Autres deps npm Lovable côté functions (`rg "npm:@lovable" supabase/functions/`) :
- `@lovable.dev/email-js` → utilisé dans `auth-email-hook` (`parseEmailWebhookPayload`, l.3) et `process-email-queue` (`sendLovableEmail`, l.1)
- `@lovable.dev/webhooks-js` → utilisé dans `auth-email-hook` (l.4) et `handle-email-suppression` (l.2) pour `verifyWebhookRequest`

**Conséquence migration** : tout le pipeline d'envoi d'emails (auth + transactionnels via queue pgmq) passe par **l'API d'envoi de Lovable** (default `https://api.lovable.dev`). Migrer demande de :
1. Remplacer `sendLovableEmail()` par un appel direct à un provider (Resend / Mailgun / Postmark) — bonne nouvelle : 5 autres fonctions appellent **déjà** Resend directement (cf. §3), donc le pattern existe.
2. Remplacer `verifyWebhookRequest` (HMAC) par un check HMAC fait-main si on garde un appelant externe, OU supprimer ce flux et utiliser le `Send Email Hook` natif Supabase.
3. Remplacer `parseEmailWebhookPayload` (un parseur du payload spécifique Lovable) — devient inutile dès qu'on bascule sur le hook natif Supabase, qui a son propre format.

**Verdict §2** : la surface "Lovable API" côté edge functions est **plus large** que les seuls appels IA. Au total ~3-4 endroits à réécrire en logique non-Lovable (1 AI gateway, 2 webhooks HMAC, 1 envoi email).

---

## Section 3 — Inventaire des Edge Functions

**Total** : 30 fonctions (hors `_shared`), **4 958 lignes** (mesurées via `wc -l`).

Tableau extrait par grep `Deno.env.get` + `fetch(` (lecture rapide ; non exhaustif pour les fonctions non lues intégralement, marquées "À VÉRIFIER").

| Fonction | Secrets utilisés | Endpoints externes | Auth |
|---|---|---|---|
| `auth-email-hook` | LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | aucun externe — enqueue local | HMAC Lovable, JWT off |
| `car-chat` | LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | `ai.gateway.lovable.dev` | JWT off |
| `check-rate-limit` | SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | aucun | À VÉRIFIER (JWT default) |
| `check-subscription` | STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Stripe API | JWT off |
| `create-boost-checkout` | STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | Stripe API | À VÉRIFIER |
| `create-checkout` | STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY | Stripe API | JWT off |
| `create-listing` | SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | aucun | À VÉRIFIER |
| `customer-portal` | STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Stripe API | JWT off |
| `delete-account` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY | Stripe API | JWT off |
| `dynamic-sitemap` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | aucun | JWT off |
| `expire-boosts` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY | `api.resend.com` (via SDK Resend) | À VÉRIFIER |
| `explain-taxes` | LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | `ai.gateway.lovable.dev` | À VÉRIFIER |
| `export-user-data` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | aucun | JWT off |
| `get-upload-url` | SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | aucun | À VÉRIFIER |
| `get-vapid-public-key` | VAPID_PUBLIC_KEY | aucun | JWT off |
| `handle-email-suppression` | LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | aucun | HMAC Lovable, JWT off |
| `handle-email-unsubscribe` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | aucun | JWT off |
| `match-new-vehicle` | SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, RESEND_API_KEY | `api.resend.com` (fetch direct) | JWT off |
| `notify-listing-status` | RESEND_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | Resend SDK | JWT off |
| `notify-reporter` | RESEND_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | Resend SDK | JWT off |
| `notify-seller` | SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | ❌ pas d'externe ; appelle `send-transactional-email` en interne | JWT off |
| `preview-transactional-email` | LOVABLE_API_KEY | aucun | Bearer Lovable, JWT off |
| `process-email-queue` | LOVABLE_API_KEY, LOVABLE_SEND_URL (opt.), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | **`api.lovable.dev` via `sendLovableEmail`** | JWT on (`config.toml:29`) — service_role obligatoire |
| `send-contact-email` | RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | `api.resend.com` (fetch direct) | JWT off |
| `send-push-notification` | VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | endpoints push browser | JWT off |
| `send-transactional-email` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | aucun direct — enqueue pgmq | JWT on (`config.toml:37`) — service_role obligatoire |
| `sitemap-index` | — | aucun | JWT off |
| `stripe-webhook` | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Stripe API (verify) | JWT off |
| `verify-car-pass` | SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | À VÉRIFIER (parsing PDF Car-Pass — éventuellement appel externe à car-pass.be) | À VÉRIFIER |
| `_shared/cors.ts` (lib) | ALLOWED_ORIGINS | n/a | n/a |

### 3.1 Architecture email à deux pipelines

**Pipeline A — Queue pgmq + Lovable email API** (auth + transactionnels brandés Elite Green) :
- `auth-email-hook` → enqueue `auth_emails` (pgmq) → cron pg_cron → `process-email-queue` → `sendLovableEmail()` → `api.lovable.dev`
- `send-transactional-email` (idempotent, vérifie `suppressed_emails`, gère unsubscribe token) → enqueue `transactional_emails` → idem

**Pipeline B — Resend direct** (notifications spécifiques, code legacy/parallèle) :
- `expire-boosts`, `notify-listing-status`, `notify-reporter`, `match-new-vehicle`, `send-contact-email` → fetch direct `api.resend.com`

L'existence des deux pipelines est une **bonne nouvelle pour la migration** : le pattern Resend est déjà codé, il "suffit" de basculer le pipeline A vers Resend (ou tout autre provider) pour s'affranchir de `@lovable.dev/email-js`. **À VÉRIFIER** : décider si on fusionne les deux pipelines (recommandé) ou si on garde les notifications Resend directes telles quelles (plus rapide mais code dupliqué).

### 3.2 ⚠️ Infra non-migrée par `supabase db push`

[supabase/migrations/20260323234838_email_infra.sql:272-292](supabase/migrations/20260323234838_email_infra.sql:272) :
```
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
--
-- 1. VAULT SECRET 'email_queue_service_role_key'
-- 2. CRON JOB 'process-email-queue' (5-second interval, net.http_post)
```

**Conséquence concrète** : un `supabase db push` sur un nouveau projet **ne créera ni le secret Vault, ni le cron job**. L'envoi d'emails sera silencieusement cassé après migration tant que ces 2 items ne sont pas recréés manuellement (10 min de travail mais facile à oublier).

---

## Section 4 — Inventaire des migrations SQL

`ls supabase/migrations | wc -l` → **82 fichiers**, **3 552 lignes** au total (`wc -l`).

Comptages bruts (`grep -c "^CREATE …"` sur tout `supabase/migrations/`) :

| Élément | Occurrences |
|---|---:|
| `CREATE TABLE` (début de ligne) | **31** |
| `CREATE POLICY` / `CREATE OR REPLACE POLICY` | **186** (avec redéfinitions) |
| `CREATE OR REPLACE FUNCTION` / `CREATE FUNCTION` | **34** |
| `CREATE TRIGGER` / `CREATE OR REPLACE TRIGGER` | **20** |
| `CREATE INDEX` / `CREATE UNIQUE INDEX` | **65** |
| `CREATE EXTENSION` | **8 lignes** (extensions distinctes : `pg_cron`, `pg_net`, `supabase_vault`, `pgmq`, `pg_trgm`, `postgis` — toutes dispo sur Supabase managé) |

Note : ces comptages incluent les redéfinitions itératives (Lovable génère beaucoup de micro-migrations). Le nombre de tables uniques en `public` est probablement ~30. **À VÉRIFIER** via `\dt public.*` sur le projet runtime.

### 4.1 Storage buckets (`INSERT INTO storage.buckets`)

7 buckets distincts créés via migrations :
- [supabase/migrations/20260115025349…sql:2](supabase/migrations/20260115025349_6aa36e33-53c5-4a41-a191-44488daa41ae.sql:2) — `brand-logos` (public, 1 MB, SVG/PNG/WEBP)
- [supabase/migrations/20260119001320…sql:2](supabase/migrations/20260119001320_8b2a4882-a482-4e3d-80a3-4a763b03a236.sql:2) — `car-photos` (public)
- [supabase/migrations/20260122124852…sql:2](supabase/migrations/20260122124852_181eb952-c5e9-40a2-bce4-93f69bce479e.sql:2) — `avatars` (public)
- [supabase/migrations/20260122125112…sql:6](supabase/migrations/20260122125112_e4a76baa-1325-4e02-bf20-fcd6a46a4e08.sql:6) — `chat-images` (public)
- [supabase/migrations/20260412133441…sql:8](supabase/migrations/20260412133441_bf21b63b-6715-44f8-affc-2e4510f1d2b3.sql:8) — `vehicle-photos` (public)
- [supabase/migrations/20260412132708…sql:3](supabase/migrations/20260412132708_b17086e4-e98a-459d-ba16-340b030d4905.sql:3) — `car-pass` (créé public, repassé private en [20260423205529:37](supabase/migrations/20260423205529_53540116-88e6-485c-bac6-66f7a1e8d3a8.sql:37))
- [supabase/migrations/20260512100001_dealer_kyc.sql:80](supabase/migrations/20260512100001_dealer_kyc.sql:80) — `dealer-kyc` (config spécifique)

Les buckets se créent au `db push` (avec `ON CONFLICT DO NOTHING`), donc rejouables sans heurts. Migration du **contenu** réel (photos d'annonces déjà uploadées) est un autre sujet — voir §7.

### 4.2 Références à `auth.users` (`rg "auth\.users" supabase/migrations/`)

**9 références** :

| Fichier:ligne | Type | Détail |
|---|---|---|
| [20251213133053…sql:13](supabase/migrations/20251213133053_e4531779-870c-46e4-a89f-337c9abe743d.sql:13) | FK | `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE` (profiles) |
| [20251213134301…sql:5,6,21](supabase/migrations/20251213134301_bc7ab451-1636-4991-a826-0a941ae4bc9f.sql:5) | FK | `buyer_id`, `seller_id`, `sender_id REFERENCES auth.users(id)` |
| [20251213144514…sql:5,34](supabase/migrations/20251213144514_d7dfa457-071d-421e-ad11-daee50f5fa68.sql:5) | FK | `viewer_id`, `user_id REFERENCES auth.users(id)` |
| [20251213150548…sql:51](supabase/migrations/20251213150548_e63802ec-5a00-4f9f-b0a9-54c7cdd7f7fd.sql:51) | Trigger | `AFTER INSERT ON auth.users` (create profile) |
| [20260117132907…sql:7](supabase/migrations/20260117132907_3d854071-5b66-4818-8203-0fd3c944aad1.sql:7) | FK | `user_id REFERENCES auth.users(id)` |
| [20260121003808…sql:54](supabase/migrations/20260121003808_ceb5cfef-2e6a-42ef-8af8-9be89b324a05.sql:54) | Trigger | `AFTER INSERT ON auth.users` |
| **[20260419221627…sql:7](supabase/migrations/20260419221627_93ee8a30-0a6a-4e6b-b92c-13c928f4e876.sql:7)** | **INSERT** | **`INSERT INTO auth.users` (user démo, mot de passe `AutoRADemo2026!` hashé via `crypt('…', gen_salt('bf'))`)** |
| [20260504191835_car_pass_async_verification.sql:54](supabase/migrations/20260504191835_car_pass_async_verification.sql:54) | FK | `requested_by uuid REFERENCES auth.users(id)` |
| [20260505120000_contact_messages.sql:13](supabase/migrations/20260505120000_contact_messages.sql:13) | FK | `user_id uuid REFERENCES auth.users(id)` |
| [20260512100001_dealer_kyc.sql:6,12](supabase/migrations/20260512100001_dealer_kyc.sql:6) | FK | `user_id`, `reviewer_id REFERENCES auth.users(id)` |

**Notes** :
- Les FK directes vers `auth.users(id)` **fonctionnent sur Supabase managé standard** (l'instruction "NEVER reference auth.users" du guide Lovable interne est conservatrice, pas un bloqueur SQL). Les rejouer fonctionnera.
- La migration `20260419221627` (insert démo) **peut échouer** sur Supabase fraîchement provisionné si l'extension `pgcrypto` n'est pas dispo (elle l'est par défaut sur Supabase managé, donc OK), ou si la version du schéma `auth.users` change (les colonnes `confirmation_token`, `email_change_token_new`, `recovery_token` sont stables actuellement mais ne sont pas garanties par GoTrue). **À VÉRIFIER** sur le projet cible.

### 4.3 Realtime publication (§ traité aussi en §6)

`rg "ALTER PUBLICATION supabase_realtime" supabase/migrations/` :
- [20251213134028…sql:2](supabase/migrations/20251213134028_a054dae2-b22d-4a8b-8870-4110aac42e0f.sql:2) — `ADD TABLE public.car_listings`
- [20251213134301…sql:83,84](supabase/migrations/20251213134301_bc7ab451-1636-4991-a826-0a941ae4bc9f.sql:83) — `ADD TABLE public.messages`, `ADD TABLE public.conversations`
- [20260409184602…sql:1](supabase/migrations/20260409184602_f93414e5-ef9a-484b-930e-6a9f3dfd5bcc.sql:1) — `ADD TABLE public.reports`
- [20260414175129…sql:1](supabase/migrations/20260414175129_693dd5b8-6269-47da-a493-997ae3bcf08a.sql:1) — `DROP TABLE public.reports`
- [20260423205529…sql:80](supabase/migrations/20260423205529_53540116-88e6-485c-bac6-66f7a1e8d3a8.sql:80) — `DROP TABLE public.car_listings` (conditionnel)

**État final après rejeu** : `messages` + `conversations` publiés ; `car_listings` et `reports` **non publiés**.

---

## Section 5 — `@vercel/speed-insights` et autres résidus Vercel

### Résultats des recherches

- `grep -i "@vercel/speed-insights" package.json` → **0 hit**. Le package n'est PAS dans les dépendances.
- `rg "@vercel/speed-insights|SpeedInsights" src/` → **0 hit**.
- `ls vercel.json` → **absent** (`ls` retourne "no match").
- `ls .vercel/` → **absent**.
- `.github/workflows/` → `ci.yml`, `e2e.yml`, `lighthouse.yml` — **aucun workflow Vercel actif**.

### Résidus tout de même présents

- [api/health.ts:1](api/health.ts:1) — `import type { VercelRequest, VercelResponse } from "@vercel/node";`
  Mais `@vercel/node` n'est PAS dans `package.json` non plus. Ce fichier ne compilerait pas tel quel ; il existe en tant que reliquat de l'ancien déploiement Vercel décrit dans `DEPLOYMENT.md`.
- [deploy.sh:28,119-125](deploy.sh:28) — `command -v vercel` et `vercel --prod --yes`. Script de déploiement Vercel, **non câblé à CI** (les workflows GitHub ne l'appellent pas).
- [DEPLOYMENT.md](DEPLOYMENT.md), [LAUNCH_CHECKLIST.md:10,60,67-68](LAUNCH_CHECKLIST.md:10), [LAUNCH_CHECKLIST.md:60](LAUNCH_CHECKLIST.md:60) — toute la doc parle de Vercel. C'est de la **doc legacy non synchronisée** avec l'état réel.
- [AUDIT.md:48-49](AUDIT.md:48) — l'AUDIT interne signale déjà que le RGPD mentionne "Vercel" alors qu'on tourne sur Lovable Cloud (item H2 noté à corriger).

### Conclusion §5

`@vercel/speed-insights` **n'est pas installé**. Aucun déploiement Vercel n'est actif. Tout ce qui touche Vercel dans le repo (`api/health.ts`, `deploy.sh`, `DEPLOYMENT.md`, `LAUNCH_CHECKLIST.md`) est **legacy orphelin** — vestige d'une intention de déploiement Vercel + Supabase externe qui n'a pas été menée à terme. La prod tourne actuellement sur `*.lovable.app` (Lovable Cloud, avec CDN Cloudflare d'après [AUDIT.md:49](AUDIT.md:49)).

Aucun impact sur la migration. C'est du nettoyage cosmétique (~30 min) à faire **avant ou après**, indépendamment.

---

## Section 6 — Realtime : subscriptions client vs publications DB

### 6.1 Côté client (`rg "\.channel\(" src/`) — **8 channels**

| Hook / Composant | Channel | Mécanisme | Tables écoutées |
|---|---|---|---|
| [src/hooks/useMultipleOnlineStatus.ts:11](src/hooks/useMultipleOnlineStatus.ts:11) | `global-presence` | Presence | n/a |
| [src/features/admin/hooks/useAdminRealtime.ts:16](src/features/admin/hooks/useAdminRealtime.ts:16) | `admin-overview-realtime` | postgres_changes | **`car_listings`** (l.20) |
| [src/features/messaging/hooks/useOnlineStatus.ts:33](src/features/messaging/hooks/useOnlineStatus.ts:33) | `presence-${conversationId}` | Presence | n/a |
| [src/features/messaging/hooks/useTypingIndicator.ts:50,83](src/features/messaging/hooks/useTypingIndicator.ts:50) | `typing-${conversationId}` | Broadcast | n/a |
| [src/features/messaging/hooks/useUnreadMessages.ts:84](src/features/messaging/hooks/useUnreadMessages.ts:84) | `unread-messages-count` | postgres_changes | `messages` |
| [src/features/messaging/hooks/useConversations.ts:128](src/features/messaging/hooks/useConversations.ts:128) | `conversations-updates` | postgres_changes | `conversations` |
| [src/features/messaging/hooks/useMessageNotifications.ts:47](src/features/messaging/hooks/useMessageNotifications.ts:47) | `global-message-notifications` | postgres_changes | `messages` |
| [src/components/ChatWindow.tsx:144](src/components/ChatWindow.tsx:144) | `messages-${conversationId}` | postgres_changes | `messages` |

### 6.2 Côté DB (état final après rejeu des migrations)

Tables publiées dans `supabase_realtime` : **`public.messages`, `public.conversations`** seulement.

### 6.3 Incohérence pré-existante (non liée à la migration)

[src/features/admin/hooks/useAdminRealtime.ts:20](src/features/admin/hooks/useAdminRealtime.ts:20) écoute `postgres_changes` sur `car_listings`, mais [20260423205529…sql:80](supabase/migrations/20260423205529_53540116-88e6-485c-bac6-66f7a1e8d3a8.sql:80) **retire `car_listings`** de la publication (avec le commentaire l.72 : *"le browsing utilise React Query, pas Realtime"*).

Sur le projet courant et après migration : l'admin **ne reçoit donc PAS** les notifications temps-réel de nouvelles annonces. C'est un bug pré-existant (silencieux : la subscribe() réussit mais aucun event n'arrive). À traiter indépendamment de la migration.

### 6.4 Conséquence pour la migration

Les 4 lignes `ALTER PUBLICATION` se rejouent en quelques secondes via `supabase db push`. **Aucun blocage**. Les channels presence + broadcast n'ont aucune config DB à recréer (ils sont gérés côté gateway Realtime de Supabase). Test E2E nécessaire post-migration : messaging temps réel sur un parcours acheteur ↔ vendeur.

---

## Section 7 — Estimation horaire honnête

**Hypothèses** : ingénieur senior fullstack qui connaît déjà le projet, env. local prêt, accès admin au nouveau projet Supabase, Apple Developer + Google OAuth credentials déjà disponibles.

| Axe | Détail | Fourchette |
|---|---|---:|
| **Schéma + extensions** | `supabase db push` des 82 migrations sur projet vide (~10-15 min). Extensions `pg_cron`/`pg_net`/`supabase_vault`/`pgmq`/`pg_trgm`/`postgis` toutes dispo sur Supabase managé. **Risque** : migration `20260419221627` (`INSERT INTO auth.users`) — pgcrypto dispo par défaut, mais structure `auth.users` non garantie stable côté GoTrue. **Mitigation** : commenter la migration démo, recréer manuellement le user. | **1-2 h** |
| **Données réelles (auth.users + tables app + storage)** | Si le projet a déjà des utilisateurs en prod (`autorabe.lovable.app`) : export `pg_dump --schema=auth --schema=public --schema=storage` puis import. **Risque** : tokens de session invalidés (les users devront se reconnecter), hashs bcrypt portables OK, mais les colonnes internes GoTrue (`recovery_token`, `instance_id`) doivent matcher. Buckets storage : 7 buckets à recréer + sync des fichiers (`rclone` ou script `aws s3 sync`-like). **À VÉRIFIER** : volumétrie réelle non lisible depuis le repo. | **4-10 h** |
| **Cron + Vault non-migrés** | Recréer manuellement le secret Vault `email_queue_service_role_key` + le job pg_cron `process-email-queue` (5 s d'intervalle, `net.http_post` vers l'edge function). Non géré par `db push`. | **0.5-1 h** |
| **Edge Functions (30 fonctions, 4 958 lignes)** | Redéploiement via `supabase functions deploy` (script `deploy.sh` existe). Re-setter ~12 secrets (`LOVABLE_API_KEY` à renommer ou supprimer, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `ALLOWED_ORIGINS`, etc.). Reconfigurer le webhook Stripe URL côté dashboard Stripe (risque fenêtre noire). Reconfigurer le `Send Email Hook` Supabase pour pointer vers `auth-email-hook` (ou désactiver le hook custom). | **3-5 h** |
| **Refactor auth (`@lovable.dev/cloud-auth-js`)** | Réécrire [src/integrations/lovable/index.ts](src/integrations/lovable/index.ts) (38 lignes) en `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })` natif. 2 call sites à ajuster dans `useAuth.ts:209,234`. Configurer apps OAuth Google + Apple dans Supabase Auth Providers. | **1-2 h** code + **2-6 h** config OAuth Apple (délai admin Apple Developer ~24-48h potentiel) |
| **Refactor AI Gateway** | Remplacer `https://ai.gateway.lovable.dev/v1/chat/completions` dans 2 fichiers ([car-chat:67](supabase/functions/car-chat/index.ts:67), [explain-taxes:96](supabase/functions/explain-taxes/index.ts:96)) par Google AI Studio direct (clé `GEMINI_API_KEY`) ou OpenRouter (compatible OpenAI). ~30 lignes diff. | **1-2 h** |
| **Refactor pipeline email (`@lovable.dev/email-js`)** | Remplacer `sendLovableEmail(...)` dans [process-email-queue:269](supabase/functions/process-email-queue/index.ts:269) par un appel Resend (le pattern existe déjà dans 5 autres fonctions). Remplacer `parseEmailWebhookPayload` (Lovable) par le parsing du payload `Send Email Hook` natif Supabase dans [auth-email-hook:3](supabase/functions/auth-email-hook/index.ts:3). Remplacer `verifyWebhookRequest` (HMAC Lovable) dans [auth-email-hook:4](supabase/functions/auth-email-hook/index.ts:4) et [handle-email-suppression:2](supabase/functions/handle-email-suppression/index.ts:2) par un check HMAC fait-main OU supprimer `handle-email-suppression` si on bascule sur les webhooks Resend natifs. Configurer Resend (domaine `notify.autora.be` à re-vérifier DKIM/SPF/DMARC). | **3-6 h** |
| **Tests E2E + smoke tests** | Rejouer la suite Playwright (`e2e/*.spec.ts`). Smoke test manuel : signup → confirm email → login → OAuth Google → OAuth Apple → créer annonce → upload photo → messagerie temps réel → checkout Stripe → reset password. | **2-4 h** |
| **Sous-total brut** | | **17.5-38 h** |
| **Marge de sécurité (+40-50%)** | Inconnues sur volumétrie données réelles, friction Apple Developer, propagation DNS si custom domain (`autora.be`), incidents Stripe webhook (signing key change), reconfig DKIM Resend, et bugs latents (ex. [useAdminRealtime](src/features/admin/hooks/useAdminRealtime.ts:14) cassé) | **+8-19 h** |
| **TOTAL réaliste** | | **~25 à 55 h** (≈ **3 à 7 jours ouvrés**) |

---

## Section 8 — Verdict final

### 🅱️ **RESTER SUR LOVABLE CLOUD ET MIGRER POST-LAUNCH**

#### Pourquoi pas MIGRER MAINTENANT

1. **Volume incompressible**. 25-55 h, soit 3-7 jours pleins d'un dev senior. Pré-launch, ce temps a une valeur produit supérieure ailleurs (finitions UX, polish, contenu, RGPD — voir [AUDIT.md](AUDIT.md) qui liste 5 items H1/H2 à boucler).

2. **Friction Apple Developer**. La création d'app Apple OAuth peut prendre 24-48h d'aller-retour admin (vérification team ID, Sign-In with Apple capability, domain verification). Si on cale sur ça, on bloque le lancement.

3. **Risques de régression non triviaux** pendant une fenêtre où on a déjà du stress :
   - **Stripe webhook secret** doit être tourné côté dashboard Stripe → fenêtre où des `checkout.session.completed` peuvent être perdus si la rotation est mal séquencée. Probabilité de doublons d'abonnements / boosts non confirmés non nulle.
   - **Pipeline email** : 6 endpoints Lovable à remplacer (`sendLovableEmail`, `verifyWebhookRequest` ×2, `parseEmailWebhookPayload`, Bearer preview ×2). Si on rate le HMAC ou la signature webhook, plus aucun email d'auth n'arrive → personne ne peut s'inscrire.
   - **Realtime messaging** : 8 channels client à valider E2E, dont du presence et broadcast qui ne sont pas testés en CI.
   - **Cron + vault** non-migrés par `db push` ([20260323234838:272-292](supabase/migrations/20260323234838_email_infra.sql:272)) — il faut explicitement les recréer après bascule. Oubli silencieux = 0 emails envoyés.
   - **Migration `INSERT INTO auth.users`** ([20260419221627](supabase/migrations/20260419221627_93ee8a30-0a6a-4e6b-b92c-13c928f4e876.sql)) risquée sur nouveau projet.

#### Pourquoi pas RESTER LOVABLE (à jamais)

La dépendance "dure" à `@lovable.dev/cloud-auth-js` côté client est **minuscule** : 38 lignes dans 1 fichier, 2 call sites, 1 méthode (cf. §1). Refuser de migrer "pour toujours" sur cette base serait techniquement injustifié. Les autres deps Lovable (`email-js`, `webhooks-js`, AI Gateway) sont remplaçables en 1-2 jours d'ingénierie focalisée.

Lovable Cloud reste un layer Supabase + extras (AI Gateway, email API, OAuth wrapper, branding emails) — pas un verrou architectural.

#### Pourquoi MIGRER POST-LAUNCH a du sens

- Une fois en prod stable, on peut planifier une fenêtre de maintenance courte (1-2h), faire un dump `pg_dump`, basculer en mode read-only annoncé aux users, importer sur le nouveau Supabase, redéployer le frontend, et rollback testé d'avance.
- À ce stade on connaîtra la **volumétrie réelle** des données (impossible à estimer depuis le repo aujourd'hui).
- Si Lovable Cloud sert bien pendant 4-8 semaines de production, on aura aussi la donnée pour décider si une migration est encore strictement utile (coût, contrôle, conformité RGPD `Confidentialite.tsx`).

### Recommandation actionnable (par ordre d'exécution)

#### Maintenant — pré-launch (< 1 h, gratuit)
1. Créer le projet Supabase externe vide sur le compte client.
2. Provisionner les apps OAuth Google + Apple **dès aujourd'hui** (Apple = délai admin). Garder les credentials de côté.
3. Créer comptes Resend / Stripe sur le compte client si pas déjà fait — ré-utiliser les API keys existantes le jour J.
4. Nettoyer les vestiges Vercel ([deploy.sh](deploy.sh), [DEPLOYMENT.md](DEPLOYMENT.md), [api/health.ts](api/health.ts), mentions dans [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) et [src/pages/Confidentialite.tsx](src/pages/Confidentialite.tsx) per [AUDIT.md:49](AUDIT.md:49)). 30 min, indépendant de la migration.
5. Fixer le bug pré-existant [useAdminRealtime.ts:20](src/features/admin/hooks/useAdminRealtime.ts:20) (subscription `car_listings` sur table non publiée Realtime). 15 min.

#### Semaine 2-4 post-launch — fenêtre creuse
6. Exécuter la migration sur la fourchette **25-55 h budgétée**, sur 3-7 jours.
7. Plan de rollback : DNS pointe encore vers Lovable Cloud, snapshot DB Lovable conservé 7 jours, bascule frontend déployable en < 5 min via revert Git.
8. Smoke test E2E complet sur le nouveau backend pendant 24h en mode dual-write (si pertinent) ou direct cutover (si faible trafic).

### Points marqués À VÉRIFIER (rappel)

- Volumétrie réelle des données prod sur Lovable Cloud — non lisible depuis le repo.
- Comportement actuel de l'auth email hook côté Lovable Cloud : qui appelle `auth-email-hook` ? Quelle URL ? — non lisible depuis le repo.
- Migration `20260419221627` (`INSERT INTO auth.users`) sur Supabase fraîchement provisionné — à tester d'abord sur un projet jetable.
- Endpoint externe éventuel dans `verify-car-pass` (parsing PDF officiel Car-Pass) — n'a pas été lu en détail.
- Comportement du custom domain `autora.be` — DNS pointe vers où aujourd'hui ? Lovable Cloud + Cloudflare ? — pas dans le repo.
- Présence de tests RLS qui valident le rejeu sur Supabase externe : il existe [supabase/tests/rls.test.sql](supabase/tests/rls.test.sql), pas lu en détail.

---

*Audit réalisé en mode lecture seule à partir du contenu du repo. Aucun fichier modifié. Aucun commit créé.*
