/**
 * LEZBelgiumMap — premium interactive Belgium map showing LEZ zones
 * Features: hover tooltips, Framer Motion animations, responsive design
 * @module features/lez/components
 */

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {  Shield, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

/** LEZ zone data with i18n labels and tooltip details */
interface LEZZone {
  id: string;
  nameFr: string;
  nameNl: string;
  color: string;
  glowColor: string;
  cx: number;
  cy: number;
  statusFr: string;
  statusNl: string;
  detailFr: string;
  detailNl: string;
  euroNorm: string;
}

const LEZ_ZONES: LEZZone[] = [
  {
    id: "brussels",
    nameFr: "Bruxelles",
    nameNl: "Brussel",
    color: "hsl(0, 72%, 51%)",
    glowColor: "rgba(239,68,68,0.3)",
    cx: 300,
    cy: 285,
    statusFr: "Zone stricte — Diesel Euro 5 interdit",
    statusNl: "Strikte zone — Diesel Euro 5 verboden",
    detailFr: "Dès 2025 : Diesel Euro 5 interdit. 2028 : Diesel Euro 6 interdit.",
    detailNl: "Vanaf 2025: Diesel Euro 5 verboden. 2028: Diesel Euro 6 verboden.",
    euroNorm: "Euro 6d+",
  },
  {
    id: "antwerp",
    nameFr: "Anvers",
    nameNl: "Antwerpen",
    color: "hsl(25, 95%, 53%)",
    glowColor: "rgba(249,115,22,0.3)",
    cx: 280,
    cy: 148,
    statusFr: "Zone en transition — Diesel Euro 4 interdit",
    statusNl: "Overgangszone — Diesel Euro 4 verboden",
    detailFr: "2025 : Diesel Euro 4 interdit. 2028 : Diesel Euro 5 interdit.",
    detailNl: "2025: Diesel Euro 4 verboden. 2028: Diesel Euro 5 verboden.",
    euroNorm: "Euro 5+",
  },
  {
    id: "ghent",
    nameFr: "Gand",
    nameNl: "Gent",
    color: "hsl(25, 95%, 53%)",
    glowColor: "rgba(249,115,22,0.3)",
    cx: 185,
    cy: 178,
    statusFr: "Zone en transition — Intra-R40",
    statusNl: "Overgangszone — Intra-R40",
    detailFr: "2025 : Diesel Euro 4 interdit dans le centre (intra-R40).",
    detailNl: "2025: Diesel Euro 4 verboden in het centrum (intra-R40).",
    euroNorm: "Euro 5+",
  },
];

/** Realistic Belgium SVG outline */
const BelgiumSVG = memo(function BelgiumSVG({
  hoveredZone,
  onHover,
  onLeave,
}: {
  hoveredZone: string | null;
  onHover: (id: string) => void;
  onLeave: () => void;
}) {
  return (
    <svg
      viewBox="0 0 520 470"
      className="w-full h-full"
      role="img"
      aria-label="Carte interactive des zones LEZ en Belgique"
    >
      <defs>
        {LEZ_ZONES.map((zone) => (
          <radialGradient key={`glow-${zone.id}`} id={`glow-${zone.id}`}>
            <stop offset="0%" stopColor={zone.color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={zone.color} stopOpacity="0" />
          </radialGradient>
        ))}
        <filter id="map-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Belgium country outline */}
      <path
        d="M90,130 L100,120 L115,115 L125,100 L140,90 L155,80 L170,75 L185,72 L195,68 L210,60 L225,55 L240,52 L255,50 L270,48 L285,50 L300,55 L310,60 L320,58 L335,55 L350,52 L365,55 L375,62 L385,70 L395,80 L405,90 L410,102 L415,115 L420,130 L425,145 L428,160 L430,175 L428,190 L425,200 L420,215 L415,228 L408,240 L400,252 L392,262 L385,275 L380,290 L378,305 L375,318 L370,330 L362,340 L350,348 L338,355 L325,360 L312,365 L300,370 L290,378 L280,385 L270,390 L258,395 L245,398 L232,400 L218,398 L205,395 L192,390 L180,382 L168,375 L155,365 L145,355 L135,342 L125,330 L118,318 L112,305 L108,290 L105,275 L100,260 L95,245 L90,230 L85,215 L82,200 L80,185 L78,170 L80,155 L85,142 Z"
        fill="hsl(224,30%,12%)"
        stroke="hsl(0,0%,30%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#map-shadow)"
      />

      {/* Flanders / Wallonia border */}
      <path
        d="M95,235 L140,230 L185,225 L220,228 L260,232 L300,238 L340,245 L380,255 L410,268"
        fill="none"
        stroke="hsl(0,0%,22%)"
        strokeWidth="1"
        strokeDasharray="6,4"
        opacity="0.5"
      />

      {/* Free zone label */}
      <text
        x="260"
        y="400"
        textAnchor="middle"
        fill="hsl(142,71%,45%)"
        fontSize="11"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
        opacity="0.5"
      >
        ACCÈS LIBRE
      </text>

      {/* City zones with interaction */}
      {LEZ_ZONES.map((zone) => {
        const isHovered = hoveredZone === zone.id;
        return (
          <g
            key={zone.id}
            onMouseEnter={() => onHover(zone.id)}
            onMouseLeave={onLeave}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={zone.nameFr}
            onFocus={() => onHover(zone.id)}
            onBlur={onLeave}
          >
            {/* Glow ring */}
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={isHovered ? 34 : 24}
              fill={`url(#glow-${zone.id})`}
              style={{ transition: "r 0.3s ease" }}
            >
              <animate
                attributeName="r"
                values={isHovered ? "30;38;30" : "18;28;18"}
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.2;0.06;0.2"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Main dot */}
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={isHovered ? 10 : 8}
              fill={zone.color}
              style={{ transition: "r 0.2s ease, filter 0.2s ease", filter: isHovered ? `drop-shadow(0 0 8px ${zone.glowColor})` : "none" }}
            />

            {/* Inner white dot */}
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={isHovered ? 4 : 3.5}
              fill="white"
              opacity="0.9"
              style={{ transition: "r 0.2s ease" }}
            />
          </g>
        );
      })}
    </svg>
  );
});

/** Tooltip content for a hovered zone */
const ZoneTooltip = memo(function ZoneTooltip({
  zone,
  isNl,
}: {
  zone: LEZZone;
  isNl: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute left-0 right-0 -top-2 -translate-y-full z-20 pointer-events-none"
    >
      <div className="mx-auto max-w-[280px] bg-popover/95 backdrop-blur-md border border-border/50 rounded-xl p-3.5 shadow-2xl">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: zone.color }}
          />
          <span className="font-semibold text-sm text-foreground">
            {isNl ? zone.nameNl : zone.nameFr}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-medium mb-1.5">
          {isNl ? zone.statusNl : zone.statusFr}
        </p>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
          {isNl ? zone.detailNl : zone.detailFr}
        </p>
        <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-primary font-semibold">
            {isNl ? "Vereist" : "Requis"} : {zone.euroNorm}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

/** Main exported component */
const LEZBelgiumMap = memo(function LEZBelgiumMap() {
  const { language } = useLanguage();
  const isNl = language === "nl";
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const handleHover = useCallback((id: string) => setHoveredZone(id), []);
  const handleLeave = useCallback(() => setHoveredZone(null), []);

  const hoveredData = LEZ_ZONES.find((z) => z.id === hoveredZone) ?? null;

  return (
    <div className="mt-10 sm:mt-14">
      {/* Section header */}
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary/70 font-semibold mb-2">
          LEZ Compliance Engine
        </p>
        <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white">
          {isNl ? "Sereen rijden in België" : "Rouler sereinement en Belgique"}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
          {isNl
            ? "Elke advertentie op AutoRA toont duidelijk de LEZ-compatibiliteit. Geen verrassingen."
            : "Chaque annonce sur AutoRA affiche clairement la compatibilité LEZ. Aucune surprise."}
        </p>
      </div>

      {/* Map card */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5 ring-1 ring-white/[0.03]">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* Map */}
          <div className="relative w-full max-w-[260px] sm:max-w-[280px] shrink-0">
            <AnimatePresence>
              {hoveredData && <ZoneTooltip zone={hoveredData} isNl={isNl} />}
            </AnimatePresence>
            <BelgiumSVG
              hoveredZone={hoveredZone}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          </div>

          {/* Legend + CTA */}
          <div className="flex-1 space-y-4 sm:space-y-5 w-full">
            {/* Legend items */}
            <div className="space-y-2.5">
              {[
                {
                  color: "bg-green-500",
                  labelFr: "Accès libre (Euro 5/6)",
                  labelNl: "Vrije toegang (Euro 5/6)",
                },
                {
                  color: "bg-amber-500",
                  labelFr: "Restrictions / transition (Anvers, Gand)",
                  labelNl: "Beperkingen / overgang (Antwerpen, Gent)",
                },
                {
                  color: "bg-red-500",
                  labelFr: "Zone stricte (Bruxelles)",
                  labelNl: "Strikte zone (Brussel)",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {isNl ? item.labelNl : item.labelFr}
                  </span>
                </div>
              ))}
            </div>

            {/* Trust message */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-[11px] sm:text-xs text-primary/80 leading-relaxed">
                <Shield className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-primary" />
                {isNl
                  ? "Alle advertenties op AutoRA zijn compatibel of duidelijk gemarkeerd. Geen onaangename verrassingen."
                  : "Toutes nos annonces sont compatibles ou clairement indiquées. Zéro mauvaise surprise."}
              </p>
            </div>

            {/* CTA button */}
            <Link
              to="/lez-belgique"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs sm:text-sm font-semibold transition-all duration-200 group"
            >
              <Shield className="w-4 h-4" />
              {isNl ? "LEZ-compatibiliteit controleren" : "Vérifier la compatibilité LEZ"}
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

export default LEZBelgiumMap;
