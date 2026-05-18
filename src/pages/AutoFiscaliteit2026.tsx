import SEOHead from "@/components/SEOHead";
import { Header, Footer, BackButton } from "@/shared/components";
import { Link } from "react-router-dom";
import { Calculator, Car, Euro, FileText, ArrowRight } from "lucide-react";

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Autofiscaliteit in België 2026",
  description:
    "Complete gids over autofiscaliteit in België 2026: BIV, verkeersbelasting, professionele aftrekbaarheid, voordeel alle aard.",
  datePublished: "2026-01-01",
  dateModified: "2026-05-01",
  publisher: {
    "@type": "Organization",
    name: "AutoRA",
    url: "https://autora.be",
  },
  mainEntityOfPage: "https://autora.be/autofiscaliteit-2026",
};

const topics = [
  {
    icon: Euro,
    title: "Belasting op inverkeerstelling (BIV)",
    slug: "#biv",
    desc: "Berekening van de BIV op basis van fiscale PK, CO₂-uitstoot en gewest (Brussel, Wallonië, Vlaanderen).",
  },
  {
    icon: Car,
    title: "Jaarlijkse verkeersbelasting",
    slug: "#vb",
    desc: "Tarieven 2026 per gewest, vrijstellingen voor elektrische en hybride voertuigen.",
  },
  {
    icon: Calculator,
    title: "Professionele aftrekbaarheid",
    slug: "#aftrekbaarheid",
    desc: "Nieuwe regels 2026: aftrekbaarheid op basis van g/km CO₂, overgangsregeling voor oudere voertuigen.",
  },
  {
    icon: FileText,
    title: "Voordeel alle aard (VAA)",
    slug: "#vaa",
    desc: "Berekening van het VAA voor bedrijfsvoertuigen ter beschikking gesteld aan werknemers.",
  },
];

export default function AutoFiscaliteit2026() {
  return (
    <>
      <SEOHead
        title="Autofiscaliteit België 2026 — Volledige gids | AutoRA"
        description="BIV, verkeersbelasting, professionele aftrekbaarheid, VAA: alles over autofiscaliteit in België voor 2026. Gids bijgewerkt door AutoRA."
        url="https://autora.be/autofiscaliteit-2026"
        jsonLd={schema}
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <BackButton to="/" className="mb-6" />
        <div className="mb-10">
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            Gids 2026
          </span>
          <h1 className="text-4xl font-bold font-display mt-4 mb-3">
            Autofiscaliteit in België — 2026
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Alles wat u moet weten over belastingen en aftrekbaarheid met betrekking tot uw wagen in
            België: BIV, jaarlijkse verkeersbelasting, professionele aftrekbaarheid en voordeel alle
            aard. Bijgewerkt voor het aanslagjaar 2026.
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

        <section id="biv" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Belasting op inverkeerstelling (BIV)</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">
            De BIV wordt éénmalig geheven bij de eerste inschrijving van een voertuig in België. Het
            bedrag verschilt naargelang het <strong>gewest</strong>, de{" "}
            <strong>fiscale paardenkracht</strong> (PK) en de <strong>CO₂-uitstoot</strong>.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            In het <strong>Vlaams Gewest</strong> is de BIV 2026 voornamelijk gebaseerd op de
            CO₂-uitstoot en de Euro-norm. In het <strong>Waals Gewest</strong> geldt een barema op
            basis van fiscale PK met CO₂-vermenigvuldiger. In het{" "}
            <strong>Brussels Hoofdstedelijk Gewest</strong> bestaat een bonus voor voertuigen zonder
            uitstoot.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4">
            <p className="text-amber-700 dark:text-amber-400 text-xs font-medium">
              ⚠️ De definitieve tarieven voor 2026 worden gepubliceerd zodra de gewestelijke
              besluiten zijn uitgevaardigd. Gebruik onze{" "}
              <Link to="/calculateur-tco" className="underline">
                TCO-calculator
              </Link>{" "}
              voor een realtime schatting.
            </p>
          </div>
        </section>

        <section id="vb" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Jaarlijkse verkeersbelasting</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            De verkeersbelasting is jaarlijks verschuldigd voor elk in België ingeschreven voertuig.
            Het bedrag hangt af van het vermogen (kW), het brandstoftype en het woongewest van de
            eigenaar. Volledig elektrische voertuigen zijn in alle drie de gewesten tot en met 2026
            vrijgesteld.
          </p>
        </section>

        <section id="aftrekbaarheid" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Professionele aftrekbaarheid</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            De Belgische belastinghervorming die op 1 januari 2026 in werking treedt, wijzigt
            de aftrekbaarheid van autokosten radicaal. De besteldatum wordt doorslaggevend.
          </p>

          <div className="rounded-2xl border border-border bg-card overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-border bg-secondary/40">
              <p className="font-semibold text-sm">Samengevat: de gulden regel</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-semibold px-5 py-3 text-foreground">Type motorisering</th>
                    <th className="text-left font-semibold px-5 py-3 text-foreground">Besteld vóór 31/12/2025</th>
                    <th className="text-left font-semibold px-5 py-3 text-foreground">Besteld (nieuwe aankoop)</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <td className="px-5 py-4 font-semibold text-foreground align-top">100% Elektrisch (BEV)</td>
                    <td className="px-5 py-4 align-top">100% aftrekbaar</td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-semibold text-primary">100% aftrekbaar</span>
                      <span className="block text-xs mt-1">(levenslang verzekerd indien dit jaar besteld)</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="px-5 py-4 font-semibold text-foreground align-top">Plug-in hybride (PHEV)</td>
                    <td className="px-5 py-4 align-top">Overgangsregeling (geplafonneerd op 50%; brandstof op 50%)</td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-semibold text-destructive">0% aftrekbaar</span>
                      <span className="block text-xs mt-1">(behoudens zeer gerichte uitzondering voor bepaalde zelfstandigen-natuurlijke personen)</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-semibold text-foreground align-top">Verbrandingsmotor (Benzine / Diesel / HEV)</td>
                    <td className="px-5 py-4 align-top">Overgangsregeling (geplafonneerd op maximaal 50%)</td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-semibold text-destructive">0% aftrekbaar</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Gebruik onze{" "}
            <Link to="/calculateur-tco" className="text-primary underline">
              TCO-calculator
            </Link>{" "}
            om de aftrekbaarheid van uw voertuig volgens uw situatie te simuleren.
          </p>
        </section>

        <section id="vaa" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">Voordeel alle aard (VAA)</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Het VAA is de belasting die u maandelijks betaalt (rechtstreeks ingehouden op
            uw loonbrief) omdat uw werkgever u een wagen ter beschikking stelt voor uw
            privéverplaatsingen.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">
            Voor de berekening neemt de Staat de{" "}
            <strong className="text-foreground">oorspronkelijke cataloguswaarde</strong>{" "}
            van het voertuig (nieuw en opties inbegrepen), en past dan een formule toe op
            basis van twee criteria:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 mb-4 list-disc list-outside ml-5">
            <li>
              <strong className="text-foreground">De vervuiling (CO₂):</strong> hoe meer de
              wagen CO₂ uitstoot ten opzichte van het nationale gemiddelde, hoe hoger de
              belasting. Elektrische wagens krijgen automatisch het voordeligste
              minimumtarief.
            </li>
            <li>
              <strong className="text-foreground">De leeftijd van de wagen:</strong> elk
              jaar past de Staat een korting van 6% toe voor de slijtage van het voertuig,
              tot een maximum van 5 jaar.
            </li>
          </ul>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              <strong>Wettelijk minimum 2026:</strong> hoe de berekening ook uitvalt, het
              VAA kan nooit lager zijn dan{" "}
              <strong className="text-primary">1 690 € per jaar</strong> (≈ 141 € per
              maand) — inkomsten 2026, aanslagjaar 2027.
            </p>
          </div>
        </section>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center gap-4">
          <Calculator className="w-8 h-8 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-sm">Simuleer uw werkelijke kosten met de TCO-calculator</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              Verwerk BIV, verkeersbelasting, aftrekbaarheid en VAA in één berekening.
            </p>
            <Link
              to="/calculateur-tco"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Naar de calculator <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
