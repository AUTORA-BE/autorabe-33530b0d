

# Plan: Harmonisation "Elite Green" & Polish Final

## Résumé

Retour à l'identité verte émeraude (cohérente avec le logo Auto**RA**), remplacement de Poppins par Montserrat pour les titres, correction du prix 249,99€ → 249€, et ajustements visuels (ombres, contraste).

---

## Modifications par fichier

### 1. `index.html` — Police Montserrat
- Remplacer le chargement Google Fonts de `Poppins` par `Montserrat:wght@500;600;700;800`
- Garder `Inter` pour le corps de texte

### 2. `tailwind.config.ts` — Font family
- Remplacer `'Poppins'` par `'Montserrat'` dans `fontFamily.display`

### 3. `src/index.css` — Palette "Elite Green"
Remplacer toutes les valeurs HSL bleues par du vert émeraude :

**Light mode :**
- `--primary`: `160 84% 30%` (≈ Emerald-600 profond, ~#059669)
- `--accent`: même valeur
- `--ring`: même valeur
- Gradients : mettre à jour les références `204 80% 35%` → `160 84% 30%`

**Dark mode :**
- `--primary`: `160 84% 42%` (plus lumineux pour le contraste sur fond sombre)
- `--accent`, `--ring` : idem
- Gradients dark : mettre à jour

**Ombres :**
- `--shadow-glow-primary` : remplacer la teinte bleue par la teinte verte

**Headings :**
- Remplacer `font-family: 'Poppins'` par `font-family: 'Montserrat'` dans la règle `h1-h6`

### 4. `src/components/PricingCTA.tsx` — Prix 249€
- Remplacer `249,99€` par `249€`

### 5. `src/features/subscription/constants/tiers.ts` — JSDoc
- Mettre à jour le commentaire `€249.99/mo` → `€249/mo` (le `price: 249` est déjà correct)

### 6. Aucun changement nécessaire sur :
- **VehicleCard.tsx** : utilise déjà `bg-primary` qui héritera automatiquement du vert
- **Footer.tsx** : structure 4 colonnes déjà en place
- **Header/DesktopActions** : le bouton "Vendre" utilise déjà `bg-primary rounded-full`
- **FilterPanel** : drawer mobile déjà implémenté
- **overflow-x** : déjà géré dans `index.css`

---

## Fichiers impactés (5 fichiers)

| Fichier | Changement |
|---|---|
| `index.html` | Montserrat au lieu de Poppins |
| `tailwind.config.ts` | `display: ['Montserrat']` |
| `src/index.css` | Palette verte + headings Montserrat |
| `src/components/PricingCTA.tsx` | 249,99€ → 249€ |
| `src/features/subscription/constants/tiers.ts` | Commentaire JSDoc |

