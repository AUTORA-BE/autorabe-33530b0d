## Objectif

Ajouter un mode debug activable qui affiche en surimpression :
- Le breakpoint actif (mobile / tablet / desktop) et la largeur exacte du viewport
- L'état d'ouverture du `FilterPanel` (`isOpen`)
- Quelle instance est montée (mobile vs desktop) selon `isDesktopFiltersViewport`
- Un compteur du nombre d'instances `FilterPanel` réellement présentes dans le DOM (pour confirmer qu'il n'y a pas de double-mount)

Cela permet de vérifier visuellement, sur mobile/PWA, que le filtre s'ouvre toujours en **modale unique plein écran** et qu'aucune instance fantôme n'est rendue.

## Activation

Le mode debug s'active de 3 façons (aucune en prod par défaut) :
1. Param URL : `?debug=1`
2. `localStorage.setItem('autora:debug', '1')`
3. Raccourci clavier : `Ctrl+Shift+D` (toggle + persistance localStorage)

## Composant créé

`src/components/DebugOverlay.tsx` — petit panneau fixe en bas à gauche, z-index très haut (`z-[200]`), arrière-plan semi-opaque, monospace, n'intercepte pas les clics (`pointer-events-none`).

Affiche en temps réel :
```text
viewport: 1032 × 825
breakpoint: tablet (md)
lg+ (≥1024): false  →  mobile FilterPanel mounted
filtersOpen: true
FilterPanel in DOM: 1  ✓
body scroll-lock: on
safe-area-top: 0px
```

Le compteur DOM utilise `document.querySelectorAll('[data-filter-panel-root]').length` rafraîchi via `requestAnimationFrame` quand `filtersOpen` change.

## Modifications

1. **`src/components/DebugOverlay.tsx`** (nouveau) — composant overlay + hook `useDebugMode()` qui gère URL/localStorage/raccourci.

2. **`src/features/search/components/FilterPanel.tsx`** — ajouter `data-filter-panel-root` et `data-filter-variant="mobile|desktop"` sur le conteneur racine, pour que l'overlay puisse les compter.

3. **`src/pages/Index.tsx`** — monter `<DebugOverlay filtersOpen={filtersOpen} isDesktopFiltersViewport={isDesktopFiltersViewport} />` à la fin du JSX.

4. **`src/App.tsx`** (vérifié si besoin) — rien à changer ; l'overlay vit uniquement sur la home pour ce premier jet. Si tu veux le globaliser, on pourra le déplacer dans `App.tsx` plus tard.

## Validation manuelle après build

- Ouvrir `/?debug=1` sur mobile/PWA → vérifier `FilterPanel in DOM: 1` et `mobile FilterPanel mounted`.
- Cliquer sur "Filtres" → `filtersOpen: true`, toujours `1` instance, `body scroll-lock: on`.
- Redimensionner au-dessus de 1024px → bascule vers `desktop`, toujours `1` instance.
- `Ctrl+Shift+D` pour masquer/afficher.

## Notes

- L'overlay n'apparaît jamais sans activation explicite — zéro impact prod.
- `pointer-events-none` garantit qu'il ne perturbe pas le tap sur la modale.