import { Building2, User, Shield, AlertCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocalizedHref } from "@/lib/useLocalizedHref";
import AdminBadge from "@/components/AdminBadge";

interface SellerBadgeProps {
  sellerType?: string | null;
  sellerName: string;
  tvaNumber?: string | null;
  compact?: boolean;
  sellerId?: string;
  isAdmin?: boolean;
}

const SellerBadge = ({
  sellerType,
  sellerName,
  tvaNumber,
  compact = false,
  sellerId,
  isAdmin = false,
}: SellerBadgeProps) => {
  const isProfessional = sellerType === "professionnel";
  const localized = useLocalizedHref();

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-2xl text-xs font-medium ${
            isProfessional
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isProfessional ? (
            <>
              <Building2 className="w-3 h-3" />
              Pro
            </>
          ) : (
            <>
              <User className="w-3 h-3" />
              Particulier
            </>
          )}
        </span>
        {isAdmin && <AdminBadge size="xs" />}
      </span>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-secondary/50">
      {/* Seller Type Badge */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {isProfessional ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-semibold bg-primary/10 text-primary">
            <Building2 className="w-4 h-4" />
            Vendeur Pro
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-medium bg-muted text-muted-foreground">
            <User className="w-4 h-4" />
            Particulier
          </span>
        )}
        {isAdmin && <AdminBadge size="sm" />}
      </div>

      {/* Seller Name */}
      <p className="font-semibold text-foreground">{sellerName}</p>

      {/* View profile link */}
      {sellerId && (
        <Link
          to={localized(`/seller/${sellerId}`)}
          className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Voir le profil
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
        </Link>
      )}

      {/* Professional Info */}
      {isProfessional && (
        <div className="mt-3 space-y-2">
          {tvaNumber && (
            <p className="text-sm text-muted-foreground">
              TVA : {tvaNumber}
            </p>
          )}
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-primary font-medium">
              Garantie légale 12 mois incluse
            </p>
          </div>
        </div>
      )}

      {/* Private Seller Info */}
      {!isProfessional && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-2xl bg-muted border border-border">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Vente privée (sans garantie légale)
          </p>
        </div>
      )}
    </div>
  );
};

export default SellerBadge;
