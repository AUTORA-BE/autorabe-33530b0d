/**
 * "Why AutoRa" — premium bento-grid with animated icons, live counters & hover effects
 * @module components
 */

import { memo, useRef, useState, useEffect } from "react";
import { Shield, Leaf, FileCheck, Award, Zap, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/** Animated counter triggered on scroll */
function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const startTime = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplay(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { rootMargin: "-40px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{display.toLocaleString("fr-BE")}{suffix}</span>;
}

/** Animated icon wrapper — pulses & floats on viewport enter */
function AnimatedIcon({ icon: Icon, color, bg }: { icon: typeof Shield; color: string; bg: string }) {
  return (
    <motion.div
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center ${bg} relative overflow-hidden`}
      whileHover={{ scale: 1.1, rotate: 3 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Subtle shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${color} relative z-10`} strokeWidth={1.5} />
    </motion.div>
  );
}

const WhyAutoRa = memo(() => {
  const { language } = useLanguage();
  const isNl = language === "nl";
  const isDe = language === "de";
  const isEn = language === "en";

  const t = (fr: string, nl: string, de: string, en: string) =>
    isNl ? nl : isDe ? de : isEn ? en : fr;

  const features = [
    {
      icon: Award,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      stat: 98,
      statSuffix: "%",
      statLabel: t("Satisfaction client", "Klanttevredenheid", "Kundenzufriedenheit", "Customer satisfaction"),
      title: t("Confiance garantie", "Gegarandeerd vertrouwen", "Garantiertes Vertrauen", "Guaranteed trust"),
      desc: t(
        "Chaque véhicule est vérifié avec Car-Pass et normes Euro avant publication. Zéro mauvaise surprise.",
        "Elk voertuig wordt geverifieerd met Car-Pass en Euro-normen vóór publicatie. Geen verrassingen.",
        "Jedes Fahrzeug wird vor der Veröffentlichung mit Car-Pass und Euro-Normen verifiziert. Keine bösen Überraschungen.",
        "Every vehicle is verified with Car-Pass and Euro standards before listing. Zero bad surprises."
      ),
      span: "lg:col-span-2 lg:row-span-2",
      featured: true,
    },
    {
      icon: Shield,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      stat: 5000,
      statSuffix: "+",
      statLabel: t("Annonces vérifiées", "Geverifieerde advertenties", "Verifizierte Anzeigen", "Verified listings"),
      title: t("Car-Pass obligatoire", "Verplichte Car-Pass", "Obligatorischer Car-Pass", "Mandatory Car-Pass"),
      desc: t(
        "Historique kilométrique certifié pour chaque véhicule vendu en Belgique.",
        "Gecertificeerde kilometergeschiedenis voor elk voertuig dat in België wordt verkocht.",
        "Zertifizierter Kilometerstand für jedes in Belgien verkaufte Fahrzeug.",
        "Certified mileage history for every vehicle sold in Belgium."
      ),
      span: "",
      featured: false,
    },
    {
      icon: Zap,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      stat: 3,
      statSuffix: " min",
      statLabel: t("Temps de réponse", "Reactietijd", "Reaktionszeit", "Response time"),
      title: t("Ultra rapide", "Supersnel", "Ultraschnell", "Ultra fast"),
      desc: t(
        "Messagerie instantanée entre acheteurs et vendeurs. Réponse moyenne en 3 minutes.",
        "Instant messaging tussen kopers en verkopers. Gemiddelde reactietijd van 3 minuten.",
        "Sofortnachrichten zwischen Käufern und Verkäufern. Durchschnittliche Antwortzeit 3 Minuten.",
        "Instant messaging between buyers and sellers. Average response time of 3 minutes."
      ),
      span: "",
      featured: false,
    },
    {
      icon: Leaf,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
      stat: 100,
      statSuffix: "%",
      statLabel: t("Conformité LEZ", "LEZ-conformiteit", "LEZ-Konformität", "LEZ compliance"),
      title: t("Moteur LEZ intégré", "Ingebouwde LEZ-motor", "Integrierter LEZ-Motor", "Built-in LEZ engine"),
      desc: t(
        "Vérifiez instantanément la compatibilité avec Bruxelles, Anvers et Gand.",
        "Controleer direct de compatibiliteit met Brussel, Antwerpen en Gent.",
        "Sofortige Kompatibilitätsprüfung für Brüssel, Antwerpen und Gent.",
        "Instantly check compatibility with Brussels, Antwerp and Ghent."
      ),
      span: "",
      featured: false,
    },
    {
      icon: FileCheck,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
      stat: 2000,
      statSuffix: "€",
      statLabel: t("Économie moyenne", "Gemiddelde besparing", "Durchschnittliche Einsparung", "Average savings"),
      title: t("Calculateur TCO", "TCO-calculator", "TCO-Rechner", "TCO Calculator"),
      desc: t(
        "Estimez le coût total : taxes régionales, assurance, carburant et dépréciation.",
        "Schat de totale kosten: regionale belastingen, verzekering, brandstof en afschrijving.",
        "Schätzen Sie die Gesamtkosten: Regionalsteuern, Versicherung, Kraftstoff und Abschreibung.",
        "Estimate total cost: regional taxes, insurance, fuel and depreciation."
      ),
      span: "",
      featured: false,
    },
    {
      icon: Users,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      stat: 4,
      statSuffix: "",
      statLabel: t("Langues supportées", "Ondersteunde talen", "Unterstützte Sprachen", "Supported languages"),
      title: t("100% belge", "100% Belgisch", "100% belgisch", "100% Belgian"),
      desc: t(
        "Disponible en FR, NL, DE et EN. Conçu pour la réalité du marché belge.",
        "Beschikbaar in FR, NL, DE en EN. Ontworpen voor de Belgische markt.",
        "Verfügbar in FR, NL, DE und EN. Für den belgischen Markt konzipiert.",
        "Available in FR, NL, DE and EN. Designed for the Belgian market."
      ),
      span: "",
      featured: false,
    },
  ];

  const sectionTitle = t(
    "Pourquoi choisir AutoRa ?",
    "Waarom kiezen voor AutoRa?",
    "Warum AutoRa wählen?",
    "Why choose AutoRa?"
  );

  const sectionSubtitle = t(
    "La seule marketplace automobile belge qui combine transparence totale, conformité LEZ et outils intelligents.",
    "De enige Belgische automarktplaats die volledige transparantie, LEZ-conformiteit en slimme tools combineert.",
    "Der einzige belgische Auto-Marktplatz, der vollständige Transparenz, LEZ-Konformität und intelligente Tools kombiniert.",
    "The only Belgian car marketplace combining total transparency, LEZ compliance and smart tools."
  );

  return (
    <section className="py-16 sm:py-28 relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.015] to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-8 relative">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-5"
          >
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-light text-primary tracking-wide">
              {t("Depuis 2024", "Sinds 2024", "Seit 2024", "Since 2024")}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-light text-foreground mb-4 leading-tight"
          >
            {sectionTitle}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-sm sm:text-base font-light max-w-xl mx-auto"
          >
            {sectionSubtitle}
          </motion.p>
        </div>

        {/* Bento grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className={`group relative rounded-2xl sm:rounded-3xl border p-6 sm:p-7 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 ${feature.span} ${
                feature.featured
                  ? "border-primary/20 bg-gradient-to-br from-primary/[0.04] to-primary/[0.01]"
                  : "border-border/20 bg-card/40 backdrop-blur-sm hover:border-primary/15"
              }`}
            >
              {/* Hover glow */}
              <div className="absolute -top-px -right-px w-20 h-20 rounded-tr-2xl sm:rounded-tr-3xl bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Icon */}
              <div className="mb-5">
                <AnimatedIcon icon={feature.icon} color={feature.color} bg={feature.bg} />
              </div>

              {/* Stat counter */}
              <div className="mb-3">
                <span className={`text-3xl sm:text-4xl ${feature.featured ? "lg:text-5xl" : ""} font-bold tracking-tight text-foreground`}>
                  <AnimatedCounter target={feature.stat} suffix={feature.statSuffix} />
                </span>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-light mt-0.5 uppercase tracking-wider">
                  {feature.statLabel}
                </p>
              </div>

              {/* Title & desc */}
              <h3 className={`text-base sm:text-lg font-medium text-foreground mb-2 ${feature.featured ? "lg:text-xl" : ""}`}>
                {feature.title}
              </h3>
              <p className={`text-sm text-muted-foreground font-light leading-relaxed ${feature.featured ? "lg:text-[15px] lg:max-w-sm" : ""}`}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

WhyAutoRa.displayName = "WhyAutoRa";

export default WhyAutoRa;
