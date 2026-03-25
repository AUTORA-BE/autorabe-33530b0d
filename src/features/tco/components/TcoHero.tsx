/** TCO Calculator Hero section */

import { motion } from 'framer-motion';
import { Car, TrendingDown, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FuelPriceStrip from '@/components/FuelPriceStrip';

interface TcoHeroProps {
  onStart: () => void;
}

const TcoHero = ({ onStart }: TcoHeroProps) => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    {/* Animated mesh background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
    <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-primary/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

    <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
      <motion.div
        initial={{ scale: 0, rotateY: 180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mx-auto mb-8 w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center"
      >
        <Car className="w-10 h-10 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-foreground leading-tight"
      >
        Calculez le <span className="text-primary">VRAI</span> coût
        <br />de votre voiture
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto"
      >
        Données officielles Belgique 2026 • Précision&nbsp;90%
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4"
      >
        <FuelPriceStrip compact />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          size="lg"
          onClick={onStart}
          className="mt-10 h-14 px-10 text-lg font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
        >
          Commencer (gratuit) →
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground"
      >
        {[
          { icon: TrendingDown, text: '50k+ calculs' },
          { icon: ShieldCheck, text: 'Sources SPF' },
          { icon: RefreshCw, text: 'MAJ quotidienne' },
        ].map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 bg-secondary/60 px-3 py-1.5 rounded-full">
            <Icon className="w-3.5 h-3.5 text-primary" />
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  </section>
);

export default TcoHero;
