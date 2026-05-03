# Plan : Plausible Analytics + Funnel Tracking

## Choix retenus
- **Provider** : Plausible (script léger, sans cookies, RGPD-friendly).
- **Events** : Funnel étendu recommandé (par défaut, faute de réponse).
- **Identification** : `user_id` (UUID) + `role` (private/pro/admin) + `email` envoyés en custom props.

⚠️ **Note RGPD** : Plausible déconseille d'envoyer des PII (email). Je l'inclus comme tu l'as demandé, mais je recommande de le retirer après lancement et de garder uniquement `user_id` + `role` (ce qui suffit pour le funnel). Le cookie banner existant couvre déjà l'opt-in.

## Étapes

### 1. Setup script Plausible
- Ajouter le script `plausible.io/js/script.tagged-events.outbound-links.js` dans `index.html` avec `data-domain="autora.be"` et `data-api="/api/event"` désactivé (pas de proxy).
- Exposer `window.plausible()` pour les events custom (queue avant chargement).

### 2. Helper `src/lib/analytics.ts`
- `trackEvent(name, props?)` — wrapper sûr (no-op en preview/dev/iframe).
- `identifyUser({ user_id, email, role })` — stocke en mémoire et injecte automatiquement dans chaque event.
- `resetUser()` au logout.
- Garde-fou : pas de tracking sur `id-preview--*.lovable.app` ni dans iframe.

### 3. Hook `useAnalytics`
- Auto page_view sur changement de route (React Router).
- Identifie l'utilisateur dès `useAuth` retourne une session (avec lookup du `role` via `user_roles`).

### 4. Events instrumentés (funnel étendu)
| Event | Trigger | Fichier |
|---|---|---|
| `page_view` | route change | hook global |
| `signup_started` | ouverture form Signup | `Auth.tsx` |
| `signup_completed` | succès `signUp` | `useAuth` |
| `login_completed` | succès `signIn` | `useAuth` |
| `search_performed` | submit HeroSearch / FilterPanel apply | `HeroSearch`, `FilterPanel` |
| `vehicle_viewed` | mount `VehicleDetail` | `VehicleDetail.tsx` |
| `favorite_added` | toggle favori (true) | `useFavorites` |
| `contact_seller_clicked` | clic bouton contact | `VehicleDetail` |
| `message_sent` | envoi message chat | `ChatRoom` |
| `listing_started` | step 1 Sell wizard | `SellWizard` |
| `listing_published` | submit final OK | `SellWizard` |
| `boost_purchased` | retour Stripe success boost | `BoostSuccess` |

### 5. Dashboard config
Tu devras créer le site `autora.be` sur plausible.io, puis configurer dans Plausible :
- **Goals** custom pour chaque event ci-dessus.
- **Funnel** : `signup_started` → `signup_completed` → `listing_started` → `listing_published`.
- **Custom props** activés : `user_id`, `role`, `email`, et props spécifiques par event (ex: `brand`, `price_range`).

## Fichiers touchés
- `index.html` (script Plausible)
- `src/lib/analytics.ts` (nouveau)
- `src/hooks/useAnalytics.ts` (nouveau)
- `src/App.tsx` (mount du hook)
- `src/features/auth/hooks/useAuth.ts` (identify + signup events)
- `src/pages/Auth.tsx` (signup_started)
- `src/components/HeroSearch.tsx`, `FilterPanel.tsx` (search)
- `src/pages/VehicleDetail.tsx` (view + contact)
- `src/hooks/useFavorites.ts` (favorite)
- `src/features/messaging/.../ChatRoom.tsx` (message_sent)
- `src/features/listings/sell/SellWizard.tsx` (listing flow)
- `src/pages/BoostSuccess.tsx` (boost)

## Hors scope
- Pas de proxy server-side (les ad-blockers bloqueront ~30% des events — acceptable pour MVP).
- Si tu veux contourner les ad-blockers plus tard, on ajoutera un edge function proxy `/api/event`.

Validation puis j'enchaîne.