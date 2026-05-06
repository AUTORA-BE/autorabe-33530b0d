/**
 * Payment success page with visual confirmation and auto-redirect
 * @module pages
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Header, Footer } from '@/shared/components';
import { useSubscription } from '@/features/subscription';
import SEOHead from '@/components/SEOHead';
import { trackEvent, EVENTS } from '@/lib/analytics';

const REDIRECT_DELAY = 8;

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const { checkSubscription } = useSubscription();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkSubscription();
    const type = searchParams.get('type') || 'subscription';
    const tier = searchParams.get('tier') || undefined;
    if (type === 'boost') {
      trackEvent(EVENTS.BOOST_PURCHASED, { tier });
    }
  }, [checkSubscription, searchParams]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="page-gradient">
      <SEOHead title="Paiement confirmé | AutoRA" description="Votre abonnement AutoRA a été activé avec succès." />
      <Header />
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-md w-full mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-3"
          >
            Paiement confirmé !
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mb-8"
          >
            Votre abonnement est maintenant actif. Vous pouvez commencer à publier vos annonces.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <Button onClick={() => navigate('/dashboard')} className="w-full gap-2">
              Accéder à mon espace vendeur
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-sm text-muted-foreground">
              Redirection automatique dans {countdown}s…
            </p>

            {/* Progress bar */}
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: REDIRECT_DELAY, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
