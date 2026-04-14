/**
 * LiveStatsStrip — real-time animated statistics fetched from the database
 * @module components
 */

import { memo, useRef, useState, useEffect } from "react";
import { Car, Users, Eye, MessageCircle, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** Smoothly animated counter with intersection observer trigger */
function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2200,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
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
      { rootMargin: "-20px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString("fr-BE")}
      {suffix}
    </span>
  );
}

/** Fetch live stats from the database */
async function fetchLiveStats() {
  const [listings, profiles, views] = await Promise.all([
    supabase
      .from("car_listings_public")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("profiles_public")
      .select("user_id", { count: "exact", head: true }),
    supabase
      .from("car_views")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    listings: listings.count ?? 0,
    users: profiles.count ?? 0,
    views: views.count ?? 0,
  };
}

const LiveStatsStrip = memo(() => {
  const { language } = useLanguage();
  const isNl = language === "nl";
  const isDe = language === "de";
  const isEn = language === "en";

  const { data: stats } = useQuery({
    queryKey: ["live-stats"],
    queryFn: fetchLiveStats,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const items = [
    {
      icon: Car,
      value: stats?.listings ?? 0,
      suffix: "+",
      label: isNl
        ? "Voertuigen online"
        : isDe
        ? "Fahrzeuge online"
        : isEn
        ? "Vehicles online"
        : "Véhicules en ligne",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Users,
      value: stats?.users ?? 0,
      suffix: "",
      label: isNl
        ? "Geregistreerde leden"
        : isDe
        ? "Registrierte Mitglieder"
        : isEn
        ? "Registered members"
        : "Membres inscrits",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Eye,
      value: stats?.views ?? 0,
      suffix: "",
      label: isNl
        ? "Keer bekeken"
        : isDe
        ? "Aufrufe"
        : isEn
        ? "Vehicle views"
        : "Consultations",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: Zap,
      value: 99,
      suffix: "%",
      label: isNl
        ? "Uptime garantie"
        : isDe
        ? "Uptime-Garantie"
        : isEn
        ? "Uptime guarantee"
        : "Uptime garanti",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <section className="relative py-8 sm:py-12 overflow-hidden">
      {/* Subtle glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 sm:px-8">
        {/* Section micro-title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mb-6 sm:mb-8"
        >
          <TrendingUp className="w-3.5 h-3.5 text-primary/60" />
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground font-light">
            {isNl ? "Live statistieken" : isDe ? "Live-Statistiken" : isEn ? "Live statistics" : "Statistiques en direct"}
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="group relative p-5 sm:p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Icon */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color}`} strokeWidth={1.5} />
              </div>

              {/* Number */}
              <div className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-1">
                <AnimatedCounter target={item.value} suffix={item.suffix} />
              </div>

              {/* Label */}
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                {item.label}
              </p>

              {/* Subtle corner glow on hover */}
              <div className="absolute -top-px -right-px w-16 h-16 rounded-tr-2xl bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

LiveStatsStrip.displayName = "LiveStatsStrip";

export default LiveStatsStrip;
