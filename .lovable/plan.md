
# Plan — Migration runtime de jbds (Lovable Cloud) vers okei (ton Supabase)

## ⚠️ À lire avant de démarrer

Aujourd'hui l'app **tourne réellement sur `jbds…`** (Lovable Cloud). C'est ce projet qui contient :
- toutes les tables avec leurs données (car_listings, profiles, subscriptions, …)
- les 28 edge functions déployées
- les secrets (STRIPE_*, RESEND_API_KEY, VAPID_*, LOVABLE_API_KEY, …)
- les buckets de storage (vehicle-photos, car-pass, chat-images, avatars, brand-logos, car-photos)
- la config Auth (Google, HIBP, templates email)

Le fichier `.env` est **géré automatiquement par Lovable Cloud** — je ne peux pas le pointer manuellement vers okei. Pour basculer le runtime, il faut **déconnecter Lovable Cloud** et **connecter ton propre projet Supabase okei** depuis le menu Connectors.

Ce n'est pas une opération que je peux faire entièrement seul : il y a des étapes manuelles côté toi (Lovable Connectors + dashboard Supabase okei).

---

## Phase 1 — Préparation (côté Lovable, sans rien casser)

1. **Aligner les références codebase déjà sur okei** (pas d'impact runtime, juste cohérence) :
   - `public/sitemap.xml` → repointer vers `okei`
   - vérifier que `vite.config.ts`, `index.html`, `supabase/config.toml`, `sitemap-index/index.ts` sont bien alignés sur `okei`
2. **Préparer un dump SQL complet** des migrations à rejouer sur okei : `supabase/combined_migrations.sql` existe déjà → on le met à jour avec les 5 dernières migrations.

## Phase 2 — Export des données depuis jbds

Pour chaque table avec données utilisateur, je génère un export SQL/CSV via `read_query` :
- `auth.users` (⚠️ mot de passe hashes non exportables → users devront reset password)
- `profiles`, `user_roles`, `user_preferences`
- `car_listings` + `car_views` + `favorites` + `reviews`
- `conversations` + `messages` + `daily_message_counts`
- `subscriptions` + `stripe_processed_events`
- `user_alerts` + `alert_notifications`
- `belgian_*` (TMC, annual tax, age reductions), `fuel_prices`
- `admin_actions`, `audit_log`, `reports`

Pour le **storage** (vehicle-photos, car-pass, chat-images, avatars) : il faut un script qui télécharge tous les fichiers de jbds et les ré-upload vers okei. Très volumineux selon les annonces existantes.

## Phase 3 — Provisioning okei (toi, dans dashboard Supabase okei)

1. **Activer les extensions** : `pgcrypto`, `pg_trgm`, `pgmq`, `pg_cron` (pour expire-boosts), …
2. **Créer les buckets** : `vehicle-photos`, `car-pass`, `chat-images`, `avatars`, `brand-logos`, `car-photos` (avec mêmes policies)
3. **Configurer Auth** :
   - Activer Email + Google OAuth (mêmes Client ID / Secret que jbds)
   - Activer HIBP password protection
   - Configurer templates email FR/NL/DE/EN
   - Configurer SMTP Resend custom + domaine `noreply@autora.be`
4. **Configurer secrets edge functions** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `LOVABLE_API_KEY`

## Phase 4 — Bascule Lovable Cloud → okei

1. Toi : **Connectors → Lovable Cloud → Disable Cloud** (attention : irréversible côté Cloud)
2. Toi : **Connectors → Supabase → Connect** ton projet okei
3. `.env` se régénère automatiquement avec URL + anon key d'okei
4. `src/integrations/supabase/types.ts` se régénère depuis le schéma okei

## Phase 5 — Rejouer schéma + données sur okei

1. Lovable applique automatiquement les migrations Supabase au connect (à valider)
2. Sinon : exécuter manuellement `combined_migrations.sql` dans le SQL editor okei
3. Importer les CSV de données dans l'ordre des FK : profiles → user_roles → car_listings → favorites → … 
4. Ré-upload des fichiers storage (script à part)
5. Redéployer les 28 edge functions sur okei (Lovable le fait au prochain push)

## Phase 6 — Validation post-migration

- `/admin` accessible avec ton compte (vérifier `user_roles`)
- Une annonce existante s'affiche avec ses photos
- Login Google fonctionne
- Stripe webhook : pointer le webhook Stripe vers la nouvelle URL `https://okei….supabase.co/functions/v1/stripe-webhook` + mettre à jour `STRIPE_WEBHOOK_SECRET`
- Re-tester sitemap, edge function `dynamic-sitemap`

## Phase 7 — Reconfigurer les services externes

- **Stripe Dashboard** : webhook URL → okei
- **Google OAuth Console** : redirect URI → `https://okei….supabase.co/auth/v1/callback`
- **Resend** : domain reste identique (`autora.be`)
- **Vercel** : pas de changement (lit `.env` au build, qui sera mis à jour)

---

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Mots de passe Auth non exportables | Tous les users doivent reset password | Email de communication "migration sécurité" |
| Photos storage volumineuses | Téléchargement long + coûts bande passante | Script batch nocturne |
| URLs photos hardcodées dans `car_listings.photos[]` | Liens cassés post-migration | Script SQL UPDATE pour réécrire les URLs jbds → okei |
| Stripe webhooks en cours pendant bascule | Events manqués | Faire la bascule en heure creuse, replay des events Stripe ensuite |
| Lovable Cloud disable = irréversible | Si problème avec okei, retour difficile | Faire un dump complet de jbds avant disable |

---

## Recommandation honnête

Cette migration représente **plusieurs heures de travail synchronisé** (toi + moi) avec un risque de downtime et de perte de données utilisateur (mots de passe).

**Question** : es-tu sûr de vouloir migrer maintenant, alors que tu es en phase finale de lancement ? Si la seule raison est "je n'ai pas accès à jbds", la solution la plus simple serait que je te montre comment **récupérer l'accès au projet jbds via le dashboard Lovable Cloud** (Connectors → Lovable Cloud → View Backend), où tu retrouves les mêmes outils que Supabase dashboard mais déjà connectés.

Veux-tu :
- **(A)** que je te guide d'abord pour accéder à jbds via Lovable Cloud (5 min, zéro risque)
- **(B)** que je commence par la **Phase 1** (alignement codebase sans toucher au runtime) en attendant que tu prépares okei
- **(C)** déclencher le plan complet maintenant
