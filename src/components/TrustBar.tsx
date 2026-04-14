/**
 * TrustBar — minimal luxe trust strip with consistent spacing
 * @module components
 */

import { memo } from "react";
import { ShieldCheck, FileCheck, Leaf, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const TrustBar = memo(() => {
  const { t } = useLanguage();

  const badges = [
    { icon: ShieldCheck, value: t("trust.listings"), label: t("trust.listingsLabel") },
    { icon: FileCheck, value: t("trust.carpass"), label: t("trust.carpassLabel") },
    { icon: Leaf, value: t("trust.lezEngine"), label: t("trust.lezLabel") },
    { icon: Headphones, value: t("trust.support"), label: t("trust.supportLabel") },
  ];

  return (
    <section className="py-8 sm:py-10">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex items-center gap-8 sm:gap-12 overflow-x-auto scrollbar-hide justify-start sm:justify-center pb-1 snap-x">
          {badges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="flex items-center gap-3 flex-shrink-0 snap-start"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center">
                <badge.icon className="w-4 h-4 text-primary/60" strokeWidth={1.5} />
              </div>
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
