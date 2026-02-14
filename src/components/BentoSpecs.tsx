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
  size?: "small" | "medium" | "large";
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

  const specs: BentoSpec[] = [
    { icon: Calendar, label: "Année", value: year.toString(), size: "medium" },
    { icon: Gauge, label: "Kilométrage", value: formatMileage(mileage), size: "large" },
    { icon: Fuel, label: "Carburant", value: fuelType, size: "medium" },
    { icon: Settings2, label: "Transmission", value: transmission, size: "medium" },
  ];

  if (euroNorm) {
    specs.push({ icon: Leaf, label: "Norme Euro", value: euroNorm, size: "small" });
  }

  if (power) {
    specs.push({ icon: Zap, label: "Puissance", value: formatPower(power), size: "large" });
  }

  if (location) {
    specs.push({ icon: MapPin, label: "Localisation", value: location, size: "medium" });
  }

  if (color) {
    specs.push({ icon: Palette, label: "Couleur", value: color, size: "small" });
  }

  if (bodyType) {
    specs.push({ icon: Car, label: "Carrosserie", value: bodyType, size: "small" });
  }

  if (doors) {
    specs.push({ icon: Weight, label: "Portes", value: `${doors} portes`, size: "small" });
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const getSizeClasses = (size: string = "small") => {
    switch (size) {
      case "large":
        return "col-span-2 row-span-1";
      case "medium":
        return "col-span-1 row-span-1";
      default:
        return "col-span-1 row-span-1";
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="font-display text-xl font-bold text-foreground mb-6">
        Caractéristiques
      </h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-fr"
      >
        {specs.map((spec, index) => {
          const Icon = spec.icon;
          return (
            <motion.div
              key={spec.label}
              variants={item}
              className={`${getSizeClasses(spec.size)} p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all duration-300 group cursor-default hover:shadow-lg hover:-translate-y-1`}
            >
              <div className="flex items-start gap-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                  <p className="font-semibold text-foreground text-sm md:text-base break-words">
                    {spec.value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default BentoSpecs;
