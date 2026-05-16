## Objectif

Faire basculer le rendu de la home d'une esthétique **SaaS premium** (gradients verts, glassmorphism, beaucoup d'air, typo Playfair éditoriale) vers une vibe **marketplace dense, dynamique et vivante** (proche de l'image de référence : header sombre compact, hero immersif avec photo voiture, blocs de recherche flottants façon "cards d'action", grille de voitures dense type Vinted/AutoScout, sections "promesses" en cards horizontales).

**Aucun changement** sur : routing, hooks (`useVehicleSearch`, `useFavorites`, `useBuyerProfile`), edge functions, RLS, i18n, schémas SEO, structure des données. C'est uniquement du **frontend / présentation**.

## Direction visuelle cible

Inspiré de l'image de référence + standards marketplace auto :

- **Header** : compact, fond noir/dark translucide même en light mode sur le hero, logo + langues à droite, plus de "premium feel"
- **Hero** : 
  - Photo immersive plein écran (voiture sur route belge, paysage)
  - Overlay sombre dégradé bas → haut
  - Titre serif large à gauche, sous-titre court
  - **3 cards flottantes** en bas du hero (façon image réf) : "Recherche rapide" / "Type de carrosserie" / "Mon Garage / Comparer" — au lieu de la grosse barre de recherche actuelle
- **Sections** : rythme plus serré, titres plus petits, plus de contenu visible en scroll
- **Cards voitures** : ratio 4:3 conservé, mais badges Car-Pass / LEZ plus marketplace (pills colorées top-left, prix gros en bas-right comme sur la réf)
- **"Nos promesses"** : 3-4 cards horizontales avec icône + titre + 1 ligne, scrollable mobile
- **Couleur** : on garde Emerald-600 comme accent mais on **réduit son usage** — le fond devient plus neutre (gris très clair / blanc cassé), l'accent vert ne sert que pour CTA + badges vérifiés
- Effets au scroll (nouveaux)

Tous via Framer Motion (déjà installé) + IntersectionObserver, GPU-friendly :

1. **Hero parallax** : photo voiture translateY plus lente que le scroll (`useScroll` + `useTransform`), opacité hero qui fade
2. **Header morph** : transparent sur hero → solide blanc/dark avec shadow dès `scrollY > 80px`
3. **Cards flottantes du hero** : se "détachent" et stickent brièvement avant de disparaître (sticky + fade)
4. **Sections reveal** : fade-up + stagger (déjà via `ScrollReveal`, on l'étend aux cards individuelles avec délai)
5. **Compteurs animés** sur TrustBar (10K+ voitures, etc.) — count-up déclenché à l'entrée viewport
6. **Marquee** discret sur la BrandCarousel (auto-scroll lent au repos, pause au hover)
7. **Hover lift** plus prononcé sur VehicleCard (translateY -6px + shadow glow)

Respect strict de `prefers-reduced-motion` : tous les effets désactivés.

## Périmètre des fichiers touchés

**Modifiés (présentation uniquement) :**

- `src/features/search/components/HeroSearch.tsx` → refonte hero immersif + 3 cards flottantes
- `src/shared/components/Header.tsx` → variante transparent → solid au scroll
- `src/components/TrustBar.tsx` → compteurs animés count-up
- `src/components/WhyAutoRA.tsx` → reformatage en cards horizontales "promesses"
- `src/features/listings/components/VehicleCard.tsx` → badges marketplace style + prix proéminent
- `src/features/search/components/BrandCarousel.tsx` → marquee auto-scroll
- `src/index.css` → ajustement tokens (fond plus neutre, accent vert plus rare), nouveaux utilitaires marketplace
- `src/pages/Index.tsx` → réordonnancement mineur des sections, ajout wrappers ScrollReveal

**Créés :**

- `src/components/marketplace/HeroParallax.tsx` — wrapper parallax du hero
- `src/components/marketplace/QuickActionCard.tsx` — les 3 cards flottantes
- `src/hooks/useCountUp.ts` — hook compteur animé
- `src/hooks/useScrollHeader.ts` — détection scroll pour header morph

**Non touchés** : tous les hooks `useVehicleSearch`, `useFavorites`, `useSubscription`, toutes les pages autres que `/`, tous les edge functions, RLS, types Supabase.

## Étapes d'exécution

1. Ajouter tokens CSS marketplace (fond neutre, ombres plus marquées, accent vert restreint) + utilitaires scroll
2. Créer hooks `useCountUp`, `useScrollHeader`
3. Refondre `HeroSearch` → photo plein écran + parallax + 3 QuickActionCards flottantes (recherche / carrosserie / comparer)
4. Adapter `Header` pour transition transparent → solid au scroll
5. Refondre `TrustBar` avec compteurs animés
6. Refondre `WhyAutoRA` en 3 cards horizontales "promesses"
7. Restyler `VehicleCard` (badges pills, prix gros)
8. Ajouter marquee à `BrandCarousel`
9. Vérifier en preview desktop + mobile + `prefers-reduced-motion`

## Garde-fous

- Aucune modification de la logique de recherche : les 3 QuickActionCards déclenchent les mêmes `handleSearch` / `updateFilter` que la barre actuelle
- Aucune modification de schéma / migration
- i18n : toutes les nouvelles strings utilisent `useLanguage()` + clés ajoutées dans `fr.json` / `nl.json` / `de.json` / `en.json`
- Mémoire projet "Elite Green luxe" → on garde Emerald-600 en accent ; on assouplit juste la densité de gradients verts (à confirmer ci-dessous)

## Question avant exécution

L'image de réf est plus **claire / neutre** (fond clair, header noir compact), alors que le site actuel est **dark Elite Green**. Tu veux :

- **A.** Garder le dark mode par défaut, juste adopter la composition marketplace (hero photo + cards flottantes + densité)
- **B.** Passer en **light mode par défaut** comme la réf (fond clair, header dark sur hero puis blanc au scroll)
- **C.** Hero light (comme réf) + reste du site dark

Réponds A / B / C et je lance l'implémentation.

ne fais pas trop comme autoscout apres ils vont crier au ^plagiat 

&nbsp;