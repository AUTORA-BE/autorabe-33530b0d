import { ShieldCheck } from "lucide-react";

interface AdminBadgeProps {
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * Official "Admin AutoRA" badge — displayed publicly only for verified admin accounts.
 * Visibility is driven by the `is_admin` flag returned by server-side RPCs
 * (`get_seller_display`, `get_public_vitrine`, `get_reviewers_profiles`).
 */
const AdminBadge = ({ size = "sm", className = "" }: AdminBadgeProps) => {
  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2 py-1 gap-1.5",
    md: "text-sm px-3 py-1.5 gap-2",
  } as const;
  const icon = { xs: "w-3 h-3", sm: "w-3.5 h-3.5", md: "w-4 h-4" }[size];

  return (
    <span
      title="Compte officiel AutoRA"
      className={`inline-flex items-center rounded-full font-semibold bg-primary/10 text-primary border border-primary/20 ${sizes[size]} ${className}`}
    >
      <ShieldCheck className={icon} strokeWidth={2} />
      Admin AutoRA
    </span>
  );
};

export default AdminBadge;
