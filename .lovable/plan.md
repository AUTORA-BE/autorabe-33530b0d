
# Correction LEZ : Mise a jour du badge CarCard

## Probleme identifie
Le composant `CarCard.tsx` (utilise sur la page d'accueil, favoris, vehicules similaires) affiche encore l'ancien badge "Acces LEZ illimite" au lieu d'utiliser le nouveau systeme `calculerStatutLEZ`.

Le widget LEZ sur la page detail fonctionne correctement (verifie sur la BMW Serie 3 320d Euro 6d diesel : affiche bien "Autorise" pour les 3 villes).

## Ce qui fonctionne deja
- `lezData.ts` : logique correcte, normalisation Euro 6 vs Euro 6d OK
- `LezWidget.tsx` : grille 3 villes, alertes futures, conseil de revente
- `VehicleCard.tsx` : badge LEZ intelligent avec tooltip

## Modification requise

### `src/features/listings/components/CarCard.tsx`
- Remplacer la fonction `getLezBadgeInfo` (ancienne logique simpliste) par un appel a `calculerStatutLEZ`
- Afficher le badge avec les 4 variantes de couleur (vert/orange/rouge) comme dans VehicleCard
- Ajouter un tooltip au survol montrant le detail par ville
- Imports necessaires : `calculerStatutLEZ` de `lezData.ts`, composants `Tooltip` de radix

### Donnees de test
Aucun vehicule diesel Euro 6 (non 6d) n'existe dans la base de donnees. Pour tester l'alerte 2031, il faudra soit :
- Ajouter un vehicule diesel Euro 6 de test dans la base
- Ou modifier temporairement un vehicule existant

La logique est correcte dans le code : un diesel Euro 6 declencherait bien l'alerte orange "Interdit des 2031" a Bruxelles avec le conseil de revente.
