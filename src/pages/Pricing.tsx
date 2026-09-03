/**
 * Pricing page — self-serve plans for private sellers (particuliers) +
 * a single sales-led "Demander votre devis" offer for garages & pros.
 * @module pages
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Settings, User, Star, Sparkles, ArrowRight, Shield, Zap, Building2, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Header, Footer, BackButton } from '@/shared/components';
import { useSubscription, SUBSCRIPTION_TIERS, FREE_TIER_FEATURES } from '@/features/subscription';
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
  cta: 'subscribe' | 'free';
  priceId?: string;
  slug?: string;
}

/** Self-serve plans for private sellers (paid instantly via Stripe). */
const PARTICULIER_CARDS: TierCard[] = [
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
    key: 'particulier',
    name: 'Particulier',
    subtitle: 'Vendeurs réguliers',
    price: '25€',
    priceSuffix: '/mois',
    features: SUBSCRIPTION_TIERS.particulier.features,
    accent: 'border-primary ring-2 ring-primary/20',
    icon: <Zap className="h-5 w-5" />,
    badge: 'Populaire',
    badgeColor: 'bg-primary text-primary-foreground',
    cta: 'subscribe',
    priceId: SUBSCRIPTION_TIERS.particulier.price_id,
    slug: 'particulier',
  },
];

/** Everything a garage / pro gets — bundled, priced on quote. */
const PRO_FEATURES: string[] = [
  'Annonces illimitées adaptées à votre stock',
  'Badge « Vendeur Vérifié » & confiance renforcée',
  'Dashboard Pro complet + statistiques + export CSV',
  'Vitrine de garage dédiée à votre enseigne',
  'Messagerie & support prioritaires',
  'Alertes « Bon Plan » sur les nouveaux leads',
  'API & intégration de stock (DMS) pour les groupes',
  'Account manager dédié & formation de votre équipe',
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
  const [quoteModal, setQuoteModal] = useState(false);

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

    if (card.cta === 'free') {
      return (
        <Button variant="outline" className="w-full rounded-xl h-12" onClick={() => navigate('/sell')}>
          Commencer gratuitement <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      );
    }

    return (
      <Button className="w-full rounded-xl h-12 font-semibold" onClick={() => handleSubscribe(card.priceId!)} disabled={isLoading}>
        {isLoading ? 'Chargement...' : "S'abonner"} {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
      </Button>
    );
  };

  return (
    <div className="page-gradient">
      <SEOHead
        title="Tarifs vendeurs — Particuliers & Garages"
        description="Particuliers : vendez gratuitement ou passez en Boost (20€/mois). Garages & professionnels : une offre sur mesure adaptée à votre volume. Demandez votre devis sur AutoRA."
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
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              Particuliers & professionnels
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
              Le plan idéal pour<br />
              <span className="text-primary">chaque vendeur.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Particulier : lancez-vous en quelques minutes. Garage ou groupe :
              une offre sur mesure adaptée à votre volume.
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

          {/* ─── PARTICULIERS — 2 self-serve cards ─── */}
          <div className="mb-6 text-center">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pour les particuliers
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-16">
            {PARTICULIER_CARDS.map((card, idx) => {
              const isCurrentPlan = currentTier?.slug === card.slug;
              return (
                <motion.div
                  key={card.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className={`relative rounded-2xl border bg-card flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${card.accent} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
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

                  <div className="px-5 pb-5">
                    {renderCta(card)}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ─── GARAGES & PROS — single sales-led card ─── */}
          <div className="mb-6 text-center">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pour les garages & professionnels
            </h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="relative max-w-4xl mx-auto rounded-3xl border-2 border-primary/30 bg-card overflow-hidden"
          >
            {/* Subtle premium glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{ background: 'radial-gradient(120% 80% at 0% 0%, hsl(var(--primary) / 0.10) 0%, transparent 55%)' }}
            />

            <div className="relative grid md:grid-cols-2 gap-0">
              {/* Left — pitch + price + CTA */}
              <div className="p-8 md:p-10 flex flex-col">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Garages & Professionnels</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Du garage indépendant au groupe multi-concessions — une offre
                  construite autour de votre volume et de vos outils.
                </p>

                <div className="mt-6">
                  <span className="text-3xl font-extrabold text-foreground">Sur devis</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tarif adapté à votre stock · sans engagement
                  </p>
                </div>

                <div className="mt-auto pt-8">
                  <Button
                    className="w-full rounded-xl h-12 font-semibold"
                    onClick={() => setQuoteModal(true)}
                  >
                    <CalendarCheck className="h-4 w-4 mr-2" /> Demander votre devis
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-2.5">
                    Réponse sous 24h ouvrables
                  </p>
                </div>
              </div>

              {/* Right — feature list */}
              <div className="p-8 md:p-10 border-t md:border-t-0 md:border-l border-border/50 bg-muted/20">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-4">
                  Tout ce qui est inclus
                </p>
                <ul className="space-y-3">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span className="text-foreground leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 mt-14 text-muted-foreground text-sm"
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

      {/* Quote / pro onboarding modal */}
      <Dialog open={quoteModal} onOpenChange={setQuoteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Demander votre devis</DialogTitle>
            <DialogDescription className="text-center">
              On construit votre offre pro en 3 étapes, sans engagement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Parlez-nous de votre activité</p>
                  <p className="text-xs text-muted-foreground">Volume de stock, type de véhicules, outils utilisés.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Vérification du compte pro</p>
                  <p className="text-xs text-muted-foreground">Numéro TVA, adresse du garage, pièce d'identité du gérant.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Devis personnalisé sous 24h</p>
                  <p className="text-xs text-muted-foreground">Une offre claire adaptée à votre volume, puis activation.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full rounded-xl h-12 font-semibold" onClick={() => { setQuoteModal(false); navigate('/contact?sujet=devis-pro'); }}>
              <CalendarCheck className="h-4 w-4 mr-2" /> Demander mon devis
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setQuoteModal(false)}>
              Plus tard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
