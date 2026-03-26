/**
 * "Why AutoRa" — premium bento-grid trust section with ultra-minimal cards
 * @module components
 */

import { memo, useRef, useState, useEffect } from "react";
import { Shield, Leaf, FileCheck, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/** Animated counter for the 90% card */
function AnimatedCounter({ target }: { target: number }) {
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
            const progress = Math.min((now - startTime) / 1800, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplay(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { rootMargin: "-40px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{display}</span>;
}

const WhyAutoRa = memo(() => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Award,
      title: t("why.card1.title"),
      desc: t("why.card1.desc"),
      highlight: true,
    },
    {
      icon: Shield,
      title: t("why.card2.title"),
      desc: t("why.card2.desc"),
    },
    {
      icon: FileCheck,
      title: t("why.card3.title"),
      desc: t("why.card3.desc"),
    },
    {
      icon: Leaf,
      title: t("why.card4.title"),
      desc: t("why.card4.desc"),
    },
  ];

  return (
    <section className="py-16 sm:py-32 relative overflow-hidden">
      <div className="container mx-auto px-6 sm:px-8 relative">
        {/* Section header — minimal */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-4 leading-tight"
          >
            {t("why.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-muted-foreground text-sm font-light max-w-md mx-auto"
          >
            {t("why.subtitle")}
          </motion.p>
        </div>

        {/* Bento grid — ultra-clean cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory pb-2 sm:pb-0"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className={`group relative rounded-3xl border p-6 sm:p-8 transition-all duration-300 flex-shrink-0 w-[240px] sm:w-auto snap-center ${
                feature.highlight
                  ? "border-primary/15 bg-primary/[0.03]"
                  : "border-border/30 bg-card/30 dark:border-border/10"
              }`}
            >
              {/* Icon — ultra-thin line art */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                feature.highlight
                  ? "bg-primary/8"
                  : "bg-secondary/40"
              }`}>
                <feature.icon className={`w-5 h-5 ${feature.highlight ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
              </div>

              {/* Counter for the 90% card */}
              {feature.highlight && (
                <div className="mb-4">
                  <span className="text-4xl sm:text-5xl font-light text-primary">
                    <AnimatedCounter target={90} />
                    <span className="text-2xl ml-0.5">%</span>
                  </span>
                </div>
              )}

              <h3 className="text-base sm:text-lg font-medium text-foreground mb-3">
                {feature.title}
              </h3>

              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

WhyAutoRa.displayName = "WhyAutoRa";

export default WhyAutoRa;
