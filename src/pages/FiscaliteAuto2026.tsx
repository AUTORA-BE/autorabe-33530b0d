import SEOHead from "@/components/SEOHead";
import { Header, Footer } from "@/shared/components";
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
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
            <p>
              La TMC est perçue une seule fois lors de la première immatriculation du véhicule en
              Belgique. Son montant varie selon la <strong>région</strong>, la{" "}
              <strong>puissance fiscale</strong> (CV) et les <strong>émissions de CO₂</strong>.
            </p>
            <p>
              En <strong>Région wallonne</strong>, la TMC 2026 est calculée sur la base de la
              puissance fiscale, avec un multiplicateur CO₂. En <strong>Région flamande</strong>,
              le barème repose principalement sur les émissions CO₂ et la norme Euro. En{" "}
              <strong>Région de Bruxelles-Capitale</strong>, la TMC intègre un bonus pour les
              véhicules zéro émission.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-700 dark:text-amber-400 text-xs font-medium">
                ⚠️ Les barèmes 2026 détaillés seront publiés dès réception des arrêtés régionaux
                définitifs. Utilisez notre{" "}
                <Link to="/calculateur-tco" className="underline">
                  calculateur TCO
                </Link>{" "}
                pour une estimation en temps réel.
              </p>
            </div>
          </div>
        </section>

        <section id="tc" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Taxe de circulation annuelle</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            La taxe de circulation est due chaque année pour tout véhicule immatriculé en Belgique.
            Son montant dépend de la puissance du moteur (kW), du type de carburant et de la région
            de résidence du propriétaire. Les véhicules entièrement électriques bénéficient d'une
            exonération totale dans les trois régions jusqu'en 2026.
          </p>
        </section>

        <section id="deductibilite" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Déductibilité professionnelle</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">
            Depuis la réforme fiscale belge de 2021 (phasing-in jusqu'en 2026), la déductibilité
            des frais de voiture est directement liée aux émissions de CO₂ :
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Véhicules zéro émission : 100 % déductible</li>
            <li>≤ 50 g/km CO₂ : 75 % déductible (transitoire 2026)</li>
            <li>50-100 g/km : selon barème dégressif 2026</li>
            <li>Thermiques pur achetés après 2026 : déductibilité limitée</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Consulte notre outil{" "}
            <Link to="/calculateur-tco" className="text-primary underline">
              Calculateur TCO
            </Link>{" "}
            pour simuler la déductibilité de votre véhicule.
          </p>
        </section>

        <section id="atn" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Avantage de toute nature (ATN)</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            L'ATN est calculé sur la base de la valeur catalogue du véhicule, du coefficient CO₂
            et d'un coefficient d'âge. Pour 2026, la formule reste{" "}
            <em>ATN = Valeur catalogue × 6/7 × CO₂ coefficient × âge coefficient</em>, avec un
            minimum légal fixé par arrêté royal.
          </p>
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
