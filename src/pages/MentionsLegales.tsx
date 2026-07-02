import { Header, Footer, BackButton } from "@/shared/components";
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
**Statut** : Plateforme en phase bêta — pré-lancement public
**Responsable de la publication** : Alperen Gursever
**Adresse de contact** : autoracontact@gmail.com
**Email** : autoracontact@gmail.com

⚠️ **Phase bêta — Activité non commerciale**

AutoRA est actuellement mis à disposition à des fins d'évaluation et de pré-lancement public. Pendant cette phase :

— Aucune transaction commerciale n'est réalisée par la plateforme elle-même.
— Aucun paiement n'est traité par AutoRA. L'inscription et l'utilisation sont gratuites.
— Les éventuelles transactions entre utilisateurs se déroulent directement entre eux, hors plateforme.



AutoRA est une plateforme de mise en relation entre vendeurs et acheteurs de véhicules d'occasion en Belgique. La plateforme n'intervient pas dans les transactions entre particuliers et n'est pas partie aux contrats de vente conclus entre utilisateurs.`,
      },
      {
        title: "2. Hébergement",
        body: `Le site AutoRA.be est hébergé et déployé par :

**Netlify, Inc.**
512 2nd Street
San Francisco, CA 94107 — États-Unis
Site web : https://www.netlify.com

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

**Modération des contenus — DSA art. 16** : AutoRA traite tout signalement de contenu potentiellement illicite dans un délai de **48 heures ouvrables** suivant sa réception. Pour signaler un contenu, utilisez le bouton « Signaler » sur l'annonce concernée ou écrivez à autoracontact@gmail.com. L'auteur du signalement sera informé des suites données à sa demande.

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

En cas de litige relatif à l'interprétation ou à l'exécution des présentes, et à défaut de résolution amiable, les tribunaux compétents seront ceux du ressort de l'arrondissement judiciaire du domicile de l'éditeur, Belgique, sauf disposition légale impérative contraire. L'arrondissement précis sera mentionné lors de l'inscription définitive de l'éditeur à la BCE.

Pour les litiges de consommation, le consommateur belge peut également recourir au service de médiation pour le consommateur : https://www.mediationconsommateur.be ou à la plateforme européenne de règlement en ligne des litiges (RLL) : https://ec.europa.eu/consumers/odr`,
      },
      {
        title: "7. Protection des données personnelles",
        body: `Le traitement des données personnelles des utilisateurs est décrit dans notre politique de confidentialité, accessible à l'adresse : https://autora.be/confidentialite

Pour toute question relative à vos données, contactez-nous à : autoracontact@gmail.com`,
      },
      {
        title: "8. Point de contact unique (DSA art. 11 & 12)",
        body: `Conformément aux articles 11 et 12 du Règlement (UE) 2022/2065 (Digital Services Act), AutoRA désigne un point de contact unique pour les autorités, les utilisateurs et les signaleurs de confiance :

**Contact général (utilisateurs, signaleurs)** : autoracontact@gmail.com
**Langues acceptées** : français, néerlandais, allemand, anglais
**Délai de réponse indicatif** : 48 heures ouvrables

**Représentation légale dans l'Union** : AutoRA étant établi en Belgique, aucun représentant légal supplémentaire (art. 13 DSA) n'est requis.

Les autorités belges (SPF Économie, APD, autorités judiciaires) peuvent adresser leurs demandes officielles à la même adresse, qui sera traitée en priorité.`,
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
**Status** : Platform in bètafase — publieke pre-lancering
**Verantwoordelijke voor de publicatie** : Alperen Gursever
**Contactadres** : autoracontact@gmail.com
**E-mail** : autoracontact@gmail.com

⚠️ **Bètafase — Niet-commerciële activiteit**

AutoRA wordt momenteel beschikbaar gesteld voor evaluatie en publieke pre-lancering. Tijdens deze fase :

— Er worden geen commerciële transacties uitgevoerd door het platform zelf.
— Geen enkele betaling wordt door AutoRA verwerkt. Inschrijving en gebruik zijn gratis.
— Eventuele transacties tussen gebruikers verlopen rechtstreeks tussen hen, buiten het platform.

AutoRA is een marktplaats voor de bemiddeling tussen verkopers en kopers van tweedehandse voertuigen in België. Het platform neemt niet deel aan transacties tussen particulieren en is geen partij bij koopovereenkomsten tussen gebruikers.`,
      },
      {
        title: "2. Hosting",
        body: `De website AutoRA.be wordt gehost en uitgerold door:

**Netlify, Inc.**
512 2nd Street
San Francisco, CA 94107 — Verenigde Staten
Website: https://www.netlify.com

De database en serverfuncties worden beheerd door:

**Supabase Inc.**
970 Toa Payoh North, #07-04
Singapore 318992
Website: https://supabase.com`,
      },
      {
        title: "3. Intellectuele eigendom",
        body: `Alle elementen van de website AutoRA.be (structuur, teksten, graphics, logo's, iconen, afbeeldingen, software, database, enz.) zijn beschermd door het auteursrecht en het merkenrecht, overeenkomstig het Belgisch Wetboek van Economisch Recht (Boek XI).

Elke reproductie, verspreiding, wijziging, publicatie of aanpassing, geheel of gedeeltelijk, van de elementen van de website, met welk middel of via welk procédé dan ook, is strikt verboden zonder de voorafgaande schriftelijke toestemming van AutoRA.

De naam « AutoRA », het logo en de bijbehorende grafische elementen zijn onderscheidende tekens die toebehoren aan AutoRA. Ongeoorloofd gebruik ervan vormt namaak die wordt bestraft door de artikelen XI.335 en volgende van het Wetboek van Economisch Recht.

Inhoud gepubliceerd door gebruikers (advertenties, foto's, beschrijvingen) blijft eigendom van de auteur. Door ze op AutoRA te publiceren, verleent de gebruiker AutoRA een niet-exclusieve, wereldwijde en kosteloze licentie voor gebruik voor de werking van het platform.`,
      },
      {
        title: "4. Aansprakelijkheid",
        body: `Als host van door derden gegenereerde inhoud (advertenties) geniet AutoRA het beperkte aansprakelijkheidsregime van artikel XII.19 van het Wetboek van economisch recht (omzetting van richtlijn 2000/31/EG). AutoRA is niet verantwoordelijk voor inhoud gepubliceerd door gebruikers, tenzij zij, na in kennis te zijn gesteld van een kennelijk onwettige inhoud, niet onmiddellijk handelt om deze te verwijderen.

**Inhoudsmoderatie — DSA art. 16** : AutoRA behandelt elke melding van mogelijk onwettige inhoud binnen **48 werkuren** na ontvangst. Om inhoud te melden, gebruikt u de knop « Melden » op de betreffende advertentie of stuurt u een e-mail naar autoracontact@gmail.com. De melder wordt op de hoogte gesteld van het gevolg dat aan zijn verzoek wordt gegeven.

AutoRA kan niet aansprakelijk worden gesteld voor directe of indirecte schade als gevolg van het gebruik van de website of de tijdelijke onbeschikbaarheid ervan.`,
      },
      {
        title: "5. Hyperlinks",
        body: `De website AutoRA.be kan links bevatten naar websites van derden. Deze links worden uitsluitend ter informatie verstrekt. AutoRA heeft geen controle over deze websites en wijst elke aansprakelijkheid af voor hun inhoud, privacybeleid of praktijken.

Het plaatsen van hyperlinks naar de website AutoRA.be vereist de voorafgaande schriftelijke toestemming van AutoRA.`,
      },
      {
        title: "6. Toepasselijk recht en bevoegde rechtbank",
        body: `Deze wettelijke vermeldingen worden beheerst door het Belgisch recht.

Bij geschillen zijn de rechtbanken bevoegd van het gerechtelijk arrondissement van de woonplaats van de uitgever, België, behoudens dwingende wettelijke bepalingen. Het precieze arrondissement zal worden vermeld bij de definitieve inschrijving van de uitgever bij de KBO.

Voor consumentengeschillen kan de Belgische consument ook een klacht indienen bij de Consumentenombudsdienst: https://www.consumentenombudsdienst.be of via het Europees platform voor onlinegeschillenbeslechting: https://ec.europa.eu/consumers/odr`,
      },
      {
        title: "7. Bescherming van persoonsgegevens",
        body: `De verwerking van persoonsgegevens van gebruikers wordt beschreven in ons privacybeleid, toegankelijk op: https://autora.be/confidentialite

Voor vragen over uw gegevens kunt u contact met ons opnemen via: autoracontact@gmail.com`,
      },
      {
        title: "8. Enig contactpunt (DSA art. 11 & 12)",
        body: `Overeenkomstig de artikelen 11 en 12 van Verordening (EU) 2022/2065 (Digital Services Act) wijst AutoRA één enkel contactpunt aan voor autoriteiten, gebruikers en betrouwbare flaggers:

**Algemeen contact (gebruikers, melders)**: autoracontact@gmail.com
**Aanvaarde talen**: Frans, Nederlands, Duits, Engels
**Indicatieve antwoordtermijn**: 48 werkuren

**Wettelijke vertegenwoordiging in de Unie**: Aangezien AutoRA in België is gevestigd, is geen aanvullende wettelijke vertegenwoordiger (art. 13 DSA) vereist.

De Belgische autoriteiten (FOD Economie, GBA, gerechtelijke autoriteiten) kunnen hun officiële verzoeken aan hetzelfde adres richten, waar ze met voorrang worden behandeld.`,
      },
    ],
  },
  de: {
    title: "Impressum",
    subtitle: "Gemäß dem belgischen Gesetz vom 11. März 2003 über bestimmte rechtliche Aspekte der Dienste der Informationsgesellschaft",
    sections: [
      {
        title: "1. Herausgeber der Website",
        body: `**Name** : AutoRA.be (nachfolgend „AutoRA")
**Status** : Plattform in der Beta-Phase — öffentlicher Pre-Launch
**Verantwortlicher für die Veröffentlichung** : Alperen Gursever
**Kontaktadresse** : autoracontact@gmail.com
**E-Mail** : autoracontact@gmail.com

⚠️ **Beta-Phase — Nicht-kommerzielle Tätigkeit**

AutoRA wird derzeit zu Evaluierungs- und öffentlichen Pre-Launch-Zwecken zur Verfügung gestellt. Während dieser Phase :

— Es werden keine kommerziellen Transaktionen über die Plattform selbst abgewickelt.
— Es werden keine Zahlungen von AutoRA verarbeitet. Registrierung und Nutzung sind kostenlos.
— Eventuelle Transaktionen zwischen Nutzern finden direkt zwischen ihnen außerhalb der Plattform statt.

AutoRA ist ein Marktplatz zur Vermittlung zwischen Verkäufern und Käufern von Gebrauchtfahrzeugen in Belgien. Die Plattform ist nicht an Transaktionen zwischen Privatpersonen beteiligt und ist keine Vertragspartei der zwischen Nutzern abgeschlossenen Kaufverträge.`,
      },
      {
        title: "2. Hosting",
        body: `Die Website AutoRA.be wird gehostet und bereitgestellt von:

**Netlify, Inc.**
512 2nd Street
San Francisco, CA 94107 — Vereinigte Staaten
Website: https://www.netlify.com

Die Datenbank und Server-Funktionen werden verwaltet von:

**Supabase Inc.**
970 Toa Payoh North, #07-04
Singapore 318992
Website: https://supabase.com`,
      },
      {
        title: "3. Geistiges Eigentum",
        body: `Alle Elemente der Website AutoRA.be (Struktur, Texte, Grafiken, Logos, Icons, Bilder, Software, Datenbank usw.) sind durch das Urheberrecht und das Markenrecht gemäß dem belgischen Wirtschaftsgesetzbuch (Buch XI) geschützt.

Jede Reproduktion, Verbreitung, Änderung, Veröffentlichung oder Anpassung, ganz oder teilweise, der Elemente der Website, mit welchem Mittel oder Verfahren auch immer, ist ohne die vorherige schriftliche Genehmigung von AutoRA strengstens untersagt.

Der Name „AutoRA", das Logo und die zugehörigen grafischen Elemente sind unterscheidungskräftige Zeichen, die AutoRA gehören. Ihre unbefugte Verwendung stellt eine Fälschung dar, die gemäß Art. XI.335 ff. des Wirtschaftsgesetzbuches geahndet wird.`,
      },
      {
        title: "4. Haftung",
        body: `Als Host von nutzergenerierten Inhalten (Anzeigen) genießt AutoRA das beschränkte Haftungsregime gemäß Art. XII.19 des belgischen Wirtschaftsgesetzbuches (Umsetzung der Richtlinie 2000/31/EG). AutoRA ist nicht für von Nutzern veröffentlichte Inhalte verantwortlich, es sei denn, sie handelt nach Bekanntwerden eines offensichtlich rechtswidrigen Inhalts nicht unverzüglich, um diesen zu entfernen.

**Inhaltsmoderation — DSA Art. 16** : AutoRA bearbeitet jede Meldung potenziell rechtswidriger Inhalte innerhalb von **48 Arbeitsstunden** nach Eingang. Um Inhalte zu melden, nutzen Sie die Schaltfläche „Melden" bei der betreffenden Anzeige oder schreiben Sie an autoracontact@gmail.com. Der Melder wird über das Ergebnis seiner Anfrage informiert.

AutoRA haftet nicht für direkte oder indirekte Schäden, die aus der Nutzung der Website oder deren vorübergehender Nichtverfügbarkeit entstehen.`,
      },
      {
        title: "5. Hyperlinks",
        body: `Die Website AutoRA.be kann Links zu Websites Dritter enthalten. Diese Links dienen nur zur Information. AutoRA hat keine Kontrolle über diese Websites und übernimmt keine Verantwortung für deren Inhalt, Datenschutzrichtlinien oder Praktiken.

Das Setzen von Hyperlinks zur Website AutoRA.be erfordert die vorherige schriftliche Zustimmung von AutoRA.`,
      },
      {
        title: "6. Anwendbares Recht und Gerichtsstand",
        body: `Dieses Impressum unterliegt belgischem Recht.

Bei Streitigkeiten sind die Gerichte des Gerichtsbezirks des Wohnsitzes des Herausgebers, Belgien, zuständig, vorbehaltlich zwingender gesetzlicher Bestimmungen. Der genaue Gerichtsbezirk wird bei der endgültigen Eintragung des Herausgebers bei der ZUD (BCE/KBO) angegeben.

Verbraucher können Beschwerden auch beim belgischen Verbraucherschlichtungsdienst einreichen: https://www.mediationconsommateur.be oder über die europäische Online-Streitbeilegungsplattform: https://ec.europa.eu/consumers/odr`,
      },
      {
        title: "7. Schutz personenbezogener Daten",
        body: `Die Verarbeitung personenbezogener Daten der Nutzer wird in unserer Datenschutzerklärung beschrieben, zugänglich unter: https://autora.be/confidentialite

Für Fragen zu Ihren Daten wenden Sie sich an: autoracontact@gmail.com`,
      },
      {
        title: "8. Einheitliche Kontaktstelle (DSA Art. 11 & 12)",
        body: `Gemäß Artikel 11 und 12 der Verordnung (EU) 2022/2065 (Digital Services Act) benennt AutoRA eine einheitliche Kontaktstelle für Behörden, Nutzer und vertrauenswürdige Hinweisgeber:

**Allgemeiner Kontakt (Nutzer, Hinweisgeber)**: autoracontact@gmail.com
**Akzeptierte Sprachen**: Französisch, Niederländisch, Deutsch, Englisch
**Indikative Antwortzeit**: 48 Arbeitsstunden

**Gesetzliche Vertretung in der Union**: Da AutoRA in Belgien ansässig ist, ist kein zusätzlicher gesetzlicher Vertreter (Art. 13 DSA) erforderlich.

Die belgischen Behörden (FÖD Wirtschaft, APD, Justizbehörden) können ihre offiziellen Anfragen an dieselbe Adresse richten und werden vorrangig bearbeitet.`,
      },
    ],
  },
  en: {
    title: "Legal Notice",
    subtitle: "In accordance with the Belgian law of 11 March 2003 on certain legal aspects of information society services",
    sections: [
      {
        title: "1. Website Publisher",
        body: `**Name** : AutoRA.be (hereinafter "AutoRA")
**Status** : Platform in beta phase — public pre-launch
**Publication director** : Alperen Gursever
**Contact address** : autoracontact@gmail.com
**Email** : autoracontact@gmail.com

⚠️ **Beta phase — Non-commercial activity**

AutoRA is currently made available for evaluation and public pre-launch purposes. During this phase :

— No commercial transactions are carried out by the platform itself.
— No payment is processed by AutoRA. Registration and use are free of charge.
— Any transactions between users take place directly between them, outside the platform.

AutoRA is a marketplace connecting sellers and buyers of second-hand vehicles in Belgium. The platform does not take part in transactions between individuals and is not a party to sale contracts concluded between users.`,
      },
      {
        title: "2. Hosting",
        body: `The AutoRA.be website is hosted and deployed by:

**Netlify, Inc.**
512 2nd Street
San Francisco, CA 94107 — United States
Website: https://www.netlify.com

The database and serverless functions are managed by:

**Supabase Inc.**
970 Toa Payoh North, #07-04
Singapore 318992
Website: https://supabase.com`,
      },
      {
        title: "3. Intellectual Property",
        body: `All elements of the AutoRA.be website (structure, texts, graphics, logos, icons, images, software, database, etc.) are protected by copyright and trademark law in accordance with the Belgian Code of Economic Law (Book XI).

Any reproduction, representation, modification, publication, adaptation or exploitation, in whole or in part, of the elements of the website, by any means or process, is strictly prohibited without the prior written authorisation of AutoRA.

The name "AutoRA", the logo and associated graphic elements are distinctive signs belonging to AutoRA. Unauthorised use constitutes infringement punishable under Articles XI.335 et seq. of the Code of Economic Law.`,
      },
      {
        title: "4. Liability",
        body: `As a host of user-generated content (listings), AutoRA benefits from the limited liability regime provided by Article XII.19 of the Belgian Code of Economic Law (implementing Directive 2000/31/EC). AutoRA is not responsible for content published by users, unless, upon being notified of manifestly illegal content, it fails to act promptly to remove it.

**Content moderation — DSA Art. 16** : AutoRA processes any report of potentially illegal content within **48 working hours** of receipt. To report content, use the "Report" button on the relevant listing or write to autoracontact@gmail.com. The reporter will be informed of the outcome of their request.

AutoRA shall not be liable for direct or indirect damages resulting from the use of the website or its temporary unavailability.`,
      },
      {
        title: "5. Hyperlinks",
        body: `The AutoRA.be website may contain links to third-party websites. These links are provided for information purposes only. AutoRA has no control over these websites and disclaims all responsibility for their content, privacy policies or practices.

Creating hyperlinks to the AutoRA.be website requires the prior written consent of AutoRA.`,
      },
      {
        title: "6. Applicable Law and Jurisdiction",
        body: `This legal notice is governed by Belgian law.

In the event of a dispute, the courts of the judicial district of the publisher's domicile, Belgium, shall have jurisdiction, subject to mandatory legal provisions. The exact district will be specified upon the publisher's final registration with the Crossroads Bank for Enterprises (BCE/KBO).

Consumers may also lodge complaints with the Belgian Consumer Mediation Service: https://www.mediationconsommateur.be or via the European online dispute resolution platform: https://ec.europa.eu/consumers/odr`,
      },
      {
        title: "7. Personal Data Protection",
        body: `The processing of users' personal data is described in our privacy policy, accessible at: https://autora.be/confidentialite

For any questions regarding your data, please contact us at: autoracontact@gmail.com`,
      },
      {
        title: "8. Single Point of Contact (DSA Art. 11 & 12)",
        body: `In accordance with Articles 11 and 12 of Regulation (EU) 2022/2065 (Digital Services Act), AutoRA designates a single point of contact for authorities, users and trusted flaggers:

**General contact (users, reporters)**: autoracontact@gmail.com
**Languages accepted**: French, Dutch, German, English
**Indicative response time**: 48 working hours

**Legal representation in the Union**: As AutoRA is established in Belgium, no additional legal representative (Art. 13 DSA) is required.

Belgian authorities (FPS Economy, APD/GBA, judicial authorities) may address their official requests to the same address, where they will be handled as a priority.`,
      },
    ],
  },
};

const MentionsLegales = () => {
  const { language } = useLanguage();
  const lang = (["fr", "nl", "de", "en"] as const).includes(language as "fr" | "nl" | "de" | "en")
    ? (language as "fr" | "nl" | "de" | "en")
    : "fr";
  const t = content[lang];

  const lastUpdated: Record<string, string> = {
    fr: "Dernière mise à jour : mai 2026",
    nl: "Laatste update: mei 2026",
    de: "Letzte Aktualisierung: Mai 2026",
    en: "Last updated: May 2026",
  };

  // C5 — Highlight [...] placeholders that contain a "to be filled" marker so
  // the editor can spot them before publishing. Matches FR/NL/DE/EN keywords.
  const PLACEHOLDER_RE = /\[([^\]]*(?:compl[ée]ter|in te vullen|auszufüllen|to be completed|completed)[^\]]*)\]/gi;

  const renderBody = (body: string) =>
    body.split("\n").map((line, i) => {
      const withPlaceholders = line.replace(
        PLACEHOLDER_RE,
        '<span class="font-bold text-red-500 bg-red-500/10 px-1 rounded">[$1]</span>'
      );
      const bold = withPlaceholders.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return line.trim() === "" ? (
        <br key={i} />
      ) : (
        <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: bold }} />
      );
    });

  // Visual warning banner shown until placeholders are filled
  const placeholderCount = t.sections.reduce(
    (acc, s) => acc + (s.body.match(PLACEHOLDER_RE)?.length ?? 0),
    0
  );

  return (
    <>
      <SEOHead
        title={`${t.title} — AutoRA.be`}
        description={t.subtitle}
        noIndex
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <BackButton to="/" className="mb-6" />
        <h1 className="text-3xl font-bold mb-2 font-display">{t.title}</h1>
        <p className="text-sm text-muted-foreground mb-6 italic">{t.subtitle}</p>

        {placeholderCount > 0 && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-500 font-medium">
              ⚠️ <span className="font-bold">{placeholderCount} champ{placeholderCount > 1 ? "s" : ""}</span> reste{placeholderCount > 1 ? "nt" : ""} à compléter (surlignés en rouge ci-dessous). Remplissez-les depuis le code source avant le lancement public — exigences légales (art. 1.III.7 CDE belge).
            </p>
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
          {lastUpdated[lang]}
        </p>
      </main>
      <Footer />
    </>
  );
};

export default MentionsLegales;
