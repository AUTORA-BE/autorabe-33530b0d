/**
 * Payment canceled page with clear message and return to pricing
 * @module pages
 */

import { XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Header, Footer } from '@/shared/components';
import SEOHead from '@/components/SEOHead';

export default function PaymentCanceled() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Paiement annulé | AutoRa" description="Votre paiement a été annulé. Vous pouvez réessayer à tout moment." />
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
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
            className="mx-auto mb-6 h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center"
          >
            <XCircle className="h-12 w-12 text-destructive" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-3"
          >
            Paiement annulé
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mb-8"
          >
            Aucun montant n'a été débité. Vous pouvez réessayer à tout moment ou choisir un autre plan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <Button onClick={() => navigate('/pricing')} className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux tarifs
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-muted-foreground">
              Retour à l'accueil
            </Button>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
