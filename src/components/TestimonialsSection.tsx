/**
 * TestimonialsSection — luxe single-card carousel with elegant transitions
 * @module components
 */

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

import avatarThomas from "@/assets/testimonials/thomas.jpg";
import avatarSophie from "@/assets/testimonials/sophie.jpg";
import avatarMarc from "@/assets/testimonials/marc.jpg";
import avatarIsabelle from "@/assets/testimonials/isabelle.jpg";
import avatarKevin from "@/assets/testimonials/kevin.jpg";

interface Testimonial {
  name: string;
  locationFr: string;
  locationNl: string;
  locationDe: string;
  locationEn: string;
  quoteFr: string;
  quoteNl: string;
  quoteDe: string;
  quoteEn: string;
  rating: number;
  avatar: string;
  roleFr: string;
  roleNl: string;
  roleDe: string;
  roleEn: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Thomas D.",
    locationFr: "Bruxelles", locationNl: "Brussel", locationDe: "Brüssel", locationEn: "Brussels",
    roleFr: "Acheteur", roleNl: "Koper", roleDe: "Käufer", roleEn: "Buyer",
    quoteFr: "J'ai enfin trouvé un site qui m'explique clairement les zones LEZ et les taxes avant d'acheter. Plus de mauvaises surprises ! Le calculateur TCO m'a fait économiser plus de 2 000€.",
    quoteNl: "Eindelijk een site die me duidelijk de LEZ-zones en belastingen uitlegt vóór de aankoop. Geen verrassingen meer! De TCO-calculator heeft me meer dan €2.000 bespaard.",
    quoteDe: "Endlich eine Seite, die mir LEZ-Zonen und Steuern vor dem Kauf klar erklärt. Keine bösen Überraschungen mehr! Der TCO-Rechner hat mir über 2.000€ gespart.",
    quoteEn: "Finally found a site that clearly explains LEZ zones and taxes before buying. No more bad surprises! The TCO calculator saved me over €2,000.",
    rating: 5, avatar: avatarThomas,
  },
  {
    name: "Sophie V.",
    locationFr: "Anvers", locationNl: "Antwerpen", locationDe: "Antwerpen", locationEn: "Antwerp",
    roleFr: "Vendeuse", roleNl: "Verkoper", roleDe: "Verkäuferin", roleEn: "Seller",
    quoteFr: "Le Car-Pass intégré et le calcul TCO m'ont fait gagner un temps fou. J'ai vendu ma voiture en 3 jours. La messagerie instantanée avec les acheteurs est un vrai plus.",
    quoteNl: "De geïntegreerde Car-Pass en TCO-berekening hebben me enorm veel tijd bespaard. Mijn auto was verkocht in 3 dagen. De directe berichten met kopers zijn een echte meerwaarde.",
    quoteDe: "Der integrierte Car-Pass und die TCO-Berechnung haben mir enorm viel Zeit gespart. Mein Auto war in 3 Tagen verkauft. Die Sofortnachrichten mit Käufern sind ein echtes Plus.",
    quoteEn: "The integrated Car-Pass and TCO calculator saved me so much time. I sold my car in 3 days. Instant messaging with buyers is a real plus.",
    rating: 5, avatar: avatarSophie,
  },
  {
    name: "Marc L.",
    locationFr: "Gand", locationNl: "Gent", locationDe: "Gent", locationEn: "Ghent",
    roleFr: "Acheteur", roleNl: "Koper", roleDe: "Käufer", roleEn: "Buyer",
    quoteFr: "Enfin un site automobile qui comprend la réalité belge : LEZ, Car-Pass, taxes régionales… Tout est transparent. L'interface est magnifique et rapide.",
    quoteNl: "Eindelijk een autosite die de Belgische realiteit begrijpt: LEZ, Car-Pass, regionale belastingen… Alles is transparant. De interface is prachtig en snel.",
    quoteDe: "Endlich eine Autoseite, die die belgische Realität versteht: LEZ, Car-Pass, regionale Steuern… Alles ist transparent. Die Oberfläche ist wunderschön und schnell.",
    quoteEn: "Finally a car site that understands Belgian reality: LEZ, Car-Pass, regional taxes… Everything is transparent. The interface is beautiful and fast.",
    rating: 5, avatar: avatarMarc,
  },
  {
    name: "Isabelle M.",
    locationFr: "Liège", locationNl: "Luik", locationDe: "Lüttich", locationEn: "Liège",
    roleFr: "Acheteuse", roleNl: "Koper", roleDe: "Käuferin", roleEn: "Buyer",
    quoteFr: "Le comparateur de véhicules est incroyable. J'ai pu comparer 3 voitures côte à côte et faire le meilleur choix en toute confiance. Service client au top !",
    quoteNl: "De voertuigvergelijker is ongelooflijk. Ik kon 3 auto's naast elkaar vergelijken en de beste keuze maken. Klantenservice is top!",
    quoteDe: "Der Fahrzeugvergleicher ist unglaublich. Ich konnte 3 Autos nebeneinander vergleichen und die beste Wahl treffen. Kundenservice top!",
    quoteEn: "The vehicle comparator is incredible. I could compare 3 cars side by side and make the best choice with confidence. Top customer service!",
    rating: 5, avatar: avatarIsabelle,
  },
  {
    name: "Kevin B.",
    locationFr: "Namur", locationNl: "Namen", locationDe: "Namur", locationEn: "Namur",
    roleFr: "Vendeur pro", roleNl: "Professionele verkoper", roleDe: "Professioneller Verkäufer", roleEn: "Pro seller",
    quoteFr: "En tant que professionnel, le dashboard vendeur et les statistiques sont exactement ce dont j'avais besoin. Mes annonces sont vues par des acheteurs qualifiés.",
    quoteNl: "Als professioneel biedt het verkopersdashboard en de statistieken precies wat ik nodig heb. Mijn advertenties worden gezien door gekwalificeerde kopers.",
    quoteDe: "Als Profi bieten das Verkäufer-Dashboard und die Statistiken genau das, was ich brauche. Meine Anzeigen werden von qualifizierten Käufern gesehen.",
    quoteEn: "As a professional, the seller dashboard and statistics are exactly what I needed. My listings are seen by qualified buyers.",
    rating: 4, avatar: avatarKevin,
  },
];

const StarRating = memo(function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "fill-primary text-primary" : "text-muted-foreground/30"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
});

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.96 }),
};

const TestimonialsSection = memo(() => {
  const { language } = useLanguage();
  const [[current, direction], setPage] = useState([0, 0]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  const getLocalized = useCallback(
    (t: Testimonial, field: "quote" | "location" | "role") => {
      const key = `${field}${language === "nl" ? "Nl" : language === "de" ? "De" : language === "en" ? "En" : "Fr"}` as keyof Testimonial;
      return t[key] as string;
    },
    [language]
  );

  const paginate = useCallback((dir: number) => {
    setPage(([prev]) => {
      const next = (prev + dir + testimonials.length) % testimonials.length;
      return [next, dir];
    });
  }, []);

  const goTo = useCallback((idx: number) => {
    setPage(([prev]) => [idx, idx > prev ? 1 : -1]);
  }, []);

  // Auto-advance
  const startAutoplay = useCallback(() => {
    intervalRef.current = setInterval(() => paginate(1), 6000);
  }, [paginate]);

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    stopAutoplay();
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) paginate(diff > 0 ? 1 : -1);
    startAutoplay();
  };

  const sectionTitles: Record<string, { title: string; subtitle: string }> = {
    fr: { title: "Ils nous font confiance", subtitle: "Des milliers de Belges utilisent AutoRA pour acheter et vendre leur voiture en toute sérénité." },
    nl: { title: "Zij vertrouwen ons", subtitle: "Duizenden Belgen gebruiken AutoRA om met een gerust hart hun auto te kopen en te verkopen." },
    de: { title: "Sie vertrauen uns", subtitle: "Tausende Belgier nutzen AutoRA, um ihr Auto sicher zu kaufen und zu verkaufen." },
    en: { title: "They trust us", subtitle: "Thousands of Belgians use AutoRA to buy and sell their car with confidence." },
  };

  const { title, subtitle } = sectionTitles[language] || sectionTitles.fr;
  const t = testimonials[current];

  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.02] blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[11px] uppercase tracking-[0.25em] text-primary/70 font-medium mb-5"
          >
            4.9/5 ★
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-5 leading-[1.15]"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-muted-foreground text-sm sm:text-base font-light"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Single-card carousel */}
        <div
          className="relative max-w-2xl mx-auto"
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation arrows */}
          <button
            onClick={() => { paginate(-1); stopAutoplay(); setTimeout(startAutoplay, 4000); }}
            className="absolute -left-2 sm:-left-14 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/60 backdrop-blur-sm border border-border/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { paginate(1); stopAutoplay(); setTimeout(startAutoplay, 4000); }}
            className="absolute -right-2 sm:-right-14 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/60 backdrop-blur-sm border border-border/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Card */}
          <div className="overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative rounded-3xl border border-border/15 bg-card/50 backdrop-blur-sm p-8 sm:p-12"
              >
                {/* Large quote mark */}
                <Quote className="absolute top-6 right-8 w-16 h-16 text-primary/[0.04]" strokeWidth={1} />

                {/* Stars */}
                <div className="mb-6">
                  <StarRating rating={t.rating} />
                </div>

                {/* Quote */}
                <p className="text-base sm:text-lg text-foreground/90 font-light leading-relaxed mb-8 italic">
                  &ldquo;{getLocalized(t, "quote")}&rdquo;
                </p>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-6" />

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    loading="lazy"
                    width={56}
                    height={56}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-primary/10 ring-offset-2 ring-offset-background"
                  />
                  <div>
                    <p className="text-sm sm:text-base font-medium text-foreground">{t.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-light">
                      {getLocalized(t, "role")} · {getLocalized(t, "location")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); stopAutoplay(); setTimeout(startAutoplay, 4000); }}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-7 h-2 bg-primary"
                    : "w-2 h-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

TestimonialsSection.displayName = "TestimonialsSection";

export default TestimonialsSection;
