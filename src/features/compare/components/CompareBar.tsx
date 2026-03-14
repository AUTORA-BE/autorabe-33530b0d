/**
 * Floating compare bar – mobile-first, compact & non-intrusive
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

  // Hide on the compare page itself & when empty
  if (compareCount === 0 || location.pathname === "/compare") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[92vw] safe-bottom"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border shadow-elevated rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Compact vehicle pills */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {compareList.map((car) => (
                <motion.div
                  key={car.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="relative group/thumb shrink-0"
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-10 rounded-lg overflow-hidden border border-primary/30 bg-muted">
                    <img
                      src={car.image || "/placeholder.svg"}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFromCompare(car.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm opacity-100 sm:opacity-0 sm:group-hover/thumb:opacity-100 transition-opacity"
                    aria-label={`Retirer ${car.brand} ${car.model}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Compact count badge on mobile, full button on desktop */}
            <Button
              onClick={() => navigate("/compare")}
              disabled={compareCount < 2}
              size="sm"
              className="btn-primary-gradient rounded-xl shrink-0 gap-1.5 h-10 px-3 sm:px-4 text-sm"
            >
              <GitCompareArrows className="w-4 h-4" />
              <span className="hidden sm:inline">Comparer</span>
              <span className="sm:hidden font-bold">{compareCount}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareBar;
