import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { localBusinessSchema, breadcrumbSchema } from "@/lib/seoSchemas";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedHref } from "@/lib/useLocalizedHref";
import { Link } from "react-router-dom";
import { Shield, Car, Award, MapPin, Heart, Languages, Calculator, FileCheck } from "lucide-react";

/**
 * Page « À propos ».
 *
 * Réécrite le 2026-08-04. La version précédente annonçait une société fondée
 * en 2024, 5 000 véhicules, 15 000 utilisateurs actifs, 98 % de satisfaction
 * et une équipe de quatre personnes nommées — aucun de ces éléments n'existe.
 * Les CGU du même site désignent par ailleurs un éditeur personne physique en
 * phase bêta, ce qui rendait le site contradictoire avec lui-même.
 *
 * En Belgique ce type d'affirmation relève des pratiques commerciales
 * trompeuses (art. VI.97 à VI.100 du Code de droit économique). Cette version
 * ne dit que des choses vérifiables.
 */

const content = {
  fr: {
    eyebrow: "À propos d'AutoRA",
    titleA: "La marketplace automobile",
    titleHighlight: "pensée pour la Belgique",
    intro:
      "AutoRA est un projet indépendant, développé et édité depuis la Belgique. L'idée de départ est simple : acheter une voiture d'occasion ici demande de jongler avec le Car-Pass, les zones de basses émissions et trois fiscalités régionales différentes. Aucune plateforme ne traitait vraiment ces trois sujets. AutoRA s'y attelle.",
    betaTitle: "Actuellement en bêta publique",
    betaBody:
      "La plateforme est ouverte et fonctionnelle, mais jeune : le catalogue se construit, et aucun paiement n'est traité pour le moment. Les retours des premiers utilisateurs orientent directement ce qui est développé ensuite.",
    factsTitle: "Ce que fait la plateforme",
    facts: [
      { icon: FileCheck, label: "Car-Pass", text: "Document vérifié manuellement avant l'affichage du badge" },
      { icon: MapPin, label: "LEZ", text: "Compatibilité Bruxelles, Anvers et Gand indiquée sur chaque annonce" },
      { icon: Calculator, label: "Fiscalité", text: "TMC et taxe de circulation simulées pour les trois régions" },
      { icon: Languages, label: "4 langues", text: "Français, néerlandais, allemand et anglais" },
    ],
    valuesTitle: "Ce à quoi je tiens",
    valuesSubtitle: "Les principes qui guident les décisions produit.",
    values: [
      { icon: Shield, title: "Transparence", description: "Un badge de vérification ne s'affiche que si un document a réellement été contrôlé." },
      { icon: Heart, title: "Honnêteté", description: "Pas de chiffres gonflés ni de faux avis. Ce que vous lisez ici est vérifiable." },
      { icon: Award, title: "Exigence", description: "Mieux vaut peu d'annonces fiables que beaucoup d'annonces douteuses." },
      { icon: MapPin, title: "Ancrage local", description: "Une plateforme pensée pour le marché belge et ses règles, pas une adaptation." },
    ],
    behindTitle: "Qui est derrière",
    behindBody:
      "AutoRA est édité par une personne physique établie en Belgique, et non par une société. Les coordonnées complètes de l'éditeur figurent dans les mentions légales. Pour toute question, le formulaire de contact est le moyen le plus direct.",
    legalLink: "Mentions légales",
    contactLink: "Nous contacter",
  },
  nl: {
    eyebrow: "Over AutoRA",
    titleA: "De automarktplaats",
    titleHighlight: "gemaakt voor België",
    intro:
      "AutoRA is een onafhankelijk project, ontwikkeld en uitgegeven vanuit België. Het uitgangspunt is eenvoudig: hier een tweedehandswagen kopen betekent jongleren met de Car-Pass, de lage-emissiezones en drie verschillende regionale belastingstelsels. Geen enkel platform behandelde die drie onderwerpen echt. AutoRA pakt ze aan.",
    betaTitle: "Momenteel in publieke bèta",
    betaBody:
      "Het platform is open en werkt, maar is jong: de catalogus wordt opgebouwd en er worden voorlopig geen betalingen verwerkt. De feedback van de eerste gebruikers bepaalt rechtstreeks wat hierna wordt ontwikkeld.",
    factsTitle: "Wat het platform doet",
    facts: [
      { icon: FileCheck, label: "Car-Pass", text: "Document handmatig gecontroleerd vóór het badge verschijnt" },
      { icon: MapPin, label: "LEZ", text: "Compatibiliteit Brussel, Antwerpen en Gent bij elke advertentie" },
      { icon: Calculator, label: "Fiscaliteit", text: "BIV en verkeersbelasting gesimuleerd voor de drie gewesten" },
      { icon: Languages, label: "4 talen", text: "Nederlands, Frans, Duits en Engels" },
    ],
    valuesTitle: "Waar het om draait",
    valuesSubtitle: "De principes achter de productbeslissingen.",
    values: [
      { icon: Shield, title: "Transparantie", description: "Een verificatiebadge verschijnt alleen als een document echt is gecontroleerd." },
      { icon: Heart, title: "Eerlijkheid", description: "Geen opgeblazen cijfers of valse reviews. Wat u hier leest, is verifieerbaar." },
      { icon: Award, title: "Veeleisendheid", description: "Liever weinig betrouwbare advertenties dan veel twijfelachtige." },
      { icon: MapPin, title: "Lokale verankering", description: "Een platform gebouwd voor de Belgische markt en haar regels, geen aanpassing." },
    ],
    behindTitle: "Wie erachter zit",
    behindBody:
      "AutoRA wordt uitgegeven door een natuurlijke persoon gevestigd in België, niet door een vennootschap. De volledige gegevens van de uitgever staan in de wettelijke vermeldingen. Voor vragen is het contactformulier de snelste weg.",
    legalLink: "Wettelijke vermeldingen",
    contactLink: "Contact opnemen",
  },
  de: {
    eyebrow: "Über AutoRA",
    titleA: "Der Automarktplatz",
    titleHighlight: "für Belgien gemacht",
    intro:
      "AutoRA ist ein unabhängiges Projekt, entwickelt und herausgegeben aus Belgien. Der Ausgangspunkt ist einfach: Wer hier einen Gebrauchtwagen kauft, muss Car-Pass, Umweltzonen und drei unterschiedliche regionale Steuersysteme unter einen Hut bringen. Keine Plattform behandelte diese drei Themen wirklich. AutoRA nimmt sie in Angriff.",
    betaTitle: "Derzeit in öffentlicher Beta",
    betaBody:
      "Die Plattform ist offen und funktionsfähig, aber jung: Der Katalog wird aufgebaut, und es werden vorerst keine Zahlungen verarbeitet. Das Feedback der ersten Nutzer bestimmt unmittelbar, was als Nächstes entwickelt wird.",
    factsTitle: "Was die Plattform leistet",
    facts: [
      { icon: FileCheck, label: "Car-Pass", text: "Dokument wird manuell geprüft, bevor das Abzeichen erscheint" },
      { icon: MapPin, label: "Umweltzonen", text: "Kompatibilität Brüssel, Antwerpen und Gent bei jeder Anzeige" },
      { icon: Calculator, label: "Steuern", text: "Zulassungs- und Verkehrssteuer für alle drei Regionen simuliert" },
      { icon: Languages, label: "4 Sprachen", text: "Deutsch, Französisch, Niederländisch und Englisch" },
    ],
    valuesTitle: "Worauf es ankommt",
    valuesSubtitle: "Die Grundsätze hinter den Produktentscheidungen.",
    values: [
      { icon: Shield, title: "Transparenz", description: "Ein Prüfabzeichen erscheint nur, wenn ein Dokument tatsächlich kontrolliert wurde." },
      { icon: Heart, title: "Ehrlichkeit", description: "Keine aufgeblähten Zahlen, keine gefälschten Bewertungen. Was hier steht, ist überprüfbar." },
      { icon: Award, title: "Anspruch", description: "Lieber wenige verlässliche Anzeigen als viele zweifelhafte." },
      { icon: MapPin, title: "Lokale Verankerung", description: "Eine Plattform für den belgischen Markt und seine Regeln, keine Anpassung." },
    ],
    behindTitle: "Wer dahintersteht",
    behindBody:
      "AutoRA wird von einer in Belgien ansässigen natürlichen Person herausgegeben, nicht von einer Gesellschaft. Die vollständigen Angaben zum Herausgeber finden Sie im Impressum. Bei Fragen ist das Kontaktformular der direkteste Weg.",
    legalLink: "Impressum",
    contactLink: "Kontakt aufnehmen",
  },
  en: {
    eyebrow: "About AutoRA",
    titleA: "The car marketplace",
    titleHighlight: "built for Belgium",
    intro:
      "AutoRA is an independent project, developed and published from Belgium. The starting point is simple: buying a used car here means juggling the Car-Pass, low-emission zones and three different regional tax systems. No platform really handled all three. AutoRA takes them on.",
    betaTitle: "Currently in public beta",
    betaBody:
      "The platform is open and working, but young: the catalogue is being built, and no payments are processed for now. Feedback from early users directly shapes what gets built next.",
    factsTitle: "What the platform does",
    facts: [
      { icon: FileCheck, label: "Car-Pass", text: "Document manually reviewed before the badge appears" },
      { icon: MapPin, label: "LEZ", text: "Brussels, Antwerp and Ghent compatibility shown on every listing" },
      { icon: Calculator, label: "Taxes", text: "Registration and road tax simulated for all three regions" },
      { icon: Languages, label: "4 languages", text: "English, French, Dutch and German" },
    ],
    valuesTitle: "What matters here",
    valuesSubtitle: "The principles behind the product decisions.",
    values: [
      { icon: Shield, title: "Transparency", description: "A verification badge only appears if a document was actually checked." },
      { icon: Heart, title: "Honesty", description: "No inflated numbers, no fake reviews. What you read here is verifiable." },
      { icon: Award, title: "Standards", description: "Better a few reliable listings than many questionable ones." },
      { icon: MapPin, title: "Local roots", description: "A platform built for the Belgian market and its rules, not adapted to it." },
    ],
    behindTitle: "Who is behind it",
    behindBody:
      "AutoRA is published by an individual based in Belgium, not by a company. The publisher's full details are in the legal notice. For any question, the contact form is the most direct route.",
    legalLink: "Legal notice",
    contactLink: "Get in touch",
  },
} as const;

const seo = {
  fr: {
    title: "À propos d'AutoRA — Marketplace auto belge",
    description:
      "AutoRA, projet indépendant belge en bêta publique. Car-Pass vérifié manuellement, compatibilité LEZ et simulateurs de taxes pour les trois régions.",
  },
  nl: {
    title: "Over AutoRA — Belgische automarktplaats",
    description:
      "AutoRA, onafhankelijk Belgisch project in publieke bèta. Handmatig gecontroleerde Car-Pass, LEZ-compatibiliteit en belastingsimulatoren voor de drie gewesten.",
  },
  de: {
    title: "Über AutoRA — Belgischer Automarktplatz",
    description:
      "AutoRA, unabhängiges belgisches Projekt in öffentlicher Beta. Manuell geprüfter Car-Pass, Umweltzonen-Kompatibilität und Steuerrechner für alle drei Regionen.",
  },
  en: {
    title: "About AutoRA — Belgian car marketplace",
    description:
      "AutoRA, an independent Belgian project in public beta. Manually reviewed Car-Pass, LEZ compatibility and tax simulators for all three regions.",
  },
} as const;

const About = () => {
  const { language } = useLanguage();
  const localizedHref = useLocalizedHref();
  const t = content[language] ?? content.fr;
  const s = seo[language] ?? seo.fr;

  return (
    <div className="page-gradient">
      <SEOHead
        title={s.title}
        description={s.description}
        url="https://autora.be/about"
        jsonLd={[
          localBusinessSchema,
          breadcrumbSchema([
            { name: "AutoRA", url: "https://autora.be" },
            { name: t.eyebrow, url: "https://autora.be/about" },
          ]),
        ]}
      />
      <Header />

      <main className="pt-24">
        {/* Hero */}
        <section className="container mx-auto px-6 py-16 text-center">
          <BackButton to="/" className="mb-4 mx-auto" />
          <div className="max-w-3xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Car className="w-4 h-4" />
              {t.eyebrow}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t.titleA} <span className="gradient-text">{t.titleHighlight}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{t.intro}</p>
          </div>
        </section>

        {/* Statut bêta — remplace le bandeau de statistiques inventées */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-6 py-12">
            <div className="max-w-3xl mx-auto text-center animate-fade-up">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
                Beta
              </span>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">{t.betaTitle}</h2>
              <p className="text-muted-foreground leading-relaxed">{t.betaBody}</p>
            </div>
          </div>
        </section>

        {/* Ce que fait la plateforme — faits vérifiables, pas de métriques */}
        <section className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">{t.factsTitle}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.facts.map((fact, index) => (
              <div
                key={fact.label}
                className="glass-card p-6 text-center animate-fade-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <fact.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-2">{fact.label}</h3>
                <p className="text-sm text-muted-foreground">{fact.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Valeurs */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">{t.valuesTitle}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">{t.valuesSubtitle}</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.values.map((value, index) => (
                <div
                  key={value.title}
                  className="bg-background rounded-2xl p-6 text-center border border-border animate-fade-up"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Qui est derrière — remplace l'équipe fictive */}
        <section className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center animate-fade-up">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">{t.behindTitle}</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">{t.behindBody}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to={localizedHref("/mentions-legales")}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-card transition-colors"
              >
                {t.legalLink}
              </Link>
              <Link
                to={localizedHref("/contact")}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t.contactLink}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
