/**
 * Pricing page for professional seller subscriptions
 * @module pages
 */

import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Crown, Rocket, Settings, User, Star, Sparkles, ArrowRight, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header, Footer } from '@/shared/components';
import { useSubscription, SUBSCRIPTION_TIERS, FREE_PARTICULIER_LIMIT } from '@/features/subscription';
import { useAuth } from '@/features/auth';
import { useToast } from '@/hooks/use-toast';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';

const tierIcons: Record<string, React.ReactNode> = {
  particulier_plus: <User className="h-6 w-6" />,
  pro: <Rocket className="h-6 w-6" />,
  premium: <Crown className="h-6 w-6" />,
};

const tierAccents: Record<string, string> = {
  particulier_plus: 'border-border',
  pro: 'border-primary ring-2 ring-primary/20',
  premium: 'border-amber-400 ring-2 ring-amber-400/20',
};

const tierGradients: Record<string, string> = {
  particulier_plus: 'from-muted/50 to-muted/30',
  pro: 'from-primary/10 to-primary/5',
  premium: 'from-amber-500/10 to-amber-400/5',
};

const tierBtnVariants: Record<string, 'default' | 'outline'> = {
  particulier_plus: 'outline',
  pro: 'default',
  premium: 'outline',
};

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const {
    subscribed,
    tier: currentTier,
    subscriptionEnd,
    isLoading,
    createCheckout,
    openCustomerPortal,
    checkSubscription,
  } = useSubscription();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({ title: 'Abonnement activé !', description: 'Votre abonnement est maintenant actif.' });
      checkSubscription();
    }
    if (searchParams.get('canceled') === 'true') {
      toast({ title: 'Paiement annulé', description: 'Vous pouvez réessayer à tout moment.', variant: 'destructive' });
    }
  }, [searchParams, toast, checkSubscription]);

  const handleSubscribe = async (priceId: string) => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    try { await createCheckout(priceId); } catch {
      toast({ title: 'Erreur', description: 'Impossible de lancer le paiement.', variant: 'destructive' });
    }
  };

  const handleManage = async () => {
    try { await openCustomerPortal(); } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'ouvrir le portail.', variant: 'destructive' });
    }
  };

  const paidTiers = Object.entries(SUBSCRIPTION_TIERS);

  return (
    <div className="page-gradient">
      <SEOHead
        title="Abonnements Vendeurs | AutoRa"
        description="Choisissez votre abonnement vendeur AutoRa. Publiez vos annonces, obtenez le badge Pro et des statistiques avancées."
      />
      <Header />
      <main className="min-h-screen pt-28 pb-20">
        <div className="container mx-auto px-4">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              Tarifs simples, sans surprise
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
              Vendez plus,<br />
              <span className="text-primary">vendez mieux.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Commencez gratuitement avec {FREE_PARTICULIER_LIMIT} annonces. Passez Pro quand votre activité décolle.
            </p>
          </motion.div>

          {/* Active subscription banner */}
          {subscribed && currentTier && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto mb-12 p-5 rounded-2xl border-2 border-primary bg-primary/5 text-center"
            >
              <p className="text-sm text-muted-foreground mb-1">Votre abonnement actuel</p>
              <p className="text-2xl font-bold text-foreground">{currentTier.name}</p>
              {subscriptionEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renouvellement le {new Date(subscriptionEnd).toLocaleDateString('fr-BE')}
                </p>
              )}
              <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={handleManage}>
                <Settings className="h-4 w-4 mr-2" />
                Gérer mon abonnement
              </Button>
            </motion.div>
          )}

          {/* Free tier card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="max-w-3xl mx-auto mb-16"
          >
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Gratuit</h2>
                    <p className="text-sm text-muted-foreground">Pour les particuliers</p>
                  </div>
                </div>
                <ul className="space-y-2 mt-4">
                  {[
                    `Jusqu'à ${FREE_PARTICULIER_LIMIT} annonces simultanées`,
                    'Messagerie intégrée',
                    'Aucun engagement, aucune carte requise',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center md:text-right">
                <p className="text-5xl font-extrabold text-foreground">0€</p>
                <p className="text-muted-foreground text-sm mt-1">pour toujours</p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => navigate('/sell')}
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Paid tiers */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {paidTiers.map(([key, tier], idx) => {
              const isCurrentPlan = currentTier?.slug === tier.slug;
              const isPremium = key === 'premium';
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.1, duration: 0.5 }}
                  className={`relative rounded-2xl border bg-card overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${tierAccents[key]} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${tierGradients[key]} px-6 pt-8 pb-6`}>
                    {tier.popular && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-primary text-primary-foreground gap-1">
                          <Star className="h-3 w-3" /> Populaire
                        </Badge>
                      </div>
                    )}
                    {isPremium && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-amber-500 text-white border-0 gap-1">
                          <Zap className="h-3 w-3" /> Performance max
                        </Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary">Votre plan</Badge>
                      </div>
                    )}

                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${isPremium ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                      {tierIcons[key]}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tier.maxListings ? `${tier.maxListings} annonces simultanées` : 'Annonces illimitées'}
                    </p>

                    <div className="mt-5">
                      <span className="text-5xl font-extrabold text-foreground">
                        {tier.price % 1 === 0 ? tier.price : tier.price.toFixed(2).replace('.', ',')}€
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">/mois</span>
                    </div>
                    {tier.price >= 50 && (
                      <p className="text-xs text-muted-foreground mt-1">HTVA · TVA belge 21% applicable</p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="px-6 py-6 flex-1">
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <Check className={`h-4 w-4 mt-0.5 shrink-0 ${isPremium ? 'text-amber-500' : 'text-primary'}`} />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="px-6 pb-6">
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full rounded-xl h-12" onClick={handleManage}>
                        <Settings className="h-4 w-4 mr-2" />
                        Gérer
                      </Button>
                    ) : (
                      <Button
                        variant={isPremium ? 'outline' : tierBtnVariants[key]}
                        className={`w-full rounded-xl h-12 font-semibold ${isPremium ? 'border-amber-500 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400' : ''}`}
                        onClick={() => handleSubscribe(tier.price_id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Chargement...' : 'Choisir ce plan'}
                        {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 mt-16 text-muted-foreground text-sm"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Paiement sécurisé par Stripe
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Annulez à tout moment
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Activation instantanée
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
