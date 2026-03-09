/**
 * TrustBar — premium trust strip with hero 90% badge
 * @module components
 */

import { memo, useRef, useState, useEffect } from "react";
import { ShieldCheck, FileCheck, Leaf, Headphones, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

function AnimatedNumber({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
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
  }, [target, duration]);

  return <span ref={ref}>{display.toLocaleString("fr-BE")}{suffix}</span>;
}

const TrustBar = memo(() => {
  const { t } = useLanguage();

  const badges = [
    {
      icon: ShieldCheck,
      value: <><AnimatedNumber target={12458} /> {t("trust.listings")}</>,
      label: t("trust.listingsLabel"),
    },
    {
      icon: FileCheck,
      value: t("trust.carpass"),
      label: t("trust.carpassLabel"),
    },
    {
      icon: Leaf,
      value: t("trust.lezEngine"),
      label: t("trust.lezLabel"),
    },
    {
      icon: Headphones,
      value: t("trust.support"),
      label: t("trust.supportLabel"),
    },
  ];

  return (
    <section className="border-y border-border/50 bg-card/60 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Hero 90% badge + regular badges */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 py-4 sm:py-5">
          {/* 90% Hero Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/20 sm:mr-auto shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center ring-1 ring-amber-500/20">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div className="leading-tight">
              <div className="text-base sm:text-lg font-extrabold text-foreground whitespace-nowrap">
                <AnimatedNumber target={90} suffix=" %" duration={1800} />
                <span className="text-amber-400 ml-1 text-xs font-bold">
                  {t("trust.certified")}
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                {t("trust.certifiedSub")}
              </div>
            </div>
          </motion.div>

          {/* Regular badges */}
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
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
                    {badge.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                    {badge.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

TrustBar.displayName = "TrustBar";

export default TrustBar;
