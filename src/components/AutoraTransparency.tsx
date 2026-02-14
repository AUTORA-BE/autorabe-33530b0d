import { motion } from "framer-motion";
import { FileCheck, ClipboardCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AutoraTransparencyProps {
  carPassVerified?: boolean | null;
  ctValid?: boolean | null;
}

const AutoraTransparency = ({ carPassVerified, ctValid }: AutoraTransparencyProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-4 rounded-2xl bg-secondary/50 border border-border"
    >
      <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
        <FileCheck className="w-4 h-4 text-primary" />
        Transparence Autora
      </h3>

      <div className="space-y-2">
        {/* Car-Pass */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-background/50">
          {carPassVerified ? (
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className={`text-sm font-medium ${carPassVerified ? "text-foreground" : "text-muted-foreground"}`}>
              Car-Pass
            </p>
            <p className="text-xs text-muted-foreground">
              {carPassVerified ? "Document disponible" : "Non vérifié"}
            </p>
          </div>
        </div>

        {/* Contrôle Technique */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-background/50">
          {ctValid ? (
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className={`text-sm font-medium ${ctValid ? "text-foreground" : "text-muted-foreground"}`}>
              Contrôle Technique
            </p>
            <p className="text-xs text-muted-foreground">
              {ctValid ? "Valide" : "Non vérifié"}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
        Informations déclaratives sous la responsabilité du vendeur.
      </p>
    </motion.div>
  );
};

export default AutoraTransparency;
