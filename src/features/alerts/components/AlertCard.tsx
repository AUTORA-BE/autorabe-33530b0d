/**
 * Card component displaying a single user alert — mobile-optimised
 * @module features/alerts/components
 */
import { memo } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Bell, BellOff } from "lucide-react";
import { useToggleAlert, useDeleteAlert } from "../hooks/useUserAlerts";
import type { UserAlert } from "../hooks/useUserAlerts";

interface AlertCardProps {
  alert: UserAlert;
}

const AlertCard = memo(({ alert }: AlertCardProps) => {
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();

  const filters = alert.filters;
  const criteria = [
    filters.brand && `${filters.brand}${filters.model ? ` ${filters.model}` : ""}`,
    filters.max_price && `≤ ${filters.max_price.toLocaleString("fr-BE")}€`,
    filters.min_year && `${filters.min_year}+`,
    filters.max_km && `≤ ${filters.max_km.toLocaleString("fr-BE")} km`,
    filters.fuel_types?.length && filters.fuel_types.join(", "),
    filters.lez_compatible && "LEZ",
    filters.carpass_verified && "Car-Pass",
  ].filter(Boolean) as string[];

  const frequencyLabel: Record<string, string> = {
    instant: "⚡ Instantané",
    daily: "📅 Quotidien",
    weekly: "📅 Hebdomadaire",
  };

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 transition-opacity duration-200 ${
        !alert.active ? "opacity-60" : ""
      }`}
    >
      {/* Row 1: name + toggle */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-semibold text-foreground text-sm sm:text-base truncate min-w-0">
          {alert.name}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={alert.active}
            onCheckedChange={(checked: boolean) =>
              toggleAlert.mutate({ id: alert.id, active: checked })
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={() => {
              if (confirm("Supprimer cette alerte ?")) {
                deleteAlert.mutate(alert.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Row 2: badges */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <Badge
          variant={alert.active ? "default" : "secondary"}
          className={`text-[11px] px-2 py-0.5 ${alert.active ? "bg-primary/15 text-primary border-primary/20" : ""}`}
        >
          {alert.active ? (
            <><Bell className="w-3 h-3 mr-1" />Active</>
          ) : (
            <><BellOff className="w-3 h-3 mr-1" />Pause</>
          )}
        </Badge>
        <Badge variant="outline" className="text-[11px] px-2 py-0.5">
          {frequencyLabel[alert.frequency] || alert.frequency}
        </Badge>
      </div>

      {/* Row 3: criteria chips */}
      {criteria.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {criteria.map((c, i) => (
            <span
              key={i}
              className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Row 4: meta */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{alert.match_count} notification{alert.match_count !== 1 ? "s" : ""}</span>
        {alert.last_sent_at && (
          <span>Dernière : {new Date(alert.last_sent_at).toLocaleDateString("fr-BE")}</span>
        )}
      </div>
    </div>
  );
});

AlertCard.displayName = "AlertCard";

export default AlertCard;
