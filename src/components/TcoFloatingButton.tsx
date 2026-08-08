import { Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const TcoFloatingButton = () => {
  const navigate = useNavigate();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => navigate("/calculateur-tco")}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] left-4 md:!bottom-6 md:left-6 z-[60] w-11 h-11 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground shadow-xl shadow-primary/25 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
          aria-label="Calculateur TCO"
        >
          <Calculator className="w-6 h-6 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
            TCO
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        Calculer le coût total de possession
      </TooltipContent>
    </Tooltip>
  );
};

export default TcoFloatingButton;
