/**
 * Reference template for the semantic HTML / a11y structure of a car detail
 * page. NOT a runtime component — copy the structure into your CarDetail.tsx.
 *
 * Why this matters:
 *   - Search engines weight content under H1/H2/H3 differently. ONE H1 per
 *     page; H2 for major facets; H3 for sub-facets inside each H2 section.
 *   - Screen readers navigate by heading level — a logical hierarchy makes
 *     the page traversable.
 *   - Landmarks (<main>, <section>, <nav>, <aside>) enable "skip to" jumps.
 *   - <figure>/<figcaption> on the gallery makes images first-class content.
 *
 * @module components/seo
 */

interface ExampleProps {
  vehicle: {
    year: number;
    brand: string;
    model: string;
    trim?: string;
    location: string;
    price: number;
    images: { src: string; alt?: string }[];
  };
}

/** REFERENCE ONLY — do not import. Use this as a structural template. */
export function CarDetailSemantics({ vehicle }: ExampleProps) {
  const headline = `${vehicle.year} ${vehicle.brand} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`;
  const altFor = (i: number) =>
    `${headline} — photo ${i + 1} sur ${vehicle.images.length}`;

  return (
    <main aria-labelledby="car-headline">
      {/* ───────────────── Breadcrumb (helps Google AND keyboard users) */}
      <nav aria-label="Fil d'Ariane" className="...">
        <ol>
          <li><a href="/">Accueil</a></li>
          <li><a href="/recherche">Voitures d'occasion</a></li>
          <li><a href={`/marque/${vehicle.brand.toLowerCase()}`}>{vehicle.brand}</a></li>
          <li aria-current="page">{vehicle.model}</li>
        </ol>
      </nav>

      {/* ───────────────── HERO — ONE H1, descriptive, includes the key facts */}
      <header className="...">
        <h1 id="car-headline" className="...">
          {/* H1 must contain : Year + Brand + Model + (optional Trim) */}
          {headline}
        </h1>
        <p className="..." aria-label={`Prix : ${vehicle.price} euros`}>
          {/* Visible price + screen-reader-only spelled-out */}
          {vehicle.price.toLocaleString("fr-BE")} €
        </p>
      </header>

      {/* ───────────────── GALLERY — semantic figure with descriptive alts */}
      <section aria-labelledby="gallery-heading" className="...">
        <h2 id="gallery-heading" className="sr-only">
          Galerie photos du véhicule
        </h2>

        <figure>
          {/* Hero / LCP image — use <HeroImage /> here, eager + fetchpriority high */}
          <img
            src={vehicle.images[0].src}
            alt={vehicle.images[0].alt || altFor(0)}
            width={1600}
            height={900}
            loading="eager"
            decoding="sync"
            {...({ fetchpriority: "high" } as { fetchpriority: "high" })}
          />
          <figcaption className="sr-only">{altFor(0)}</figcaption>
        </figure>

        <ul role="list" aria-label="Photos supplémentaires">
          {vehicle.images.slice(1).map((img, i) => (
            <li key={i}>
              <button
                type="button"
                aria-label={`Voir ${altFor(i + 1)}`}
                className="..."
              >
                <img
                  src={img.src}
                  alt={img.alt || altFor(i + 1)}
                  width={400}
                  height={225}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────────── KEY SPECS — H2 with H3 sub-blocks */}
      <section aria-labelledby="specs-heading" className="...">
        <h2 id="specs-heading">Caractéristiques techniques</h2>

        <section aria-labelledby="engine-heading">
          <h3 id="engine-heading">Motorisation</h3>
          <dl>
            <dt>Carburant</dt><dd>Essence</dd>
            <dt>Boîte</dt><dd>Automatique</dd>
            <dt>Puissance</dt><dd>510 ch</dd>
          </dl>
        </section>

        <section aria-labelledby="dimensions-heading">
          <h3 id="dimensions-heading">Dimensions & poids</h3>
          {/* … */}
        </section>

        <section aria-labelledby="conformity-heading">
          <h3 id="conformity-heading">Conformité belge</h3>
          {/* Car-Pass · Norme Euro · Compatibilité LEZ */}
        </section>
      </section>

      {/* ───────────────── DESCRIPTION — H2 */}
      <section aria-labelledby="desc-heading" className="...">
        <h2 id="desc-heading">Description du vendeur</h2>
        {/* … rich text from seller */}
      </section>

      {/* ───────────────── SELLER — H2 */}
      <aside aria-labelledby="seller-heading" className="...">
        <h2 id="seller-heading">Vendeur</h2>
        <button type="button" aria-label="Contacter le vendeur" className="...">
          Envoyer un message
        </button>
        <a href="tel:+32..." aria-label="Appeler le vendeur">
          Appeler
        </a>
      </aside>

      {/* ───────────────── RELATED VEHICLES — H2 */}
      <section aria-labelledby="related-heading" className="...">
        <h2 id="related-heading">Véhicules similaires</h2>
        {/* … carousel */}
      </section>
    </main>
  );
}

/**
 * RULES OF THUMB
 * --------------
 *  - 1 H1 per page (= the car headline).
 *  - H2 for top-level sections (Galerie, Spécs, Description, Vendeur, Similaires).
 *  - H3 for sub-sections inside each H2 block.
 *  - Every <section> SHOULD have an aria-labelledby pointing to its heading.
 *  - Every <img> MUST have an alt that describes the vehicle and the
 *    photo's position (not just "car.jpg").
 *  - The hero/LCP image is `loading="eager"` + `fetchpriority="high"`.
 *  - All other gallery images are `loading="lazy"` + `decoding="async"`.
 *  - Interactive non-text controls (icon buttons, image-zoom) get aria-label.
 *  - Prices and metric values benefit from invisible spelled-out labels via
 *    `aria-label` for screen readers (avoids "118500 €" being read as digits).
 */
