/**
 * Visual summary of filters applied via voice search
 * @module components/VoiceSearchSummary
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, Banknote, Gauge, Fuel, Settings2, Shield, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

/** Represents an applied voice filter */
export interface VoiceFilter {
  type: 'brand' | 'model' | 'budget' | 'mileage' | 'fuel' | 'transmission';
  label: string;
  value: string;
}

interface VoiceSearchSummaryProps {
  /** Array of applied voice filters */
  filters: VoiceFilter[];
  /** Callback to remove a specific filter */
  onRemoveFilter: (type: VoiceFilter['type']) => void;
  /** Callback to clear all filters */
  onClearAll: () => void;
}

const ICON_MAP: Record<VoiceFilter['type'], React.ElementType> = {
  brand: Car,
  model: Car,
  budget: Banknote,
  mileage: Gauge,
  fuel: Fuel,
  transmission: Settings2,
};

const COLOR_MAP: Record<VoiceFilter['type'], string> = {
  brand: 'bg-primary/15 text-primary border-primary/20',
  model: 'bg-secondary text-secondary-foreground border-secondary',
  budget: 'bg-accent text-accent-foreground border-accent',
  mileage: 'bg-secondary text-secondary-foreground border-secondary',
  fuel: 'bg-primary/10 text-primary border-primary/15',
  transmission: 'bg-muted text-muted-foreground border-muted',
};

/**
 * Displays a visual summary of voice search filters with dismiss functionality
 */
export const VoiceSearchSummary = memo(function VoiceSearchSummary({
  filters,
  onRemoveFilter,
  onClearAll,
}: VoiceSearchSummaryProps) {
  const { language } = useLanguage();

  if (filters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glass-panel p-3 sm:p-4 max-w-3xl mx-auto mt-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mic className="w-4 h-4 text-primary" />
          <span className="font-medium">
            {language === 'nl' ? 'Spraakfilters toegepast' : 'Filtres vocaux appliqués'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
        >
          {language === 'nl' ? 'Alles wissen' : 'Tout effacer'}
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {filters.map((filter) => {
            const Icon = ICON_MAP[filter.type];
            return (
              <motion.div
                key={filter.type}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${COLOR_MAP[filter.type]}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs text-muted-foreground">{filter.label}:</span>
                <span>{filter.value}</span>
                <button
                  onClick={() => onRemoveFilter(filter.type)}
                  className="ml-1 p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
                  aria-label={`Retirer ${filter.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
