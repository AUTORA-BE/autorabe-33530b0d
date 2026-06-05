import { useRef, memo, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Leaf, ShieldCheck, Gauge } from "lucide-react";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { HeroSearch } from "@/features/search";
import FloatingTrustChip from "./FloatingTrustChip";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-marketplace.jpg";

interface HeroParallaxSceneProps {
  onSearch: (brand: string, model: string, maxPrice: number, maxMileage?: number, fuelType?: string, transmission?: string, euroNorm?: string, color?: string) => void;
}

const SHOWCASE_CARS = [
  {
    brand: "BMW",
    model: "Série 5 530e",
    year: 2022,
    price: 45900,
    fuel: "Hybride",
    mileage: "32 000 km",
    location: "Bruxelles",
    lez: true,
    color: "text-amber-500",
  },
  {
    brand: "Tesla",
    model: "Model Y LR",
    year: 2023,
    price: 38500,
    fuel: "Électrique",
    mileage: "18 000 km",
    location: "Anvers",
    lez: true,
    color: "text-primary",
  },
  {
    brand: "Mercedes",
    model: "Classe C 220d",
    year: 2021,
    price: 32000,
    fuel: "Diesel Euro 6d",
    mileage: "54 000 km",
    location: "Liège",
    lez: true,
    color: "text-foreground",
  },
];

const HeroParallaxScene = memo(function HeroParallaxScene({ onSearch }: HeroParallaxSceneProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [activeListings, setActiveListings] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('car_listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count, error }) => {
        if (cancelled || error) return;
        setActiveListings(count ?? 0);
      });
    return () => { cancelled = true; };
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Each layer moves at a different speed — deeper layers move less
  const bgY = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, -80]);
  const fxY = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, -30]);
  const fxX = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, 18]);
  const chipY = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, -50]);
  const chipX = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, -20]);
  const textY = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, -80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], prefersReduced ? [1, 1] : [1, 0.7]);
  const cardsY = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, -180]);

  return (
    <div
      ref={heroRef}
      className="relative min-h-[88vh] overflow-hidden"
      style={{ contain: "layout style" }}
    >
      {/* ── Layer 1: Cinematic background image ── */}
      <motion.div
        style={{ y: bgY, scale: 1.08 }}
        className="absolute inset-0 origin-center"
      >
        <img
          src={heroImg}
          alt="Voiture sur route belge au coucher du soleil"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          width={1920}
          height={1080}
        />
        {/* Cinematic vignette + fade to background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/65 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
        {/* Subtle grain overlay for premium feel */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </motion.div>

      {/* ── Layer 2: Luminous orbs / lens flare ── */}
      <motion.div
        style={{ y: fxY, x: fxX }}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {/* Primary orb — top right */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 65%)",
            top: "-15%",
            right: "-8%",
            filter: "blur(60px)",
          }}
          animate={prefersReduced ? {} : { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Secondary orb — bottom left */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 65%)",
            bottom: "10%",
            left: "-5%",
            filter: "blur(80px)",
          }}
          animate={prefersReduced ? {} : { scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Lens flare accent */}
        <div
          className="absolute w-[180px] h-[180px] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 60%)",
            top: "35%",
            left: "60%",
            filter: "blur(30px)",
          }}
        />
      </motion.div>

      {/* ── Layer 3: Floating trust chip (only shown when we have real data > 0) ── */}
      {activeListings !== null && activeListings > 0 && (
        <motion.div
          style={{ y: chipY, x: chipX }}
          className="absolute top-[14%] sm:top-[18%] left-1/2 -translate-x-1/2 z-20"
        >
          <FloatingTrustChip count={activeListings} />
        </motion.div>
      )}

      {/* ── Layer 4: Text + Search (embedded HeroSearch) ── */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-20 flex items-center justify-center pt-28 sm:pt-36 pb-12 sm:pb-20"
      >
        <HeroSearch onSearch={onSearch} />
      </motion.div>

      {/* ── Layer 5: Showcase mini-cards (desktop only) ── */}
      <motion.div
        style={{ y: cardsY }}
        className="relative z-30 hidden lg:block pb-16"
      >
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            {SHOWCASE_CARS.map((car, i) => (
              <motion.div
                key={car.model}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                className="rounded-2xl bg-card/65 backdrop-blur-xl border border-border/30 p-4 shadow-xl shadow-black/20 hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                {/* Brand + year */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-light mb-0.5">
                      {car.brand}
                    </p>
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {car.model}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-light mt-0.5">{car.year}</span>
                </div>

                {/* Price */}
                <p className="font-serif text-xl font-light text-foreground mb-3">
                  {car.price.toLocaleString("fr-BE")} <span className="text-base text-muted-foreground">€</span>
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-light">
                    <Gauge className="w-2.5 h-2.5" strokeWidth={1.5} />
                    {car.mileage}
                  </span>
                  <span className="h-2.5 w-px bg-border/40" />
                  <span className="inline-flex items-center gap-1 text-[10px] font-light text-primary">
                    <Leaf className="w-2.5 h-2.5" strokeWidth={1.5} />
                    LEZ OK
                  </span>
                  <span className="h-2.5 w-px bg-border/40" />
                  <span className="inline-flex items-center gap-1 text-[10px] font-light">
                    <ShieldCheck className="w-2.5 h-2.5 text-primary" strokeWidth={1.5} />
                    <span className="text-muted-foreground">Car-Pass</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default HeroParallaxScene;
