import { motion } from "framer-motion";
import { 
  Calendar, 
  Gauge, 
  Fuel, 
  Settings2, 
  Leaf, 
  MapPin, 
  Zap, 
  Palette,
  Car,
  Weight
} from "lucide-react";

interface BentoSpec {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}

interface BentoSpecsProps {
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  euroNorm?: string | null;
  location?: string | null;
  power?: number | null;
  color?: string | null;
  bodyType?: string | null;
  doors?: number | null;
}

const BentoSpecs = ({
  year,
  mileage,
  fuelType,
  transmission,
  euroNorm,
  location,
  power,
  color,
  bodyType,
  doors,
}: BentoSpecsProps) => {
  const formatMileage = (km: number) => {
    return new Intl.NumberFormat("fr-BE").format(km) + " km";
  };

  const formatPower = (kw: number) => {
    const ch = Math.round(kw * 1.36);
    return `${kw} kW / ${ch} ch`;
  };

  // Primary specs always shown prominently
  const primarySpecs: BentoSpec[] = [
    { icon: Calendar, label: "Année", value: year.toString(), highlight: true },
    { icon: Gauge, label: "Kilométrage", value: formatMileage(mileage), highlight: true },
    { icon: Fuel, label: "Carburant", value: fuelType },
    { icon: Settings2, label: "Transmission", value: transmission },
  ];

  const secondarySpecs: BentoSpec[] = [];

  if (euroNorm) secondarySpecs.push({ icon: Leaf, label: "Norme Euro", value: euroNorm });
  if (power) secondarySpecs.push({ icon: Zap, label: "Puissance", value: formatPower(power) });
  if (location) secondarySpecs.push({ icon: MapPin, label: "Localisation", value: location });
  if (color) secondarySpecs.push({ icon: Palette, label: "Couleur", value: color });
  if (bodyType) secondarySpecs.push({ icon: Car, label: "Carrosserie", value: bodyType });
  if (doors) secondarySpecs.push({ icon: Weight, label: "Portes", value: `${doors} portes` });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="glass-card p-5 sm:p-6">
      <h2 className="font-display text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">
        Caractéristiques
      </h2>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {/* Hero row: Year & Mileage side by side */}
        <div className="grid grid-cols-2 gap-3">
          {primarySpecs.slice(0, 2).map((spec) => {
            const Icon = spec.icon;
            return (
              <motion.div
                key={spec.label}
                variants={item}
                className="relative overflow-hidden rounded-2xl bg-primary/10 p-4 group"
              >
                <Icon className="absolute -bottom-2 -right-2 w-16 h-16 text-primary/[0.07]" />
                <div className="relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center mb-2.5">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80 font-medium">
                    {spec.label}
                  </p>
                  <p className="font-bold text-foreground text-lg mt-0.5 leading-tight">
                    {spec.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Fuel & Transmission row */}
        <div className="grid grid-cols-2 gap-3">
          {primarySpecs.slice(2, 4).map((spec) => {
            const Icon = spec.icon;
            return (
              <motion.div
                key={spec.label}
                variants={item}
                className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3.5 hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    {spec.label}
                  </p>
                  <p className="font-semibold text-foreground text-sm leading-tight mt-0.5">
                    {spec.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Secondary specs as compact chips grid */}
        {secondarySpecs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {secondarySpecs.map((spec) => {
              const Icon = spec.icon;
              return (
                <motion.div
                  key={spec.label}
                  variants={item}
                  className="flex items-center gap-2.5 rounded-xl bg-secondary/30 px-3 py-2.5 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium leading-none">
                      {spec.label}
                    </p>
                    <p className="font-semibold text-foreground text-xs mt-0.5 break-words leading-tight">
                      {spec.value}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BentoSpecs;
