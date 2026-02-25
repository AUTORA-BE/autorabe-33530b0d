/**
 * StatsStrip — a horizontal social-proof strip between sections
 * @module components
 */

import { memo, useRef, useState, useEffect } from "react";
import { Car, Users, ShieldCheck, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
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
            const progress = Math.min((now - startTime) / 2000, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { rootMargin: "-30px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

const StatsStrip = memo(() => {
  const { language } = useLanguage();
  const isNl = language === "nl";

  const stats = [
    { icon: Car, value: 150, suffix: "+", labelFr: "Annonces vérifiées", labelNl: "Geverifieerde advertenties" },
    { icon: Users, value: 500, suffix: "+", labelFr: "Utilisateurs actifs", labelNl: "Actieve gebruikers" },
    { icon: ShieldCheck, value: 98, suffix: "%", labelFr: "Taux de satisfaction", labelNl: "Tevredenheidscijfer" },
    { icon: Star, value: 4.8, suffix: "/5", labelFr: "Note moyenne", labelNl: "Gemiddelde score" },
  ];

  return (
    <section className="py-5 sm:py-10 border-y border-border/50 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Mobile: horizontal scroll · Desktop: grid */}
        <div className="flex sm:grid sm:grid-cols-4 gap-5 sm:gap-8 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3 justify-center flex-shrink-0 snap-center min-w-[140px] sm:min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <div className="font-display text-lg sm:text-2xl font-bold text-foreground whitespace-nowrap">
                  {stat.value === 4.8 ? (
                    <span>{stat.value}{stat.suffix}</span>
                  ) : (
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  )}
                </div>
                <p className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">
                  {isNl ? stat.labelNl : stat.labelFr}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

StatsStrip.displayName = "StatsStrip";

export default StatsStrip;
