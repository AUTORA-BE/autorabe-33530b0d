import { Building2, User, Shield, AlertCircle } from "lucide-react";

interface SellerBadgeProps {
  sellerType?: string | null;
  sellerName: string;
  tvaNumber?: string | null;
  compact?: boolean;
}

const SellerBadge = ({
  sellerType,
  sellerName,
  tvaNumber,
  compact = false,
}: SellerBadgeProps) => {
  const isProfessional = sellerType === "professionnel";

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl text-xs font-light tracking-wide ${
          isProfessional
            ? "bg-primary/8 text-primary"
            : "bg-muted/50 text-muted-foreground"
        }`}
      >
        {isProfessional ? (
          <>
            <Building2 className="w-3 h-3" strokeWidth={1.5} />
            Pro
          </>
        ) : (
          <>
            <User className="w-3 h-3" strokeWidth={1.5} />
            Particulier
          </>
        )}
      </span>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-secondary/20 border border-border/10">
      {/* Seller Type Badge */}
      <div className="flex items-center gap-2 mb-3">
        {isProfessional ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-light tracking-wide bg-primary/8 text-primary">
            <Building2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Vendeur Pro
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-light tracking-wide bg-muted/40 text-muted-foreground">
            <User className="w-3.5 h-3.5" strokeWidth={1.5} />
            Particulier
          </span>
        )}
      </div>

      {/* Seller Name */}
      <p className="font-light text-foreground tracking-tight">{sellerName}</p>

      {/* Professional Info */}
      {isProfessional && (
        <div className="mt-4 space-y-2">
          {tvaNumber && (
            <p className="text-sm text-muted-foreground font-light">
              TVA : {tvaNumber}
            </p>
          )}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-primary/5 border border-primary/10">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <p className="text-sm text-primary font-light">
              Garantie légale 12 mois incluse
            </p>
          </div>
        </div>
      )}

      {/* Private Seller Info */}
      {!isProfessional && (
        <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-muted/20 border border-border/10">
          <AlertCircle className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground/60 font-light">
            Vente privée (sans garantie légale)
          </p>
        </div>
      )}
    </div>
  );
};

export default SellerBadge;
