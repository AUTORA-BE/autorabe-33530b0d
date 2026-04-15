/**
 * Guide SEO — Acheter une voiture d'occasion en Belgique
 */
import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { articleSchema, breadcrumbSchema } from "@/lib/seoSchemas";
import { Car, Shield, Search, Calculator, FileCheck, CheckCircle, AlertTriangle, Heart } from "lucide-react";

const GuideAchatOccasion = () => {
  return (
    <div className="page-gradient">
      <SEOHead
        title="Acheter une voiture d'occasion en Belgique — Guide 2026"
        description="Guide complet pour acheter une voiture d'occasion en Belgique : vérifications, Car-Pass, contrôle technique, LEZ, taxes et pièges à éviter. Conseils d'experts."
        url="https://autora.be/guide/acheter-voiture-occasion"
        jsonLd={[
          articleSchema({
            title: "Guide complet pour acheter une voiture d'occasion en Belgique",
            description: "Toutes les étapes et vérifications pour un achat serein",
            url: "https://autora.be/guide/acheter-voiture-occasion",
            datePublished: "2026-04-15",
          }),
          breadcrumbSchema([
            { name: "AutoRa", url: "https://autora.be" },
            { name: "Guides", url: "https://autora.be/guide/acheter-voiture-occasion" },
            { name: "Acheter une voiture d'occasion", url: "https://autora.be/guide/acheter-voiture-occasion" },
          ]),
        ]}
      />
      <Header />

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-6 max-w-4xl">
          <BackButton to="/" className="mb-6" />

          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Car className="w-4 h-4" />
              Guide d'achat
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Acheter une voiture d'occasion en <span className="gradient-text">Belgique</span> — Guide 2026
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              L'achat d'une voiture d'occasion est un investissement important. En Belgique, plusieurs spécificités légales et pratiques encadrent cette transaction. Ce guide vous accompagne étape par étape pour un achat <strong>serein, sécurisé et au meilleur prix</strong>.
            </p>
          </header>

          <div className="prose prose-lg max-w-none space-y-12">

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Calculator className="w-7 h-7 text-primary flex-shrink-0" />
                1. Définir son budget réel (TCO)
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Le prix d'achat ne représente qu'une partie du coût réel d'un véhicule. Le <strong>TCO (Total Cost of Ownership)</strong> inclut tous les frais sur la durée de possession :
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Prix d'achat", desc: "Négociation, frais de dossier, TVA (21% chez un pro)" },
                  { label: "Assurance", desc: "RC obligatoire + omnium optionnelle (500-2000€/an)" },
                  { label: "Carburant", desc: "Diesel ~1,72€/L, Essence 95 ~1,78€/L, Électrique ~0,35€/kWh" },
                  { label: "Entretien", desc: "Vidange, pneus, freins, CT (800-2000€/an selon le véhicule)" },
                  { label: "Taxe de mise en circulation", desc: "TMC variable selon la région, la puissance et le CO₂" },
                  { label: "Taxe de circulation annuelle", desc: "De 80€ à 2000€+ selon la puissance fiscale" },
                ].map((item) => (
                  <div key={item.label} className="glass-card p-4 rounded-xl">
                    <p className="font-semibold text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Conseil AutoRa :</strong> Utilisez notre <a href="/calculateur-tco" className="text-primary hover:underline font-medium">calculateur TCO gratuit</a> pour estimer le coût total sur 5 ans de n'importe quel véhicule.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Search className="w-7 h-7 text-primary flex-shrink-0" />
                2. Rechercher le bon véhicule
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Plusieurs critères doivent guider votre recherche :
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Motorisation : essence, diesel, hybride ou électrique — chaque choix a un impact fiscal et pratique différent",
                  "Norme Euro : optez pour Euro 6 minimum pour la compatibilité LEZ à long terme",
                  "Kilométrage : en dessous de 100 000 km pour un usage quotidien, vérifiez le Car-Pass",
                  "Année : les véhicules de 3-5 ans offrent le meilleur rapport qualité-prix (décote maximale passée)",
                  "Type de vendeur : professionnel (garantie légale 1 an) vs particulier (sans garantie)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <FileCheck className="w-7 h-7 text-primary flex-shrink-0" />
                3. Vérifications indispensables
              </h2>

              <h3 className="font-display text-xl font-bold text-foreground mb-3 mt-6">Le Car-Pass</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Le <a href="/guide/car-pass" className="text-primary hover:underline font-medium">Car-Pass</a> est <strong>obligatoire</strong> en Belgique. Il retrace l'historique kilométrique du véhicule et vous protège contre la fraude au compteur. Exigez-le systématiquement et vérifiez que le kilométrage affiché correspond.
              </p>

              <h3 className="font-display text-xl font-bold text-foreground mb-3">Le contrôle technique</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Un contrôle technique valide est requis pour immatriculer le véhicule à votre nom. Vérifiez :
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Date de validité du dernier contrôle",
                  "Présence de remarques ou défauts à corriger",
                  "Le certificat de conformité européen (COC)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className="font-display text-xl font-bold text-foreground mb-3">Compatibilité LEZ</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Si vous habitez ou circulez régulièrement à Bruxelles, Anvers ou Gand, vérifiez que le véhicule est conforme aux <a href="/guide/lez-belgique" className="text-primary hover:underline font-medium">zones de basses émissions</a>. Un véhicule non conforme vous expose à des amendes de 150€ à 350€.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-primary flex-shrink-0" />
                4. Les pièges à éviter
              </h2>
              <div className="space-y-4">
                {[
                  { title: "Annonces trop belles pour être vraies", desc: "Un prix 30% sous le marché cache souvent un problème : accident, inondation, kilométrage trafiqué." },
                  { title: "Vente sans Car-Pass", desc: "Refusez systématiquement. C'est une obligation légale et un signe de sérieux du vendeur." },
                  { title: "Véhicule importé sans documents", desc: "Exigez le certificat de conformité européen (COC), le Car-Pass belge et le contrôle technique." },
                  { title: "Paiement en espèces intégral", desc: "Privilégiez un virement bancaire pour garder une trace. En Belgique, les paiements en espèces sont limités à 3 000€." },
                  { title: "Essai routier refusé", desc: "Un vendeur qui refuse l'essai routier a probablement quelque chose à cacher." },
                ].map((trap) => (
                  <div key={trap.title} className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                    <p className="font-semibold text-foreground text-sm mb-1">{trap.title}</p>
                    <p className="text-xs text-muted-foreground">{trap.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Shield className="w-7 h-7 text-primary flex-shrink-0" />
                5. Droits de l'acheteur en Belgique
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                La loi belge protège les acheteurs de véhicules d'occasion :
              </p>
              <ul className="space-y-3 mb-4">
                {[
                  "Garantie légale de 1 an obligatoire lors d'un achat chez un professionnel (garage, concessionnaire)",
                  "Droit de rétractation de 14 jours pour les achats en ligne (vente à distance)",
                  "Vices cachés : le vendeur est responsable des défauts non déclarés, même entre particuliers",
                  "Le Car-Pass protège contre la fraude au kilométrage — la vente peut être annulée en cas de manipulation",
                ].map((right) => (
                  <li key={right} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{right}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Calculator className="w-7 h-7 text-primary flex-shrink-0" />
                6. Taxes et frais à prévoir
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                En Belgique, les taxes automobiles varient selon la <strong>région</strong> (Wallonie, Bruxelles, Flandre) :
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { region: "Wallonie", tmc: "Basée sur CV fiscaux et âge", annual: "Basée sur CV fiscaux" },
                  { region: "Bruxelles", tmc: "Basée sur CV fiscaux et CO₂", annual: "Basée sur CV fiscaux" },
                  { region: "Flandre", tmc: "Basée sur CO₂, Euro et âge", annual: "Taxe verte basée sur CO₂" },
                ].map((tax) => (
                  <div key={tax.region} className="glass-card p-5 rounded-2xl">
                    <h3 className="font-display font-bold text-foreground mb-2">{tax.region}</h3>
                    <p className="text-xs text-muted-foreground mb-1"><strong>TMC :</strong> {tax.tmc}</p>
                    <p className="text-xs text-muted-foreground"><strong>Annuelle :</strong> {tax.annual}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Utilisez notre <a href="/calculateur-tco" className="text-primary hover:underline font-medium">simulateur de taxes</a> intégré au calculateur TCO pour estimer précisément vos taxes selon votre région.
              </p>
            </section>

            <section className="glass-card p-8 rounded-2xl">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Heart className="w-7 h-7 text-primary flex-shrink-0" />
                Pourquoi acheter sur AutoRa ?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                AutoRa est la marketplace automobile belge conçue pour un achat en toute confiance :
              </p>
              <ul className="space-y-3">
                {[
                  "Car-Pass vérifié sur chaque annonce — transparence kilométrique garantie",
                  "Badges LEZ visibles pour savoir instantanément si le véhicule est conforme",
                  "Calculateur TCO intégré pour connaître le vrai coût sur 5 ans",
                  "Messagerie sécurisée pour échanger avec le vendeur sans partager vos coordonnées",
                  "Distinction claire entre vendeurs professionnels (garantie) et particuliers",
                  "Alertes personnalisées pour être notifié dès qu'un véhicule correspond à vos critères",
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

export default GuideAchatOccasion;
