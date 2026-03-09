/**
 * TrustBar — minimal executive trust strip
 * @module components
 */

import { memo, useRef, useState, useEffect } from "react";
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

  return (
    <section className="py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 md:gap-x-16 gap-y-4"
        >
          {/* 90% certified - highlighted */}
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-primary tabular-nums">
              <AnimatedNumber target={90} suffix="%" duration={1600} />
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              {t("trust.certified")}
            </span>
          </div>

          <div className="hidden sm:block w-px h-6 bg-border" />

          {/* Listings count */}
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
              <AnimatedNumber target={12458} duration={2000} />
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              {t("trust.listings")} {t("trust.listingsLabel")}
            </span>
          </div>

          <div className="hidden sm:block w-px h-6 bg-border" />

          {/* Car-Pass */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm sm:text-base font-semibold text-foreground">
              {t("trust.carpass")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("trust.carpassLabel")}
            </span>
          </div>

          <div className="hidden md:block w-px h-6 bg-border" />

          {/* LEZ */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm sm:text-base font-semibold text-foreground">
              LEZ
            </span>
            <span className="text-xs text-muted-foreground">
              {t("trust.lezLabel")}
            </span>
          </div>

          <div className="hidden md:block w-px h-6 bg-border" />

          {/* Support */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm sm:text-base font-semibold text-foreground">
              {t("trust.support")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("trust.supportLabel")}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

TrustBar.displayName = "TrustBar";

export default TrustBar;
