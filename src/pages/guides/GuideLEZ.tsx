/**
 * Guide SEO — Zones de Basses Émissions (LEZ) en Belgique
 */
import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { articleSchema, breadcrumbSchema, faqSchema } from "@/lib/seoSchemas";
import { Shield, MapPin, AlertTriangle, CheckCircle, Car, Info } from "lucide-react";

const GuideLEZ = () => {
  return (
    <div className="page-gradient">
      <SEOHead
        title="Guide LEZ Belgique 2026 — Zones Basses Émissions"
        description="Tout savoir sur les zones de basses émissions (LEZ) en Belgique : Bruxelles, Anvers, Gand. Quels véhicules autorisés ? Amendes, normes Euro et calendrier 2026."
        url="https://autora.be/guide/lez-belgique"
        jsonLd={[
          articleSchema({
            title: "Guide complet des zones LEZ en Belgique 2026",
            description: "Tout savoir sur les zones de basses émissions en Belgique",
            url: "https://autora.be/guide/lez-belgique",
            datePublished: "2026-04-15",
          }),
          breadcrumbSchema([
            { name: "Accueil", url: "https://autora.be" },
            { name: "Guides", url: "https://autora.be/guide/lez-belgique" },
            { name: "LEZ Belgique", url: "https://autora.be/guide/lez-belgique" },
          ]),
          faqSchema([
            { question: "Quelles villes belges ont une LEZ en 2026 ?", answer: "Trois villes appliquent une zone de basses émissions : Bruxelles (toute la Région), Anvers (centre-ville) et Gand (intra-ring)." },
            { question: "Mon diesel Euro 5 peut-il rouler à Bruxelles ?", answer: "Non. Depuis le 1er janvier 2025, les diesels Euro 5 sont interdits dans la LEZ de Bruxelles. Seuls Euro 6 et plus récents sont autorisés." },
            { question: "Quelle est l'amende pour une infraction LEZ ?", answer: "350 € pour la première infraction à Bruxelles, jusqu'à 1 000 € en cas de récidive. Anvers et Gand : 150 € à 350 €." },
            { question: "Mon véhicule essence est-il concerné par la LEZ ?", answer: "Les essences Euro 1 et inférieurs sont interdits à Bruxelles. À partir d'Euro 2, ils sont autorisés. La plupart des véhicules essence post-1997 passent." },
            { question: "Comment vérifier si mon véhicule est conforme LEZ ?", answer: "Sur AutoRa, chaque annonce affiche un badge LEZ par ville. Vous pouvez aussi vérifier sur lez.brussels avec votre plaque d'immatriculation." },
            { question: "Les voitures électriques et hybrides sont-elles autorisées ?", answer: "Oui, les véhicules 100% électriques et hybrides rechargeables (PHEV) sont autorisés dans toutes les LEZ belges sans restriction." },
          ]),
        ]}
      />
      <Header />

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-6 max-w-4xl">
          <BackButton to="/" className="mb-6" />

          {/* Hero */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              Guide complet
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Zones de Basses Émissions <span className="gradient-text">(LEZ)</span> en Belgique — Guide 2026
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Les zones de basses émissions (LEZ — <em>Low Emission Zone</em>) sont des périmètres urbains où la circulation de certains véhicules polluants est restreinte ou interdite. En Belgique, trois villes appliquent ces restrictions : <strong>Bruxelles</strong>, <strong>Anvers</strong> et <strong>Gand</strong>. Ce guide vous explique tout ce que vous devez savoir avant d'acheter ou de vendre un véhicule en 2026.
            </p>
          </header>

          {/* Table of contents */}
          <nav className="glass-card p-6 mb-12 rounded-2xl">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">Sommaire</h2>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#quest-ce-que-la-lez" className="hover:text-primary transition-colors">1. Qu'est-ce qu'une zone LEZ ?</a></li>
              <li><a href="#trois-lez-belgique" className="hover:text-primary transition-colors">2. Les trois LEZ en Belgique</a></li>
              <li><a href="#normes-euro" className="hover:text-primary transition-colors">3. Normes Euro et véhicules autorisés</a></li>
              <li><a href="#calendrier-2026" className="hover:text-primary transition-colors">4. Calendrier des restrictions 2026</a></li>
              <li><a href="#amendes" className="hover:text-primary transition-colors">5. Amendes et sanctions</a></li>
              <li><a href="#conseils-achat" className="hover:text-primary transition-colors">6. Conseils pour acheter un véhicule conforme LEZ</a></li>
              <li><a href="#autora-lez" className="hover:text-primary transition-colors">7. Comment AutoRa vous aide</a></li>
            </ol>
          </nav>

          {/* Content sections */}
          <div className="prose prose-lg max-w-none space-y-12">

            <section id="quest-ce-que-la-lez">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Shield className="w-7 h-7 text-primary flex-shrink-0" />
                1. Qu'est-ce qu'une zone LEZ ?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Une <strong>zone de basses émissions</strong> (LEZ) est un périmètre géographique défini par une ville ou une région dans lequel seuls les véhicules répondant à certaines <strong>normes environnementales</strong> (normes Euro) peuvent circuler librement. L'objectif est de réduire la pollution atmosphérique et d'améliorer la qualité de l'air en milieu urbain.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                En Belgique, les LEZ concernent principalement les véhicules les plus anciens et les plus polluants. Les critères d'accès sont basés sur la <strong>norme Euro</strong> du véhicule, déterminée par sa date de première immatriculation et son type de motorisation (diesel, essence, GPL, hybride, électrique).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Les véhicules <strong>100% électriques</strong> et <strong>à hydrogène</strong> sont toujours autorisés, quelle que soit la zone. Les véhicules hybrides sont soumis aux mêmes critères que leur motorisation thermique.
              </p>
            </section>

            <section id="trois-lez-belgique">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <MapPin className="w-7 h-7 text-primary flex-shrink-0" />
                2. Les trois LEZ en Belgique
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {[
                  { city: "Bruxelles", since: "2018", scope: "19 communes de la Région de Bruxelles-Capitale", note: "La plus stricte de Belgique. S'applique 24h/24, 7j/7." },
                  { city: "Anvers", since: "2017", scope: "Centre-ville et périphérie immédiate", note: "Première LEZ belge. Restrictions progressives chaque année." },
                  { city: "Gand", since: "2020", scope: "Centre-ville de Gand", note: "Zone plus restreinte mais critères stricts." },
                ].map((zone) => (
                  <div key={zone.city} className="glass-card p-6 rounded-2xl">
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">{zone.city}</h3>
                    <p className="text-xs text-primary font-medium mb-2">Active depuis {zone.since}</p>
                    <p className="text-sm text-muted-foreground mb-3">{zone.scope}</p>
                    <p className="text-xs text-muted-foreground italic">{zone.note}</p>
                  </div>
                ))}
              </div>

              <p className="text-muted-foreground leading-relaxed">
                D'autres villes belges (Malines, Willebroek, etc.) envisagent également d'instaurer des restrictions similaires à l'avenir. Il est donc crucial de vérifier la conformité LEZ de votre véhicule avant tout achat.
              </p>
            </section>

            <section id="normes-euro">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Car className="w-7 h-7 text-primary flex-shrink-0" />
                3. Normes Euro et véhicules autorisés
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Les normes Euro classent les véhicules selon leur niveau d'émissions polluantes. Plus le chiffre est élevé, plus le véhicule est propre. Voici un résumé des normes en vigueur :
              </p>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Norme Euro</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Diesel</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Essence / GPL</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Années approx.</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50"><td className="py-2 px-4">Euro 1</td><td className="py-2 px-4">Interdit partout</td><td className="py-2 px-4">Interdit partout</td><td className="py-2 px-4">1993-1996</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4">Euro 2</td><td className="py-2 px-4">Interdit partout</td><td className="py-2 px-4">Interdit partout</td><td className="py-2 px-4">1996-2000</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4">Euro 3</td><td className="py-2 px-4">Interdit partout</td><td className="py-2 px-4">Interdit Bruxelles</td><td className="py-2 px-4">2000-2005</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4">Euro 4</td><td className="py-2 px-4">Interdit Bruxelles</td><td className="py-2 px-4">Autorisé</td><td className="py-2 px-4">2005-2009</td></tr>
                    <tr className="border-b border-border/50"><td className="py-2 px-4">Euro 5</td><td className="py-2 px-4">Autorisé (pour l'instant)</td><td className="py-2 px-4">Autorisé</td><td className="py-2 px-4">2009-2014</td></tr>
                    <tr><td className="py-2 px-4">Euro 6</td><td className="py-2 px-4">Autorisé</td><td className="py-2 px-4">Autorisé</td><td className="py-2 px-4">2014+</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Attention :</strong> les restrictions se durcissent chaque année. Un véhicule Euro 5 diesel pourrait être interdit dès 2028 à Bruxelles. Anticipez en choisissant un véhicule Euro 6 ou électrique.
                </p>
              </div>
            </section>

            <section id="calendrier-2026">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Info className="w-7 h-7 text-primary flex-shrink-0" />
                4. Calendrier des restrictions 2026
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                En 2026, les principales évolutions sont :
              </p>
              <ul className="space-y-3 mb-4">
                {[
                  "Bruxelles : les véhicules diesel Euro 4 et essence Euro 2 sont désormais interdits",
                  "Anvers : interdiction étendue aux diesel Euro 4 à partir du 1er janvier 2026",
                  "Gand : alignement progressif sur les critères d'Anvers",
                  "Les day-passes (autorisations temporaires) restent disponibles pour les visiteurs occasionnels",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="amendes">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-primary flex-shrink-0" />
                5. Amendes et sanctions
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Circuler dans une LEZ avec un véhicule non conforme expose à une <strong>amende de 150€ à 350€</strong> par infraction constatée, selon la ville. Les contrôles sont effectués automatiquement par des caméras ANPR (reconnaissance de plaques). Aucun avertissement préalable n'est donné.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { city: "Bruxelles", amount: "350€", note: "Par trimestre d'infraction" },
                  { city: "Anvers", amount: "150€ à 300€", note: "Par jour d'infraction" },
                  { city: "Gand", amount: "150€ à 300€", note: "Par jour d'infraction" },
                ].map((fine) => (
                  <div key={fine.city} className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
                    <p className="font-display font-bold text-foreground text-lg">{fine.city}</p>
                    <p className="text-2xl font-bold text-destructive my-1">{fine.amount}</p>
                    <p className="text-xs text-muted-foreground">{fine.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="conseils-achat">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <CheckCircle className="w-7 h-7 text-primary flex-shrink-0" />
                6. Conseils pour acheter un véhicule conforme LEZ
              </h2>
              <ol className="space-y-4 text-muted-foreground leading-relaxed">
                <li><strong className="text-foreground">1. Vérifiez la norme Euro</strong> — Sur AutoRa, chaque annonce affiche clairement la norme Euro du véhicule avec un badge de compatibilité LEZ.</li>
                <li><strong className="text-foreground">2. Privilégiez Euro 6 ou supérieur</strong> — Pour être tranquille pendant au moins 5 à 10 ans, optez pour un véhicule Euro 6 (diesel ou essence) ou un véhicule électrique.</li>
                <li><strong className="text-foreground">3. Vérifiez le Car-Pass</strong> — Le Car-Pass confirme l'historique kilométrique et la date de première immatriculation, essentiel pour déterminer la norme Euro réelle.</li>
                <li><strong className="text-foreground">4. Utilisez le calculateur TCO d'AutoRa</strong> — Notre outil gratuit calcule le coût total de possession sur 5 ans, taxes LEZ incluses.</li>
                <li><strong className="text-foreground">5. Anticipez les évolutions</strong> — Les normes se durcissent chaque année. Un investissement dans un véhicule propre aujourd'hui vous protège contre les futures restrictions.</li>
              </ol>
            </section>

            <section id="autora-lez" className="glass-card p-8 rounded-2xl">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                7. Comment AutoRa vous aide
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                AutoRa est la seule marketplace automobile belge qui intègre nativement la vérification LEZ dans chaque annonce. Voici ce que nous offrons :
              </p>
              <ul className="space-y-3">
                {[
                  "Badge LEZ visible sur chaque annonce (compatible / attention / non conforme)",
                  "Filtre de recherche par norme Euro pour trouver uniquement des véhicules conformes",
                  "Calculateur TCO intégrant les taxes environnementales régionales",
                  "Car-Pass vérifié sur chaque véhicule pour confirmer l'historique",
                  "Carte interactive des zones LEZ en Belgique",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </section>

          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default GuideLEZ;
