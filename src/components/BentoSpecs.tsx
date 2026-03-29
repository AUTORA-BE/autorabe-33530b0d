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

  // Build secondary pills
  const details: { icon: React.ElementType; label: string; value: string }[] = [];
  if (power) details.push({ icon: Zap, label: "Puissance", value: formatPower(power) });
  if (euroNorm) details.push({ icon: Leaf, label: "Norme Euro", value: euroNorm });
  if (color) details.push({ icon: Palette, label: "Couleur", value: color });
  if (bodyType) details.push({ icon: Car, label: "Carrosserie", value: bodyType });
  if (doors) details.push({ icon: DoorOpen, label: "Portes", value: `${doors}` });

  return (
    <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/10 p-5 sm:p-8">
      <h2 className="font-serif text-base sm:text-xl font-light text-foreground mb-5 sm:mb-7 tracking-tight">
        Caractéristiques
      </h2>

      <div className="grid grid-cols-6 gap-2.5 sm:gap-3 auto-rows-auto">

        {/* ── Location — spans full width, hero tile ── */}
        {location && (
          <div
            className="col-span-6 group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-primary/5 p-4 sm:p-6 cursor-default transition-colors hover:bg-primary/8"
          >
            <MapPin className="absolute -bottom-4 -right-4 w-20 h-20 text-primary/[0.04]" strokeWidth={1} />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60 font-light">
                  Localisation
                </p>
                <p className="font-light text-foreground text-sm sm:text-lg leading-tight tracking-tight">{location}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Year — tall left tile ── */}
        <div
          className="col-span-3 row-span-2 group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-secondary/30 p-4 sm:p-6 cursor-default flex flex-col justify-between min-h-[110px] sm:min-h-[140px] transition-colors hover:bg-secondary/40"
        >
          <Calendar className="absolute -bottom-3 -right-3 w-16 h-16 text-primary/[0.03]" strokeWidth={1} />
          <div className="relative z-10">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary/8 flex items-center justify-center mb-3 sm:mb-4">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60 font-light">
              Année
            </p>
          </div>
          <p className="relative z-10 font-serif font-light text-foreground text-2xl sm:text-3xl leading-tight tracking-tight">
            {year}
          </p>
        </div>

        {/* ── Mileage — right top ── */}
        <div
          className="col-span-3 group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-secondary/30 p-4 sm:p-5 cursor-default transition-colors hover:bg-secondary/40"
        >
          <Gauge className="absolute -bottom-2 -right-2 w-12 h-12 text-primary/[0.03]" strokeWidth={1} />
          <div className="relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/8 flex items-center justify-center mb-2 sm:mb-3">
              <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-light">
              Kilométrage
            </p>
            <p className="font-light text-foreground text-sm sm:text-base mt-0.5 leading-tight">
              {formatMileage(mileage)}
            </p>
          </div>
        </div>

        {/* ── Fuel + Transmission ── */}
        {[
          { icon: Fuel, label: "Carburant", value: fuelType },
          { icon: Settings2, label: "Boîte", value: transmission },
        ].map((spec) => {
          const Icon = spec.icon;
          return (
            <div
              key={spec.label}
              className="col-span-3 group relative overflow-hidden rounded-2xl bg-secondary/20 p-4 cursor-default transition-colors hover:bg-secondary/30"
            >
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-light leading-none">
                    {spec.label}
                  </p>
                  <p className="font-light text-foreground text-xs mt-1 leading-tight break-words">
                    {spec.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Extra details ── */}
        {details.map((spec, i) => {
          const Icon = spec.icon;
          const isWide = i === 0 && details.length % 2 !== 0;
          return (
            <div
              key={spec.label}
              className={`${isWide ? "col-span-6" : "col-span-3"} group flex items-center gap-3 rounded-2xl bg-secondary/15 px-4 py-3 cursor-default transition-colors hover:bg-secondary/25`}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-light leading-none">
                  {spec.label}
                </p>
                <p className="font-light text-foreground text-xs mt-1 leading-tight break-words">
                  {spec.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BentoSpecs;
