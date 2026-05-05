import { Header, Footer } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

const renderBody = (body: string) =>
  body.split("\n").map((line, i) => {
    const html = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener noreferrer">$1</a>');
    return line.trim() === "" ? (
      <br key={i} />
    ) : (
      <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: html }} />
    );
  });

const fr = {
  title: "Conditions Générales de Vente",
  subtitle: "Abonnements et services payants — Version mai 2026",
  intro: `Les présentes Conditions Générales de Vente (ci-après « CGV ») s'appliquent à tous les achats de services payants effectués sur la plateforme AutoRA.be (ci-après « AutoRA »), exploitée par [Nom / Société — à compléter], [adresse — à compléter], Belgique.

Les présentes CGV constituent le contrat conclu entre AutoRA et l'acheteur. Elles prévalent sur tout document de l'acheteur.`,
  sections: [
    {
      title: "1. Offres et services",
      body: `AutoRA propose les services payants suivants :

**Annonce boost** : mise en avant d'une annonce spécifique dans les résultats de recherche pendant une durée déterminée.
**Abonnement Professionnel** : accès à des fonctionnalités avancées pour les vendeurs professionnels (quota d'annonces, statistiques, badge pro, etc.).

Les caractéristiques détaillées et les prix de chaque offre sont disponibles sur la page https://autora.be/pricing.

Les prix sont indiqués en euros (EUR), toutes taxes comprises (TTC) pour les consommateurs belges. Pour les clients professionnels assujettis à la TVA, la TVA belge applicable sera mentionnée sur la facture.`,
    },
    {
      title: "2. Processus de commande",
      body: `**2.1 Étapes**
Pour souscrire à un service payant, l'utilisateur doit :
1. Être connecté à son compte AutoRA ;
2. Sélectionner l'offre souhaitée ;
3. Vérifier les caractéristiques et le prix récapitulés avant paiement ;
4. Renseigner ses coordonnées de paiement via Stripe ;
5. Confirmer la commande.

**2.2 Confirmation**
Un email de confirmation est envoyé à l'adresse associée au compte dans les minutes suivant le paiement. Cet email constitue la preuve de la transaction.

**2.3 Facture**
Une facture électronique est disponible dans l'espace client pour chaque transaction.`,
    },
    {
      title: "3. Paiement",
      body: `**3.1 Prestataire**
Les paiements sont traités par **Stripe, Inc.** (354 Oyster Point Blvd, South San Francisco, CA 94080, États-Unis), certifié PCI DSS niveau 1. AutoRA n'accède jamais à vos coordonnées bancaires complètes.

**3.2 Moyens de paiement acceptés**
— Carte bancaire (Visa, Mastercard, American Express)
— Bancontact

**3.3 Sécurité**
Toutes les transactions sont sécurisées par chiffrement TLS. Les cartes sont tokenisées par Stripe.

**3.4 Renouvellement automatique (abonnements)**
Les abonnements sont renouvelés automatiquement à l'échéance, sauf résiliation préalable. Le montant du renouvellement correspond au tarif en vigueur au moment du renouvellement. Vous serez notifié par email 7 jours avant le renouvellement.`,
    },
    {
      title: "4. Droit de rétractation",
      body: `**4.1 Principe**
Conformément à l'article VI.47 du Code de droit économique belge (transposant la directive 2011/83/UE), le consommateur dispose d'un délai de **14 jours calendrier** à compter de la conclusion du contrat pour exercer son droit de rétractation, sans avoir à justifier sa décision ni à payer de pénalité.

**4.2 Exercice du droit**
Pour exercer votre droit de rétractation, vous devez notifier AutoRA par email à autoracontact@gmail.com en indiquant clairement votre intention de vous rétracter. Vous pouvez utiliser le modèle de formulaire ci-dessous.

**4.3 Exceptions**
Conformément à l'article VI.53 du Code de droit économique, le droit de rétractation ne s'applique pas aux :
— Contenus numériques fournis sur un support immatériel dont l'exécution a commencé avec l'accord préalable exprès du consommateur et sa renonciation expresse à son droit de rétractation ;
— Services pleinement exécutés avant la fin du délai de rétractation, avec l'accord préalable exprès du consommateur.

En acceptant les présentes CGV et en initiant immédiatement le service (boost activé sur l'annonce), vous reconnaissez renoncer expressément à votre droit de rétractation pour les services de mise en avant dont l'exécution est immédiate.

**4.4 Modèle de formulaire de rétractation**
À envoyer à autoracontact@gmail.com :
« Je/Nous vous notifie/notifions par la présente ma/notre rétractation du contrat portant sur [service acheté], commandé le [date], sous le numéro de transaction [ID Stripe]. Nom : [votre nom]. Date : [date]. »

**4.5 Remboursement**
En cas de rétractation valide, AutoRA procède au remboursement dans les 14 jours suivant réception de la notification, par le même moyen de paiement que celui utilisé lors de la transaction initiale.`,
    },
    {
      title: "5. Durée et résiliation des abonnements",
      body: `**5.1 Durée**
Les abonnements sont souscrits pour une durée d'un mois (ou un an selon l'offre choisie), renouvelables automatiquement.

**5.2 Résiliation par l'utilisateur**
L'utilisateur peut résilier son abonnement à tout moment depuis son espace client (Paramètres → Abonnement → Résilier). La résiliation prend effet à la fin de la période en cours, sans remboursement du prorata non consommé, sauf disposition légale contraire.

**5.3 Résiliation par AutoRA**
AutoRA peut résilier un abonnement avec remboursement au prorata en cas de fermeture du service, ou sans remboursement en cas de violation grave des CGU par l'utilisateur.`,
    },
    {
      title: "6. Garanties et responsabilité",
      body: `**6.1 Obligation de moyens**
AutoRA s'engage à mettre en ligne les services souscrits dans les délais annoncés. En cas de défaillance technique imputable à AutoRA empêchant l'exécution du service pendant plus de 24h consécutives, un avoir équivalent sera proposé.

**6.2 Limitation de responsabilité**
La responsabilité d'AutoRA est limitée au montant payé pour le service concerné au cours des 12 derniers mois. AutoRA n'est pas responsable des pertes indirectes (manque à gagner, perte de clientèle).

**6.3 Force majeure**
AutoRA ne peut être tenue responsable de l'inexécution de ses obligations en cas de force majeure, conformément à l'article 7.1.1 du nouveau Code civil belge.`,
    },
    {
      title: "7. Facturation et TVA",
      body: `Les utilisateurs professionnels (vendeurs déclarés comme professionnels lors de l'inscription) peuvent renseigner leur numéro de TVA intracommunautaire pour bénéficier du mécanisme d'autoliquidation applicable aux services B2B.

Les factures sont disponibles au format PDF dans l'espace client et sont émises par AutoRA ([n° TVA — à compléter]).`,
    },
    {
      title: "8. Service après-vente et litiges",
      body: `Pour toute question relative à une commande, contactez-nous à autoracontact@gmail.com.

**Médiation** : Conformément à l'article VI.73 du Code de droit économique, tout consommateur peut recourir gratuitement au service de médiation pour le consommateur en cas de litige non résolu : [https://www.mediationconsommateur.be](https://www.mediationconsommateur.be)

**Plateforme ODR** : [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr)`,
    },
    {
      title: "9. Droit applicable",
      body: `Les présentes CGV sont régies par le droit belge. Tout litige est soumis à la compétence exclusive des tribunaux de l'arrondissement judiciaire de [à compléter], sous réserve des dispositions légales impératives applicables aux consommateurs.`,
    },
  ],
};

const nl = {
  title: "Algemene Verkoopvoorwaarden",
  subtitle: "Abonnementen en betalende diensten — Versie mei 2026",
  intro: `Deze Algemene Verkoopvoorwaarden (hierna « AVV ») zijn van toepassing op alle aankopen van betalende diensten op het AutoRA.be platform, uitgebaat door [Naam — in te vullen], België.`,
  sections: [
    {
      title: "1. Aanbod en diensten",
      body: `AutoRA biedt de volgende betalende diensten aan: advertentieboost (voorrang in zoekresultaten) en Professioneel abonnement. Prijzen en kenmerken zijn beschikbaar op https://autora.be/pricing.`,
    },
    {
      title: "2. Betaling",
      body: `Betalingen worden verwerkt door **Stripe, Inc.** (PCI DSS niveau 1 gecertificeerd). Aanvaarde betaalmiddelen: Visa, Mastercard, Bancontact. Abonnementen worden automatisch verlengd, tenzij vooraf opgezegd.`,
    },
    {
      title: "3. Herroepingsrecht",
      body: `Overeenkomstig artikel VI.47 van het Wetboek van economisch recht beschikt de consument over een herroepingstermijn van **14 kalenderdagen** vanaf de contractsluiting. Uitzonderingen zijn van toepassing op volledig uitgevoerde digitale diensten waarbij u uitdrukkelijk toestemming heeft gegeven om onmiddellijk te beginnen.`,
    },
    {
      title: "4. Opzegging",
      body: `U kunt uw abonnement op elk moment opzeggen via uw accountinstellingen. De opzegging gaat in aan het einde van de lopende periode.`,
    },
    {
      title: "5. Toepasselijk recht",
      body: `Deze AVV worden beheerst door het Belgisch recht. Bij geschillen zijn de rechtbanken van het gerechtelijk arrondissement [in te vullen] bevoegd. Consumenten kunnen ook een klacht indienen bij de Consumentenombudsdienst: [https://www.consumentenombudsdienst.be](https://www.consumentenombudsdienst.be).`,
    },
  ],
};

const CGV = () => {
  const { language } = useLanguage();
  const lang = language === "nl" ? "nl" : "fr";
  const t = lang === "nl" ? nl : fr;

  return (
    <>
      <SEOHead
        title={`${t.title} — AutoRA.be`}
        description="Conditions générales de vente des abonnements AutoRA.be"
        noindex
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 font-display">{t.title}</h1>
        <p className="text-sm text-muted-foreground mb-8 italic">{t.subtitle}</p>

        <div className="text-sm text-muted-foreground leading-relaxed mb-10 p-4 bg-muted/30 rounded-xl border border-border/20">
          {t.intro.split("\n\n").map((p, i) => (
            <p key={i} className="mb-3 last:mb-0">{p}</p>
          ))}
        </div>

        <div className="space-y-10">
          {t.sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold mb-3 text-foreground border-b border-border/20 pb-2">
                {s.title}
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
                {renderBody(s.body)}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-muted-foreground/50 border-t border-border/10 pt-6">
          {lang === "fr" ? "Dernière mise à jour : mai 2026" : "Laatste update: mei 2026"}
        </p>
      </main>
      <Footer />
    </>
  );
};

export default CGV;
