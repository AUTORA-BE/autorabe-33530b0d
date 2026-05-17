/**
 * TrustBar — premium trust strip with elegant card design
 * @module components
 */

import { memo } from "react";
import { ShieldCheck, FileCheck, Leaf, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const TrustBar = memo(() => {
  const { t } = useLanguage();

  const badges = [
    {
      icon: ShieldCheck,
      value: t("trust.listings"),
      label: t("trust.listingsLabel"),
      gradient: "from-primary/20 via-primary/10 to-transparent",
    },
    {
      icon: FileCheck,
      value: t("trust.carpass"),
      label: t("trust.carpassLabel"),
      gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    },
    {
      icon: Leaf,
      value: t("trust.lezEngine"),
      label: t("trust.lezLabel"),
      gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
    },
    {
      icon: Headphones,
      value: t("trust.support"),
      label: t("trust.supportLabel"),
      gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    },
  ];

  return (
    <section className="py-6 sm:py-10">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-hide justify-start sm:justify-center pb-1 snap-x">
          {badges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.075 }}
              className="relative flex-shrink-0 snap-start flex items-center gap-3.5 px-5 py-3.5 rounded-2xl border border-border/15 bg-card/40 backdrop-blur-sm overflow-hidden group hover:border-primary/15 transition-colors duration-300"
            >
              {/* Subtle gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${badge.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative w-10 h-10 rounded-xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center flex-shrink-0">
                <badge.icon className="w-[18px] h-[18px] text-primary/70" strokeWidth={1.5} />
              </div>
              <div className="relative leading-tight">
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
