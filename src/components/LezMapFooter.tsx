import { useLanguage } from "@/contexts/LanguageContext";

const cities = [
  { name: "Bruxelles", namNl: "Brussel", cx: 148, cy: 115, color: "hsl(var(--primary))" },
  { name: "Anvers", namNl: "Antwerpen", cx: 155, cy: 55, color: "hsl(25, 95%, 53%)" },
  { name: "Gand", namNl: "Gent", cx: 100, cy: 65, color: "hsl(25, 95%, 53%)" },
];

const LezMapFooter = () => {
  const { language } = useLanguage();

  return (
    <div className="mt-10 p-6 rounded-2xl bg-white/[0.03] border border-white/5">
      <h4 className="font-display font-bold text-white text-sm uppercase tracking-wide mb-4">
        {language === "nl" ? "LEZ-zones in België" : language === "de" ? "LEZ-Zonen in Belgien" : language === "en" ? "LEZ zones in Belgium" : "Zones LEZ en Belgique"}
      </h4>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Simplified Belgium SVG */}
        <div className="relative w-[220px] h-[180px] shrink-0">
          <svg viewBox="0 0 280 220" className="w-full h-full" aria-label="Carte LEZ Belgique">
            {/* Belgium outline (simplified) */}
            <path
              d="M50,30 L90,15 L140,10 L190,15 L230,30 L260,60 L255,90 L240,120 L220,140 L200,160 L170,180 L140,190 L110,185 L80,170 L55,145 L35,120 L25,90 L30,60 Z"
              fill="hsl(224,30%,10%)"
              stroke="hsl(0,0%,30%)"
              strokeWidth="1.5"
            />
            {/* City markers with pulse */}
            {cities.map((city) => (
              <g key={city.name}>
                <circle cx={city.cx} cy={city.cy} r="16" fill={city.color} opacity="0.15">
                  <animate attributeName="r" values="12;20;12" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.2;0.05;0.2" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx={city.cx} cy={city.cy} r="6" fill={city.color} />
                <circle cx={city.cx} cy={city.cy} r="3" fill="white" opacity="0.8" />
                <text
                  x={city.cx}
                  y={city.cy + 18}
                  textAnchor="middle"
                  fill="hsl(0,0%,70%)"
                  fontSize="10"
                  fontWeight="600"
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
