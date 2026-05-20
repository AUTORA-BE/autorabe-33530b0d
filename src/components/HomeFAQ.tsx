/**
 * HomeFAQ — Concise FAQ section for the homepage covering Belgian-specific concerns.
 * Injects FAQPage JSON-LD for SEO. Uses the shared accordion primitives.
 * @module components
 */

import { memo } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle } from "lucide-react";

type QA = { q: string; a: string };

const FAQS: Record<string, QA[]> = {
  fr: [
    {
      q: "Qu'est-ce que le Car-Pass et pourquoi est-il obligatoire ?",
      a: "Le Car-Pass est un document officiel belge attestant l'historique kilométrique d'un véhicule d'occasion. Il est obligatoire pour toute vente entre particuliers comme entre professionnels. Sur AutoRA, chaque annonce indique clairement si le Car-Pass est disponible et vérifié.",
    },
    {
      q: "Mon véhicule est-il compatible avec les zones LEZ belges ?",
      a: "Bruxelles, Anvers et Gand appliquent des restrictions selon la norme Euro et le carburant. Chaque fiche véhicule sur AutoRA affiche la norme Euro et un indicateur de compatibilité. Consultez aussi notre guide LEZ Belgique pour les règles 2026.",
    },
    {
      q: "Quelle est la différence entre vendeur Pro et Particulier ?",
      a: "Un vendeur professionnel facture la TVA et offre la garantie légale belge de 12 mois minimum sur les véhicules d'occasion. Un particulier vend sans TVA ni garantie. Les deux types sont clairement identifiés par un badge sur chaque annonce.",
    },
    {
      q: "Y a-t-il des frais cachés sur AutoRA ?",
      a: "Non. Publier une annonce de base est gratuit. Les options payantes (boost, mise en avant, abonnements Pro) sont transparentes et détaillées sur la page Tarifs. Aucune commission n'est prélevée sur la vente.",
    },
  ],
  nl: [
    {
      q: "Wat is de Car-Pass en waarom is hij verplicht?",
      a: "De Car-Pass is een officieel Belgisch document dat de kilometergeschiedenis van een tweedehandswagen attesteert. Hij is verplicht voor elke verkoop, zowel tussen particulieren als professionelen. Op AutoRA toont elke advertentie duidelijk of de Car-Pass beschikbaar en geverifieerd is.",
    },
    {
      q: "Is mijn voertuig compatibel met de Belgische LEZ-zones?",
      a: "Brussel, Antwerpen en Gent passen beperkingen toe op basis van Euro-norm en brandstof. Elk voertuigfiche op AutoRA toont de Euro-norm en een compatibiliteitsindicator. Raadpleeg ook onze LEZ België gids voor de regels 2026.",
    },
    {
      q: "Wat is het verschil tussen een Pro- en een Particuliere verkoper?",
      a: "Een professionele verkoper rekent btw aan en biedt de Belgische wettelijke garantie van minimum 12 maanden op tweedehandswagens. Een particulier verkoopt zonder btw of garantie. Beide types worden duidelijk aangeduid met een badge op elke advertentie.",
    },
    {
      q: "Zijn er verborgen kosten op AutoRA?",
      a: "Nee. Een basisadvertentie publiceren is gratis. Betalende opties (boost, uitlichting, Pro-abonnementen) zijn transparant en gedetailleerd op de Prijzenpagina. Er wordt geen commissie ingehouden op de verkoop.",
    },
  ],
  de: [
    {
      q: "Was ist der Car-Pass und warum ist er obligatorisch?",
      a: "Der Car-Pass ist ein offizielles belgisches Dokument, das die Kilometerhistorie eines Gebrauchtwagens bescheinigt. Er ist für jeden Verkauf zwischen Privatpersonen wie zwischen Profis obligatorisch. Auf AutoRA zeigt jede Anzeige klar an, ob der Car-Pass verfügbar und überprüft ist.",
    },
    {
      q: "Ist mein Fahrzeug mit den belgischen LEZ-Zonen kompatibel?",
      a: "Brüssel, Antwerpen und Gent wenden Beschränkungen je nach Euro-Norm und Kraftstoff an. Jedes Fahrzeug auf AutoRA zeigt die Euro-Norm und einen Kompatibilitätshinweis. Konsultieren Sie auch unseren LEZ-Belgien-Leitfaden für die Regeln 2026.",
    },
    {
      q: "Was ist der Unterschied zwischen einem Pro- und einem Privatverkäufer?",
      a: "Ein professioneller Verkäufer berechnet Mehrwertsteuer und bietet die belgische gesetzliche Gewährleistung von mindestens 12 Monaten auf Gebrauchtwagen. Ein Privatverkäufer verkauft ohne MwSt. und Garantie. Beide Typen sind durch ein Badge auf jeder Anzeige klar gekennzeichnet.",
    },
    {
      q: "Gibt es versteckte Gebühren auf AutoRA?",
      a: "Nein. Das Veröffentlichen einer Basisanzeige ist kostenlos. Kostenpflichtige Optionen (Boost, Hervorhebung, Pro-Abonnements) sind transparent und auf der Preisseite detailliert. Es wird keine Provision auf den Verkauf erhoben.",
    },
  ],
  en: [
    {
      q: "What is the Car-Pass and why is it mandatory?",
      a: "The Car-Pass is an official Belgian document certifying the mileage history of a used vehicle. It is mandatory for every sale, between private parties as well as professionals. On AutoRA, every listing clearly indicates whether the Car-Pass is available and verified.",
    },
    {
      q: "Is my vehicle compatible with Belgian LEZ zones?",
      a: "Brussels, Antwerp and Ghent apply restrictions based on Euro standard and fuel type. Every vehicle page on AutoRA displays the Euro standard and a compatibility indicator. Also see our Belgium LEZ guide for 2026 rules.",
    },
    {
      q: "What is the difference between Pro and Private sellers?",
      a: "A professional seller charges VAT and provides the Belgian legal warranty of at least 12 months on used vehicles. A private seller sells without VAT or warranty. Both types are clearly identified by a badge on every listing.",
    },
    {
      q: "Are there hidden fees on AutoRA?",
      a: "No. Posting a basic listing is free. Paid options (boost, featuring, Pro subscriptions) are transparent and detailed on the Pricing page. No commission is taken on the sale.",
    },
  ],
};

const HomeFAQ = memo(() => {
  const { language } = useLanguage();
  const lang = (["fr", "nl", "de", "en"].includes(language) ? language : "fr") as keyof typeof FAQS;
  const items = FAQS[lang];

  const t = (fr: string, nl: string, de: string, en: string) =>
    lang === "nl" ? nl : lang === "de" ? de : lang === "en" ? en : fr;

  // SEO: FAQPage schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  const faqHref =
    lang === "nl" ? "/nl/faq" : lang === "de" ? "/de/faq" : lang === "en" ? "/en/faq" : "/faq";

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-6 sm:px-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="inline-flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85 mb-4">
            <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("Questions fréquentes", "Veelgestelde vragen", "Häufige Fragen", "Frequently asked")}
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-light leading-[1.15] md:leading-[1.1] tracking-tight text-foreground">
            {t(
              "Tout savoir avant d'acheter",
              "Alles weten vóór de aankoop",
              "Alles wissen vor dem Kauf",
              "Everything to know before buying"
            )}
          </h2>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-3">
          {items.map((it, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm px-5 sm:px-6"
            >
              <AccordionTrigger className="text-left text-sm sm:text-base font-medium text-foreground hover:no-underline py-5">
                {it.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground font-light leading-relaxed pb-5">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 text-center">
          <Link
            to={faqHref}
            className="inline-flex items-center gap-2 text-sm text-primary font-light hover:gap-3 transition-all"
          >
            {t(
              "Voir toutes les questions",
              "Alle vragen bekijken",
              "Alle Fragen ansehen",
              "See all questions"
            )}
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
});

HomeFAQ.displayName = "HomeFAQ";

export default HomeFAQ;
