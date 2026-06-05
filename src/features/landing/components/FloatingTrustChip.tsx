import { memo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface FloatingTrustChipProps {
  count: number;
}

const FloatingTrustChip = memo(function FloatingTrustChip({ count }: FloatingTrustChipProps) {
  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-card/70 backdrop-blur-xl border border-primary/30 shadow-lg shadow-black/20"
      aria-label={`${count.toLocaleString("fr-BE")} annonces actives vérifiées`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <span className="text-xs font-light text-foreground whitespace-nowrap">
        <span className="font-medium">{count.toLocaleString("fr-BE")}</span> annonces actives
      </span>
      <span className="h-3 w-px bg-border/50 shrink-0" />
      <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.8} />
      <span className="text-[10px] font-light text-primary whitespace-nowrap">Car-Pass</span>
    </motion.div>
  );
});

export default FloatingTrustChip;
