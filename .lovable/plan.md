

# Plan : Widget Prix Carburants Belgique -- Intégration Premium

## Contexte

AutoRa dispose deja des donnees de prix carburants belges dans `src/features/tco/constants/belgianData.ts` (PRIX_CARBURANT). L'objectif est d'exposer ces donnees de maniere elegante a trois endroits strategiques sans surcharger l'interface.

## Architecture

Trois points d'integration, un seul composant reutilisable :

```text
FuelPriceStrip (composant unique)
  ├── Homepage : bandeau horizontal sous TrustBar (scroll horizontal mobile)
  ├── TCO Hero : mini-indicateur contextuel sous le sous-titre
  └── TCO FuelTypeStep : prix live inline sur chaque carte carburant (deja present)
```

## Modifications prevues

### 1. Nouveau composant `src/components/FuelPriceStrip.tsx`

Widget horizontal glassmorphique affichant les 4 prix principaux (Diesel B7, Essence E10, Essence E5, Electricite). Design :

- Fond `bg-card/40 backdrop-blur-xl border border-border/20` -- glassmorphism subtil
- Icones vectorielles minimalistes Lucide (`Droplets` pour diesel, `Flame` pour essence, `Zap` pour electrique) -- pas d'emojis
- Typographie : prix en `font-mono text-foreground font-semibold`, labels en `text-[11px] text-muted-foreground`
- Denomination officielle belge : "Diesel B7", "E10 (95)", "E98", "kWh"
- Badge discret "MAJ Mars 2026" en `text-[9px]` avec icone `Clock`
- Skeleton loader anime pendant le premier rendu (simule un delai de 300ms pour l'effet premium)
- Scroll horizontal `snap-x` sur mobile, flex horizontal centre sur desktop
- Staggered entrance via `framer-motion` (opacity + translateY)

### 2. Integration Homepage (`src/pages/Index.tsx`)

- Ajouter `FuelPriceStrip` en lazy-load entre le TrustBar et le SwipeDiscovery
- Enveloppe `ScrollReveal` avec direction "up"
- Fallback skeleton de 48px de hauteur

### 3. Integration TCO Hero (`src/features/tco/components/TcoHero.tsx`)

- Ajouter une version compacte (3 prix, inline) sous le texte "Donnees officielles Belgique 2026"
- Variante `compact` du composant : taille reduite, sans bordure, fond transparent
- Apparition animee avec delay 0.6s

### 4. Mise a jour FuelTypeStep (`src/features/tco/components/steps/FuelTypeStep.tsx`)

- Remplacer les emojis (🛢️ ⛽ 🔋 🔌 ⚡) par des icones Lucide coherentes (`Droplets`, `Flame`, `Zap`, `PlugZap`, `BatteryCharging`)
- Mettre a jour le sous-titre : "Prix moyens Belgique -- Mars 2026"

### 5. Mise a jour constantes (`src/features/tco/constants/belgianData.ts`)

- Ajouter un champ `lucideIcon` a chaque entree de `FUEL_OPTIONS` pour remplacer les emojis
- Conserver les emojis en fallback si necessaire

## Section technique

| Aspect | Detail |
|---|---|
| Donnees | Statiques depuis `belgianData.ts`, pas d'appel API |
| Performance | Lazy-load + Suspense, skeleton 48px, `contentVisibility: auto` |
| Responsive | `snap-x overflow-x-auto` mobile, `flex-wrap justify-center` desktop |
| Accessibilite | `aria-label` sur chaque prix, role `list` semantique |
| Bundle | ~2KB gzip (composant + icones deja presentes) |

