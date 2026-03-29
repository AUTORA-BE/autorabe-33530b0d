import { Check, FileCheck, Wrench, FileText } from "lucide-react";

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
}

const TransparencyChecklist = ({
  carPassVerified,
  ctValid,
  maintenanceBookComplete,
  compact = false,
}: TransparencyChecklistProps) => {
  const items: ChecklistItem[] = [
    { label: "Car-Pass disponible", icon: FileCheck, checked: carPassVerified },
    { label: "Contrôle Technique valide", icon: FileText, checked: ctValid },
    { label: "Carnet d'entretien complet", icon: Wrench, checked: maintenanceBookComplete },
  ];

  if (compact) {
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
        <span className="text-xs text-muted-foreground font-light">
          {verifiedCount}/3
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/10 p-6 sm:p-8">
      <div className="flex items-center gap-4 mb-7">
        <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="font-serif text-lg sm:text-xl font-light text-foreground tracking-tight">
            Indicateurs de Transparence
          </h2>
          <p className="text-xs text-muted-foreground/60 font-light mt-0.5">
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
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                isChecked
                  ? "bg-primary/5 border border-primary/10"
                  : "bg-muted/30 border border-transparent"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isChecked
                    ? "bg-primary/10"
                    : "bg-muted/50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isChecked ? "text-primary" : "text-muted-foreground/40"
                  }`}
                  strokeWidth={1.5}
                />
              </div>
              <span
                className={`flex-1 text-sm ${
                  isChecked
                    ? "text-foreground font-light"
                    : "text-muted-foreground/50 line-through font-light"
                }`}
              >
                {item.label}
              </span>
              {isChecked ? (
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground/40 font-light tracking-wide">
                  Non fourni
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-[10px] text-muted-foreground/40 text-center leading-relaxed font-light tracking-wide">
        Ces informations sont fournies par le vendeur et n'engagent pas AutoRa.
      </p>
    </div>
  );
};

export default TransparencyChecklist;
