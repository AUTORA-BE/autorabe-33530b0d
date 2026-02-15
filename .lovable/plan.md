

# Plan d'audit pre-lancement AutoRA -- Actions restantes

Ce plan identifie uniquement les actions qui ne sont **pas encore implementees** dans le codebase actuel. De nombreux points de votre prompt sont deja en place.

---

## Ce qui est DEJA fait (aucune action necessaire)

- Logo "Auto" blanc / "RA" vert : Header et Footer sont corrects
- Types TypeScript stricts (`Vehicle`, `VehicleDetail`, `VehicleListingRow`) dans `features/listings/types/`
- Validation Zod sur le formulaire de contact (email, message 10-2000 chars)
- Validation Zod sur le formulaire SellCar (prix, annee, etc.)
- React Query avec `staleTime` 5 min et `gcTime` 10 min
- Lazy loading de toutes les pages non-critiques dans `App.tsx`
- SEOHead avec React Helmet (titres, descriptions, Open Graph, hreflang 4 langues)
- Badges Car-Pass et LEZ sur VehicleCard avec tooltips par ville
- Filtres avancés (marque, modele, prix, annee, km, carburant, transmission, Euro, LEZ, vendeur, carrosserie)
- Infinite scroll avec pagination serveur (PAGE_SIZE = 20)
- Footer complet avec liens legaux, CGV, RGPD, Car-Pass, avertissement belge
- Page 404 avec bouton retour
- Systeme de signalement d'annonces (table `reports` + `ReportAdModal`)
- Dashboard admin (`/admin/reports`)
- Page CarDetail avec galerie, specs, contact vendeur, partage
- Grille responsive (1/2/3 colonnes)
- Switch de langue FR/NL/DE/EN
- Bucket `car-photos` avec RLS
- RLS policies restreintes a `authenticated` (migration recente)
- Transition CSS globale supprimee (correction recente)
- Filtres `sellerTypeFilter` et `bodyType` corriges dans `buildQuery` (correction recente)

---

## Actions a implementer

### 1. Anti-spam sur le formulaire de contact
**Fichier:** `src/pages/Contact.tsx`

Ajouter un rate-limiting cote client : empecher plus d'une soumission par 60 secondes. Utiliser un `useState` avec `lastSubmitTime` et comparer avec `Date.now()`.

### 2. Validation renforcee du formulaire SellCar
**Fichier:** `src/components/SellCarForm.tsx`

- Prix : ajouter `.max(1000000, "Le prix ne peut pas depasser 1 000 000 EUR")`
- Limiter a 10 photos max (ajouter un check dans la logique d'upload)
- Limiter chaque photo a 5MB (verifier `file.size` avant upload)
- Messages d'erreur en francais clair au lieu de "Required"

### 3. Composant CarImage reutilisable
**Nouveau fichier:** `src/components/cars/CarImage.tsx`

- Skeleton loader pendant le chargement (`onLoad` state)
- `loading="lazy"` par defaut
- Gestion d'erreur avec placeholder "Image non disponible" (`onError`)
- `aspect-ratio` fixe pour eviter les layout shifts
- Badge "Photo principale" sur la premiere image (optionnel via prop)

Integrer ce composant dans `VehicleCard.tsx` et `CarDetail.tsx` pour remplacer les `<img>` directs.

### 4. Page Contact : supprimer les informations fictives
**Fichier:** `src/pages/Contact.tsx`

Le formulaire affiche une adresse fictive ("Rue de la Loi 1") et un telephone fictif ("+32 2 123 45 67"). Conformement au statut provisoire du projet, supprimer ces informations et ne garder que l'email `contact@autora.be`. Supprimer egalement la Google Map iframe.

### 5. Centraliser la logique de filtrage (refactoring)
**Fichier:** `src/features/listings/hooks/useFilteredInfiniteCarListings.ts`

Remplacer la fonction `buildQuery` dupliquee par un import de `applyFilters` depuis `vehicleQueries.ts`. Cela elimine la duplication et les risques de desynchronisation.

### 6. Ajouter `fetchListings` aux dependances du useEffect
**Fichier:** `src/features/listings/hooks/useFilteredInfiniteCarListings.ts`

Corriger le `useEffect` (ligne ~226) pour inclure `fetchListings` dans le tableau de dependances, conformement aux regles React.

### 7. Supprimer le `dbListing` type `any` dans CarDetail
**Fichier:** `src/pages/CarDetail.tsx` (ligne 47)

Remplacer `const [dbListing, setDbListing] = useState<any>(null)` par le type `VehicleListingRow | null` pour eliminer le seul `any` restant.

### 8. Precharger les images de la premiere rangee
**Fichier:** `src/features/listings/components/VehicleGrid.tsx` ou equivalent

Ajouter `loading="eager"` et `fetchpriority="high"` sur les 3 premieres images de la grille, garder `loading="lazy"` pour le reste. Cela ameliore le Largest Contentful Paint (LCP).

---

## Resume des priorites

| Priorite | Action | Effort |
|----------|--------|--------|
| Haute | Anti-spam formulaire contact (60s) | Faible |
| Haute | Validation SellCar renforcee (prix max, photos max/size, messages FR) | Faible |
| Haute | Supprimer infos fictives de Contact.tsx | Faible |
| Haute | Supprimer `any` dans CarDetail.tsx | Faible |
| Moyenne | Composant CarImage reutilisable | Moyen |
| Moyenne | Centraliser `buildQuery` via `applyFilters` | Moyen |
| Moyenne | Fix useEffect dependencies | Faible |
| Faible | Precharger premieres images (LCP) | Faible |

---

## Section technique

### Composant CarImage -- Interface proposee
```typescript
interface CarImageProps {
  src: string;
  alt: string;
  isPrimary?: boolean;       // Affiche badge "Photo principale"
  eager?: boolean;           // loading="eager" pour LCP
  className?: string;
  aspectRatio?: string;      // Defaut: "4/3"
  onClick?: () => void;      // Pour zoom fullscreen
}
```

### Anti-spam Contact -- Implementation
```typescript
const [lastSubmitTime, setLastSubmitTime] = useState(0);

const onSubmit = async (data) => {
  const now = Date.now();
  if (now - lastSubmitTime < 60000) {
    toast.error("Veuillez attendre 60 secondes entre chaque envoi.");
    return;
  }
  setLastSubmitTime(now);
  // ... reste de la logique
};
```

### Centralisation filtrage -- Approche
Exporter `applyFilters` depuis `vehicleQueries.ts` (deja defini) et l'utiliser dans `useFilteredInfiniteCarListings.ts` au lieu de la copie locale `buildQuery`. Le sorting est deja centralise via `applySorting`.

