

# Audit Performance Mobile — AutoRA.be

## Résultats de l'audit

### Core Web Vitals (viewport mobile 390×844)

| Métrique | Valeur | Seuil idéal | Verdict |
|----------|--------|-------------|---------|
| FCP | **6 808 ms** | < 1 800 ms | ❌ Très lent |
| TTFB | **759 ms** | < 800 ms | ⚠️ Limite |
| DOM Interactive | 1 566 ms | — | OK |
| Full Page Load | 5 692 ms | — | ❌ Lent |
| INP | non mesuré | < 200 ms | — |

> **Note** : ces mesures sont prises sur le serveur de développement Vite (non minifié, 186 modules ESM chargés individuellement). En production (bundle splitté + CDN), les valeurs seront **~3-4× meilleures**. Néanmoins, plusieurs optimisations sont nécessaires.

### Problèmes identifiés

1. **LanguageContext.tsx = 92 KB** (2 555 lignes) — le plus gros module applicatif, chargé de manière synchrone. Contient les traductions inline pour 4 langues.

2. **lucide-react = 160 KB** — l'intégralité de la librairie d'icônes est importée (tree-shaking insuffisant en dev).

3. **framer-motion = 80 KB** — chargé sur toutes les pages même si les animations sont simples.

4. **ScrollToTop.tsx** — le handler `onScroll` consomme 99.6 ms de self-time CPU (le plus gros consommateur). Il devrait être throttlé.

5. **Google Fonts (render-blocking)** — 3 familles chargées de manière bloquante dans `<head>` (Playfair Display, Montserrat, Inter).

6. **Pas de `manualChunks` pour lucide-react** — il est bundlé dans le chunk principal au lieu d'être séparé.

### Ressources & DOM
- **JS Heap** : 23.9 MB (acceptable)
- **DOM Nodes** : 755 (bon, < 1 500)
- **DOM Depth** : 11 (bon)
- **Event Listeners** : 257 (acceptable)

### CPU Profile (scroll page entière)
- `ScrollToTop.onScroll` : 99.6 ms (throttle manquant)
- `formatMileage` (CarCard) : 33.2 ms (appels répétés, pourrait être mémoïsé)
- `framer-motion interpolator` : 12.9 ms (acceptable)

---

## Plan d'optimisation (par priorité)

### 1. Throttle le scroll handler de ScrollToTop
Ajouter un `requestAnimationFrame` guard pour réduire le self-time de ~100 ms à < 5 ms.

### 2. Extraire les traductions dans des fichiers JSON séparés
Déplacer les ~2 500 lignes de traductions hors de `LanguageContext.tsx` dans des fichiers JSON chargés dynamiquement (`import()`) par langue. Réduit le bundle initial de ~90 KB.

### 3. Charger Google Fonts en non-bloquant
Remplacer `<link rel="stylesheet">` par `<link rel="preload" as="style" onload="this.rel='stylesheet'">` et supprimer Playfair Display + Montserrat (le site utilise principalement Inter/system-ui).

### 4. Ajouter lucide-react aux manualChunks
Séparer `lucide-react` dans son propre chunk pour un meilleur cache splitting.

### 5. Mémoïser formatMileage dans CarCard
Wrapper avec `useMemo` pour éviter les recalculs inutiles dans la grille de véhicules.

### 6. Lazy-load framer-motion pour les pages non-critiques
Garder framer-motion dans le chunk vendor mais s'assurer que les composants lourds (TCO Stepper, Compare) sont lazy-loaded.

---

## Estimation de l'impact en production

| Métrique | Avant (estimé prod) | Après optimisations |
|----------|---------------------|---------------------|
| FCP | ~2.5s | ~1.4s |
| LCP | ~3.5s | ~2.0s |
| TBT | ~250ms | ~100ms |
| Bundle initial | ~450 KB | ~320 KB |

**Verdict** : Le site est **fonctionnellement prêt** pour le lancement. Ces optimisations sont des améliorations de confort qui peuvent être appliquées progressivement. Rien n'est bloquant pour un lancement Early Access.

