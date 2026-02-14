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
  DoorOpen
} from "lucide-react";

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
  const formatMileage = (km: number) =>
    new Intl.NumberFormat("fr-BE").format(km) + " km";

  const formatPower = (kw: number) => {
    const ch = Math.round(kw * 1.36);
    return `${kw} kW / ${ch} ch`;
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  // Build secondary detail pills
  const details: { icon: React.ElementType; label: string; value: string }[] = [
    { icon: Fuel, label: "Carburant", value: fuelType },
    { icon: Settings2, label: "Transmission", value: transmission },
  ];
  if (euroNorm) details.push({ icon: Leaf, label: "Norme Euro", value: euroNorm });
  if (power) details.push({ icon: Zap, label: "Puissance", value: formatPower(power) });
  if (color) details.push({ icon: Palette, label: "Couleur", value: color });
  if (bodyType) details.push({ icon: Car, label: "Carrosserie", value: bodyType });
  if (doors) details.push({ icon: DoorOpen, label: "Portes", value: `${doors}` });

  return (
    <div className="glass-card p-5 sm:p-6">
      <h2 className="font-display text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-5">
        Caractéristiques
      </h2>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {/* 1. Location — full width hero */}
        {location && (
          <motion.div
            variants={item}
            className="relative overflow-hidden rounded-2xl bg-primary/10 p-4"
          >
            <MapPin className="absolute -bottom-3 -right-3 w-20 h-20 text-primary/[0.06]" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                  Localisation
                </p>
                <p className="font-bold text-foreground text-lg leading-tight">{location}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. Year + Mileage — the two key numbers */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Calendar, label: "Année", value: year.toString() },
            { icon: Gauge, label: "Kilométrage", value: formatMileage(mileage) },
          ].map((spec) => {
            const Icon = spec.icon;
            return (
              <motion.div
                key={spec.label}
                variants={item}
                className="relative overflow-hidden rounded-2xl bg-secondary/60 p-4"
              >
                <Icon className="absolute -bottom-2 -right-2 w-14 h-14 text-primary/[0.06]" />
                <div className="relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    {spec.label}
                  </p>
                  <p className="font-bold text-foreground text-base mt-0.5 leading-tight">
                    {spec.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 3. All other details — clean compact list */}
        <div className="grid grid-cols-2 gap-2">
          {details.map((spec) => {
            const Icon = spec.icon;
            return (
              <motion.div
                key={spec.label}
                variants={item}
                className="flex items-center gap-2.5 rounded-xl bg-secondary/30 px-3 py-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium leading-none">
                    {spec.label}
                  </p>
                  <p className="font-semibold text-foreground text-xs mt-0.5 leading-tight break-words">
                    {spec.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default BentoSpecs;
