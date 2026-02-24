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
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const item = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
  };

  // Build secondary pills
  const details: { icon: React.ElementType; label: string; value: string }[] = [];
  if (power) details.push({ icon: Zap, label: "Puissance", value: formatPower(power) });
  if (euroNorm) details.push({ icon: Leaf, label: "Norme Euro", value: euroNorm });
  if (color) details.push({ icon: Palette, label: "Couleur", value: color });
  if (bodyType) details.push({ icon: Car, label: "Carrosserie", value: bodyType });
  if (doors) details.push({ icon: DoorOpen, label: "Portes", value: `${doors}` });

  return (
    <div className="glass-card p-5 sm:p-6">
      <h2 className="font-display text-lg sm:text-xl font-bold text-foreground mb-5">
        Caractéristiques
      </h2>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-6 gap-3 auto-rows-auto">

        {/* ── Location — spans full width, hero tile ── */}
        {location && (
          <motion.div
            variants={item}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="col-span-6 group relative overflow-hidden rounded-2xl bg-primary/10 p-5 cursor-default"
          >
            <MapPin className="absolute -bottom-4 -right-4 w-24 h-24 text-primary/[0.06] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary/30 group-hover:shadow-glow">
                <MapPin className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-110" />
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

        {/* ── Year — tall left tile (spans 3 cols, 2 rows) ── */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.03, y: -3 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="col-span-3 row-span-2 group relative overflow-hidden rounded-2xl bg-secondary/60 p-5 cursor-default flex flex-col justify-between min-h-[140px]"
        >
          <Calendar className="absolute -bottom-3 -right-3 w-20 h-20 text-primary/[0.05] transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3 transition-all duration-300 group-hover:bg-primary/25 group-hover:shadow-glow">
              <Calendar className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-110" />
            </div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
              Année
            </p>
          </div>
          <p className="relative z-10 font-extrabold text-foreground text-3xl leading-tight">
            {year}
          </p>
        </motion.div>

        {/* ── Mileage — right top ── */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.04, y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="col-span-3 group relative overflow-hidden rounded-2xl bg-secondary/60 p-4 cursor-default"
        >
          <Gauge className="absolute -bottom-2 -right-2 w-14 h-14 text-primary/[0.05] transition-all duration-500 group-hover:scale-110 group-hover:rotate-12" />
          <div className="relative z-10">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center mb-2 transition-all duration-300 group-hover:bg-primary/25 group-hover:shadow-glow">
              <Gauge className="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
              Kilométrage
            </p>
            <p className="font-bold text-foreground text-base mt-0.5 leading-tight">
              {formatMileage(mileage)}
            </p>
          </div>
        </motion.div>

        {/* ── Fuel + Transmission — right bottom, side by side sharing 3 cols ── */}
        {[
          { icon: Fuel, label: "Carburant", value: fuelType },
          { icon: Settings2, label: "Boîte", value: transmission },
        ].map((spec) => {
          const Icon = spec.icon;
          return (
            <motion.div
              key={spec.label}
              variants={item}
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="col-span-3 sm:col-span-3 group relative overflow-hidden rounded-2xl bg-secondary/40 p-3.5 cursor-default"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              <div className="relative z-10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary/20">
                  <Icon className="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium leading-none">
                    {spec.label}
                  </p>
                  <p className="font-semibold text-foreground text-xs mt-0.5 leading-tight break-words">
                    {spec.value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* ── Extra details — compact pills, auto-fill remaining space ── */}
        {details.map((spec, i) => {
          const Icon = spec.icon;
          // Make the first extra detail span wider if odd count
          const isWide = i === 0 && details.length % 2 !== 0;
          return (
            <motion.div
              key={spec.label}
              variants={item}
              whileHover={{ scale: 1.04, y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`${isWide ? "col-span-6" : "col-span-3"} group flex items-center gap-2.5 rounded-xl bg-secondary/30 px-3 py-2.5 cursor-default relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              <div className="relative z-10 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary/20">
                <Icon className="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="relative z-10 min-w-0">
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
      </motion.div>
    </div>
  );
};

export default BentoSpecs;
