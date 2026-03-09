/**
 * TrustBar — bande de confiance premium juste après le hero
 * Badges de confiance spécifiques au marché belge
 * @module components
 */

import { memo, useRef, useState, useEffect } from "react";
import { ShieldCheck, FileCheck, Leaf, Headphones } from "lucide-react";
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
      { rootMargin: "-30px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{display.toLocaleString("fr-BE")}{suffix}</span>;
}

const TrustBar = memo(() => {
  const { language } = useLanguage();
  const isNl = language === "nl";

  const badges = [
    {
      icon: ShieldCheck,
      valueFr: <><AnimatedNumber target={12458} suffix="" /> annonces</>,
      valueNl: <><AnimatedNumber target={12458} suffix="" /> advertenties</>,
      labelFr: "vérifiées",
      labelNl: "geverifieerd",
    },
    {
      icon: FileCheck,
      valueFr: "Car-Pass",
      valueNl: "Car-Pass",
      labelFr: "protégé",
      labelNl: "beschermd",
    },
    {
      icon: Leaf,
      valueFr: "LEZ Engine",
      valueNl: "LEZ Engine",
      labelFr: "intégré",
      labelNl: "geïntegreerd",
    },
    {
      icon: Headphones,
      valueFr: "Support",
      valueNl: "Ondersteuning",
      labelFr: "100 % belge",
      labelNl: "100% Belgisch",
    },
    {
      icon: Lock,
      valueFr: "Transactions",
      valueNl: "Transacties",
      labelFr: "sécurisées",
      labelNl: "beveiligd",
    },
  ];

  return (
    <section className="border-y border-border/50 bg-card/60 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div
          className="flex items-center gap-6 sm:gap-0 sm:justify-between py-4 sm:py-5 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {badges.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 flex-shrink-0 min-w-max sm:min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <badge.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-foreground whitespace-nowrap">
                  {isNl ? badge.valueNl : badge.valueFr}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                  {isNl ? badge.labelNl : badge.labelFr}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

TrustBar.displayName = "TrustBar";

export default TrustBar;
