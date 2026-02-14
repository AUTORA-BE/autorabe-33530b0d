/**
 * Pricing page for professional seller subscriptions
 * @module pages
 */

import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Rocket, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header, Footer } from '@/shared/components';
import { useSubscription, SUBSCRIPTION_TIERS, FREE_PARTICULIER_LIMIT } from '@/features/subscription';
import { useAuth } from '@/features/auth';
import { useToast } from '@/hooks/use-toast';
import SEOHead from '@/components/SEOHead';

const tierIcons: Record<string, React.ReactNode> = {
  particulier_plus: <User className="h-6 w-6" />,
  starter: <Zap className="h-6 w-6" />,
  pro: <Rocket className="h-6 w-6" />,
  premium: <Crown className="h-6 w-6" />,
};

const particulierTiers = Object.entries(SUBSCRIPTION_TIERS).filter(([, t]) => t.category === 'particulier');
const proTiers = Object.entries(SUBSCRIPTION_TIERS).filter(([, t]) => t.category === 'professionnel');

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

  // Handle Stripe redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({ title: 'Abonnement activé !', description: 'Votre abonnement Pro est maintenant actif.' });
      checkSubscription();
    }
    if (searchParams.get('canceled') === 'true') {
      toast({ title: 'Paiement annulé', description: 'Vous pouvez réessayer à tout moment.', variant: 'destructive' });
    }
  }, [searchParams, toast, checkSubscription]);

  const handleSubscribe = async (priceId: string) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    try {
      await createCheckout(priceId);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de lancer le paiement.', variant: 'destructive' });
    }
  };

  const handleManage = async () => {
    try {
      await openCustomerPortal();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'ouvrir le portail.', variant: 'destructive' });
    }
  };

  return (
    <>
      <SEOHead
        title="Abonnements Vendeurs Pro | AutoRa"
        description="Choisissez votre abonnement vendeur professionnel AutoRa. Publiez vos annonces, obtenez le badge Pro et des statistiques avancées."
      />
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">Tarifs</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Vendez sur AutoRa, simplement
            </h1>
            <p className="text-muted-foreground text-lg">
              Gratuit pour les particuliers jusqu'à {FREE_PARTICULIER_LIMIT} annonces simultanées. Des plans Pro pour les professionnels.
            </p>
          </div>

          {/* Active subscription banner */}
          {subscribed && currentTier && (
            <div className="max-w-md mx-auto mb-10 p-4 rounded-xl border-2 border-primary bg-primary/5 text-center">
              <p className="text-sm text-muted-foreground mb-1">Votre abonnement actuel</p>
              <p className="text-xl font-bold text-foreground">{currentTier.name}</p>
              {subscriptionEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renouvellement le {new Date(subscriptionEnd).toLocaleDateString('fr-BE')}
                </p>
              )}
              <Button variant="outline" size="sm" className="mt-3" onClick={handleManage}>
                <Settings className="h-4 w-4 mr-2" />
                Gérer mon abonnement
              </Button>
            </div>
          )}

          {/* Particulier section */}
          <div className="max-w-lg mx-auto mb-16">
            <h2 className="text-xl font-semibold text-foreground mb-2 text-center">Particulier</h2>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Gratuit jusqu'à {FREE_PARTICULIER_LIMIT} annonces simultanées, sans engagement.
            </p>

            <Card className="border-border">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Gratuit</CardTitle>
                <CardDescription>Jusqu'à {FREE_PARTICULIER_LIMIT} annonces simultanées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-foreground">0€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">Jusqu'à {FREE_PARTICULIER_LIMIT} annonces simultanées gratuitement</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">Messagerie intégrée</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">Aucun engagement</span>
                  </li>
                </ul>

                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center mb-3">
                    Besoin de plus de {FREE_PARTICULIER_LIMIT} annonces ?
                  </p>
                  {particulierTiers.map(([key, tier]) => {
                    const isCurrentPlan = currentTier?.slug === tier.slug;
                    return (
                      <div key={key} className="text-center">
                        <p className="text-lg font-semibold text-foreground mb-2">
                          {tier.price.toFixed(2).replace('.', ',')}€<span className="text-sm text-muted-foreground font-normal">/mois</span>
                        </p>
                        {isCurrentPlan ? (
                          <Button variant="outline" className="w-full" onClick={handleManage}>Gérer</Button>
                        ) : (
                          <Button variant="outline" className="w-full" onClick={() => handleSubscribe(tier.price_id)} disabled={isLoading}>
                            {isLoading ? 'Chargement...' : 'Passer à Particulier+'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pro section */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-2 text-center">Vendeurs Professionnels</h2>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Badge Pro, statistiques avancées et visibilité maximale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {proTiers.map(([key, tier]) => {
              const isCurrentPlan = currentTier?.slug === tier.slug;
              return (
                <Card
                  key={key}
                  className={`relative flex flex-col transition-all duration-200 hover:shadow-lg ${
                    tier.popular ? 'border-primary shadow-md scale-[1.02]' : 'border-border'
                  } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Le plus populaire</Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="secondary">Votre plan</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {tierIcons[key]}
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription>
                      {tier.maxListings ? `${tier.maxListings} annonces simultanées` : 'Annonces simultanées illimitées'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold text-foreground">
                        {tier.price.toFixed(2).replace('.', ',')}€
                      </span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full" onClick={handleManage}>
                        Gérer
                      </Button>
                    ) : (
                      <Button
                        variant={tier.popular ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => handleSubscribe(tier.price_id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Chargement...' : 'Choisir ce plan'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* FAQ / trust */}
          <div className="text-center mt-16 text-muted-foreground text-sm max-w-lg mx-auto">
            <p>Paiement sécurisé par Stripe. Annulez à tout moment depuis votre espace de gestion.</p>
            <p className="mt-2">Tous les prix sont HTVA. La TVA belge de 21% sera appliquée.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
