/**
 * "Why AutoRa" trust section with 90% hero card + staggered entrance
 * @module components
 */

import { memo, useRef, useState, useEffect } from "react";
import { Shield, Leaf, FileCheck, HeadphonesIcon, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
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
    <section className="py-10 sm:py-24 relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
          >
            <Shield className="w-3.5 h-3.5" />
            {t("why.badge")}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight"
          >
            {t("why.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto"
          >
            {t("why.subtitle")}
          </motion.p>
        </div>

        {/* Feature cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory pb-2 sm:pb-0"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className={`group relative rounded-2xl border p-5 sm:p-7 transition-all duration-300 flex-shrink-0 w-[260px] sm:w-auto snap-center ${
                feature.highlight
                  ? "border-amber-500/30 bg-gradient-to-br from-amber-500/[0.06] via-card to-card hover:border-amber-500/40 hover:shadow-[0_8px_32px_-8px_rgba(245,158,11,0.15)]"
                  : "border-border bg-card hover:border-primary/20 hover:shadow-[var(--shadow-elevated)]"
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors ${
                feature.highlight
                  ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 group-hover:from-amber-500/25 group-hover:to-amber-600/15"
                  : "bg-primary/10 group-hover:bg-primary/15"
              }`}>
                <feature.icon className={`w-6 h-6 ${feature.highlight ? "text-amber-400" : "text-primary"}`} />
              </div>

              {/* Counter for the 90% card */}
              {feature.highlight && (
                <div className="mb-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">
                    <AnimatedCounter target={90} />
                    <span className="text-xl ml-0.5">%</span>
                  </span>
                </div>
              )}

              <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-2">
                {isNl ? feature.titleNl : feature.titleFr}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {isNl ? feature.descNl : feature.descFr}
              </p>

              {/* Bottom accent */}
              <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl ${
                feature.highlight ? "via-amber-500/40" : "via-primary/30"
              }`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

WhyAutoRa.displayName = "WhyAutoRa";

export default WhyAutoRa;
