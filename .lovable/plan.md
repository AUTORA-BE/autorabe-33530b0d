# Sprint Sécurité Production — AutoRA.be

État courant après audit éclair du code et du schéma DB :

| Domaine | État | Action |
|---|---|---|
| RLS sur `profiles`, `car_listings`, `conversations`, `messages`, `favorites`, `subscriptions`… | ✅ RLS active, policies scopées `auth.uid()` | Aucune (vérifié) |
| Rôle admin via `has_role()` SECURITY DEFINER + `useAdminAuth` sur `/admin/*` | ✅ | Aucune |
| ErrorBoundary global (App + main) | ✅ déjà présent | Aucune |
| Clés API en dur dans le code | ✅ aucune trouvée (Stripe/Supabase via env) | Aucune |
| Zod sur Auth | ✅ partiel | Étendre (voir §3) |
| `console.*` dans le bundle | ⚠️ **64 occurrences** | **Strip en prod** |
| Garde "Édition Vitrine" Pro vérifié | ⚠️ à confirmer | **Vérifier + bloquer si non-pro** |
| Redirection session expirée | ⚠️ partielle | **Helper global** |

## Actions ciblées (build + petits patchs)

### 1. Strip automatique des logs en production
Dans `vite.config.ts`, ajouter dans `build.esbuild` :
```ts
esbuild: { drop: ['console', 'debugger'] }
```
→ supprime les 64 `console.*` du bundle prod sans toucher au code source (dev reste verbeux).
Exception : conserver `console.error` dans `ErrorBoundary` (déplacer derrière `if (import.meta.env.DEV)`).

### 2. Garde stricte `/dashboard/vitrine` (Édition Vitrine)
- Dans `EditVitrine.tsx`, ajouter un gate : si `profile.user_type !== 'professionnel'` → `<Navigate to="/dashboard" replace />` + toast "Réservé aux comptes Pro vérifiés".
- Vérifier que `/admin/*` redirige déjà via `useAdminAuth` (confirmé : `AdminLayout` l'utilise).

### 3. Validation Zod renforcée côté client
Schémas stricts (réutilisables dans `src/lib/validation/`) :
- **Email** : `z.string().trim().toLowerCase().email().max(255)`
- **Téléphone BE** : regex `^\+32\s?[1-9]\d{7,8}$` ou `^0[1-9]\d{7,8}$`
- **TVA BE** : `^BE0?\d{9,10}$` (normalisation)
- **Code postal** : `^\d{4}$`
- **Texte libre** (description, bio) : `.max(2000)` + `DOMPurify.sanitize` à l'affichage si HTML.
Appliquer dans : formulaire d'inscription, "Vendre ma voiture" (sell wizard étape 3), édition profil/vitrine, contact vendeur.
Côté serveur : la validation finale reste assurée par les contraintes DB + RPC (déjà en place).

### 4. Anti-spam / rate limiting
- `check_rate_limit()` déjà câblé sur `get_seller_contact` (30/h), `create-listing` (10/j), `notify-seller` (30/h), `reset` (3/h). ✅ rien à ajouter.
- Auth signup/login : délégué à Supabase Auth (rate limits natifs). ✅

### 5. Session expirée → redirection propre
Dans `src/integrations/supabase/client.ts` consumer (créer `src/lib/authGuard.ts`) :
- Listener `onAuthStateChange` → si `event === 'SIGNED_OUT'` ou `TOKEN_REFRESHED` échoue → `navigate('/auth?reason=expired')` + toast.
- Wrapper `withAuth(fn)` pour appels critiques qui catch `AuthSessionMissingError` → même redirection.

### 6. XSS — confirmation
- Aucun `dangerouslySetInnerHTML` détecté dans les composants utilisateur. ✅
- Description annonces : rendu en `<p>` simple, pas de HTML. ✅
- Photos : URLs Supabase Storage signées, pas d'user input direct.

### 7. RGPD / HTTPS
- HTTPS forcé par Lovable hosting + custom domain. ✅
- Bannière consentement + export JSON + droit à l'oubli déjà en place (mem GDPR). ✅
- Vérifier headers : ajouter dans `index.html`/Vercel-equivalent `<meta http-equiv="Content-Security-Policy">` minimal (déjà mémorisé sous "Security Architecture"). ✅

## Livrables

1. `vite.config.ts` — `esbuild.drop: ['console','debugger']`
2. `src/components/ErrorBoundary.tsx` — `console.error` gated `import.meta.env.DEV`
3. `src/pages/EditVitrine.tsx` — gate `user_type === 'professionnel'`
4. `src/lib/validation/belgian.ts` — schémas Zod réutilisables (email, phone BE, TVA, postal)
5. Branchement de ces schémas dans : `Auth.tsx`, `SellWizard` step contact, `EditVitrine.tsx`
6. `src/lib/authGuard.ts` — listener session expirée + redirection `/auth?reason=expired`
7. Toast i18n FR/NL/DE/EN pour "Session expirée" et "Réservé aux Pros"

## Hors-scope (déjà OK)
- Schéma RLS, has_role, rate limits DB, ErrorBoundary global, secrets, CSP, GDPR UI.

Confirme et je passe en build pour livrer ces 7 points en une passe.