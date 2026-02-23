/**
 * "Why AutoRa" trust section with staggered entrance
 * @module components
 */

import { Shield, Leaf, FileCheck, HeadphonesIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const features = [
  {
    icon: Shield,
    titleFr: "100 % transparence",
    titleNl: "100% transparantie",
    descFr: "Chaque annonce est vérifiée manuellement par notre équipe avant publication.",
    descNl: "Elke advertentie wordt handmatig geverifieerd door ons team vóór publicatie.",
  },
  {
    icon: FileCheck,
    titleFr: "Car-Pass intégré",
    titleNl: "Geïntegreerde Car-Pass",
    descFr: "Historique kilométrique officiel belge directement visible sur chaque fiche.",
    descNl: "Officiële Belgische kilometergeschiedenis direct zichtbaar op elke fiche.",
  },
  {
    icon: Leaf,
    titleFr: "Compatibilité LEZ",
    titleNl: "LEZ-compatibiliteit",
    descFr: "Vérifiez instantanément si le véhicule est autorisé dans les zones à faibles émissions.",
    descNl: "Controleer direct of het voertuig is toegelaten in lage-emissiezones.",
  },
  {
    icon: HeadphonesIcon,
    titleFr: "Support 7j/7",
    titleNl: "Ondersteuning 7/7",
    descFr: "Notre équipe est disponible tous les jours pour vous accompagner.",
    descNl: "Ons team is elke dag beschikbaar om u te begeleiden.",
  },
];

const WhyAutoRa = () => {
  const { language } = useLanguage();
  const isNl = language === "nl";

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
          >
            <Shield className="w-3.5 h-3.5" />
            {isNl ? "Waarom AutoRa?" : "Pourquoi AutoRa ?"}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight"
          >
            {isNl ? "Koop met vertrouwen" : "Achetez en toute confiance"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto"
          >
            {isNl
              ? "AutoRa biedt een veilige en betrouwbare marktplaats, speciaal ontworpen voor de Belgische automobielsector."
              : "AutoRa offre une marketplace sécurisée et fiable, spécialement conçue pour le marché automobile belge."}
          </motion.p>
        </div>

        {/* Feature cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group relative rounded-2xl border border-border bg-card p-6 sm:p-7 hover:border-primary/20 transition-all duration-300 hover:shadow-[var(--shadow-elevated)]"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-2">
                {isNl ? feature.titleNl : feature.titleFr}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {isNl ? feature.descNl : feature.descFr}
              </p>

              {/* Subtle hover accent */}
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyAutoRa;
