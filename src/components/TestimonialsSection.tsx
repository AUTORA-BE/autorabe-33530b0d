/**
 * Témoignages — minimal luxury testimonials
 * @module components
 */

import { memo } from "react";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
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
    <section className="py-16 sm:py-32 relative overflow-hidden">
      <div className="container mx-auto px-6 sm:px-8 relative">
        {/* Section header */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-4 leading-tight"
          >
            {isNl ? "Wat onze gebruikers zeggen" : "Ce que disent nos utilisateurs"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-muted-foreground text-sm font-light max-w-md mx-auto"
          >
            {isNl
              ? "Duizenden Belgen vertrouwen op AutoRa voor hun autoaankoop en -verkoop."
              : "Des milliers de Belges font confiance à AutoRa pour acheter et vendre leur voiture."}
          </motion.p>
        </div>

        {/* Testimonial cards — clean, borderless feel */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="flex sm:grid sm:grid-cols-3 gap-5 sm:gap-8 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory pb-2 sm:pb-0"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group relative rounded-3xl border border-border/20 bg-card/30 p-7 sm:p-9 flex-shrink-0 w-[300px] sm:w-auto snap-center transition-all duration-300"
            >
              {/* Quote icon — very subtle */}
              <Quote className="w-8 h-8 text-primary/10 mb-6" strokeWidth={1} />

              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-primary/60 text-primary/60" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-sm text-foreground font-light leading-relaxed mb-8">
                "{isNl ? t.quoteNl : t.quoteFr}"
              </p>

              {/* Author — minimal */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center text-xs font-medium text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isNl ? t.nameNl : t.nameFr}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-light">
                    {isNl ? t.locationNl : t.locationFr}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

TestimonialsSection.displayName = "TestimonialsSection";

export default TestimonialsSection;
