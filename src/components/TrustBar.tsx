/**
 * TrustBar — minimal, airy trust strip
 * @module components
 */

import { memo, useRef, useState, useEffect } from "react";
import { ShieldCheck, FileCheck, Leaf, Headphones } from "lucide-react";
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
    <section className="relative py-6 sm:py-8">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto scrollbar-hide justify-start sm:justify-center pb-1 snap-x">
          {badges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-center gap-3 flex-shrink-0 snap-start"
            >
              <badge.icon className="w-4 h-4 text-primary/60" strokeWidth={1.5} />
              <div className="leading-tight">
                <div className="text-sm font-medium text-foreground whitespace-nowrap">
                  {badge.value}
                </div>
                <div className="text-[11px] text-muted-foreground font-light whitespace-nowrap">
                  {badge.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

TrustBar.displayName = "TrustBar";

export default TrustBar;
