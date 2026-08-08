/**
 * Floating compare bar – mobile-first, sits above other FABs
 * @module features/compare/components/CompareBar
 */
import { useCompareContext } from "../context/CompareContext";
import { useNavigate, useLocation } from "react-router-dom";
import { X, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CompareBar = () => {
  const { compareList, removeFromCompare, compareCount } = useCompareContext();
  const navigate = useNavigate();
  const location = useLocation();

  if (compareCount === 0 || location.pathname === "/compare") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] sm:!bottom-6 left-1/2 -translate-x-1/2 z-[55] safe-bottom"
      >
        <div className="flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border shadow-elevated rounded-full pl-2 pr-1.5 py-1.5 sm:pl-3 sm:pr-2 sm:py-2">
          {/* Vehicle thumbnails – pill layout */}
          {compareList.map((car) => (
            <motion.div
              key={car.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative shrink-0"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-primary/40 bg-muted">
                <img
                  src={car.image || "/placeholder.svg"}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeFromCompare(car.id)}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                aria-label={`Retirer ${car.brand} ${car.model}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </motion.div>
          ))}

          {/* CTA */}
          <Button
            onClick={() => navigate("/compare")}
            disabled={compareCount < 2}
            size="sm"
            className="btn-primary-gradient rounded-full shrink-0 gap-1 h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-4"
          >
            <GitCompareArrows className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Comparer</span>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareBar;
