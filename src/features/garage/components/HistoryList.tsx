/**
 * Vehicle list with relative-time badges, used in the Garage history tab.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock, History } from "lucide-react";
import { CarCard } from "@/features/listings";
import { useFavorites } from "@/features/favorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedVehicleHref } from "@/lib/useLocalizedHref";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useViewHistory, useClearViewHistory, formatRelativeTime } from "@/features/garage";
import type { Language } from "@/contexts/LanguageContext";

interface HistoryListProps {
  enabled: boolean;
}

export function HistoryList({ enabled }: HistoryListProps) {
  const navigate = useNavigate();
  const vehicleHref = useLocalizedVehicleHref();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t, language } = useLanguage();
  const { data: items = [], isLoading } = useViewHistory(enabled);
  const clearMutation = useClearViewHistory();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[16/10] rounded-[20px] bg-card/60 backdrop-blur-sm border border-border/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring" }}
        className="text-center py-16"
      >
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 flex items-center justify-center">
            <History className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          {t("garage.history.empty")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-8">
          {t("garage.history.emptyDescription")}
        </p>
        <Button
          onClick={() => navigate("/")}
          className="rounded-full px-8 py-3 bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform"
        >
          {t("favorites.discover")}
        </Button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {items.length} {t("garage.history.itemsLabel")}
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              disabled={clearMutation.isPending}
            >
              {t("garage.history.clear")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("garage.history.clearConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("garage.history.clearConfirm")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => clearMutation.mutate()}>
                {t("garage.history.clear")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-5">
        <AnimatePresence mode="popLayout">
          {items.map((car, i) => (
            <motion.div
              key={car.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), type: "spring", stiffness: 300, damping: 30 }}
              className="relative"
            >
              <CarCard
                car={car}
                isFavorite={isFavorite(car.id)}
                onToggleFavorite={toggleFavorite}
                onClick={(id) => navigate(vehicleHref({ ...car, id }))}
              />
              <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-md border border-border/40 text-[10px] font-medium text-foreground/80">
                <Clock className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                {formatRelativeTime(car.lastViewedAt, language as Language)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default HistoryList;
