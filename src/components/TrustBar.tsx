/**
 * TrustBar — minimal executive trust strip with balanced grid
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
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto"
        >
          {/* 90% certified */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black text-primary tabular-nums mb-1">
              <AnimatedNumber target={90} suffix="%" duration={1600} />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
              {t("trust.certified")}
            </div>
          </div>

          {/* Listings count */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black text-foreground tabular-nums mb-1">
              <AnimatedNumber target={12458} duration={2000} />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
              {t("trust.listings")}
            </div>
          </div>

          {/* Car-Pass */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">
              ✓
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
              {t("trust.carpass")}
            </div>
          </div>

          {/* LEZ */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">
              ✓
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
              LEZ {t("trust.lezLabel")}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

TrustBar.displayName = "TrustBar";

export default TrustBar;
