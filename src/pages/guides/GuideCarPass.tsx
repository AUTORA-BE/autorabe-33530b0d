/**
 * Guide SEO — Le Car-Pass en Belgique
 */
import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { articleSchema, breadcrumbSchema } from "@/lib/seoSchemas";
import { FileCheck, Shield, AlertTriangle, CheckCircle, HelpCircle, Scale } from "lucide-react";

const GuideCarPass = () => {
  return (
    <div className="page-gradient">
      <SEOHead
        title="Car-Pass Belgique 2026 — Guide Complet"
        description="Tout savoir sur le Car-Pass en Belgique : obligation légale, vérification kilométrique, fraude, prix et démarches. Guide complet pour acheteurs et vendeurs."
        url="https://autora.be/guide/car-pass"
        jsonLd={[
          articleSchema({
            title: "Guide complet du Car-Pass en Belgique 2026",
            description: "Tout savoir sur le Car-Pass obligatoire lors de la vente de véhicule en Belgique",
            url: "https://autora.be/guide/car-pass",
            datePublished: "2026-04-15",
          }),
          breadcrumbSchema([
            { name: "AutoRa", url: "https://autora.be" },
            { name: "Guides", url: "https://autora.be/guide/car-pass" },
            { name: "Car-Pass", url: "https://autora.be/guide/car-pass" },
          ]),
        ]}
      />
      <Header />

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-6 max-w-4xl">
          <BackButton to="/" className="mb-6" />

          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <FileCheck className="w-4 h-4" />
              Guide complet
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Le <span className="gradient-text">Car-Pass</span> en Belgique — Guide 2026
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Le Car-Pass est un document <strong>obligatoire</strong> lors de toute vente de véhicule d'occasion en Belgique. Il garantit la fiabilité du compteur kilométrique et protège les acheteurs contre la fraude au kilométrage. Voici tout ce que vous devez savoir.
            </p>
          </header>

          <div className="prose prose-lg max-w-none space-y-12">

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <HelpCircle className="w-7 h-7 text-primary flex-shrink-0" />
                Qu'est-ce que le Car-Pass ?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Le Car-Pass est un document officiel qui retrace l'<strong>historique kilométrique</strong> d'un véhicule. Il répertorie tous les relevés de kilométrage enregistrés lors de passages au contrôle technique, en garage agréé, ou lors de transactions précédentes.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Créé par l'ASBL Car-Pass en 2006, ce système est unique en Europe et fait de la Belgique le pays avec le taux de fraude au compteur le plus bas du continent. Avant son introduction, on estimait que <strong>1 véhicule d'occasion sur 5</strong> avait un compteur trafiqué.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Le Car-Pass est <strong>gratuit pour l'acheteur</strong> — c'est le vendeur qui doit le fournir et en assumer les éventuels frais de demande.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Scale className="w-7 h-7 text-primary flex-shrink-0" />
                Obligation légale
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                La loi belge du <strong>11 juin 2004</strong> impose au vendeur de fournir un Car-Pass valide lors de toute vente de véhicule d'occasion. Cette obligation s'applique :
              </p>
              <ul className="space-y-3 mb-4">
                {[
                  "Aux ventes entre particuliers",
                  "Aux ventes par des professionnels (garages, concessionnaires)",
                  "Aux véhicules importés (un Car-Pass belge doit être établi)",
                  "À tout véhicule ayant été immatriculé en Belgique",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Sanction :</strong> Un vendeur qui ne fournit pas de Car-Pass s'expose à des poursuites civiles. L'acheteur peut demander <strong>l'annulation de la vente</strong> ou une <strong>réduction du prix</strong>.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Shield className="w-7 h-7 text-primary flex-shrink-0" />
                Comment lire un Car-Pass ?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Un Car-Pass contient les informations suivantes :
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Numéro de châssis", desc: "Identifiant unique du véhicule (17 caractères)" },
                  { label: "Date du document", desc: "Date de génération du Car-Pass (valide 2 mois)" },
                  { label: "Historique km", desc: "Tableau chronologique de tous les relevés enregistrés" },
                  { label: "Source des données", desc: "Contrôle technique, garage, assurance, etc." },
                  { label: "Alertes", desc: "Signal si le kilométrage a diminué (possible fraude)" },
                  { label: "Code QR", desc: "Permet de vérifier l'authenticité du document" },
                ].map((item) => (
                  <div key={item.label} className="glass-card p-4 rounded-xl">
                    <p className="font-semibold text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Astuce :</strong> Si le kilométrage a diminué entre deux relevés, cela peut indiquer une <strong>fraude au compteur</strong>. Le Car-Pass signale automatiquement cette anomalie.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
                <FileCheck className="w-7 h-7 text-primary flex-shrink-0" />
                Comment obtenir un Car-Pass ?
              </h2>
              <ol className="space-y-4 text-muted-foreground leading-relaxed">
                <li><strong className="text-foreground">1. En ligne</strong> — Rendez-vous sur <a href="https://www.car-pass.be" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">car-pass.be</a> et introduisez le numéro de châssis. Le document est généré en quelques minutes.</li>
                <li><strong className="text-foreground">2. Chez un professionnel</strong> — Tout garage agréé ou concessionnaire peut générer un Car-Pass pour vous.</li>
                <li><strong className="text-foreground">3. Via AutoRa</strong> — Notre service Pack Car-Pass s'occupe de toute la démarche pour vous. Nous vérifions, certifions et intégrons le Car-Pass directement dans votre annonce avec un badge « Car-Pass vérifié ».</li>
              </ol>
            </section>

            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Coût et validité
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl text-center">
                  <p className="text-3xl font-display font-bold text-primary">Gratuit</p>
                  <p className="text-sm text-muted-foreground mt-2">Pour les véhicules immatriculés en Belgique</p>
                </div>
                <div className="glass-card p-6 rounded-2xl text-center">
                  <p className="text-3xl font-display font-bold text-primary">2 mois</p>
                  <p className="text-sm text-muted-foreground mt-2">Durée de validité du Car-Pass</p>
                </div>
              </div>
            </section>

            <section className="glass-card p-8 rounded-2xl">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                AutoRa & le Car-Pass
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Sur AutoRa, la transparence est au cœur de notre mission. Chaque annonce affiche le statut Car-Pass du véhicule :
              </p>
              <ul className="space-y-3">
                {[
                  "Badge « Car-Pass vérifié » visible sur chaque annonce certifiée",
                  "Upload direct du document Car-Pass par le vendeur",
                  "Vérification automatique de la cohérence kilométrique",
                  "Service Pack Car-Pass pour les vendeurs qui souhaitent être accompagnés",
                  "Alerte pour les acheteurs si le Car-Pass est manquant ou expiré",
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

export default GuideCarPass;
