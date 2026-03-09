/**
 * Témoignages premium — section de preuve sociale
 * Carousel horizontal mobile, grille desktop
 * @module components
 */

import { memo } from "react";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

interface Testimonial {
  nameFr: string;
  nameNl: string;
  locationFr: string;
  locationNl: string;
  quoteFr: string;
  quoteNl: string;
  rating: number;
  initials: string;
}

const testimonials: Testimonial[] = [
  {
    nameFr: "Thomas D.",
    nameNl: "Thomas D.",
    locationFr: "Bruxelles",
    locationNl: "Brussel",
    quoteFr: "J'ai enfin trouvé un site qui m'explique clairement les zones LEZ et les taxes avant d'acheter. Plus de mauvaises surprises !",
    quoteNl: "Eindelijk een site die me duidelijk de LEZ-zones en belastingen uitlegt vóór de aankoop. Geen verrassingen meer!",
    rating: 5,
    initials: "TD",
  },
  {
    nameFr: "Sophie V.",
    nameNl: "Sophie V.",
    locationFr: "Anvers",
    locationNl: "Antwerpen",
    quoteFr: "Le Car-Pass intégré et le calcul TCO m'ont fait gagner un temps fou. J'ai vendu ma voiture en 3 jours.",
    quoteNl: "De geïntegreerde Car-Pass en TCO-berekening hebben me enorm veel tijd bespaard. Mijn auto was verkocht in 3 dagen.",
    rating: 5,
    initials: "SV",
  },
  {
    nameFr: "Marc L.",
    nameNl: "Marc L.",
    locationFr: "Gand",
    locationNl: "Gent",
    quoteFr: "Enfin un site automobile qui comprend la réalité belge : LEZ, Car-Pass, taxes régionales… Tout est transparent.",
    quoteNl: "Eindelijk een autosite die de Belgische realiteit begrijpt: LEZ, Car-Pass, regionale belastingen… Alles is transparant.",
    rating: 5,
    initials: "ML",
  },
];

const TestimonialsSection = memo(() => {
  const { language } = useLanguage();
  const isNl = language === "nl";

  return (
    <section className="py-12 sm:py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.015] to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            {isNl ? "Getuigenissen" : "Témoignages"}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight"
          >
            {isNl ? "Wat onze gebruikers zeggen" : "Ce que disent nos utilisateurs"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto"
          >
            {isNl
              ? "Duizenden Belgen vertrouwen op AutoRa voor hun autoaankoop en -verkoop."
              : "Des milliers de Belges font confiance à AutoRa pour acheter et vendre leur voiture."}
          </motion.p>
        </div>

        {/* Testimonial cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory pb-2 sm:pb-0"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group relative rounded-2xl border border-border bg-card p-5 sm:p-7 flex-shrink-0 w-[300px] sm:w-auto snap-center hover:border-primary/20 transition-all duration-300 hover:shadow-[var(--shadow-elevated)]"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary/15 mb-4" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-sm sm:text-base text-foreground leading-relaxed mb-6">
                "{isNl ? t.quoteNl : t.quoteFr}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isNl ? t.nameNl : t.nameFr}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isNl ? t.locationNl : t.locationFr}
                  </p>
                </div>
              </div>

              {/* Hover accent line */}
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

TestimonialsSection.displayName = "TestimonialsSection";

export default TestimonialsSection;
