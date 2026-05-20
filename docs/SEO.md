# SEO Technical Reference — AutoRA

Cible : marché **domestique belge**, multilingue (fr-BE / nl-BE / de-BE).
Stack : React 19 + Vite + `react-helmet-async`.

---

## 1. Composants SEO disponibles

| Composant | Quand l'utiliser |
|---|---|
| `<SEOHead />` (`src/components/SEOHead.tsx`) | **Toutes les pages** (home, search, à propos…) |
| `<VehicleSEO />` (`src/components/seo/VehicleSEO.tsx`) | **Pages annonce uniquement** (`/car/:id`) |
| `<HeroImage />` (`src/components/seo/HeroImage.tsx`) | Image LCP candidate (1 par page max) |
| `CarDetailSemantics.example.tsx` | Référence structurelle H1/H2/H3 (à recopier) |

---

## 2. Intégration dans `CarDetail.tsx`

```tsx
import VehicleSEO from "@/components/seo/VehicleSEO";
import HeroImage from "@/components/seo/HeroImage";

export default function CarDetail() {
  const { vehicle } = useVehicle();

  if (!vehicle) return null;

  return (
    <>
      <VehicleSEO vehicle={vehicle} />

      <main aria-labelledby="car-headline">
        <header>
          <h1 id="car-headline">
            {vehicle.year} {vehicle.brand} {vehicle.model}
          </h1>
        </header>

        <HeroImage
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
          isLcp
        />

        {/* …reste du contenu… */}
      </main>
    </>
  );
}
```

---

## 3. Stratégie hreflang pour la Belgique

### Le piège
Avec `hrefLang="fr"` seul, Google peut servir tes pages françaises aux utilisateurs **français**, et tu te retrouves en compétition avec lacentrale.fr, leboncoin.fr, autoscout24.fr — un combat perdu.

### La bonne pratique pour AutoRA

Émettre **TOUS** les codes régionalisés ET les codes génériques :

```html
<link rel="alternate" hreflang="fr-BE" href="https://autora.be/fr/…" />
<link rel="alternate" hreflang="nl-BE" href="https://autora.be/nl/…" />
<link rel="alternate" hreflang="de-BE" href="https://autora.be/de/…" />
<link rel="alternate" hreflang="fr"    href="https://autora.be/fr/…" />
<link rel="alternate" hreflang="nl"    href="https://autora.be/nl/…" />
<link rel="alternate" hreflang="de"    href="https://autora.be/de/…" />
<link rel="alternate" hreflang="en"    href="https://autora.be/en/…" />
<link rel="alternate" hreflang="x-default" href="https://autora.be/fr/…" />
```

| Code | Audience visée |
|---|---|
| `fr-BE` | Wallons + bruxellois francophones |
| `nl-BE` | Flamands + bruxellois néerlandophones |
| `de-BE` | Communauté germanophone (cantons de l'Est / Ostbelgien) |
| `fr` / `nl` / `de` | Fallback générique (audience large) |
| `en` | Anglophones internationaux |
| `x-default` | Tout le reste (redirige vers `fr-BE`) |

### Signaux de renforcement géographique

```html
<meta name="geo.region" content="BE" />
<meta name="geo.placename" content="Belgium" />
<meta name="ICBM" content="50.8503, 4.3517" />
```

À configurer en plus :
- **Google Search Console** → International targeting → BE
- Hébergement avec CDN en Europe (Cloudflare/Vercel EU PoPs)
- TLD `.be` (déjà OK avec `autora.be`)

---

## 4. JSON-LD Vehicle — données structurées

Le helper `vehicleSchema()` (`src/lib/seoSchemas.ts`) émet un objet conforme à
[Google Vehicle Listing](https://developers.google.com/search/docs/appearance/structured-data/vehicle-listing) :

### Champs requis Google
- `brand` (Brand object)
- `model`
- `offers.price` + `offers.priceCurrency`
- `vehicleIdentificationNumber` (VIN — fortement recommandé)

### Champs recommandés (tous générés si fournis)
- `mileageFromOdometer` avec `unitCode: "KMT"`
- `dateVehicleFirstRegistered` (ISO 8601)
- `fuelType` (mappé sur les enums schema.org : `Gasoline`, `Diesel`, `Electric`, `Hybrid`, `Lpg`, `Cng`)
- `vehicleTransmission`
- `bodyType`
- `numberOfDoors`, `vehicleSeatingCapacity`
- `color`, `vehicleInteriorColor`
- `vehicleEngine` (avec `enginePower` kW + `engineDisplacement` cc)
- `itemCondition` (toujours `UsedCondition` pour le marché occasion)
- `offers.availability`, `priceValidUntil`, `areaServed: { name: "BE" }`
- `offers.seller` typé `AutoDealer` (pro) ou `Person` (particulier)

### Test
1. Push en prod (autora.be).
2. https://search.google.com/test/rich-results → coller l'URL d'une annonce.
3. Vérifier l'éligibilité « Vehicle listing ».

---

## 5. Open Graph & Twitter Cards

`<VehicleSEO />` génère automatiquement :

| Type | Champs |
|---|---|
| Facebook / LinkedIn | `og:type=product`, `og:title`, `og:description`, `og:image` (jusqu'à 4), `og:image:width=1200`, `og:image:height=630`, `og:image:alt`, `og:locale=fr_BE` |
| Product OG | `product:price:amount`, `product:price:currency=EUR`, `product:availability=in stock`, `product:condition=used`, `product:brand`, `product:retailer_item_id` |
| Twitter | `twitter:card=summary_large_image`, image, title, description, alt, `@autora_be` |

### Vérifier les previews
- Facebook : https://developers.facebook.com/tools/debug/
- LinkedIn : https://www.linkedin.com/post-inspector/
- Twitter : https://cards-dev.twitter.com/validator (déprécié — utilise les DevTools)

### Format image recommandé
- **1200 × 630 px** (ratio 1.91:1) — exigence Open Graph stricte
- Format JPG/WebP, **< 1 MB**
- Voiture **centrée**, pas de logo AutoRA superposé (Facebook crop)

---

## 6. Core Web Vitals — performance images

### LCP (Largest Contentful Paint) — cible < 2.5s

**L'image hero** d'une page annonce est presque toujours le LCP. Le composant
`<HeroImage isLcp />` applique le pattern complet :

```tsx
<HeroImage
  src={vehicle.image}
  alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
  isLcp     /* eager + fetchpriority high + decoding sync */
/>
```

Sous le capot :
- `loading="eager"` (pas de lazy sur le LCP — règle d'or)
- `fetchpriority="high"` (priorité réseau au-dessus des CSS non-bloquants)
- `decoding="sync"` (décodage avant le paint pour les très grosses images)
- `<picture>` avec sources AVIF puis WebP, fallback original
- `srcSet` 640/960/1280/1600/1920 + `sizes` responsive
- `width`/`height` explicites → **CLS = 0**
- `<link rel="preload" as="image" fetchpriority="high">` injecté par `VehicleSEO`

### CLS (Cumulative Layout Shift) — cible < 0.1

Toujours fournir `width` et `height` (ou `aspect-ratio` CSS) sur **chaque** image.
Le navigateur réserve l'espace avant le chargement → zéro shift.

### Autres images (galerie, miniatures)

Garde le composant existant `CarImage` (`src/components/cars/CarImage.tsx`) qui
gère déjà `loading="lazy"` + `decoding="async"` + blur placeholder.

### Pipeline de transformation
`HeroImage` détecte automatiquement :
- **Supabase Storage Render-Transform** → injecte `?width=…&format=webp&quality=80`
- **Cloudflare `/cdn-cgi/image/…`** → ajoute `format=webp,width=…`
- **Unsplash** → ajoute `?fm=webp&w=…&auto=format`

Si l'image vient d'une autre source (URL externe arbitraire), `<picture>` fait
gracieusement fallback sur l'original sans transformation.

---

## 7. Structure sémantique HTML5

Voir `src/components/seo/CarDetailSemantics.example.tsx` pour le template.

### Règles d'or
- **1 seul `<h1>` par page** = `{Année} {Marque} {Modèle}`
- `<h2>` = sections majeures (Galerie, Spécs, Description, Vendeur, Similaires)
- `<h3>` = sous-sections dans chaque `<h2>`
- `<main aria-labelledby="car-headline">` enrobant toute la page
- Chaque `<section>` a `aria-labelledby` pointant vers son heading
- `<nav aria-label="Fil d'Ariane">` pour le breadcrumb
- `<aside>` pour les blocs latéraux non-essentiels (cards vendeur sur desktop)
- `<figure>` + `<figcaption>` pour la galerie

### Alt dynamiques
```tsx
const altFor = (i) =>
  `${year} ${brand} ${model} — photo ${i+1} sur ${total}`;
```

Jamais `alt="car.jpg"` ou `alt=""` sur une photo de véhicule (sauf pure
décoration). L'alt doit décrire **le véhicule** et la **position** de la photo
dans la séquence.

---

## 8. Checklist de release pour une page annonce

- [ ] `<VehicleSEO />` monté en haut du composant
- [ ] `<HeroImage isLcp />` sur la première image
- [ ] H1 = `{Année} {Marque} {Modèle}`
- [ ] H2 = Galerie / Spécs / Description / Vendeur / Similaires
- [ ] Tous les `<img>` ont un `alt` dynamique non-vide
- [ ] Tous les `<button>` icône ont un `aria-label`
- [ ] Breadcrumb présent avec `aria-current="page"` sur le dernier item
- [ ] Test Rich Results → Vehicle Listing éligible
- [ ] Test Facebook Debugger → og:image affiché, pas de warning
- [ ] PageSpeed Insights mobile → LCP < 2.5s, CLS < 0.1, INP < 200ms

---

## 9. Sitemap & robots

À ajouter si pas encore fait :
- `/public/robots.txt` avec `Sitemap: https://autora.be/sitemap.xml`
- `/public/sitemap.xml` généré au build (script Node listant toutes les pages publiques)
- Section `<lastmod>` à jour à chaque génération
- Une entrée `<url>` par annonce avec `<xhtml:link rel="alternate" hreflang="…">`

Hors-scope de cette PR mais c'est le maillon suivant logique.
