

# Plan SEO — Améliorer la visibilité sur Google

## Ce qui est déjà en place
- SEOHead avec meta tags, Open Graph, Twitter Cards, hreflang
- JSON-LD : Organization, WebSite, Vehicle (Car+Offer), FAQ, Breadcrumb, LocalBusiness
- Sitemap statique + dynamique (Edge Function avec annonces actives)
- robots.txt correct

## Améliorations à apporter

### 1. Ajouter le pre-rendering SEO (critique)
Google a du mal à indexer les SPA React rendues uniquement côté client. Il faut ajouter un **service de pre-rendering** pour servir du HTML statique aux bots.

- Installer `vite-plugin-prerender` ou configurer un service externe (prerender.io)
- Alternative plus simple : ajouter une balise `<meta name="fragment" content="!">` et utiliser le service gratuit Renderton/Prerender

### 2. Soumettre le site à Google Search Console
- Aller sur [search.google.com/search-console](https://search.google.com/search-console)
- Ajouter la propriété `autora.be`
- Vérifier via enregistrement TXT DNS chez OVHcloud
- Soumettre les deux sitemaps manuellement

### 3. Ajouter des pages de contenu SEO (blog/guides)
Créer des pages riches en contenu textuel que Google peut indexer :
- `/guide/lez-belgique` — Guide complet zones LEZ
- `/guide/car-pass` — Tout savoir sur le Car-Pass
- `/guide/acheter-voiture-occasion` — Guide d'achat

Chaque guide = texte long (1500+ mots), structuré avec H2/H3, mots-clés ciblés.

### 4. Enrichir les meta tags par page
- Ajouter des `title` et `description` uniques et optimisés sur chaque page (About, Contact, Pricing, TCO)
- Ajouter des mots-clés longue traîne dans les descriptions

### 5. Améliorer le sitemap statique
- Ajouter `<lastmod>` sur toutes les URLs statiques
- Ajouter la page `/services` manquante
- Ajouter les pages `/lez-belgique` si elle existe

### 6. Ajouter des données structurées manquantes
- **AggregateOffer** sur la homepage (fourchette de prix des véhicules)
- **ItemList** pour les résultats de recherche
- **Review/AggregateRating** sur les profils vendeurs

### 7. Optimiser le Core Web Vitals
- Vérifier que `fetchpriority="high"` est sur l'image hero
- Ajouter `width`/`height` explicites sur les images pour éviter le CLS
- S'assurer que le LCP (Largest Contentful Paint) < 2.5s

---

## Détails techniques

| Fichier | Modification |
|---------|-------------|
| `vite.config.ts` | Ajouter plugin prerender pour les routes statiques |
| `public/sitemap.xml` | Ajouter `<lastmod>`, pages manquantes |
| `src/lib/seoSchemas.ts` | Ajouter `itemListSchema`, `aggregateOfferSchema` |
| `src/pages/Index.tsx` | Ajouter ItemList JSON-LD pour les véhicules populaires |
| `src/pages/*.tsx` | Enrichir les props `title`/`description` de SEOHead |
| Nouvelles pages guides | 2-3 pages de contenu SEO statique |
| `index.html` | Nettoyer les meta dupliqués (OG title/desc dans head ET SEOHead) |

## Actions manuelles (hors code)
1. **Google Search Console** : créer le compte, vérifier le domaine, soumettre les sitemaps
2. **Google My Business** : créer une fiche si applicable
3. **Backlinks** : s'inscrire sur des annuaires belges (Pages d'Or, etc.)

