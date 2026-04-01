import { Header, Footer } from "@/shared/components";
import { FileText, Scale, AlertTriangle, Users, CreditCard, Shield, Mail } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const Terms = () => {
  const sections = [
    {
      icon: Users,
      title: "1. Acceptation des conditions",
      content: `En accédant et en utilisant le site AutoRa (ci-après "le Site"), vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre Site.

Ces conditions s'appliquent à tous les visiteurs, utilisateurs et autres personnes qui accèdent ou utilisent le Site.`
    },
    {
      icon: FileText,
      title: "2. Description du service",
      content: `AutoRa est une plateforme de mise en relation entre vendeurs et acheteurs de véhicules d'occasion en Belgique. Notre service permet de :

• Publier des annonces de vente de véhicules
• Rechercher et consulter des annonces de véhicules
• Contacter des vendeurs via notre système de messagerie
• Comparer des véhicules
• Vérifier l'historique des véhicules via Car-Pass

AutoRa agit uniquement en tant qu'intermédiaire et n'est pas partie aux transactions effectuées entre acheteurs et vendeurs.`
    },
    {
      icon: Scale,
      title: "3. Obligations des utilisateurs",
      content: `En utilisant notre Site, vous vous engagez à :

• Fournir des informations exactes, complètes et à jour lors de l'inscription et de la publication d'annonces
• Ne pas publier de contenu faux, trompeur ou frauduleux
• Respecter les droits de propriété intellectuelle d'autrui
• Ne pas utiliser le Site à des fins illégales ou non autorisées
• Ne pas perturber ou interférer avec le fonctionnement du Site
• Maintenir la confidentialité de vos identifiants de connexion

Les vendeurs professionnels doivent clairement s'identifier comme tels et respecter la législation applicable au commerce automobile.`
    },
    {
      icon: CreditCard,
      title: "4. Annonces et transactions",
      content: `Publication d'annonces :
• Les annonces doivent décrire fidèlement le véhicule proposé
• Les photos doivent correspondre au véhicule effectivement vendu
• Le prix affiché doit être le prix réel de vente
• Toute information concernant le kilométrage, l'historique d'accidents ou les défauts doit être mentionnée

AutoRa se réserve le droit de :
• Refuser ou supprimer toute annonce ne respectant pas ces conditions
• Suspendre ou supprimer tout compte utilisateur en cas de violation des présentes conditions
• Modifier ou interrompre le service à tout moment`
    },
    {
      icon: AlertTriangle,
      title: "5. Limitation de responsabilité",
      content: `AutoRa ne garantit pas :
• L'exactitude, l'exhaustivité ou la fiabilité des informations publiées par les utilisateurs
• La qualité, la sécurité ou la légalité des véhicules annoncés
• La capacité des vendeurs à vendre ou des acheteurs à acheter
• Que le Site sera exempt d'erreurs ou disponible sans interruption

AutoRa ne peut être tenu responsable des :
• Dommages directs ou indirects résultant de l'utilisation du Site
• Litiges entre acheteurs et vendeurs
• Pertes financières liées aux transactions effectuées via le Site

Nous recommandons vivement de vérifier physiquement tout véhicule avant l'achat et de consulter le document Car-Pass.`
    },
    {
      icon: Shield,
      title: "6. Propriété intellectuelle",
      content: `Tous les contenus présents sur le Site (textes, graphiques, logos, images, logiciels) sont la propriété d'AutoRa ou de ses concédants de licence et sont protégés par les lois sur la propriété intellectuelle.

Vous n'êtes pas autorisé à :
• Copier, modifier ou distribuer le contenu du Site sans autorisation
• Utiliser les marques, logos ou autres éléments distinctifs d'AutoRa
• Extraire systématiquement des données du Site

Les utilisateurs conservent les droits sur le contenu qu'ils publient mais accordent à AutoRa une licence non exclusive pour l'afficher sur le Site.`
    },
    {
      icon: Mail,
      title: "7. Modifications et contact",
      content: `AutoRa se réserve le droit de modifier ces Conditions Générales à tout moment. Les modifications entrent en vigueur dès leur publication sur le Site. Nous vous encourageons à consulter régulièrement cette page.

Pour toute question concernant ces conditions, vous pouvez nous contacter :
• Par email : legal@autora.be
• Par courrier : AutoRa SPRL, Rue de la Loi 1, 1000 Bruxelles, Belgique

Dernière mise à jour : Janvier 2025`
    }
  ];

  return (
    <div className="page-gradient">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-3xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Scale className="w-4 h-4" />
              Conditions Générales
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Conditions Générales <span className="gradient-text">d'Utilisation</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Veuillez lire attentivement ces conditions avant d'utiliser notre plateforme. 
              Elles régissent votre utilisation du site AutoRa et des services associés.
            </p>
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

        {/* Droit applicable */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                Droit applicable et juridiction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Les présentes Conditions Générales sont régies par le droit belge. 
                En cas de litige, les tribunaux de Bruxelles seront seuls compétents, 
                sans préjudice du droit du consommateur de saisir le tribunal de son domicile.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
