/**
 * Pricing page for seller subscriptions — 5-column comparison layout
 * @module pages
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Crown, Rocket, Settings, User, Star, Sparkles, ArrowRight, Shield, Zap, Building2, Phone, X, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Header, Footer, BackButton } from '@/shared/components';
import { useSubscription, SUBSCRIPTION_TIERS, FREE_PARTICULIER_LIMIT, FREE_TIER_FEATURES } from '@/features/subscription';
import { useAuth } from '@/features/auth';
import { useToast } from '@/hooks/use-toast';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';

interface TierCard {
  key: string;
  name: string;
  subtitle: string;
  price: string;
  priceSuffix: string;
  features: string[];
  accent: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  cta: 'subscribe' | 'verify' | 'contact' | 'free';
  priceId?: string;
  slug?: string;
}

const TIER_CARDS: TierCard[] = [
  {
    key: 'free',
    name: 'Gratuit',
    subtitle: 'Vendeurs occasionnels',
    price: '0€',
    priceSuffix: 'pour toujours',
    features: FREE_TIER_FEATURES,
    accent: 'border-border',
    icon: <User className="h-5 w-5" />,
    cta: 'free',
  },
  {
    key: 'boost',
    name: 'Boost',
    subtitle: 'Vendeurs réguliers',
    price: '20€',
    priceSuffix: '/mois',
    features: SUBSCRIPTION_TIERS.boost.features,
    accent: 'border-blue-500/40 ring-1 ring-blue-500/20',
    icon: <Zap className="h-5 w-5" />,
    cta: 'subscribe',
    priceId: SUBSCRIPTION_TIERS.boost.price_id,
    slug: 'boost',
  },
  {
    key: 'pro',
    name: 'Pro Garage',
    subtitle: 'Garages & professionnels',
    price: '50€',
    priceSuffix: '/mois HTVA',
    features: SUBSCRIPTION_TIERS.pro.features,
    accent: 'border-primary ring-2 ring-primary/20',
    icon: <Rocket className="h-5 w-5" />,
    badge: 'Populaire',
    badgeColor: 'bg-primary text-primary-foreground',
    cta: 'verify',
    priceId: SUBSCRIPTION_TIERS.pro.price_id,
    slug: 'pro',
  },
  {
    key: 'premium',
    name: 'Premium',
    subtitle: 'Performance maximale',
    price: '250€',
    priceSuffix: '/mois HTVA',
    features: SUBSCRIPTION_TIERS.premium.features,
    accent: 'border-amber-400 ring-2 ring-amber-400/20',
    icon: <Crown className="h-5 w-5" />,
    badge: 'Performance max',
    badgeColor: 'bg-amber-500 text-white border-0',
    cta: 'verify',
    priceId: SUBSCRIPTION_TIERS.premium.price_id,
    slug: 'premium',
  },
  {
    key: 'boss',
    name: 'BOSS',
    subtitle: 'Concessions & groupes',
    price: 'Sur mesure',
    priceSuffix: '',
    features: [
      'Multi-concessions',
      'Volume d\'annonces illimité',
      'API & intégration stock DMS',
      'Account manager VIP dédié',
      'Formation équipe incluse',
      'SLA & support contractuel',
      'Tableau de bord groupe',
    ],
    accent: 'border-foreground/20 ring-1 ring-foreground/10',
    icon: <Building2 className="h-5 w-5" />,
    cta: 'contact',
  },
];

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
  const [verifyModal, setVerifyModal] = useState(false);

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

  const renderCta = (card: TierCard) => {
    const isCurrentPlan = currentTier?.slug === card.slug;

    if (isCurrentPlan) {
      return (
        <Button variant="outline" className="w-full rounded-xl h-12" onClick={handleManage}>
          <Settings className="h-4 w-4 mr-2" /> Gérer mon plan
        </Button>
      );
    }

    switch (card.cta) {
      case 'free':
        return (
          <Button variant="outline" className="w-full rounded-xl h-12" onClick={() => navigate('/sell')}>
            Commencer gratuitement <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        );
      case 'subscribe':
        return (
          <Button className="w-full rounded-xl h-12 font-semibold" onClick={() => handleSubscribe(card.priceId!)} disabled={isLoading}>
            {isLoading ? 'Chargement...' : "S'abonner"} {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        );
      case 'verify':
        return (
          <Button
            variant="outline"
            className="w-full rounded-xl h-12 font-semibold border-primary text-primary hover:bg-primary/10"
            onClick={() => setVerifyModal(true)}
          >
            <CalendarCheck className="h-4 w-4 mr-2" /> Demander une vérification
          </Button>
        );
      case 'contact':
        return (
          <Button variant="outline" className="w-full rounded-xl h-12 font-semibold" onClick={() => navigate('/contact')}>
            <Phone className="h-4 w-4 mr-2" /> Nous contacter
          </Button>
        );
    }
  };

  return (
    <div className="page-gradient">
      <SEOHead
        title="Tarifs & Abonnements vendeurs"
        description="Comparez les 5 offres AutoRa : Gratuit, Boost (20€/mois), Pro Garage (50€), Premium (250€) et BOSS (sur mesure). Vendez vos voitures en Belgique avec le plan idéal."
        url="https://autora.be/pricing"
      />
      <Header />
      <main className="min-h-screen pt-28 pb-20">
        <div className="container mx-auto px-4">
          <BackButton to="/" className="mb-4" />

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              5 formules pour chaque profil
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
              Le plan idéal pour<br />
              <span className="text-primary">chaque vendeur.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Du particulier occasionnel au groupe automobile, trouvez l'offre qui vous correspond.
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

          {/* ─── 5 TIER GRID ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 max-w-[1400px] mx-auto mb-16">
            {TIER_CARDS.map((card, idx) => {
              const isCurrentPlan = currentTier?.slug === card.slug;
              return (
                <motion.div
                  key={card.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  className={`relative rounded-2xl border bg-card flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${card.accent} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {/* Badge */}
                  {card.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className={`${card.badgeColor} gap-1 shadow-sm`}>
                        <Star className="h-3 w-3" /> {card.badge}
                      </Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="text-[10px]">Actif</Badge>
                    </div>
                  )}

                  {/* Header */}
                  <div className="px-5 pt-7 pb-4">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3 text-muted-foreground">
                      {card.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{card.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-foreground">{card.price}</span>
                      {card.priceSuffix && <span className="text-muted-foreground text-sm ml-1">{card.priceSuffix}</span>}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="px-5 py-4 flex-1 border-t border-border/50">
                    <ul className="space-y-2.5">
                      {card.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                          <span className="text-foreground leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5">
                    {renderCta(card)}
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
            className="flex flex-wrap justify-center gap-8 mt-8 text-muted-foreground text-sm"
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

      {/* Verification modal for Pro / Premium / BOSS */}
      <Dialog open={verifyModal} onOpenChange={setVerifyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Vérification requise</DialogTitle>
            <DialogDescription className="text-center">
              Pour garantir la sécurité et la confiance sur AutoRa, les comptes professionnels sont vérifiés manuellement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Prenez rendez-vous</p>
                  <p className="text-xs text-muted-foreground">Notre équipe vous contactera pour fixer un créneau de 15 minutes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Vérification des documents</p>
                  <p className="text-xs text-muted-foreground">Numéro TVA, adresse du garage, pièce d'identité du gérant.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Activation du compte</p>
                  <p className="text-xs text-muted-foreground">Votre abonnement est activé sous 24-48h après validation.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full rounded-xl h-12 font-semibold" onClick={() => { setVerifyModal(false); navigate('/contact'); }}>
              <CalendarCheck className="h-4 w-4 mr-2" /> Prendre rendez-vous
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setVerifyModal(false)}>
              Plus tard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
