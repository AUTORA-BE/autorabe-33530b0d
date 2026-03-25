/** Step 1: Fuel type selection with Lucide icons */

import { motion } from 'framer-motion';
import { Check, Droplets, Flame, Zap, PlugZap, BatteryCharging, type LucideIcon } from 'lucide-react';
import { FUEL_OPTIONS } from '../../constants/belgianData';
import type { FuelType } from '../../types/tco.types';

const ICON_MAP: Record<string, LucideIcon> = {
  Droplets, Flame, Zap, PlugZap, BatteryCharging,
};

interface FuelTypeStepProps {
  value: FuelType;
  onChange: (v: FuelType) => void;
}

const FuelTypeStep = ({ value, onChange }: FuelTypeStepProps) => (
  <div>
    <h2 className="text-2xl font-display font-bold text-foreground mb-2">Quel carburant ?</h2>
    <p className="text-muted-foreground mb-8">Prix moyens Belgique — Mars 2026</p>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {FUEL_OPTIONS.map((opt, i) => {
        const selected = value === opt.value;
        const Icon = ICON_MAP[opt.lucideIcon];
        return (
          <motion.button
            key={opt.value}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onChange(opt.value)}
            className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.03] hover:shadow-md ${
              selected
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                : 'border-border/50 bg-secondary/30 hover:border-primary/50'
            }`}
          >
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
            <div className="mb-2 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              {Icon ? <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} /> : <span className="text-lg">{opt.icon}</span>}
            </div>
            <div className="font-semibold text-foreground text-sm">{opt.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{opt.price}</div>
            <span className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${opt.badgeColor}`}>
              {opt.badge}
            </span>
          </motion.button>
        );
      })}
    </div>
  </div>
);

export default FuelTypeStep;
