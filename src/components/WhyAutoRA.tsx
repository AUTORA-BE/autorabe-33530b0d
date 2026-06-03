/**
 * "Why AutoRA" — editorial numbered list, automotive luxury style
 * @module components
 */

import { memo, useRef } from "react";
import { Shield, Leaf, FileCheck, Zap, Globe, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

const WhyAutoRA = memo(() => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isNl = language === "nl";
  const isDe = language === "de";
  const isEn = language === "en";

  const t = (fr: string, nl: string, de: string, en: string) =>
    isNl ? nl : isDe ? de : isEn ? en : fr;

  const features = [
    // Row 1 — Trust & Legal
    {
      icon: Shield,
      title: t("Car-Pass certifié", "Gecertificeerde Car-Pass", "Zertifizierter Car-Pass", "Certified Car-Pass"),
      desc: t(
        "Historique kilométrique vérifié pour chaque véhicule. Transparence absolue.",
        "Geverifieerde kilometergeschiedenis voor elk voertuig. Absolute transparantie.",
        "Verifizierter Kilometerstand für jedes Fahrzeug. Absolute Transparenz.",
        "Verified mileage history for every vehicle. Absolute transparency."
      ),
      color: "text-primary",
    },
    {
      icon: Leaf,
      title: t("LEZ & Normes Euro", "LEZ & Euro-normen", "LEZ & Euro-Normen", "LEZ & Euro standards"),
      desc: t(
        "Conformité LEZ pour Bruxelles, Anvers et Gand. Chaque annonce affiche sa norme Euro.",
        "LEZ-conformiteit voor Brussel, Antwerpen en Gent. Elke advertentie toont de Euro-norm.",
        "LEZ-Konformität für Brüssel, Antwerpen und Gent. Jede Anzeige zeigt die Euro-Norm.",
        "LEZ compliance for Brussels, Antwerp and Ghent. Every listing displays its Euro standard."
      ),
      color: "text-emerald-500",
    },
    {
      icon: Globe,
      title: t("100% belge, 4 langues", "100% Belgisch, 4 talen", "100% belgisch, 4 Sprachen", "100% Belgian, 4 languages"),
      desc: t(
        "Disponible en français, néerlandais, allemand et anglais.",
        "Beschikbaar in het Frans, Nederlands, Duits en Engels.",
        "Verfügbar auf Französisch, Niederländisch, Deutsch und Englisch.",
        "Available in French, Dutch, German and English."
      ),
      color: "text-rose-500",
    },
    // Row 2 — Tools & Experience
    {
      icon: Calculator,
      title: t("Calculateur TCO", "TCO-calculator", "TCO-Rechner", "TCO Calculator"),
      desc: t(
        "Estimez le coût total : taxes, assurance, carburant et dépréciation.",
        "Schat de totale kosten: belastingen, verzekering, brandstof en afschrijving.",
        "Gesamtkosten schätzen: Steuern, Versicherung, Kraftstoff und Abschreibung.",
        "Estimate total cost: taxes, insurance, fuel and depreciation."
      ),
      color: "text-blue-500",
    },
    {
      icon: Zap,
      title: t("Messagerie instantanée", "Instant berichten", "Sofortnachrichten", "Instant messaging"),
      desc: t(
        "Contactez le vendeur en temps réel. Réponse moyenne en 3 minutes.",
        "Neem in real-time contact op met de verkoper. Gemiddelde reactietijd 3 minuten.",
        "Kontaktieren Sie den Verkäufer in Echtzeit. Durchschnittliche Antwortzeit 3 Minuten.",
        "Contact the seller in real time. Average response in 3 minutes."
      ),
      color: "text-amber-500",
    },
    {
      icon: FileCheck,
      title: t("Annonces vérifiées", "Geverifieerde advertenties", "Geprüfte Anzeigen", "Verified listings"),
      desc: t(
        "Chaque annonce passe un contrôle qualité avant publication.",
        "Elke advertentie ondergaat een kwaliteitscontrole vóór publicatie.",
        "Jede Anzeige durchläuft eine Qualitätskontrolle vor der Veröffentlichung.",
        "Every listing undergoes a quality check before publication."
      ),
      color: "text-violet-500",
    },
  ];

  const sectionTitle = t(
    "Pourquoi choisir AutoRA ?",
    "Waarom kiezen voor AutoRA?",
    "Warum AutoRA wählen?",
    "Why choose AutoRA?"
  );

  const sectionSubtitle = t(
    "La marketplace automobile belge qui met la transparence au premier plan.",
    "De Belgische automarktplaats die transparantie voorop stelt.",
    "Der belgische Auto-Marktplatz, der Transparenz in den Vordergrund stellt.",
    "The Belgian car marketplace that puts transparency first."
  );

  return (
    <section className="py-20 sm:py-32 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),transparent_50%)]">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.025] blur-[130px] pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-8 relative">
        {/* Header */}
        <div className="max-w-xl mb-14 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85 mb-5"
          >
            {t("Nos engagements", "Onze beloften", "Unsere Versprechen", "Our commitments")}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-2xl sm:text-4xl md:text-5xl font-light leading-[1.15] md:leading-[1.1] tracking-tight text-foreground mb-5"
          >
            {sectionTitle}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-muted-foreground text-sm sm:text-base font-light"
          >
            {sectionSubtitle}
          </motion.p>
        </div>

        {/* Mobile: editorial vertical typographic stack — no cards, no swipe */}
        {isMobile ? (
          <div ref={scrollRef} className="flex flex-col space-y-10 px-1">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="relative"
              >
                <span className="block text-4xl font-light text-primary/50 mb-3 tabular-nums tracking-tight">
                  0{i + 1}
                </span>
                <h3 className="text-lg font-semibold text-foreground tracking-tight mb-2 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-[14px] text-muted-foreground font-light leading-[1.7]">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Desktop: editorial numbered grid — unchanged */
          <div className="grid grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.05 + (i % 3) * 0.08 }}
                className="group py-9 px-6 sm:px-8 lg:px-10 border-t border-border/10 hover:bg-card/20 transition-colors duration-500"
              >
                <span className="block font-mono text-[11px] text-muted-foreground mb-6 tracking-[0.2em] group-hover:text-primary transition-colors duration-500">
                  0{i + 1}
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <feature.icon
                    className={`w-4 h-4 ${feature.color} opacity-70 group-hover:opacity-100 transition-opacity duration-500`}
                    strokeWidth={1.5}
                  />
                  <h3 className="text-[15px] sm:text-base font-medium text-foreground tracking-tight">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-[13px] sm:text-sm text-muted-foreground font-light leading-relaxed pl-[26px]">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

WhyAutoRA.displayName = "WhyAutoRA";

export default WhyAutoRA;
