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
    <section className="py-8 sm:py-10 border-y border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3 sm:gap-4 justify-center">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  {stat.value === 4.8 ? (
                    <span>{stat.value}{stat.suffix}</span>
                  ) : (
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
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
