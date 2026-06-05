# CRASH_TEST.md — AutoRa.be (audit pré-launch)

**Date** : 2026-06-05
**Méthode** : lecture du code réel + simulation des 3 parcours utilisateurs. Chaque finding est sourcé (`fichier:ligne`). Audit lecture seule.

---

## 🔴 CRITIQUE

### C-1 — Parcours "Poster une voiture" sur mobile
Le cœur du produit. Bug combattu en plusieurs correctifs :
- `1379e56` — force `type="button"` par défaut sur le `<Button>` shadcn ([src/components/ui/button.tsx](src/components/ui/button.tsx)) : empêche les submits accidentels dans le wizard.
- `2bf9c82` + `4fc050a` — persistance du `currentStep` en sessionStorage + garde anti-submit (`if (currentStep !== 3) return`) dans `onSubmit` ([src/components/SellCarForm.tsx](src/components/SellCarForm.tsx)).
- `7c471bd` — Car-Pass passé d'un upload fichier à un **input lien** `car-pass.be` (supprime un point de friction mobile).

**Statut : ✅ confirmé fonctionnel par l'utilisateur (2026-06-05).**

### C-2 — Aperçus de partage social (Open Graph) cassés hors home
SPA statique sur Cloudflare Pages, **sans prerender** (`vite.config.ts` — aucun react-snap/SSR). Les balises OG des routes dynamiques (vitrine `/garage/:slug`, fiche `/car/:id`) sont injectées **côté client** par react-helmet-async ([src/components/SEOHead.tsx:79-85](src/components/SEOHead.tsx:79)).

Les crawlers Facebook / LinkedIn / WhatsApp / Twitter **n'exécutent pas le JS** → ils ne voient que l'[index.html](index.html) statique (8 balises `og:` figées = home générique).

**Conséquence** : quand un garagiste partage son lien vitrine sur Facebook, l'aperçu montre l'image générique d'AutoRa, pas son garage. Handicap de croissance pour une marketplace.

**Remédiation** : prerendering des routes publiques (Cloudflare Worker qui sert un HTML enrichi aux bots, ou `@prerenderer/rollup-plugin`). **Post-launch acceptable.**

---

## 🟠 UX/UI

### U-1 — Le bouton "Précédent" casse la recherche
[src/features/listings/hooks/useFiltersUrlSync.ts:136](src/features/listings/hooks/useFiltersUrlSync.ts:136) : `setSearchParams(newParams, { replace: true })` + lecture URL→state **une seule fois au mount** (garde `isInitialized.current`, [ligne 121](src/features/listings/hooks/useFiltersUrlSync.ts:121)).

Conséquences :
1. Chaque changement de filtre **écrase** l'historique → "Précédent" sort de la recherche au lieu de défaire le dernier filtre.
2. Un retour avant/arrière vers une URL filtrée **ne ré-applique pas** les filtres dans l'UI.

✅ Les filtres sont bien dans l'URL (partage OK). Fix : écouter le changement de `searchParams` (back/forward) pour re-sync, et utiliser `push` (pas `replace`) pour les changements significatifs.

### U-2 — Piège kW vs ch sur la puissance
Le formulaire demande "Puissance (ch)" ([src/i18n/fr.json:510](src/i18n/fr.json:510)). Le TCO traite cette valeur comme des chevaux et convertit ([VehicleTcoSection.tsx:152-157](src/features/tco/components/VehicleTcoSection.tsx:152)). **Code cohérent en interne.**

Mais la carte grise belge (case P.2) affiche des **kW**. Un vendeur peut saisir ses kW dans un champ "ch" → TCO faux + affichage "X ch" erroné.

**Mitigation appliquée (2026-06-05)** : texte d'aide ajouté sous le champ ("En chevaux. Votre carte grise indique des kW — multipliez par 1,36"). Idéal à terme : demander les kW par défaut comme Autoscout/2ememain.

### U-3 — Hook de filtres mort
[src/features/search/hooks/useCarFilters.ts](src/features/search/hooks/useCarFilters.ts) ré-exporté dans 2 barrels mais **jamais consommé** par un composant. Défauts divergents de `useVehicleSearch` (maxPrice 200000 vs 1000000). À supprimer lors d'un nettoyage post-launch (risque barrel non nul, reporté).

---

## 🟢 POINTS SOLIDES (à préserver)

### Sécurité (Profil "Casseur") — RLS solide ✓
- `UPDATE car_listings` : `USING (auth.uid() = user_id)` sans `WITH CHECK` explicite ([20260215125809…sql:160](supabase/migrations/20260215125809_66b7e6a0-ce4e-4e87-9b5d-7a7f416fbda1.sql:160)) → Postgres applique `USING` comme check → **IDOR bloqué** (impossible de modifier l'annonce d'un autre).
- Idem `UPDATE profiles` ([ligne 195](supabase/migrations/20260215125809_66b7e6a0-ce4e-4e87-9b5d-7a7f416fbda1.sql:195)) → vitrine d'autrui protégée.
- Honeypot sur Auth, SellCar **et** Contact.
- INSERT verrouillé `WITH CHECK (auth.uid() = user_id)`.

### Vitrine Garage (Profil "Garagiste") — bien construite ✓
- `vitrine_slug` UNIQUE + format CHECK `^[a-z0-9-]{3,60}$` + index case-insensitive ([20260602130146…sql:4-16](supabase/migrations/20260602130146_67f28053-f919-4a6c-b11e-2daa5edffcce.sql:4)).
- Fonction `is_vitrine_slug_available(_slug, _user_id)` → doublons gérés.
- JSON-LD `dealerSchema` (AutoDealer) injecté ([SellerProfile.tsx:365](src/pages/SellerProfile.tsx:365)).

### Acheteur (Profil 1) ✓ (partiel)
- Plein écran photos OK via `<FullscreenGallery>` ([CarDetail.tsx:584](src/pages/CarDetail.tsx:584)).
- Aucune couleur dark-only hardcodée (`text-white`/`bg-black`) dans CarDetail → light mode sain sur cette page (non audité sur les 38 autres).

---

## ⚠️ À VÉRIFIER (non confirmé runtime)
- Propagation realtime de l'abonnement (admin upgrade garagiste → sans reconnexion).
- Contraste Light mode sur Dashboard / Vitrine édition / Settings.

---

## Verdict

| Profil | Note | Bloquant launch ? |
|---|---|---|
| Acheteur | 7/10 | 🟠 Back-button (U-1) |
| Garagiste | 6/10 | 🔴 OG social (C-2, post-launch) |
| Casseur | 9/10 | ✅ RLS solide |

**Aucun bloquant launch absolu restant** une fois C-1 confirmé (fait). C-2 et U-1 sont rattrapables post-launch.
