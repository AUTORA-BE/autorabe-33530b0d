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
  DoorOpen,
  CalendarCheck
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
  /** First registration date (ISO YYYY-MM-DD). Displayed as MM/YYYY when present. */
  firstRegistration?: string | null;
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
  firstRegistration,
}: BentoSpecsProps) => {
  const formatFirstReg = (iso: string): string | null => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${mm}/${d.getFullYear()}`;
  };
  const formatMileage = (km: number) =>
    new Intl.NumberFormat("fr-BE").format(km) + " km";

  // `power` is stored in horsepower (ch/HP) — matches the sell wizard input label.
  // Derive kW for completeness so the spec aligns with the value used in the TCO calculator.
  const formatPower = (ch: number) => {
    const kw = Math.round(ch / 1.36);
    return `${ch} ch / ${kw} kW`;
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
  if (firstRegistration) {
    const formatted = formatFirstReg(firstRegistration);
    if (formatted) details.push({ icon: CalendarCheck, label: "1ère immat.", value: formatted });
  }

  return (
    <div className="glass-card p-3 sm:p-6">
      <h2 className="font-display text-base sm:text-xl font-bold text-foreground mb-3 sm:mb-5">
        Caractéristiques
      </h2>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-6 gap-2 sm:gap-3 auto-rows-auto">

        {/* ── Location — spans full width, hero tile ── */}
        {location && (
          <motion.div
            variants={item}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="col-span-6 group relative overflow-hidden rounded-xl sm:rounded-2xl bg-primary/10 p-3 sm:p-5 cursor-default"
          >
            <MapPin className="absolute -bottom-4 -right-4 w-20 h-20 text-primary/[0.06]" />
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                  Localisation
                </p>
                <p className="font-bold text-foreground text-sm sm:text-lg leading-tight">{location}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Year — tall left tile (spans 3 cols, 2 rows) ── */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.03, y: -3 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="col-span-3 row-span-2 group relative overflow-hidden rounded-xl sm:rounded-2xl bg-secondary/60 p-3 sm:p-5 cursor-default flex flex-col justify-between min-h-[110px] sm:min-h-[140px]"
        >
          <Calendar className="absolute -bottom-3 -right-3 w-16 h-16 text-primary/[0.05]" />
          <div className="relative z-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/15 flex items-center justify-center mb-2 sm:mb-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
              Année
            </p>
          </div>
          <p className="relative z-10 font-extrabold text-foreground text-2xl sm:text-3xl leading-tight">
            {year}
          </p>
        </motion.div>

        {/* ── Mileage — right top ── */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.04, y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="col-span-3 group relative overflow-hidden rounded-xl sm:rounded-2xl bg-secondary/60 p-3 sm:p-4 cursor-default"
        >
          <Gauge className="absolute -bottom-2 -right-2 w-12 h-12 text-primary/[0.05]" />
          <div className="relative z-10">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary/15 flex items-center justify-center mb-1.5 sm:mb-2">
              <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
              Kilométrage
            </p>
            <p className="font-bold text-foreground text-sm sm:text-base mt-0.5 leading-tight">
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
