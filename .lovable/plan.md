# Finalisation Grand Launch — 3 vagues d'un coup

## Vague 1 — Page d'accueil premium

**HeroSearch (`src/features/search/components/HeroSearch.tsx`)**
- Headline serif Playfair plus impactante: "L'automobile belge, sans compromis."
- Sub: "Car-Pass vérifié · LEZ conforme · Vendeurs locaux"
- 3 trust chips sous la barre de recherche (Car-Pass / LEZ / Pro & Particuliers), Lucide stroke 1.5
- Traduction des nouvelles clés dans fr/nl/de/en

**Compteurs réels (`src/components/LiveStatsStrip.tsx`)**
- Garder les requêtes existantes (déjà branchées sur `car_listings_public`, `profiles_public`, `car_views`)
- Remplacer la valeur fake "99% Uptime" par un compteur réel: nombre de villes uniques couvertes (RPC ou query distinct sur `car_listings.location`)
- Ajouter une nouvelle RPC `get_active_cities_count()` (SECURITY DEFINER, public)

**WhyAutoRa (`src/components/WhyAutoRa.tsx`)**
- Vérifier que les 4 cartes mettent en avant: Car-Pass obligatoire · Bon Match IA · TMC/LEZ intégré · Conseiller fiscal IA
- Ajuster textes i18n si besoin

## Vague 2 — Cohérence & nettoyage

**Refactor admin hook**
- `src/hooks/useIsAdmin.ts` → simple re-export de `useAdminAuth` (ou wrapper autour de la même RPC) pour supprimer la duplication

**i18n purge**
- Supprimer clés mortes dans fr/nl/de/en: `hero.title1`, `hero.title2`, `auth.findIdealCar`, anciennes `auth.heroDesc` non référencées
- Vérifier via `rg` avant suppression

**Routes obsolètes (`src/App.tsx`)**
- Confirmer que `/favorites` redirige vers `/garage`
- Supprimer route `/early-access` si présente
- Supprimer import du composant `EarlyAccessBanner` partout

## Vague 3 — Confiance & conversion

**Badge "Vendeur vérifié"**
- Sur `VehicleCard`, afficher badge Emerald-600 quand `seller_type = 'professionnel'` et profil complété (garage_name + phone)

**Section FAQ home (lazy)**
- Ajouter `<HomeFAQ />` dans `Index.tsx` après `PricingCTA`
- 4 questions clés réutilisées de `/faq` (Car-Pass, LEZ, frais cachés, vendeur Pro vs Particulier)
- Schema.org `FAQPage` injecté via `SEOHead`

**Skeleton sync**
- Vérifier `HomeSkeleton.tsx` → ajouter skeleton FAQ pour éviter CLS

**Meta OG**
- `Index.tsx` SEOHead: ajouter image OG `https://autora.be/og-home.jpg`, description orientée Belgique (déjà en place, vérifier)

## Détails techniques

- Nouvelle RPC SQL:
  ```sql
  CREATE OR REPLACE FUNCTION public.get_active_cities_count()
  RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
    SELECT COUNT(DISTINCT location)::integer
    FROM car_listings WHERE status='approved' AND location IS NOT NULL
  $$;
  GRANT EXECUTE ON FUNCTION public.get_active_cities_count() TO anon, authenticated;
  ```
- Composant nouveau: `src/components/HomeFAQ.tsx`
- Pas de breaking change DB; pas de nouvelle table

## Hors scope

- Vrais témoignages (attendre signups)
- Programme parrainage
- App mobile native

J'enchaîne dès validation.
