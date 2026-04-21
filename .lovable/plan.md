

## Prochaine étape recommandée — URLs SEO multilingues

Maintenant que les grilles fiscales sont en DB et que le polish Beta est terminé, le **plus gros levier restant** avant le lancement public c'est le **SEO multilingue**. Aujourd'hui Google.be voit `autora.be/` en une seule langue, alors que ton marché cible est 60% NL / 35% FR / 5% DE.

## Plan en 3 étapes (priorité décroissante)

### Étape 1 — URLs préfixées par langue (gros impact SEO)
Refactor du routing pour passer de `/voiture/:id` à `/fr/voiture/:id`, `/nl/auto/:id`, `/de/auto/:id`.

- Ajouter un paramètre `:lang` racine dans `App.tsx` (React Router)
- Détecter la langue depuis l'URL au boot (au lieu de localStorage seul)
- Redirection automatique `/` → `/fr/` (ou langue navigateur)
- Mettre à jour `LanguageContext` pour synchroniser URL ↔ langue
- Mettre à jour tous les `<Link>` et `navigate()` pour préfixer la langue active
- Slugs traduits pour les routes clés : `/recherche` (FR) / `/zoeken` (NL) / `/suche` (DE)

### Étape 2 — Hreflang + sitemap multilingue
- `SEOHead` : générer dynamiquement les balises `<link rel="alternate" hreflang>` vers les vraies URLs traduites (pas `?lang=`)
- Edge function `dynamic-sitemap` : émettre une entrée par langue × annonce avec `<xhtml:link rel="alternate">` pour chaque alternative
- `robots.txt` : autoriser les 3 préfixes

### Étape 3 — Slugs SEO sur les fiches véhicule
Passer de `/fr/voiture/uuid-abc-123` à `/fr/voiture/bmw-serie-3-2020-bruxelles-uuid-abc-123` :
- Helper `buildVehicleSlug(vehicle, lang)` côté client
- Route accepte `:slug` et extrait l'UUID en fin de chaîne (rétrocompat avec anciennes URLs)
- Boost massif sur Google pour les requêtes "BMW Série 3 Bruxelles"

## Détails techniques

| Fichier | Changement |
|---------|-----------|
| `src/App.tsx` | Wrapper `<Route path="/:lang/*">` + redirect racine |
| `src/contexts/LanguageContext.tsx` | Lire/écrire `useParams().lang`, garder localStorage en fallback |
| `src/shared/components/Header.tsx`, `BottomNav.tsx`, `Footer.tsx` | Tous les liens passent par un helper `localizedPath(path, lang)` |
| `src/components/SEOHead.tsx` | Générer hreflang vers `https://autora.be/{lang}/{path}` au lieu de `?lang=` |
| `src/lib/routes.ts` (nouveau) | Map des slugs traduits par langue |
| `src/utils/vehicleSlug.ts` (nouveau) | `buildSlug()` + `extractIdFromSlug()` |
| `supabase/functions/dynamic-sitemap/index.ts` | Émettre 3 entrées par véhicule + alternates |
| `public/robots.txt` | Confirmer Allow: /fr/ /nl/ /de/ |

## Estimation
- Étape 1 : ~45 min, risque modéré (touche tous les composants de navigation)
- Étape 2 : ~20 min, risque faible
- Étape 3 : ~25 min, risque faible (rétrocompat assurée)

**Total : ~1h30 pour une refonte SEO complète.** Après ça, tu peux soumettre le sitemap à Google Search Console et tu seras indexable proprement dans les 3 langues belges.

## Alternatives si tu préfères un autre angle

- **Tester l'app end-to-end** (inscription → annonce → message) avant tout chantier SEO
- **Créer 2-3 pages de contenu SEO** (guides LEZ, Car-Pass, achat occasion) — quick win complémentaire
- **Brancher le calculateur fiscal sur la fiche véhicule** (pré-remplir CV/région/année depuis l'annonce) — UX boost
- **Configurer le domaine custom autora.be** + Google Search Console — action manuelle 15 min

Dis-moi laquelle tu veux attaquer.

