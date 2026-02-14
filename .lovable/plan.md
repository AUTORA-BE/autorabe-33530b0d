

# Refonte LEZ - Affichage oriente FUTUR

## Objectif
Remplacer le systeme LEZ actuel (simpliste, avec dates passees) par un systeme complet base sur un calendrier reel par ville (Bruxelles, Anvers, Gand), avec des messages orientes vers le futur et des conseils actionnables.

## Fichiers a creer

### 1. `src/lib/lezData.ts` - Donnees et logique LEZ centralisees
- Calendrier LEZ complet par ville (bruxelles, anvers, gand) x carburant x norme Euro
- 4 statuts : `autorise`, `interdit`, `derogation_requise`, `alerte` (interdit dans moins de 5 ans)
- Fonction `calculerStatutLEZ(fuelType, euroNorm)` retournant le statut global + details par ville
- Types TypeScript stricts pour tous les statuts et retours

## Fichiers a modifier

### 2. `src/components/LezWidget.tsx` - Refonte complete
- Remplacer la logique `getLezStatus` simpliste par `calculerStatutLEZ` depuis `lezData.ts`
- Mode compact : badge colore avec texte contextuel (LEZ OK / Interdit / Derogation / Annee interdiction)
- Mode complet (page detail) : affichage par ville en grille 3 colonnes avec :
  - Statut vert/orange/rouge par ville
  - Messages orientes futur : "Autorise", "Interdit", "Derogation requise", "Interdit des 2031"
  - Alerte visuelle si interdiction dans moins de 5 ans avec conseil de revente
  - Modal "En savoir plus" mise a jour avec tableau par norme/carburant
- Suppression de toutes les references a des dates passees ("interdit depuis X")

### 3. `src/features/listings/components/VehicleCard.tsx` - Badge LEZ intelligent
- Remplacer le badge binaire `isLezCompatible` par un appel a `calculerStatutLEZ`
- 4 variantes de badge :
  - Vert : "LEZ OK" (autorise sans restriction)
  - Orange : "LEZ 2031" (alerte future) ou "Derogation"
  - Rouge : "Interdit" 
- Tooltip au survol montrant le detail par ville
- Necessites : import `Tooltip` de radix, import `calculerStatutLEZ`

### 4. `src/features/listings/api/vehicleQueries.ts` - Mise a jour mapping
- La constante `LEZ_COMPATIBLE_NORMS` reste pour le filtre DB mais le champ `isLezCompatible` est maintenu pour compatibilite
- Pas de changement majeur car le calcul LEZ detaille se fait cote client avec euroNorm + fuelType

### 5. `src/pages/CarDetail.tsx` - Section LEZ enrichie
- Le `LezWidget` recoit deja `euroNorm` et `fuelType`, la refonte du widget suffit
- Pas de changement de props necessaire

## Logique de statut

```text
Statut global = le plus restrictif des 3 villes

interdit (priorite 4) > alerte (3) > derogation_requise (2) > autorise (1)

Messages :
- "Interdit" -> pas de date passee
- "Autorise" -> si pas de limite connue
- "Autorise jusqu'en X" -> si limite > 5 ans
- "Interdit des X" + alerte orange -> si limite <= 5 ans
- "Derogation requise" -> max 8j/an
```

## Details techniques

### Donnees cles integrees
- Bruxelles diesel Euro 6 : autorise jusqu'en 2031 (alerte 5 ans)
- Bruxelles diesel Euro 0-5 : interdit
- Bruxelles essence Euro 0-2 : interdit
- Bruxelles essence Euro 3+ : autorise
- Anvers/Gand diesel Euro 0-3 : derogation requise (8j/an)
- Anvers/Gand diesel Euro 4+ : autorise
- Anvers/Gand essence : tous autorises
- Electrique/hybride : toujours autorise

### Composants UI utilises
- `Badge` (shadcn) pour les badges sur VehicleCard
- `Tooltip` (radix) pour le detail au survol sur VehicleCard
- `Dialog` (radix) pour le modal "En savoir plus" sur la page detail
- `Alert` (shadcn) pour les alertes contextuelles (interdit, alerte future, derogation)
- Couleurs : emerald (autorise), amber/orange (alerte/derogation), red (interdit)

### Impact sur les fichiers existants
- `vehicle.types.ts` : pas de changement (isLezCompatible reste pour le filtre rapide)
- `useCarFilters.ts` : pas de changement (filtre LEZ utilise toujours isLezCompatible)
- `Compare.tsx` : le champ "Compatible LEZ" reste fonctionnel
- `SellCarForm.tsx` : les warnings LEZ existants peuvent etre enrichis mais ne sont pas prioritaires

