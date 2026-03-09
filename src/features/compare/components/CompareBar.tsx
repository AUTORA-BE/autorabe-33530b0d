/**
 * Floating compare bar that appears when vehicles are selected for comparison
 * @module features/compare/components/CompareBar
 */
import { useCompareContext } from "../context/CompareContext";
import { useNavigate } from "react-router-dom";
import { X, GitCompareArrows, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CompareBar = () => {
  const { compareList, removeFromCompare, compareCount } = useCompareContext();
  const navigate = useNavigate();

  if (compareCount === 0) return null;

  const emptySlots = Math.max(0, 3 - compareCount);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-2xl"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-3">
            {/* Vehicle thumbnails */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {compareList.map((car) => (
                <motion.div
                  key={car.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="relative group/thumb shrink-0"
                >
                  <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 border-primary/30 bg-muted">
                    <img
                      src={car.image || "/placeholder.svg"}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFromCompare(car.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-md"
                    aria-label={`Retirer ${car.brand} ${car.model}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center mt-0.5 truncate w-16 sm:w-20">
                    {car.brand} {car.model}
                  </p>
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl border-2 border-dashed border-border flex items-center justify-center shrink-0"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>

            {/* Compare button */}
            <Button
              onClick={() => navigate("/compare")}
              disabled={compareCount < 2}
              className="btn-primary-gradient rounded-xl shrink-0 gap-2"
            >
              <GitCompareArrows className="w-4 h-4" />
              <span className="hidden sm:inline">Comparer</span>
              <span className="sm:hidden">{compareCount}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareBar;
