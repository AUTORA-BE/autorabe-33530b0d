/**
 * Card component displaying a single user alert with toggle and delete
 * @module features/alerts/components
 */
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Bell, BellOff, Zap, Calendar } from "lucide-react";
import { useToggleAlert, useDeleteAlert } from "../hooks/useUserAlerts";
import type { UserAlert } from "../hooks/useUserAlerts";

interface AlertCardProps {
  alert: UserAlert;
}

const AlertCard = memo(({ alert }: AlertCardProps) => {
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();

  const filters = alert.filters;
  const criteriaText = [
    filters.brand && `${filters.brand}${filters.model ? ` ${filters.model}` : ""}`,
    filters.max_price && `max ${filters.max_price.toLocaleString("fr-BE")}€`,
    filters.min_year && `${filters.min_year}+`,
    filters.max_km && `max ${filters.max_km.toLocaleString("fr-BE")} km`,
    filters.fuel_types?.length && filters.fuel_types.join(", "),
    filters.lez_compatible && "LEZ OK",
    filters.carpass_verified && "Car-Pass",
  ]
    .filter(Boolean)
    .join(" • ");

  const frequencyLabel = {
    instant: "⚡ Instantané",
    daily: "📅 Quotidien",
    weekly: "📅 Hebdomadaire",
  }[alert.frequency];

  return (
    <Card className={`transition-all duration-200 ${!alert.active ? "opacity-60" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-display text-base font-bold text-foreground truncate">
                {alert.name}
              </h3>
              <Badge
                variant={alert.active ? "default" : "secondary"}
                className={`text-xs ${alert.active ? "bg-primary/15 text-primary" : ""}`}
              >
                {alert.active ? (
                  <><Bell className="w-3 h-3 mr-1" />Active</>
                ) : (
                  <><BellOff className="w-3 h-3 mr-1" />Pause</>
                )}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {frequencyLabel}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{criteriaText || "Tous les véhicules"}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{alert.match_count} notification{alert.match_count !== 1 ? "s" : ""}</span>
              {alert.last_sent_at && (
                <span>
                  Dernière : {new Date(alert.last_sent_at).toLocaleDateString("fr-BE")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={alert.active}
              onCheckedChange={(checked) => toggleAlert.mutate({ id: alert.id, active: checked })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
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
      </CardContent>
    </Card>
  );
});

AlertCard.displayName = "AlertCard";

export default AlertCard;
