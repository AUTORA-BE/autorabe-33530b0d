import { Header, Footer } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

const content = {
  fr: {
    title: "Mentions légales",
    subtitle: "Conformément à la loi belge du 11 mars 2003 sur certains aspects juridiques des services de la société de l'information",
    sections: [
      {
        title: "1. Éditeur du site",
        body: `**Dénomination** : AutoRA.be (ci-après « AutoRA »)
**Forme juridique** : [À compléter — ex. : SRL / Personne physique]
**Adresse** : [Adresse complète à compléter]
**Numéro d'entreprise BCE** : [BE 0000.000.000 — à compléter]
**Numéro de TVA** : [BE 0000.000.000 — à compléter si assujetti]
**Email** : autoracontact@gmail.com
**Directeur de publication** : [Nom du responsable — à compléter]

AutoRA est une marketplace de mise en relation entre vendeurs et acheteurs de véhicules d'occasion en Belgique. La plateforme n'intervient pas dans les transactions entre particuliers et n'est pas partie aux contrats de vente conclus entre utilisateurs.`,
      },
      {
        title: "2. Hébergement",
        body: `Le site AutoRA.be est hébergé par :

**Vercel Inc.**
340 Pine Street, Suite 1028
San Francisco, CA 94104 — États-Unis
Site web : https://vercel.com
Email : support@vercel.com

La base de données et les fonctions serverless sont gérées par :

**Supabase Inc.**
970 Toa Payoh North, #07-04
Singapore 318992
Site web : https://supabase.com`,
      },
      {
        title: "3. Propriété intellectuelle",
        body: `L'ensemble des éléments constituant le site AutoRA.be (structure, textes, graphismes, logos, icônes, images, sons, logiciels, base de données, etc.) est protégé par le droit d'auteur et le droit des marques, conformément au Code de droit économique belge (Livre XI).

Toute reproduction, représentation, modification, publication, adaptation ou exploitation, totale ou partielle, des éléments du site, quel que soit le moyen ou le procédé utilisé, est strictement interdite sans l'autorisation écrite préalable d'AutoRA.

Le nom « AutoRA », le logo et les éléments graphiques associés sont des signes distinctifs appartenant à AutoRA. Leur utilisation non autorisée constitue une contrefaçon sanctionnée par les articles XI.335 et suivants du Code de droit économique.

Les contenus publiés par les utilisateurs (annonces, photos, descriptions) restent la propriété de leur auteur. En les publiant sur AutoRA, l'utilisateur accorde à AutoRA une licence non exclusive, mondiale et gratuite d'utilisation à des fins de fonctionnement de la plateforme.`,
      },
      {
        title: "4. Responsabilité",
        body: `AutoRA met tout en œuvre pour assurer l'exactitude et la mise à jour des informations diffusées sur le site. Toutefois, AutoRA ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.

En tant qu'hébergeur de contenus générés par des tiers (annonces), AutoRA bénéficie du régime de responsabilité limitée prévu par l'article XII.19 du Code de droit économique (transposant la directive 2000/31/CE). AutoRA n'est pas responsable des contenus publiés par les utilisateurs, sauf si, informée d'un contenu manifestement illicite, elle n'agit pas promptement pour le retirer.

AutoRA ne saurait être tenue responsable des dommages directs ou indirects résultant de l'utilisation du site ou de son inaccessibilité temporaire.`,
      },
      {
        title: "5. Liens hypertextes",
        body: `Le site AutoRA.be peut contenir des liens vers des sites tiers. Ces liens sont fournis à titre informatif uniquement. AutoRA n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, leur politique de confidentialité ou leurs pratiques.

La création de liens hypertextes pointant vers le site AutoRA.be est soumise à l'accord écrit préalable d'AutoRA.`,
      },
      {
        title: "6. Droit applicable et juridiction",
        body: `Les présentes mentions légales sont régies par le droit belge.

En cas de litige relatif à l'interprétation ou à l'exécution des présentes, et à défaut de résolution amiable, les tribunaux compétents seront ceux du ressort de l'arrondissement judiciaire de [arrondissement à compléter], Belgique, sauf disposition légale impérative contraire.

Pour les litiges de consommation, le consommateur belge peut également recourir au service de médiation pour le consommateur : https://www.mediationconsommateur.be ou à la plateforme européenne de règlement en ligne des litiges (RLL) : https://ec.europa.eu/consumers/odr`,
      },
      {
        title: "7. Protection des données personnelles",
        body: `Le traitement des données personnelles des utilisateurs est décrit dans notre politique de confidentialité, accessible à l'adresse : https://autora.be/confidentialite

Pour toute question relative à vos données, contactez-nous à : autoracontact@gmail.com`,
      },
    ],
  },
  nl: {
    title: "Wettelijke vermeldingen",
    subtitle: "Overeenkomstig de Belgische wet van 11 maart 2003 betreffende bepaalde juridische aspecten van de diensten van de informatiemaatschappij",
    sections: [
      {
        title: "1. Uitgever van de website",
        body: `**Naam** : AutoRA.be (hierna « AutoRA »)
**Rechtsvorm** : [In te vullen — bv. : BV / Natuurlijk persoon]
**Adres** : [Volledig adres in te vullen]
**KBO-nummer** : [BE 0000.000.000 — in te vullen]
**BTW-nummer** : [BE 0000.000.000 — in te vullen indien BTW-plichtig]
**E-mail** : autoracontact@gmail.com
**Verantwoordelijke voor de publicatie** : [Naam in te vullen]

AutoRA is een marktplaats voor de bemiddeling tussen verkopers en kopers van tweedehandse voertuigen in België. Het platform neemt niet deel aan transacties tussen particulieren en is geen partij bij koopovereenkomsten tussen gebruikers.`,
      },
      {
        title: "2. Hosting",
        body: `De website AutoRA.be wordt gehost door:

**Vercel Inc.**
340 Pine Street, Suite 1028
San Francisco, CA 94104 — Verenigde Staten
Website: https://vercel.com

De database en serverfuncties worden beheerd door:

**Supabase Inc.**
970 Toa Payoh North, #07-04
Singapore 318992
Website: https://supabase.com`,
      },
      {
        title: "3. Intellectuele eigendom",
        body: `Alle elementen van de website AutoRA.be (structuur, teksten, graphics, logo's, iconen, afbeeldingen, software, database, enz.) zijn beschermd door het auteursrecht en het merkenrecht, overeenkomstig het Belgisch Wetboek van Economisch Recht (Boek XI).

Elke reproductie, verspreiding, wijziging, publicatie of aanpassing, geheel of gedeeltelijk, van de elementen van de website, met welk middel of via welk procédé dan ook, is strikt verboden zonder de voorafgaande schriftelijke toestemming van AutoRA.`,
      },
      {
        title: "4. Aansprakelijkheid",
        body: `Als host van door derden gegenereerde inhoud (advertenties) geniet AutoRA het beperkte aansprakelijkheidsregime van artikel XII.19 van het Wetboek van economisch recht (omzetting van richtlijn 2000/31/EG). AutoRA is niet verantwoordelijk voor inhoud gepubliceerd door gebruikers, tenzij zij, na in kennis te zijn gesteld van een kennelijk onwettige inhoud, niet onmiddellijk handelt om deze te verwijderen.`,
      },
      {
        title: "5. Toepasselijk recht en bevoegde rechtbank",
        body: `Deze wettelijke vermeldingen worden beheerst door het Belgisch recht. Bij geschillen zijn de rechtbanken van het gerechtelijk arrondissement [in te vullen] bevoegd, behoudens dwingende wettelijke bepalingen.`,
      },
    ],
  },
};

const MentionsLegales = () => {
  const { language } = useLanguage();
  const lang = language === "nl" ? "nl" : "fr";
  const t = content[lang];

  const renderBody = (body: string) =>
    body.split("\n").map((line, i) => {
      const bold = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return line.trim() === "" ? (
        <br key={i} />
      ) : (
        <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: bold }} />
      );
    });

  return (
    <>
      <SEOHead
        title={`${t.title} — AutoRA.be`}
        description={t.subtitle}
        noindex
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 font-display">{t.title}</h1>
        <p className="text-sm text-muted-foreground mb-10 italic">{t.subtitle}</p>

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
          {lang === "fr"
            ? `Dernière mise à jour : mai 2026`
            : `Laatste update: mei 2026`}
        </p>
      </main>
      <Footer />
    </>
  );
};

export default MentionsLegales;
