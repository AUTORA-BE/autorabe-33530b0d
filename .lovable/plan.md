

## Plan: Nettoyage complet et optimisation du site AutoRa

Voici l'ensemble des corrections et optimisations identifiées, regroupées par priorite.

---

### 1. Fix critique : bug d'affichage des vehicules (race condition)

Le hook `useVehicleSearch` a un bug ou `debouncedFilters` change de reference objet (sans changer de valeur) apres 300ms, ce qui declenche le reset de `allVehicles` a `[]` sans re-fetch.

**Fichier** : `src/features/listings/hooks/useVehicleSearch.ts`
- Remplacer la dependance `debouncedFilters` par `JSON.stringify(debouncedFilters)` dans l'effet de reset (ligne 96-99)

---

### 2. Supprimer les hooks obsoletes

`useCarListings` et `useInfiniteCarListings` sont des doublons de `useVehicleSearch` mais sans React Query, sans filtres, sans URL sync. Ils sont encore utilises dans :
- `Favorites.tsx` : utilise `useCarListings` pour recuperer tous les cars puis filtre cote client
- `CarDetail.tsx` : utilise `useCarListings` pour `allCars` (vehicules similaires)

**Actions** :
- **Favorites.tsx** : Remplacer `useCarListings` par une requete React Query dediee qui fetch uniquement les vehicules favoris par IDs (bien plus performant que charger toutes les annonces)
- **CarDetail.tsx** : Utilise deja `useVehicleDetail` pour le detail, remplacer `useCarListings` par `vehicleQueries.getRelated()` qui existe deja
- **Supprimer** `useCarListings.ts` et `useInfiniteCarListings.ts`
- **Nettoyer** les barrel exports dans `hooks/index.ts` et `features/listings/index.ts`

---

### 3. Fix du hook conditionnel (violation des regles React)

Dans `useVehicleSearch`, le `useFiltersUrlSync` est appele conditionnellement (ligne 67-70), ce qui viole les regles des hooks React.

**Fix** : Deplacer la condition a l'interieur du hook `useFiltersUrlSync` en ajoutant un parametre `enabled`, ou appeler le hook inconditionnellement et gerer le `syncUrl` en interne.

---

### 4. Double requete API pour count + data

`vehicleQueries.list()` fait 2 requetes Supabase : une pour le count, une pour les data. On peut les fusionner en une seule avec `select('*', { count: 'exact' })`.

**Fichier** : `src/features/listings/api/vehicleQueries.ts`
- Fusionner count + data en une seule requete

---

### 5. CarCard : supprimer framer-motion inutile

`CarCard` utilise `motion.article` avec `whileHover` et `whileTap` qui ajoutent du poids JS pour chaque carte. Remplacer par CSS `:hover` et `:active` natifs pour la meme UX avec zero JS.

**Fichier** : `src/features/listings/components/CarCard.tsx`
- Remplacer `motion.article` par `<article>` avec classes CSS `hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98] transition-all duration-300`

---

### 6. Resume des fichiers a modifier

| Fichier | Action |
|---|---|
| `useVehicleSearch.ts` | Fix race condition + fix hook conditionnel |
| `vehicleQueries.ts` | Fusionner count+data en 1 requete |
| `CarCard.tsx` | Remplacer motion.article par CSS natif |
| `Favorites.tsx` | Fetch par IDs au lieu de tout charger |
| `CarDetail.tsx` | Utiliser `vehicleQueries.getRelated()` |
| `useCarListings.ts` | Supprimer |
| `useInfiniteCarListings.ts` | Supprimer |
| `hooks/index.ts` | Nettoyer exports |
| `features/listings/index.ts` | Nettoyer exports |

