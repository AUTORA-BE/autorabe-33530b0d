# Refonte homepage AutoRA — Plan d'exécution

## Phase 1 — Système de couleurs unifié (fondations)

**Fichiers :** `src/index.css`, `tailwind.config.ts`

- Ajout des tokens HSL dans `:root` et `.dark` :
  - `--background-primary`, `--background-elevated`
  - `--background-gradient-from`, `--background-gradient-via`, `--background-gradient-to`
  - `--surface-glass`, `--border-glass`
  - `--accent-electric` (cyan/vert électrique distinct de `--primary` emerald)
  - `--text-primary`, `--text-secondary`, `--text-muted`
- Exposition dans `tailwind.config.ts` (`colors.surface.glass`, `colors.accent.electric`, etc.)
- Suppression du `transition` global sur `html` (cause des saccades scroll)
- Ajout d'un utilitaire `.hero-gradient-deep` (dégradé br from/via/to)

## Phase 2 — Anti-FOUC + Hero adaptatif

**Fichiers :** `index.html`, `src/features/search/components/HeroSearch.tsx`

- Script inline `<head>` AVANT React : lit `localStorage.theme` ou `prefers-color-scheme`, applique `class="dark"` sur `<html>` immédiatement
- Couleur de fond du body alignée sur le token via CSS dans `<style>` critique
- HeroSearch : remplacement des couleurs hardcodées par tokens, image avec overlay glass adaptatif, dégradé profond derrière la BMW
- Vérification que `next-themes` est bien `defaultTheme="dark" enableSystem` (déjà OK dans main.tsx)

## Phase 3 — Variants boutons stricts

**Fichier :** `src/components/ui/button.tsx`

- Ajout variants : `primary` (accent-electric + glow), `secondary` (glass), `ghost-link` (underline hover)
- Border-radius uniforme `rounded-xl`, transitions `duration-200`
- Tailles `sm` / `default` / `lg` cohérentes
- Variants existants (`default`, `outline`, etc.) conservés pour ne pas casser le reste de l'app

## Phase 4 — Réorganisation homepage avec transitions fluides

**Fichier :** `src/pages/Index.tsx` + nouveau composant `src/components/home/FiscalAdvisorCTA.tsx`

Ordre final :
1. Hero (existant, ajusté Phase 2)
2. **Bandeau confiance** (TrustBar remonté, cards glass translucides)
3. **Marques 100% électriques** (EvBrandSection, déjà en place)
4. **Annonces en vedette** (FeaturedVehiclesSection)
5. **CTA Conseiller fiscal IA** (NOUVEAU — bandeau glass avec lien vers chatbot)
6. **Marques gamme mixte** (BrandCarousel)
7. **Pourquoi AutoRA** (WhyAutoRA)
8. Sections existantes restantes (PopularVehicles, SellCarCTA, FAQ, Results)
9. Footer

Transitions : suppression des `bg-white`/`bg-black` durs dans chaque section, remplacement par token-based gradients qui se chaînent.

## Phase 5 — Fixes UI ciblés

- **Cards listing** : audit `VehicleCard` → `h-full`, `aspect-[4/3]`, footer `mt-auto`
- **Nav mobile** : audit `MobileMenu` → drawer plein écran, backdrop-blur, body-scroll-lock
- **Footer** : audit `Footer.tsx` → grid 4 cols desktop, alignement top
- **Scroll** : `scroll-behavior: smooth` déjà présent ; retrait des transitions globales parasites

## Contraintes respectées

- Aucune touche à Supabase / auth / Stripe / Resend / prompt chatbot IA
- Routes inchangées
- Branding "AutoRA" (R+A majuscules) préservé
- Pas de nouvelle dépendance (`next-themes` déjà installé)

## Risques identifiés

- Variants boutons : si renommage de `default` → risque de casse → je garde `default` et j'**ajoute** `primary`/`secondary`/`ghost-link` à côté
- Tokens renommés : je **n'écrase pas** `--background`/`--foreground` existants → j'**ajoute** la nouvelle famille à côté pour migration progressive
- VehicleCard utilisé partout : modifs minimales (juste `h-full` + `mt-auto` sur footer)

## Estimation

~15 fichiers modifiés, ~3 nouveaux fichiers, 0 régression backend attendue.

Validez le plan et je l'exécute dans l'ordre.
