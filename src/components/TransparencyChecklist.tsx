import { Check, FileCheck, Wrench, FileText, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface TransparencyChecklistProps {
  carPassVerified?: boolean | null;
  ctValid?: boolean | null;
  maintenanceBookComplete?: boolean | null;
  compact?: boolean;
}

interface ChecklistItem {
  label: string;
  icon: React.ElementType;
  checked: boolean | null | undefined;
  tooltip?: string;
}

const TransparencyChecklist = ({
  carPassVerified,
  ctValid,
  maintenanceBookComplete,
  compact = false,
}: TransparencyChecklistProps) => {
  const items: ChecklistItem[] = [
    {
      label: "Car-Pass vérifié par AutoRa (Contrôle manuel)",
      icon: FileCheck,
      checked: carPassVerified,
      tooltip:
        "L'équipe AutoRa vérifie manuellement chaque certificat Car-Pass fourni par le vendeur avant publication. Garantie de service premium — pas une vérification automatique.",
    },
    { label: "Contrôle Technique valide", icon: FileText, checked: ctValid },
    { label: "Carnet d'entretien complet", icon: Wrench, checked: maintenanceBookComplete },
  ];

  if (compact) {
    // Compact version for CarCard
    const verifiedCount = items.filter((item) => item.checked).length;
    if (verifiedCount === 0) return null;

    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {items.map((item, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                item.checked ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {verifiedCount}/3
        </span>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Indicateurs de Transparence
          </h2>
          <p className="text-sm text-muted-foreground">
            Informations fournies par le vendeur
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isChecked = item.checked === true;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isChecked
                  ? "bg-primary/10"
                  : "bg-muted/50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isChecked
                    ? "bg-primary/20"
                    : "bg-muted"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isChecked ? "text-primary" : "text-muted-foreground/50"
                  }`}
                />
              </div>
              <span
                className={`flex-1 flex items-center gap-1.5 ${
                  isChecked
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/70 line-through"
                }`}
              >
                {item.label}
                {item.tooltip && isChecked && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info
                          className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-primary cursor-help shrink-0"
                          aria-label="Plus d'info"
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                        {item.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
              {isChecked ? (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Info non fournie
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Le Car-Pass est vérifié manuellement par AutoRa avant publication. Les autres indicateurs (CT, carnet d'entretien) sont déclarés par le vendeur.
      </p>
    </div>
  );
};

export default TransparencyChecklist;
