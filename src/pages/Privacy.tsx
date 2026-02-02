import { Header, Footer } from "@/shared/components";
import { Shield, Database, Eye, Lock, UserCheck, Globe, Mail, Settings } from "lucide-react";

const Privacy = () => {
  const sections = [
    {
      icon: Database,
      title: "1. Données collectées",
      content: `Nous collectons les types de données suivants :

Données d'identification :
• Nom et prénom
• Adresse email
• Numéro de téléphone (optionnel)
• Adresse postale (pour les vendeurs professionnels)

Données relatives aux véhicules :
• Informations sur les véhicules mis en vente
• Historique des annonces publiées
• Photos des véhicules

Données de navigation :
• Adresse IP
• Type de navigateur et système d'exploitation
• Pages visitées et durée des visites
• Recherches effectuées sur le Site`
    },
    {
      icon: Eye,
      title: "2. Utilisation des données",
      content: `Vos données personnelles sont utilisées pour :

• Gérer votre compte utilisateur et authentification
• Permettre la publication et la gestion de vos annonces
• Faciliter la communication entre acheteurs et vendeurs
• Améliorer nos services et personnaliser votre expérience
• Envoyer des notifications relatives à vos annonces et messages
• Prévenir la fraude et garantir la sécurité du Site
• Respecter nos obligations légales

Nous ne vendons jamais vos données personnelles à des tiers. Les données peuvent être partagées avec des prestataires de services (hébergement, analyse) uniquement dans le cadre de la fourniture de nos services.`
    },
    {
      icon: Lock,
      title: "3. Sécurité des données",
      content: `Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :

• Chiffrement SSL/TLS pour toutes les communications
• Stockage sécurisé des mots de passe (hachage)
• Accès restreint aux données personnelles
• Surveillance continue de nos systèmes
• Sauvegardes régulières et plan de reprise d'activité

En cas de violation de données susceptible d'affecter vos droits, nous vous en informerons conformément à la réglementation applicable.`
    },
    {
      icon: UserCheck,
      title: "4. Vos droits (RGPD)",
      content: `Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :

• Droit d'accès : obtenir une copie de vos données personnelles
• Droit de rectification : corriger des données inexactes
• Droit à l'effacement : demander la suppression de vos données
• Droit à la limitation : restreindre le traitement de vos données
• Droit à la portabilité : recevoir vos données dans un format structuré
• Droit d'opposition : vous opposer au traitement de vos données
• Droit de retirer votre consentement à tout moment

Pour exercer ces droits, contactez-nous à privacy@autora.be ou via votre espace personnel dans les paramètres du compte.`
    },
    {
      icon: Globe,
      title: "5. Cookies et technologies similaires",
      content: `Notre Site utilise des cookies pour :

Cookies essentiels :
• Maintenir votre session de connexion
• Mémoriser vos préférences de langue
• Assurer la sécurité du Site

Cookies analytiques :
• Comprendre comment vous utilisez le Site
• Améliorer nos services et l'expérience utilisateur

Cookies de personnalisation :
• Mémoriser vos recherches et préférences
• Afficher des recommandations pertinentes

Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur ou via notre bandeau de consentement.`
    },
    {
      icon: Settings,
      title: "6. Conservation des données",
      content: `Nous conservons vos données pendant les durées suivantes :

• Données de compte : pendant toute la durée de votre inscription, puis 3 ans après la dernière activité
• Annonces publiées : 2 ans après expiration ou suppression
• Messages : 2 ans après le dernier échange
• Données de navigation : 13 mois maximum
• Données de facturation : 10 ans (obligation légale)

À l'expiration de ces délais, les données sont supprimées ou anonymisées de manière irréversible.`
    },
    {
      icon: Mail,
      title: "7. Contact et réclamations",
      content: `Pour toute question relative à la protection de vos données :

Délégué à la Protection des Données (DPO) :
• Email : privacy@autora.be
• Adresse : AutoRa SPRL, Rue de la Loi 1, 1000 Bruxelles, Belgique

Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'Autorité de Protection des Données (APD) :
• Site web : www.autoriteprotectiondonnees.be
• Email : contact@apd-gba.be

Dernière mise à jour : Janvier 2025`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-3xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Politique de Confidentialité
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Protection de vos <span className="gradient-text">données personnelles</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Chez AutoRa, nous prenons la protection de vos données très au sérieux. 
              Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles.
            </p>
          </div>
        </section>

        {/* RGPD Banner */}
        <section className="container mx-auto px-6 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground mb-1">Conforme au RGPD</h3>
                <p className="text-sm text-muted-foreground">
                  AutoRa respecte le Règlement Général sur la Protection des Données (RGPD) 
                  et la loi belge du 30 juillet 2018 relative à la protection des personnes physiques.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-6 pb-16">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <div 
                key={section.title}
                className="glass-card p-8 animate-fade-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold text-foreground mb-4">
                      {section.title}
                    </h2>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                Des questions sur vos données ?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Notre équipe est à votre disposition pour répondre à toutes vos questions 
                concernant la protection de vos données personnelles.
              </p>
              <a 
                href="mailto:privacy@autora.be"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Contacter le DPO
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
