import { useLanguage } from "@/contexts/LanguageContext";

const cities = [
  { name: "Bruxelles", namNl: "Brussel", cx: 300, cy: 295, color: "hsl(var(--primary))" },
  { name: "Anvers", namNl: "Antwerpen", cx: 280, cy: 155, color: "hsl(25, 95%, 53%)" },
  { name: "Gand", namNl: "Gent", cx: 185, cy: 185, color: "hsl(25, 95%, 53%)" },
];

const LezMapFooter = () => {
  const { language } = useLanguage();

  return (
    <div className="mt-10 p-6 rounded-2xl bg-white/[0.03] border border-white/5">
      <h4 className="font-display font-bold text-white text-sm uppercase tracking-wide mb-4">
        {language === "nl" ? "LEZ-zones in België" : language === "de" ? "LEZ-Zonen in Belgien" : language === "en" ? "LEZ zones in Belgium" : "Zones LEZ en Belgique"}
      </h4>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Realistic Belgium SVG outline */}
        <div className="relative w-[240px] h-[220px] shrink-0">
          <svg viewBox="0 0 520 470" className="w-full h-full" aria-label="Carte LEZ Belgique">
            {/* Realistic Belgium border path */}
            <path
              d="M90,130 L100,120 L115,115 L125,100 L140,90 L155,80 L170,75 L185,72 L195,68 L210,60 L225,55 L240,52 L255,50 L270,48 L285,50 L300,55 L310,60 L320,58 L335,55 L350,52 L365,55 L375,62 L385,70 L395,80 L405,90 L410,102 L415,115 L420,130 L425,145 L428,160 L430,175 L428,190 L425,200 L420,215 L415,228 L408,240 L400,252 L392,262 L385,275 L380,290 L378,305 L375,318 L370,330 L362,340 L350,348 L338,355 L325,360 L312,365 L300,370 L290,378 L280,385 L270,390 L258,395 L245,398 L232,400 L218,398 L205,395 L192,390 L180,382 L168,375 L155,365 L145,355 L135,342 L125,330 L118,318 L112,305 L108,290 L105,275 L100,260 L95,245 L90,230 L85,215 L82,200 L80,185 L78,170 L80,155 L85,142 Z"
              fill="hsl(224,30%,10%)"
              stroke="hsl(0,0%,35%)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Regional borders (Flanders / Wallonia / Brussels) */}
            <path
              d="M95,235 L140,230 L185,225 L220,228 L260,232 L300,238 L340,245 L380,255 L410,268"
              fill="none"
              stroke="hsl(0,0%,25%)"
              strokeWidth="1"
              strokeDasharray="6,4"
              opacity="0.6"
            />

            {/* City markers with pulse */}
            {cities.map((city) => (
              <g key={city.name}>
                <circle cx={city.cx} cy={city.cy} r="22" fill={city.color} opacity="0.12">
                  <animate attributeName="r" values="16;26;16" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0.04;0.15" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx={city.cx} cy={city.cy} r="8" fill={city.color} />
                <circle cx={city.cx} cy={city.cy} r="3.5" fill="white" opacity="0.85" />
                <text
                  x={city.cx}
                  y={city.cy + 22}
                  textAnchor="middle"
                  fill="hsl(0,0%,70%)"
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {language === "nl" ? city.namNl : city.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary shrink-0" />
            <span className="text-gray-400">
              {language === "nl" ? "Toegang toegestaan (Euro 5/6)" : language === "de" ? "Zugang erlaubt (Euro 5/6)" : language === "en" ? "Access allowed (Euro 5/6)" : "Accès autorisé (Euro 5/6)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
            <span className="text-gray-400">
              {language === "nl" ? "Beperkingen / overgang" : language === "de" ? "Einschränkungen / Übergang" : language === "en" ? "Restrictions / transition" : "Restrictions / transition"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            <span className="text-gray-400">
              {language === "nl" ? "Verboden toegang (Euro 0-3)" : language === "de" ? "Zugang verboten (Euro 0-3)" : language === "en" ? "Access prohibited (Euro 0-3)" : "Accès interdit (Euro 0-3)"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            {language === "nl"
              ? "Controleer de LEZ-compatibiliteit van elk voertuig op AutoRA."
              : language === "de"
              ? "Überprüfen Sie die LEZ-Kompatibilität jedes Fahrzeugs auf AutoRA."
              : language === "en"
              ? "Check LEZ compatibility for every vehicle on AutoRA."
              : "Vérifiez la compatibilité LEZ de chaque véhicule sur AutoRA."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LezMapFooter;
