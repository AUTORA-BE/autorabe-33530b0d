# Géocodage des annonces — état actuel et fonctionnalité manquante

## Constat (production)

Les colonnes `latitude` / `longitude` de `car_listings` existent mais sont
**nulles sur la totalité des annonces**. Conséquence directe :

- la RPC `listings_within_radius` ne renvoie **jamais** aucun résultat ;
- le filtre « autour de moi » / par rayon est donc inopérant, silencieusement
  (pas d'erreur, juste zéro résultat).

## Pourquoi

`src/components/SellCarForm.tsx` tente bien un géocodage à la publication via
OSM Nominatim (`nominatim.openstreetmap.org/search`), mais :

1. l'échec est volontairement non bloquant (`catch` vide) — une annonce se
   publie sans coordonnées et personne n'en est informé ;
2. Nominatim impose une politique d'usage stricte (1 req/s, `User-Agent`
   identifiant obligatoire) que le navigateur ne peut pas respecter
   correctement ; les appels depuis le front sont fréquemment refusés ;
3. la Content-Security-Policy de `index.html` ne liste pas
   `nominatim.openstreetmap.org` dans `connect-src` — la requête est donc
   **bloquée par le navigateur** en production. C'est la cause principale.
4. rien ne géocode les annonces créées par d'autres chemins, ni les annonces
   existantes.

## Ce qu'il faudrait construire (hors périmètre du correctif actuel)

- Géocodage **côté serveur**, dans une Edge Function, déclenché à la création
  et à la modification d'annonce — avec `User-Agent` conforme, limitation de
  débit et mise en cache par code postal / commune.
- Un référentiel local des ~1150 codes postaux belges couvrirait la quasi-
  totalité des cas sans appel réseau, le géocodage en ligne ne servant que de
  repli.
- Une reprise unique des annonces existantes (`latitude is null`).
- Une supervision : alerte si le taux d'annonces sans coordonnées dépasse un
  seuil.

Tant que ce chantier n'est pas fait, le filtre par distance doit être
considéré comme non fonctionnel. Le filtre **par province**, lui, fonctionne :
il s'appuie sur le texte de `location` et tolère depuis peu les codes postaux
(voir `src/features/listings/utils/location.ts`).
