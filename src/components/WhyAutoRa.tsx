/**
 * "Why AutoRa" — luxe section with horizontal swipe on mobile, refined grid on desktop
 * @module components
 */

import { memo, useRef } from "react";
import {   Shield, Leaf, FileCheck, Zap, Globe, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
};

const WhyAutoRa = memo(() => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isNl = language === "nl";
  const isDe = language === "de";
  const isEn = language === "en";

  const t = (fr: string, nl: string, de: string, en: string) =>
    isNl ? nl : isDe ? de : isEn ? en : fr;

  const features = [
    {
      icon: Shield,
      title: t("Car-Pass certifié", "Gecertificeerde Car-Pass", "Zertifizierter Car-Pass", "Certified Car-Pass"),
      desc: t(
        "Historique kilométrique vérifié pour chaque véhicule. Transparence absolue.",
        "Geverifieerde kilometergeschiedenis voor elk voertuig. Absolute transparantie.",
        "Verifizierter Kilometerstand für jedes Fahrzeug. Absolute Transparenz.",
        "Verified mileage history for every vehicle. Absolute transparency."
      ),
      accent: "from-primary/20 to-primary/5",
    },
    {
      icon: Leaf,
      title: t("Conformité LEZ", "LEZ-conformiteit", "LEZ-Konformität", "LEZ Compliance"),
      desc: t(
        "Vérification instantanée pour Bruxelles, Anvers et Gand.",
        "Directe controle voor Brussel, Antwerpen en Gent.",
        "Sofortige Prüfung für Brüssel, Antwerpen und Gent.",
        "Instant check for Brussels, Antwerp and Ghent."
      ),
      accent: "from-emerald-500/20 to-emerald-500/5",
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
      accent: "from-amber-500/20 to-amber-500/5",
    },
    {
      icon: Calculator,
      title: t("Calculateur TCO", "TCO-calculator", "TCO-Rechner", "TCO Calculator"),
      desc: t(
        "Estimez le coût total : taxes, assurance, carburant et dépréciation.",
        "Schat de totale kosten: belastingen, verzekering, brandstof en afschrijving.",
        "Gesamtkosten schätzen: Steuern, Versicherung, Kraftstoff und Abschreibung.",
        "Estimate total cost: taxes, insurance, fuel and depreciation."
      ),
      accent: "from-blue-500/20 to-blue-500/5",
    },
    {
      icon: FileCheck,
      title: t("Normes Euro vérifiées", "Geverifieerde Euro-normen", "Verifizierte Euro-Normen", "Verified Euro standards"),
      desc: t(
        "Chaque annonce affiche sa norme Euro. Filtrez selon vos besoins.",
        "Elke advertentie toont de Euro-norm. Filter op uw behoeften.",
        "Jede Anzeige zeigt die Euro-Norm. Filtern Sie nach Bedarf.",
        "Every listing displays its Euro standard. Filter to your needs."
      ),
      accent: "from-violet-500/20 to-violet-500/5",
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
      accent: "from-rose-500/20 to-rose-500/5",
    },
  ];

  const sectionTitle = t(
    "Pourquoi choisir AutoRa ?",
    "Waarom kiezen voor AutoRa?",
    "Warum AutoRa wählen?",
    "Why choose AutoRa?"
  );

  const sectionSubtitle = t(
    "La marketplace automobile belge qui met la transparence au premier plan.",
    "De Belgische automarktplaats die transparantie voorop stelt.",
    "Der belgische Auto-Marktplatz, der Transparenz in den Vordergrund stellt.",
    "The Belgian car marketplace that puts transparency first."
  );

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };
  void scroll;

  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[11px] uppercase tracking-[0.25em] text-primary/70 font-medium mb-5"
          >
            {t("Nos engagements", "Onze beloften", "Unsere Versprechen", "Our commitments")}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-5 leading-[1.15]"
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

        {/* Mobile: Horizontal scroll carousel */}
        {isMobile ? (
          <div className="relative -mx-6">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-6 pb-4"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex-shrink-0 w-[280px] snap-center rounded-2xl border border-border/20 bg-card/60 backdrop-blur-sm p-6 relative overflow-hidden"
                >
                  {/* Gradient accent top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.accent}`} />

                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br ${feature.accent} border border-primary/10 flex items-center justify-center mb-5">
                    <feature.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>

                  <h3 className="text-[15px] font-medium text-foreground mb-2 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-[13px] text-muted-foreground font-light leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Scroll hint gradient */}
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </div>
        ) : (
          /* Desktop: Refined grid */
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={item}
                className="group relative rounded-2xl border border-border/15 bg-card/40 backdrop-blur-sm p-8 sm:p-10 transition-all duration-500 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 overflow-hidden"
              >
                {/* Gradient accent top */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feature.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Icon */}
                <div className="mb-6 relative">
                  <div className="w-12 h-12 rounded-2xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center transition-all duration-500 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5">
                    <feature.icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Text */}
                <h3 className="text-[15px] sm:text-base font-medium text-foreground mb-2.5 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[13px] sm:text-sm text-muted-foreground font-light leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
});

WhyAutoRa.displayName = "WhyAutoRa";

export default WhyAutoRa;
