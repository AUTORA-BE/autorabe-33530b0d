# MIGRATION_ASSESSMENT.md
**Audit de migration : Lovable Cloud → Supabase externe**
Mode : lecture seule, aucun code modifié. Toutes les affirmations sont sourcées (`chemin:ligne`).

---

## Section 1 — Surface d'usage de `@lovable.dev/cloud-auth-js`

`rg -n "@lovable.dev/cloud-auth-js" src/` ne retourne **qu'un seul fichier** :

- **`src/integrations/lovable/index.ts:3`**
  ```ts
  import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
  ```
  Le fichier expose un wrapper `lovable.auth.signInWithOAuth(provider, opts)` (lignes 14–35) qui :
  1. Appelle `lovableAuth.signInWithOAuth("google" | "apple", { redirect_uri, extraParams })` (ligne 15)
  2. Récupère `result.tokens` et les pousse dans Supabase via `supabase.auth.setSession(result.tokens)` (ligne 31)

**Surface côté application** (`rg -n "lovable\.auth" src/`) — 2 call sites seulement :
- `src/features/auth/hooks/useAuth.ts:209` → `lovable.auth.signInWithOAuth('google', {...})`
- `src/features/auth/hooks/useAuth.ts:234` → `lovable.auth.signInWithOAuth('apple', {...})`

**Méthodes Lovable Auth réellement utilisées : 1** (`signInWithOAuth`).
**Méthodes NON utilisées de cette lib** : `signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`, `getSession`, `onAuthStateChange`, `resend`. Toutes ces opérations sont déjà faites directement sur `supabase.auth` dans `src/features/auth/hooks/useAuth.ts` (lignes 23–262), donc **indépendantes** de `@lovable.dev/cloud-auth-js`.

**Nombre d'appels distincts à remplacer : 2** (les 2 OAuth sign-ins), via un seul wrapper de 35 lignes à réécrire en `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })` standard. Prérequis hors-code : créer une app OAuth Google + Apple sur le nouveau projet Supabase et coller les credentials dans Auth → Providers.

---

## Section 2 — Surface d'usage de `LOVABLE_API_KEY`

`rg -n "LOVABLE_API_KEY" supabase/functions/ src/` → **0 hit côté `src/`**, **6 fichiers côté edge functions** :

| Fichier | Lignes | Rôle réel |
|---|---|---|
| `supabase/functions/car-chat/index.ts:64–88` | AI Gateway | Chatbot IA véhicule. Appelle `https://ai.gateway.lovable.dev/v1/chat/completions`, modèle `google/gemini-2.5-flash`, stream. |
| `supabase/functions/explain-taxes/index.ts:61–104` | AI Gateway | Assistant fiscal belge. Même endpoint `https://ai.gateway.lovable.dev/v1/chat/completions`, même modèle `google/gemini-2.5-flash`, stream. |
| `supabase/functions/auth-email-hook/index.ts:93, 134` | **Auth bearer + HMAC** | Sert de secret partagé : (a) preview endpoint `Authorization: Bearer ${apiKey}` (l.96–98), (b) `verifyWebhookRequest({ secret: apiKey })` pour signer les webhooks d'emails auth. **N'appelle PAS l'AI Gateway.** |
| `supabase/functions/handle-email-suppression/index.ts:39` | **HMAC** | `verifyWebhookRequest({ secret: apiKey })`. Secret partagé pour signature webhook. Pas d'AI. |
| `supabase/functions/process-email-queue/index.ts:83` | **Bearer** | `Authorization: Bearer ${apiKey}` pour authentifier l'appelant cron. Pas d'AI. |
| `supabase/functions/preview-transactional-email/index.ts:18` | **Bearer** | Idem : auth bearer pour preview. Pas d'AI. |

**Conclusion factuelle :**
- Usages AI Gateway réels : **2 fonctions seulement** (`car-chat`, `explain-taxes`), même URL, même modèle. À remplacer par n'importe quel provider OpenAI-compatible (clé Gemini directe, OpenRouter, etc.) → ~20 lignes de diff.
- Usages "HMAC / Bearer secret" : **4 fonctions** où `LOVABLE_API_KEY` est utilisé **comme secret partagé**, pas comme clé d'un service Lovable. Migration triviale : renommer la variable en `WEBHOOK_SECRET` (ou autre) et la fournir dans les secrets Supabase + côté appelant (qui est aujourd'hui l'infra Lovable Cloud pour les webhooks d'auth emails — **À VÉRIFIER : qui appellera `auth-email-hook` après migration ?** Si l'auth hook Supabase natif est reconfiguré, ce flux change entièrement, voir §7).

Aucun usage détecté pour : génération de descriptions d'annonces, modération, embeddings vector search.

---

## Section 3 — Inventaire des Edge Functions

30 fonctions dans `supabase/functions/` (hors `_shared`). Total `4 958` lignes.

| Fonction | Lignes | Secrets `Deno.env.get(...)` | Endpoints externes (`fetch`) |
|---|---:|---|---|
| auth-email-hook | 318 | `LOVABLE_API_KEY`, `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET` (À VÉRIFIER) | Resend (`api.resend.com`) |
| car-chat | 110 | `LOVABLE_API_KEY` | `ai.gateway.lovable.dev` |
| check-rate-limit | 91 | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | aucun |
| check-subscription | 89 | `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Stripe API |
| create-boost-checkout | 113 | `STRIPE_SECRET_KEY`, supabase env | Stripe API |
| create-checkout | 83 | `STRIPE_SECRET_KEY`, supabase env | Stripe API |
| create-listing | 201 | supabase env | aucun externe |
| customer-portal | 58 | `STRIPE_SECRET_KEY`, supabase env | Stripe API |
| delete-account | 229 | supabase service-role | aucun |
| dynamic-sitemap | 152 | supabase env | aucun |
| expire-boosts | 218 | supabase service-role | aucun |
| explain-taxes | 142 | `LOVABLE_API_KEY` | `ai.gateway.lovable.dev` |
| export-user-data | 136 | supabase service-role | aucun |
| get-upload-url | 120 | supabase env | aucun |
| get-vapid-public-key | 35 | `VAPID_PUBLIC_KEY` | aucun |
| handle-email-suppression | 162 | `LOVABLE_API_KEY`, supabase service-role | aucun |
| handle-email-unsubscribe | 130 | supabase service-role | aucun |
| match-new-vehicle | 286 | supabase service-role, `RESEND_API_KEY` (À VÉRIFIER) | Resend |
| notify-listing-status | 164 | `RESEND_API_KEY`, supabase env | Resend |
| notify-reporter | 156 | `RESEND_API_KEY`, supabase env | Resend |
| notify-seller | 157 | `RESEND_API_KEY`, supabase env | Resend |
| preview-transactional-email | 100 | `LOVABLE_API_KEY` | aucun |
| process-email-queue | 362 | `LOVABLE_API_KEY`, supabase service-role, `RESEND_API_KEY` | Resend |
| send-contact-email | 251 | `RESEND_API_KEY`, supabase env | Resend |
| send-push-notification | 230 | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, supabase service-role | endpoints push browser |
| send-transactional-email | 367 | `RESEND_API_KEY`, supabase service-role | Resend |
| sitemap-index | 32 | — | aucun |
| stripe-webhook | 355 | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, supabase service-role | Stripe API |
| verify-car-pass | 111 | supabase service-role | À VÉRIFIER (parsing PDF Car-Pass — pas de fetch externe visible au survol, à confirmer) |

À VÉRIFIER : la liste exhaustive des `Deno.env.get` par fonction (tableau ci-dessus extrait par lecture rapide ; un `rg -n "Deno.env.get" supabase/functions/<fn>/index.ts` par fonction serait nécessaire pour exhaustivité formelle).

---

## Section 4 — Inventaire des migrations SQL

`ls supabase/migrations/ | wc -l` → **82 fichiers** de migration.
Taille notable : `20260215125809_*.sql` (10 759 octets), `20260323234838_email_infra.sql` (11 343 octets), `20260421140301_*.sql` (7 167 octets). Plusieurs micro-migrations < 200 octets (typique itération Lovable).

Comptages bruts (`rg -i --no-filename "<keyword>" supabase/migrations/ | wc -l`) :

| Élément | Occurrences |
|---|---:|
| `CREATE TABLE` | **33** |
| `CREATE POLICY` | **195** |
| `CREATE OR REPLACE FUNCTION` | **34** |
| `CREATE FUNCTION` | 1 |
| `CREATE TRIGGER` | **23** |
| `CREATE INDEX` | **64** |
| `CREATE EXTENSION` | 8 |

Note : ces comptages incluent les redéfinitions (`CREATE OR REPLACE`, `DROP POLICY ... CREATE POLICY ...`). Le nombre de **tables distinctes** est inférieur (la base réelle expose ~30 tables publiques, cf. `supabase--project_info`).

**Références directes à `auth.users` (`rg -n "auth\.users" supabase/migrations/`)** : oui, **plusieurs FK directes** :
- `20251213133053_…sql:13` → `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- `20251213134301_…sql:5,6,21` → `buyer_id`, `seller_id`, `sender_id REFERENCES auth.users(id)`
- `20251213144514_…sql:5,34` → `viewer_id`, `user_id REFERENCES auth.users(id)`
- `20251213150548_…sql:51` → trigger `AFTER INSERT ON auth.users`
- `20260117132907_…sql:7` → `user_id ... REFERENCES auth.users(id)`
- `20260121003808_…sql:54` → trigger `AFTER INSERT ON auth.users`
- `20260419221627_…sql:1–7` → **`INSERT INTO auth.users` (seed démo)** — sera bloqué sur certains projets Supabase managés, **À VÉRIFIER** si rejouable tel quel.
- `20260505120000_contact_messages.sql:13`, `20260504191835_car_pass_async_verification.sql:54`, `20260512100001_dealer_kyc.sql:6,12` → FK supplémentaires.

⚠️ Le guide Lovable interne dit "NEVER use a foreign key reference to the auth.users table" — le projet **viole déjà cette règle dans ≥ 9 migrations**. Rejouer sur un Supabase externe **fonctionnera** (les FK vers `auth.users` sont parfaitement valides en SQL Supabase standard) mais la migration `20260419221627` (insert démo dans `auth.users`) est à risque (mot de passe hashé en dur, contrainte d'unicité email/UID).

---

## Section 5 — Dépendances Vercel

- `grep -i vercel package.json` → **vide**. Le package `@vercel/speed-insights` **n'est PAS dans `package.json`** au moment de l'audit. `rg -n "@vercel/speed-insights|SpeedInsights" src/` → **aucun résultat**. Conclusion : la prémisse de la question (le repo contient `@vercel/speed-insights`) est **fausse à date**, ou bien le package a été retiré depuis. **À VÉRIFIER** côté utilisateur.
- `vercel.json` à la racine : **absent** (`ls vercel.json` → not found).
- Dossier `.vercel/` : **absent**.
- `api/health.ts` existe (1 445 octets) : c'est un handler de health-check qui ressemble à du Vercel Serverless mais **rien ne prouve qu'il est actuellement déployé** ; il peut être un reliquat du `DEPLOYMENT.md` (qui décrit un déploiement Vercel historique).
- Workflows GitHub : `ci.yml`, `e2e.yml`, `lighthouse.yml`. **Aucun `deploy.yml` Vercel actif**. `ci.yml` build seulement.
- `DEPLOYMENT.md` documente un déploiement Vercel + Supabase externe — c'est de la **doc legacy**, non synchronisée avec l'état réel (preview & published URLs actuelles sont `*.lovable.app`, cf. `<project_urls>`).

**Conclusion §5** : pas de déploiement Vercel actif détectable depuis le repo. La prod tourne sur Lovable (`autorabe.lovable.app`).

---

## Section 6 — État Realtime

**Côté client** (`rg "\.channel\(" src/`) — **7 subscriptions** :

| Hook | Channel | Mécanisme |
|---|---|---|
| `src/hooks/useMultipleOnlineStatus.ts:11` | `global-presence` | Presence (pas postgres_changes) |
| `src/features/admin/hooks/useAdminRealtime.ts:16` | `admin-overview-realtime` | postgres_changes (À VÉRIFIER tables) |
| `src/features/messaging/hooks/useOnlineStatus.ts:33` | `presence-${conversationId}` | Presence |
| `src/features/messaging/hooks/useTypingIndicator.ts:50` | `typing-${conversationId}` | Broadcast |
| `src/features/messaging/hooks/useUnreadMessages.ts:84` | `unread-messages-count` | postgres_changes sur `messages` |
| `src/features/messaging/hooks/useConversations.ts:128` | `conversations-updates` | postgres_changes sur `conversations` |
| `src/features/messaging/hooks/useMessageNotifications.ts:47` | `global-message-notifications` | postgres_changes sur `messages` |

**Côté DB** (`rg "ALTER PUBLICATION supabase_realtime" supabase/migrations/`) — **publications actives finales** :
- `public.car_listings` → ADD en `20251213134028:2`, puis DROP conditionnel en `20260423205529:80` → **état final À VÉRIFIER**.
- `public.messages` → ADD en `20251213134301:83` → **publié**.
- `public.conversations` → ADD en `20251213134301:84` → **publié**.
- `public.reports` → ADD puis DROP (`20260409184602` puis `20260414175129`) → **non publié**.

**Cohérence** : `useAdminRealtime` écoute potentiellement `car_listings` dont la publication a peut-être été retirée — **À VÉRIFIER** en runtime sur le nouveau projet.

Migration Realtime : trivial à rejouer (4 lignes SQL `ALTER PUBLICATION ADD TABLE`). Aucun risque structurel.

---

## Section 7 — Estimation honnête (heures de travail)

Hypothèses : ingénieur senior fullstack qui connaît déjà le projet, environnement local prêt, accès admin au nouveau projet Supabase.

| Axe | Détail | Fourchette |
|---|---|---:|
| **Schéma + données** | Rejouer 82 migrations via `supabase db push` (~10–15 min). Régler les rejets probables : `INSERT INTO auth.users` (20260419221627), extensions non listées, droits `service_role`. Export/import des données utilisateurs réelles (auth.users, profiles, listings, photos storage, conversations) : **c'est le poste le plus risqué**. Inclut migration buckets storage (6 buckets dont `vehicle-photos`, `car-pass` privé). | **6–14 h** |
| **Edge Functions** | 30 fonctions, 4 958 lignes. Redéploiement script `deploy.sh` existe. Re-setter ~10 secrets (`STRIPE_*`, `RESEND_API_KEY`, `VAPID_*`, etc.). Re-configurer le Stripe webhook URL côté Stripe Dashboard. Re-configurer l'auth email hook côté Supabase Auth (`auth-email-hook`). | **3–6 h** |
| **Refactor auth (`@lovable.dev/cloud-auth-js`)** | Réécrire `src/integrations/lovable/index.ts` (35 lignes) pour utiliser `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })` natif. 2 call sites à ajuster dans `useAuth.ts`. Configurer Google + Apple OAuth dans le dashboard Supabase. | **1–3 h** code + **1–3 h** config OAuth providers |
| **Refactor AI Gateway** | 2 fonctions seulement (`car-chat`, `explain-taxes`), même URL, même modèle Gemini Flash. Bascule vers Google AI Studio direct (clé `GEMINI_API_KEY`) ou OpenRouter compatible OpenAI : ~30 lignes diff total + 1 secret à ajouter. **MAIS** : 4 autres fonctions utilisent `LOVABLE_API_KEY` comme **secret HMAC partagé** avec l'infra Lovable Cloud (auth email hook & process-email-queue). Après migration, ces hooks ne reçoivent plus les webhooks de Lovable → il faut **soit** reconfigurer le `Send Email Hook` natif Supabase pour pointer vers `auth-email-hook` avec un nouveau secret, **soit** abandonner ce hook et laisser Supabase envoyer ses emails par défaut (perte du branding Elite Green + templates React). | **2–6 h** |
| **Tests E2E** | Suite Playwright existante (`e2e/auth.spec.ts`, `e2e/messaging.spec.ts`, `e2e/publish-listing.spec.ts`). Rejouer + corriger les éventuels chemins OAuth + URLs. | **2–4 h** |
| **Sous-total brut** | | **15–36 h** |
| **Marge de sécurité recommandée** | Inconnues sur la migration des données réelles, downtime utilisateurs, propagation DNS si custom domain, OAuth credentials Apple (Apple Developer ~24-48h de friction admin) | **+40 %** |
| **TOTAL réaliste** | | **~21 à 50 h** (≈ **3 à 7 jours**) |

---

## Section 8 — Verdict

### **B) RESTER LOVABLE CLOUD ET MIGRER POST-LAUNCH**

**Argumentation factuelle :**

1. **Volume > 2 jours.** L'estimation basse (21 h) dépasse déjà le seuil "moins de 2 jours" du verdict A. La fourchette haute (50 h) flirte avec une semaine pleine. Verdict A est exclu.

2. **Verdict C exclu également.** La dépendance "dure" à `@lovable.dev/cloud-auth-js` est **minuscule** : 35 lignes dans 1 fichier, 2 call sites, 1 méthode utilisée. Ce n'est PAS un verrouillage architectural. `useAuth.ts` (262 lignes) utilise déjà `supabase.auth.*` natif pour signIn/signUp/signOut/reset/onAuthStateChange. Refuser la migration "pour toujours" sur cette base serait techniquement injustifié.

3. **Risques de régression critiques en pré-launch** :
   - **Messagerie temps réel** (§6) : 7 channels, 3 tables publiées Realtime, presence + broadcast + postgres_changes. C'est un sous-système non trivial qui demande validation manuelle E2E sur le nouveau projet.
   - **Stripe** : webhook signé (`STRIPE_WEBHOOK_SECRET`), 5 endpoints de checkout/portal/boost. Reconfigurer le webhook URL dans Stripe → période de blackout où les events ne sont plus signés correctement = risque de doublons d'abonnements ou de boosts non confirmés.
   - **Auth email hook custom** : le branding Elite Green des emails transactionnels (welcome, reset, magic-link) passe par `auth-email-hook` signé via `LOVABLE_API_KEY`. Sur Supabase externe, il faut reconfigurer le `Send Email Hook` natif et générer un nouveau secret HMAC. **C'est le point le plus risqué** : un mauvais secret = plus aucun email d'auth envoyé.
   - **Données réelles** : si la base contient déjà des utilisateurs en prod (`autorabe.lovable.app`), l'export `auth.users` + hashs de mots de passe + sessions n'est pas trivial et n'est documenté nulle part dans le repo.

4. **Bénéfice marginal pré-launch** : aucun blocage technique aujourd'hui. Lovable Cloud expose déjà l'intégralité de Supabase (RLS, edge functions, storage, realtime, auth) ; les seuls items "spécifiques Lovable" sont (a) le wrapper OAuth de 35 lignes, (b) l'AI Gateway sur 2 fonctions, (c) le secret HMAC partagé pour les webhooks d'emails auth. Aucun de ces 3 items ne limite la roadmap produit.

5. **Bénéfice post-launch** : une fois en prod stable, la migration peut être faite proprement (window de maintenance annoncée, snapshot DB, dual-write éventuel, rollback testé). C'est le moment standard pour ce type de bascule.

**Recommandation actionnable** :
- **Maintenant** : rester sur Lovable Cloud. Lancer.
- **Pré-requis à anticiper dès aujourd'hui** (gratuit, < 1 h) : créer le projet Supabase externe vide, claim Google OAuth + Apple Developer credentials (Apple = délai admin), provisionner Resend/Stripe secrets sur ce projet fantôme. Ainsi le jour J de la migration ne dépend que du code.
- **Post-launch** (semaine 2–4 après lancement, fenêtre creuse) : exécuter la migration avec la fourchette 21–50 h budgétée et un plan de rollback testé.

---

### Points marqués "À VÉRIFIER"
- `@vercel/speed-insights` : prétendument dans le repo, **introuvable** à l'audit (§5).
- État final de la publication Realtime sur `public.car_listings` (§6).
- Liste exhaustive `Deno.env.get` par edge function (§3 — échantillonnage rapide, pas exhaustif).
- Comportement de la migration `20260419221627` (insert dans `auth.users`) sur un Supabase fraîchement provisionné (§4).
- Présence / volumétrie réelle des données utilisateurs en prod sur Lovable Cloud — non lisible depuis le repo (§7).
- Mode de routage actuel des webhooks `auth-email-hook` côté Lovable Cloud (qui appelle l'endpoint et avec quelle URL ?) — non lisible depuis le repo (§2, §7).
