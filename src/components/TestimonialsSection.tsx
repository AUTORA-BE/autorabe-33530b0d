/**
 * TestimonialsSection — premium carousel with real avatars & star ratings
 * @module components
 */

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

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
    locationFr: "Bruxelles",
    locationNl: "Brussel",
    locationDe: "Brüssel",
    locationEn: "Brussels",
    roleFr: "Acheteur",
    roleNl: "Koper",
    roleDe: "Käufer",
    roleEn: "Buyer",
    quoteFr: "J'ai enfin trouvé un site qui m'explique clairement les zones LEZ et les taxes avant d'acheter. Plus de mauvaises surprises ! Le calculateur TCO m'a fait économiser plus de 2 000€.",
    quoteNl: "Eindelijk een site die me duidelijk de LEZ-zones en belastingen uitlegt vóór de aankoop. Geen verrassingen meer! De TCO-calculator heeft me meer dan €2.000 bespaard.",
    quoteDe: "Endlich eine Seite, die mir LEZ-Zonen und Steuern vor dem Kauf klar erklärt. Keine bösen Überraschungen mehr! Der TCO-Rechner hat mir über 2.000€ gespart.",
    quoteEn: "Finally found a site that clearly explains LEZ zones and taxes before buying. No more bad surprises! The TCO calculator saved me over €2,000.",
    rating: 5,
    avatar: avatarThomas,
  },
  {
    name: "Sophie V.",
    locationFr: "Anvers",
    locationNl: "Antwerpen",
    locationDe: "Antwerpen",
    locationEn: "Antwerp",
    roleFr: "Vendeuse",
    roleNl: "Verkoper",
    roleDe: "Verkäuferin",
    roleEn: "Seller",
    quoteFr: "Le Car-Pass intégré et le calcul TCO m'ont fait gagner un temps fou. J'ai vendu ma voiture en 3 jours. La messagerie instantanée avec les acheteurs est un vrai plus.",
    quoteNl: "De geïntegreerde Car-Pass en TCO-berekening hebben me enorm veel tijd bespaard. Mijn auto was verkocht in 3 dagen. De directe berichten met kopers zijn een echte meerwaarde.",
    quoteDe: "Der integrierte Car-Pass und die TCO-Berechnung haben mir enorm viel Zeit gespart. Mein Auto war in 3 Tagen verkauft. Die Sofortnachrichten mit Käufern sind ein echtes Plus.",
    quoteEn: "The integrated Car-Pass and TCO calculator saved me so much time. I sold my car in 3 days. Instant messaging with buyers is a real plus.",
    rating: 5,
    avatar: avatarSophie,
  },
  {
    name: "Marc L.",
    locationFr: "Gand",
    locationNl: "Gent",
    locationDe: "Gent",
    locationEn: "Ghent",
    roleFr: "Acheteur",
    roleNl: "Koper",
    roleDe: "Käufer",
    roleEn: "Buyer",
    quoteFr: "Enfin un site automobile qui comprend la réalité belge : LEZ, Car-Pass, taxes régionales… Tout est transparent. L'interface est magnifique et rapide.",
    quoteNl: "Eindelijk een autosite die de Belgische realiteit begrijpt: LEZ, Car-Pass, regionale belastingen… Alles is transparant. De interface is prachtig en snel.",
    quoteDe: "Endlich eine Autoseite, die die belgische Realität versteht: LEZ, Car-Pass, regionale Steuern… Alles ist transparent. Die Oberfläche ist wunderschön und schnell.",
    quoteEn: "Finally a car site that understands Belgian reality: LEZ, Car-Pass, regional taxes… Everything is transparent. The interface is beautiful and fast.",
    rating: 5,
    avatar: avatarMarc,
  },
  {
    name: "Isabelle M.",
    locationFr: "Liège",
    locationNl: "Luik",
    locationDe: "Lüttich",
    locationEn: "Liège",
    roleFr: "Acheteuse",
    roleNl: "Koper",
    roleDe: "Käuferin",
    roleEn: "Buyer",
    quoteFr: "Le comparateur de véhicules est incroyable. J'ai pu comparer 3 voitures côte à côte et faire le meilleur choix en toute confiance. Service client au top !",
    quoteNl: "De voertuigvergelijker is ongelooflijk. Ik kon 3 auto's naast elkaar vergelijken en de beste keuze maken. Klantenservice is top!",
    quoteDe: "Der Fahrzeugvergleicher ist unglaublich. Ich konnte 3 Autos nebeneinander vergleichen und die beste Wahl treffen. Kundenservice top!",
    quoteEn: "The vehicle comparator is incredible. I could compare 3 cars side by side and make the best choice with confidence. Top customer service!",
    rating: 5,
    avatar: avatarIsabelle,
  },
  {
    name: "Kevin B.",
    locationFr: "Namur",
    locationNl: "Namen",
    locationDe: "Namur",
    locationEn: "Namur",
    roleFr: "Vendeur pro",
    roleNl: "Professionele verkoper",
    roleDe: "Professioneller Verkäufer",
    roleEn: "Pro seller",
    quoteFr: "En tant que professionnel, le dashboard vendeur et les statistiques sont exactement ce dont j'avais besoin. Mes annonces sont vues par des acheteurs qualifiés.",
    quoteNl: "Als professioneel biedt het verkopersdashboard en de statistieken precies wat ik nodig heb. Mijn advertenties worden gezien door gekwalificeerde kopers.",
    quoteDe: "Als Profi bieten das Verkäufer-Dashboard und die Statistiken genau das, was ich brauche. Meine Anzeigen werden von qualifizierten Käufern gesehen.",
    quoteEn: "As a professional, the seller dashboard and statistics are exactly what I needed. My listings are seen by qualified buyers.",
    rating: 4,
    avatar: avatarKevin,
  },
];

/** Renders star rating */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 transition-colors ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

const TestimonialsSection = memo(() => {
  const { language } = useLanguage();
  const [current, setCurrent] = useState(0);
  const isMobile = useIsMobile();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  const getLocalized = useCallback(
    (t: Testimonial, field: "quote" | "location" | "role") => {
      const key = `${field}${language === "nl" ? "Nl" : language === "de" ? "De" : language === "en" ? "En" : "Fr"}` as keyof Testimonial;
      return t[key] as string;
    },
    [language]
  );

  const visibleCount = isMobile ? 1 : 3;
  const maxIndex = testimonials.length - visibleCount;

  const next = useCallback(() => setCurrent((c) => (c >= maxIndex ? 0 : c + 1)), [maxIndex]);
  const prev = useCallback(() => setCurrent((c) => (c <= 0 ? maxIndex : c - 1)), [maxIndex]);

  // Auto-advance
  useEffect(() => {
    intervalRef.current = setInterval(next, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [next]);

  const pauseAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resumeAutoplay = useCallback(() => {
    intervalRef.current = setInterval(next, 5000);
  }, [next]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    pauseAutoplay();
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    resumeAutoplay();
  };

  const sectionTitles: Record<string, { title: string; subtitle: string }> = {
    fr: {
      title: "Ils nous font confiance",
      subtitle: "Des milliers de Belges utilisent AutoRa pour acheter et vendre leur voiture en toute sérénité.",
    },
    nl: {
      title: "Zij vertrouwen ons",
      subtitle: "Duizenden Belgen gebruiken AutoRa om met een gerust hart hun auto te kopen en te verkopen.",
    },
    de: {
      title: "Sie vertrauen uns",
      subtitle: "Tausende Belgier nutzen AutoRa, um ihr Auto sicher zu kaufen und zu verkaufen.",
    },
    en: {
      title: "They trust us",
      subtitle: "Thousands of Belgians use AutoRa to buy and sell their car with confidence.",
    },
  };

  const { title, subtitle } = sectionTitles[language] || sectionTitles.fr;

  return (
    <section className="py-16 sm:py-28 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/8 border border-amber-500/15 mb-5"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-light text-amber-600 dark:text-amber-400 tracking-wide">4.9/5</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-4 leading-tight"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-sm sm:text-base font-light max-w-lg mx-auto"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={pauseAutoplay}
          onMouseLeave={resumeAutoplay}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation arrows — desktop only */}
          {!isMobile && (
            <>
              <button
                onClick={() => { prev(); pauseAutoplay(); setTimeout(resumeAutoplay, 3000); }}
                className="absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 flex items-center justify-center text-foreground hover:bg-card hover:border-primary/20 transition-all shadow-sm"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => { next(); pauseAutoplay(); setTimeout(resumeAutoplay, 3000); }}
                className="absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 flex items-center justify-center text-foreground hover:bg-card hover:border-primary/20 transition-all shadow-sm"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Cards container */}
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-5 sm:gap-6"
              animate={{ x: `-${current * (100 / visibleCount)}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  className="group flex-shrink-0 rounded-2xl sm:rounded-3xl border border-border/20 bg-card/40 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:border-primary/15 hover:shadow-lg hover:shadow-primary/5"
                  style={{ width: `calc(${100 / visibleCount}% - ${((visibleCount - 1) * (isMobile ? 20 : 24)) / visibleCount}px)` }}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  {/* Quote accent */}
                  <Quote className="w-7 h-7 text-primary/10 mb-4" strokeWidth={1} />

                  {/* Stars */}
                  <div className="mb-4">
                    <StarRating rating={t.rating} />
                  </div>

                  {/* Quote text */}
                  <p className="text-sm sm:text-[15px] text-foreground/90 font-light leading-relaxed mb-6 min-h-[80px]">
                    &ldquo;{getLocalized(t, "quote")}&rdquo;
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-border/30 mb-5" />

                  {/* Author */}
                  <div className="flex items-center gap-3.5">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      loading="lazy"
                      width={48}
                      height={48}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-primary/10 ring-offset-2 ring-offset-background"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-light">
                        {getLocalized(t, "role")} · {getLocalized(t, "location")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); pauseAutoplay(); setTimeout(resumeAutoplay, 3000); }}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-6 h-2 bg-primary"
                    : "w-2 h-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                }`}
                aria-label={`Go to slide ${i + 1}`}
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
