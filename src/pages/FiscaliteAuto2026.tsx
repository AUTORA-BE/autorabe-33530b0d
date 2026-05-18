import SEOHead from "@/components/SEOHead";
import { Header, Footer, BackButton } from "@/shared/components";
import { Link } from "react-router-dom";
import { Calculator, Car, Euro, FileText, ArrowRight } from "lucide-react";

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Fiscalité automobile en Belgique 2026",
  description:
    "Guide complet sur la fiscalité automobile en Belgique : TMC, taxe de circulation, déductibilité professionnelle, bonus-malus CO₂.",
  datePublished: "2026-01-01",
  dateModified: "2026-05-01",
  publisher: {
    "@type": "Organization",
    name: "AutoRA",
    url: "https://autora.be",
  },
  mainEntityOfPage: "https://autora.be/fiscalite-auto-2026",
};

const topics = [
  {
    icon: Euro,
    title: "Taxe de mise en circulation (TMC)",
    slug: "#tmc",
    desc: "Calcul de la TMC selon la puissance fiscale, l'émission CO₂ et la région (Bruxelles, Wallonie, Flandre).",
  },
  {
    icon: Car,
    title: "Taxe de circulation annuelle",
    slug: "#tc",
    desc: "Montants 2026 par région, exonérations pour véhicules électriques et hybrides.",
  },
  {
    icon: Calculator,
    title: "Déductibilité professionnelle",
    slug: "#deductibilite",
    desc: "Nouvelles règles 2026 : déductibilité selon les g/km CO₂, régime transitoire pour les anciens véhicules.",
  },
  {
    icon: FileText,
    title: "Avantage de toute nature (ATN)",
    slug: "#atn",
    desc: "Calcul de l'ATN pour les véhicules de société mis à disposition des salariés.",
  },
];

export default function FiscaliteAuto2026() {
  return (
    <>
      <SEOHead
        title="Fiscalité automobile Belgique 2026 — Guide complet | AutoRA"
        description="TMC, taxe de circulation, déductibilité professionnelle, ATN : tout savoir sur la fiscalité automobile en Belgique pour 2026. Guide mis à jour par AutoRA."
        url="https://autora.be/fiscalite-auto-2026"
        jsonLd={schema}
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <BackButton to="/" className="mb-6" />
        <div className="mb-10">
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            Guide 2026
          </span>
          <h1 className="text-4xl font-bold font-display mt-4 mb-3">
            Fiscalité automobile en Belgique — 2026
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Tout ce que vous devez savoir sur les taxes et la déductibilité liées à votre voiture en
            Belgique : TMC, taxe de circulation annuelle, déductibilité professionnelle et avantage
            de toute nature. Mis à jour pour l'année fiscale 2026.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {topics.map(({ icon: Icon, title, slug, desc }) => (
            <a
              key={slug}
              href={slug}
              className="group flex gap-4 p-5 rounded-2xl border border-border/50 hover:border-primary/40 bg-card hover:bg-card/80 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            </a>
          ))}
        </div>

        <section id="tmc" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Taxe de mise en circulation (TMC)</h2>
          <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
            <p>
              La TMC est perçue une seule fois lors de la première immatriculation du véhicule
              en Belgique. Son montant varie selon la <strong>région</strong>, la{" "}
              <strong>puissance fiscale</strong> (CV) et les <strong>émissions de CO₂</strong>.
            </p>
            <p>
              En <strong>Région wallonne</strong>, la nouvelle TMC intègre désormais la
              puissance fiscale, le CO₂, mais aussi la <strong>masse (MMA)</strong> et
              l'<strong>âge</strong> du véhicule. En <strong>Région flamande</strong>, le
              barème repose principalement sur les émissions CO₂ et la norme Euro. En{" "}
              <strong>Région de Bruxelles-Capitale</strong>, la taxe reste basée sur les CV
              fiscaux avec des incitants pour le zéro émission. Utilisez notre{" "}
              <Link to="/calculateur-tco" className="text-primary underline">
                calculateur TCO
              </Link>{" "}
              pour une estimation précise.
            </p>
          </div>
        </section>

        <section id="tc" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Taxe de circulation annuelle</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            La taxe de circulation est due chaque année pour tout véhicule immatriculé en
            Belgique. Son montant dépend de la <strong>puissance du moteur</strong>, du{" "}
            <strong>type de carburant</strong> et de la <strong>région</strong>. À noter
            qu'à partir de <strong>2026</strong>, les véhicules entièrement électriques ne
            sont plus totalement exonérés lors d'une nouvelle immatriculation et basculent
            sur des <strong>tarifs forfaitaires minimaux</strong>.
          </p>
        </section>

        <section id="deductibilite" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Déductibilité professionnelle</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            La réforme fiscale belge modifie radicalement la déductibilité des frais de
            voiture. La date de commande devient déterminante.
          </p>

          <div className="rounded-2xl border border-border bg-card overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-border bg-secondary/40">
              <p className="font-semibold text-sm">En résumé : la règle d'or 2026</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-semibold px-5 py-3 text-foreground">Type de motorisation</th>
                    <th className="text-left font-semibold px-5 py-3 text-foreground">Commandé avant le 31/12/2025</th>
                    <th className="text-left font-semibold px-5 py-3 text-foreground">Commandé en 2026 (nouvel achat)</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <td className="px-5 py-4 font-semibold text-foreground align-top">100 % Électrique (BEV)</td>
                    <td className="px-5 py-4 align-top">100 % déductible</td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-semibold text-primary">100 % déductible</span>
                      <span className="block text-xs mt-1">(sécurisé à vie si commandé cette année)</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="px-5 py-4 font-semibold text-foreground align-top">Hybride Rechargeable (PHEV)</td>
                    <td className="px-5 py-4 align-top">Régime transitoire (plafonné à 50 % ; carburant à 50 %)</td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-semibold text-destructive">0 % déductible</span>
                      <span className="block text-xs mt-1">(sauf rares exceptions en personne physique)</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-semibold text-foreground align-top">Thermique (Essence / Diesel / HEV)</td>
                    <td className="px-5 py-4 align-top">Régime transitoire (plafonné à 50 % maximum)</td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-semibold text-destructive">0 % déductible</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Consultez notre outil{" "}
            <Link to="/calculateur-tco" className="text-primary underline">
              Calculateur TCO
            </Link>{" "}
            pour simuler la déductibilité de votre véhicule selon votre situation.
          </p>
        </section>

        <section id="atn" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Avantage de toute nature (ATN)</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            L'ATN est calculé sur la base de la <strong className="text-foreground">valeur
            catalogue du véhicule TVAC</strong>, d'un <strong className="text-foreground">pourcentage CO₂</strong>{" "}
            (calculé selon les nouvelles valeurs de référence de{" "}
            <strong className="text-foreground">70 g pour l'essence</strong> et{" "}
            <strong className="text-foreground">58 g pour le diesel</strong>) et d'un{" "}
            <strong className="text-foreground">coefficient d'âge</strong>. Pour 2026, la
            formule reste :
          </p>
          <div className="rounded-2xl border border-border bg-secondary/40 p-4 mb-4">
            <p className="font-mono text-sm text-foreground text-center">
              ATN = Valeur catalogue × 6/7 × % CO₂ × Coefficient d'âge
            </p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              Le montant minimal légal de l'ATN pour l'année 2026 est fixé à{" "}
              <strong className="text-primary">1 690 € par an</strong>.
            </p>
          </div>
        </section>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center gap-4">
          <Calculator className="w-8 h-8 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-sm">Simulez vos coûts réels avec le Calculateur TCO</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              Intégrez TMC, taxe de circulation, déductibilité et ATN dans un seul calcul.
            </p>
            <Link
              to="/calculateur-tco"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Accéder au calculateur <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
