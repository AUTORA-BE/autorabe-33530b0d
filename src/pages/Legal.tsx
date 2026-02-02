import { Header, Footer } from "@/shared/components";
import { Building2, User, Globe, Server, FileText, Scale, Camera, Mail } from "lucide-react";

const Legal = () => {
  const sections = [
    {
      icon: Building2,
      title: "1. Éditeur du site",
      content: `AutoRa SPRL
Numéro d'entreprise : BE 0123.456.789
Siège social : Rue de la Loi 1, 1000 Bruxelles, Belgique

Capital social : 50.000 €
Téléphone : +32 2 123 45 67
Email : contact@autora.be`
    },
    {
      icon: User,
      title: "2. Directeur de la publication",
      content: `Directeur de la publication : [Nom du directeur]
Fonction : Gérant

Le directeur de la publication est responsable du contenu éditorial publié sur le site AutoRa.`
    },
    {
      icon: Server,
      title: "3. Hébergement",
      content: `Le site AutoRa est hébergé par :

Lovable Technologies
Adresse : [Adresse de l'hébergeur]
Site web : https://lovable.dev

Pour toute question technique relative à l'hébergement, veuillez contacter notre équipe technique à l'adresse : tech@autora.be`
    },
    {
      icon: Globe,
      title: "4. Propriété intellectuelle",
      content: `L'ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, icônes, sons, logiciels, etc.) est protégé par le droit d'auteur et le droit des marques.

Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable d'AutoRa.

La marque AutoRa, le logo et les éléments graphiques associés sont des marques déposées. Leur utilisation sans autorisation constitue une contrefaçon.`
    },
    {
      icon: FileText,
      title: "5. Conditions d'utilisation",
      content: `L'utilisation du site AutoRa implique l'acceptation pleine et entière des conditions générales d'utilisation décrites dans nos CGU.

Ces conditions d'utilisation sont susceptibles d'être modifiées ou complétées à tout moment. Les utilisateurs sont donc invités à les consulter de manière régulière.

Pour consulter nos conditions générales complètes, veuillez vous rendre sur la page Conditions Générales d'Utilisation.`
    },
    {
      icon: Scale,
      title: "6. Limitation de responsabilité",
      content: `AutoRa s'efforce de fournir des informations aussi précises que possible sur son site. Toutefois, AutoRa ne pourra être tenue responsable des omissions, inexactitudes ou carences dans la mise à jour.

AutoRa décline toute responsabilité :
• En cas de défaillance technique
• En cas de contenu publié par les utilisateurs
• Pour les transactions effectuées entre particuliers
• Pour les liens vers des sites tiers

L'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive.`
    },
    {
      icon: Camera,
      title: "7. Données personnelles et RGPD",
      content: `Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi belge du 30 juillet 2018 relative à la protection des personnes physiques à l'égard des traitements de données à caractère personnel, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.

Délégué à la Protection des Données (DPO) :
Email : dpo@autora.be
Adresse : AutoRa SPRL, Rue de la Loi 1, 1000 Bruxelles

Pour exercer vos droits ou pour toute question sur le traitement de vos données, vous pouvez nous contacter à l'adresse ci-dessus ou consulter notre Politique de Confidentialité.`
    },
    {
      icon: Mail,
      title: "8. Contact",
      content: `Pour toute question ou réclamation concernant le site AutoRa, vous pouvez nous contacter :

Par email : contact@autora.be
Par téléphone : +32 2 123 45 67
Par courrier : AutoRa SPRL, Rue de la Loi 1, 1000 Bruxelles, Belgique

Horaires d'ouverture du service client :
Lundi - Vendredi : 9h00 - 18h00
Samedi : 10h00 - 16h00`
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
              <Building2 className="w-4 h-4" />
              Informations légales
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Mentions <span className="gradient-text">Légales</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Retrouvez toutes les informations légales relatives au site AutoRa, 
              conformément à la législation belge et européenne en vigueur.
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

        {/* Dernière mise à jour */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                Droit applicable
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Les présentes mentions légales sont régies par le droit belge. 
                Tout litige relatif à l'utilisation du site AutoRa sera soumis à la compétence 
                exclusive des tribunaux de Bruxelles.
              </p>
              <p className="text-sm text-muted-foreground">
                Dernière mise à jour : Janvier 2025
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Legal;
