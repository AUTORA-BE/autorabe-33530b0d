/**
 * TrustBar — premium horizontal trust strip with elegant badges
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
        <div className="flex flex-col lg:flex-row items-center justify-between py-4 sm:py-5 gap-6 lg:gap-8">
          
          {/* 90% Highlight - Left side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-center gap-3.5 px-5 py-2.5 rounded-2xl bg-primary/[0.04] border border-primary/10 w-full lg:w-auto justify-center lg:justify-start"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold text-foreground flex items-baseline gap-1.5">
                <AnimatedNumber target={90} suffix=" %" duration={1800} />
                <span className="text-primary text-sm">
                  {t("trust.certified")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {t("trust.certifiedSub")}
              </div>
            </div>
          </motion.div>

          {/* Regular Badges - Right side */}
          <div className="flex items-center gap-8 overflow-x-auto w-full lg:w-auto scrollbar-hide pb-2 lg:pb-0 px-2 lg:px-0 snap-x">
            {badges.map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-3 flex-shrink-0 snap-start"
              >
                <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                  <badge.icon className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {badge.value}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {badge.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
});

TrustBar.displayName = "TrustBar";

export default TrustBar;