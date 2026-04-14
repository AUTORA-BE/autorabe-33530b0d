/**
 * "Why AutoRa" — minimalist luxe section with elegant cards
 * @module components
 */

import { memo } from "react";
import { Shield, Leaf, FileCheck, Zap, Globe, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

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

  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-16 sm:mb-20">
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

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/10 rounded-3xl overflow-hidden border border-border/15"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group relative bg-background/80 backdrop-blur-sm p-8 sm:p-10 transition-colors duration-500 hover:bg-primary/[0.02]"
            >
              {/* Icon */}
              <div className="mb-6 relative">
                <div className="w-11 h-11 rounded-xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center transition-all duration-500 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5">
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

              {/* Subtle bottom accent on hover */}
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

WhyAutoRa.displayName = "WhyAutoRa";

export default WhyAutoRa;
