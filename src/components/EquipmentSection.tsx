import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface EquipmentSectionProps {
  /** Raw features array from listing.features (may be null/empty) */
  features: string[] | null | undefined;
}

/**
 * Renders the listing's equipment/options as a responsive chip grid.
 * Returns null when no features are present (no empty section).
 */
const EquipmentSection = ({ features }: EquipmentSectionProps) => {
  const { t } = useLanguage();

  const items = (features ?? []).map((f) => f?.trim()).filter((f): f is string => !!f);
  if (items.length === 0) return null;

  return (
    <div className="glass-card p-5 sm:p-6">
      <h2 className="font-display text-lg sm:text-xl font-bold text-foreground mb-4">
        {t("carDetail.equipment.title")}
      </h2>
      <motion.ul
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.025 } },
        }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"
      >
        {items.map((item) => (
          <motion.li
            key={item}
            variants={{
              hidden: { opacity: 0, y: 6 },
              show: { opacity: 1, y: 0 },
            }}
            className="px-3 py-2 rounded-full bg-secondary/60 text-secondary-foreground text-xs sm:text-sm text-center truncate border border-border/30"
            title={item}
          >
            {item}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
};

export default EquipmentSection;
