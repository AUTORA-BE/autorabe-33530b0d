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
  title: "Conditions Générales d'Utilisation",
  subtitle: "Version en vigueur — mai 2026",
  intro: `Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme AutoRA.be (ci-après « AutoRA » ou « la Plateforme »), exploitée par [Nom / Société — à compléter], [adresse — à compléter], Belgique.

En accédant à la Plateforme ou en créant un compte, l'utilisateur accepte sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la Plateforme.

AutoRA se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications substantielles par email et/ou par notification sur la Plateforme. La poursuite de l'utilisation après notification vaut acceptation des nouvelles conditions.`,
  sections: [
    {
      title: "1. Définitions",
      body: `**Plateforme** : le site web AutoRA.be et ses applications mobiles associées.
**Utilisateur** : toute personne physique ou morale accédant à la Plateforme.
**Vendeur** : utilisateur publiant une ou plusieurs annonces de vente de véhicule(s).
**Acheteur** : utilisateur cherchant à acquérir un véhicule via la Plateforme.
**Annonce** : publication décrivant un véhicule proposé à la vente.
**Car-Pass** : document officiel belge certifiant le kilométrage d'un véhicule.
**Contenu** : toute information, texte, image ou donnée publiée par un utilisateur.`,
    },
    {
      title: "2. Objet et nature de la Plateforme",
      body: `AutoRA est une marketplace de mise en relation entre vendeurs et acheteurs de véhicules d'occasion. AutoRA agit exclusivement en qualité d'intermédiaire technique : elle n'est ni vendeur, ni acheteur, ni mandataire d'aucune des parties.

AutoRA n'est pas partie aux transactions conclues entre utilisateurs et ne garantit pas la réalisation des transactions. Toute transaction est conclue directement entre le vendeur et l'acheteur, sous leur entière responsabilité.

Les vendeurs professionnels (marchands de véhicules, leasing, etc.) sont tenus de s'identifier comme tels lors de leur inscription et dans leurs annonces, conformément au Code de droit économique (art. VI.2 et suivants).`,
    },
    {
      title: "3. Inscription et accès",
      body: `**3.1 Conditions d'inscription**
L'inscription est ouverte à toute personne physique majeure (18 ans ou plus) ou à toute personne morale valablement constituée selon le droit belge ou étranger.

Les informations fournies lors de l'inscription doivent être exactes, complètes et à jour. Tout changement doit être répercuté sans délai.

**3.2 Identifiants**
Chaque utilisateur est responsable de la confidentialité de ses identifiants. Il s'engage à notifier immédiatement AutoRA de toute utilisation non autorisée de son compte à l'adresse autoracontact@gmail.com.

AutoRA ne saurait être tenue responsable des conséquences d'une utilisation frauduleuse des identifiants due à la négligence de l'utilisateur.

**3.3 Un compte par personne**
Chaque utilisateur ne peut créer qu'un seul compte personnel. La création de comptes multiples dans le but de contourner une suspension est interdite.`,
    },
    {
      title: "4. Obligations des utilisateurs",
      body: `**4.1 Exactitude des annonces**
Le vendeur garantit que toutes les informations de son annonce sont exactes, complètes et non trompeuses, notamment :
— le kilométrage réel du véhicule (concordance obligatoire avec le Car-Pass) ;
— l'état réel du véhicule (accidents, réparations, défauts visibles et non visibles connus) ;
— la situation juridique du véhicule (absence de gage, de saisie, de leasing en cours) ;
— l'année et la version exactes du véhicule.

Toute omission intentionnelle ou fausse déclaration est susceptible d'engager la responsabilité civile et pénale du vendeur.

**4.2 Car-Pass**
Pour les véhicules d'occasion immatriculés en Belgique, la mise à disposition du Car-Pass est fortement encouragée et peut être rendue obligatoire pour certaines catégories d'annonces. La plateforme peut afficher la mention « Car-Pass non vérifié » pour les annonces sans vérification.

**4.3 Photos**
Les photos publiées doivent représenter le véhicule concerné. L'utilisation de photos volées, de logiciels tiers ou de visuels génériques est interdite.

**4.4 Prix**
Le prix indiqué doit être le prix de vente réel. Les prix « à partir de » ou intentionnellement sous-évalués pour générer du trafic sont interdits.`,
    },
    {
      title: "5. Contenus interdits",
      body: `Il est interdit de publier sur AutoRA :
— des véhicules volés ou faisant l'objet d'un litige de propriété ;
— des annonces de véhicules non conformes aux normes d'homologation belges ;
— des contenus pornographiques, discriminatoires, incitant à la haine ou illégaux ;
— des informations personnelles de tiers sans leur consentement ;
— des liens ou redirections vers des sites de phishing ou frauduleux ;
— des contenus contenant des virus ou codes malveillants ;
— des spams ou messages commerciaux non sollicités via le système de messagerie ;
— des annonces de pièces détachées ou accessoires en dehors des catégories autorisées ;
— tout autre contenu violant le droit belge ou européen applicable.

AutoRA se réserve le droit de supprimer sans préavis tout contenu contrevenant aux présentes règles.`,
    },
    {
      title: "6. Modération et signalement",
      body: `**6.1 Modération**
AutoRA procède à une modération des annonces avant leur mise en ligne (ou après publication pour certaines catégories). Elle peut refuser, modifier ou supprimer toute annonce ne respectant pas les présentes CGU ou ses règles éditoriales.

**6.2 Signalement**
Tout utilisateur peut signaler un contenu illicite ou suspect via le formulaire de signalement accessible sur chaque annonce. AutoRA s'engage à traiter les signalements dans un délai raisonnable, conformément à l'article XII.19 du Code de droit économique.

**6.3 Statuts d'annonce**
Les annonces peuvent avoir les statuts suivants : brouillon, en attente de vérification, approuvée, refusée, suspendue. La modification de certains champs sensibles (prix, kilométrage, marque, modèle) d'une annonce approuvée la repasse automatiquement en statut « en attente de vérification ».`,
    },
    {
      title: "7. Suspension et résiliation",
      body: `**7.1 Par AutoRA**
AutoRA peut suspendre ou résilier un compte, sans préavis ni indemnité, en cas de :
— violation des présentes CGU ;
— fourniture d'informations fausses lors de l'inscription ;
— comportement frauduleux ou tentative de manipulation de la Plateforme ;
— décision judiciaire ou administrative l'y contraignant.

**7.2 Par l'utilisateur**
L'utilisateur peut fermer son compte à tout moment depuis ses paramètres de compte ou en contactant AutoRA. La clôture entraîne la suppression des données personnelles selon les modalités décrites dans la politique de confidentialité.

**7.3 Abonnements actifs**
En cas de résiliation de compte avec un abonnement payant actif, les dispositions des Conditions Générales de Vente s'appliquent.`,
    },
    {
      title: "8. Services payants et abonnements",
      body: `AutoRA propose des services payants (mise en avant d'annonces, abonnements professionnels). Ces services sont soumis aux Conditions Générales de Vente accessibles à l'adresse https://autora.be/cgv.

Le paiement est traité par Stripe, Inc. Les coordonnées bancaires ne transitent pas par les serveurs d'AutoRA.`,
    },
    {
      title: "9. Responsabilité d'AutoRA",
      body: `**9.1 Limitation**
AutoRA ne garantit pas l'exactitude des informations publiées par les utilisateurs, ni l'absence de vices cachés dans les véhicules vendus. AutoRA n'est pas responsable des transactions conclues entre utilisateurs, des litiges en découlant, des défauts de paiement ou de livraison.

**9.2 Disponibilité**
AutoRA s'efforce de maintenir la Plateforme accessible 24h/24, 7j/7, mais ne peut garantir une disponibilité ininterrompue. Des maintenances peuvent être effectuées, de préférence en heures creuses, avec ou sans préavis.

**9.3 Exclusion de garantie**
AutoRA exclut toute garantie de résultat quant aux transactions facilitées. Elle n'est tenue qu'à une obligation de moyens.`,
    },
    {
      title: "10. Propriété intellectuelle des contenus utilisateurs",
      body: `L'utilisateur conserve la propriété de ses contenus. En publiant sur AutoRA, il accorde à AutoRA une licence non exclusive, mondiale, gratuite, sous-licenciable et transférable pour utiliser, reproduire, modifier, adapter, publier, traduire et distribuer ces contenus, uniquement pour les besoins de fonctionnement et promotion de la Plateforme.

Cette licence prend fin lors de la suppression du contenu ou du compte, sauf si les contenus ont été partagés par d'autres utilisateurs.`,
    },
    {
      title: "11. Protection des données personnelles",
      body: `Le traitement des données personnelles des utilisateurs est régi par la politique de confidentialité d'AutoRA, conforme au RGPD (Règlement UE 2016/679), accessible à l'adresse : https://autora.be/confidentialite`,
    },
    {
      title: "12. Droit applicable et règlement des litiges",
      body: `Les présentes CGU sont régies par le droit belge, à l'exclusion de ses règles de conflit de lois.

Tout litige relatif à l'interprétation ou à l'exécution des présentes fera l'objet d'une tentative de résolution amiable préalable. À défaut d'accord dans les 30 jours, les tribunaux de l'arrondissement judiciaire de [à compléter] seront seuls compétents, sauf disposition légale impérative contraire.

Les consommateurs résidant en Belgique peuvent également recourir au service de médiation pour le consommateur (www.mediationconsommateur.be) ou à la plateforme européenne de résolution des litiges en ligne (https://ec.europa.eu/consumers/odr).`,
    },
  ],
};

const nl = {
  title: "Algemene Gebruiksvoorwaarden",
  subtitle: "Van kracht — mei 2026",
  intro: `Deze Algemene Gebruiksvoorwaarden (hierna « AGV ») regelen de toegang tot en het gebruik van het AutoRA.be platform (hierna « AutoRA » of « het Platform »), uitgebaat door [Naam / Vennootschap — in te vullen], [adres — in te vullen], België.

Door toegang te nemen tot het Platform of een account aan te maken, aanvaardt de gebruiker deze AGV zonder voorbehoud.`,
  sections: [
    {
      title: "1. Voorwerp en aard van het Platform",
      body: `AutoRA is een marktplaats voor de bemiddeling tussen verkopers en kopers van tweedehandse voertuigen. AutoRA treedt uitsluitend op als technisch tussenpersoon en is geen partij bij de transacties tussen gebruikers.`,
    },
    {
      title: "2. Verplichtingen van de gebruikers",
      body: `De verkoper garandeert dat alle informatie in zijn advertentie juist en volledig is, met name de werkelijke kilometerstand (in overeenstemming met de Car-Pass), de werkelijke staat van het voertuig en de juridische situatie ervan.`,
    },
    {
      title: "3. Verboden inhoud",
      body: `Het is verboden om op AutoRA te publiceren: gestolen voertuigen, illegale inhoud, misleidende advertenties, spam of enige andere inhoud die in strijd is met het Belgisch of Europees recht.`,
    },
    {
      title: "4. Moderatie en schorsing",
      body: `AutoRA behoudt zich het recht voor om zonder voorafgaande kennisgeving inhoud te verwijderen of accounts te schorsen die in strijd zijn met deze AGV.`,
    },
    {
      title: "5. Toepasselijk recht",
      body: `Deze AGV worden beheerst door het Belgisch recht. Bij geschillen zijn de rechtbanken van het gerechtelijk arrondissement [in te vullen] bevoegd.`,
    },
  ],
};

const CGU = () => {
  const { language } = useLanguage();
  const lang = language === "nl" ? "nl" : "fr";
  const t = lang === "nl" ? nl : fr;

  return (
    <>
      <SEOHead
        title={`${t.title} — AutoRA.be`}
        description="Conditions régissant l'utilisation de la marketplace AutoRA.be"
        noIndex
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 font-display">{t.title}</h1>
        <p className="text-sm text-muted-foreground mb-4 italic">{t.subtitle}</p>

        {lang === "fr" && (
          <div className="text-sm text-muted-foreground leading-relaxed mb-10 p-4 bg-muted/30 rounded-xl border border-border/20">
            {fr.intro.split("\n\n").map((p, i) => (
              <p key={i} className="mb-3 last:mb-0">{p}</p>
            ))}
          </div>
        )}
        {lang === "nl" && (
          <div className="text-sm text-muted-foreground leading-relaxed mb-10 p-4 bg-muted/30 rounded-xl border border-border/20">
            {nl.intro.split("\n\n").map((p, i) => (
              <p key={i} className="mb-3 last:mb-0">{p}</p>
            ))}
          </div>
        )}

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

export default CGU;
