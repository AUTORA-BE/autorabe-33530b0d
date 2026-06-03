import { Header, Footer, BackButton } from "@/shared/components";
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
  intro: `Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme AutoRA.be (ci-après « AutoRA » ou « la Plateforme »), éditée par Alperen Gursever (personne physique éditrice — phase bêta, pré-lancement public), Belgique. Contact : autoracontact@gmail.com.

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
Pour les véhicules d'occasion immatriculés en Belgique, le vendeur peut soumettre son document Car-Pass depuis son tableau de bord vendeur. Après soumission, l'annonce est marquée « En attente de vérification » jusqu'à validation manuelle par l'équipe AutoRA (délai indicatif : 24-48 heures ouvrables). Les annonces avec Car-Pass vérifié bénéficient d'une meilleure visibilité. AutoRA ne garantit pas l'authenticité des documents soumis — la responsabilité de l'exactitude du kilométrage incombe au vendeur.

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

Tout litige relatif à l'interprétation ou à l'exécution des présentes fera l'objet d'une tentative de résolution amiable préalable. À défaut d'accord dans les 30 jours, les tribunaux compétents seront ceux du ressort de l'arrondissement judiciaire du domicile de l'éditeur, Belgique, sauf disposition légale impérative contraire.

Les consommateurs résidant en Belgique peuvent également recourir au service de médiation pour le consommateur (www.mediationconsommateur.be) ou à la plateforme européenne de résolution des litiges en ligne (https://ec.europa.eu/consumers/odr).`,
    },
  ],
};

const nl = {
  title: "Algemene Gebruiksvoorwaarden",
  subtitle: "Van kracht — mei 2026",
  intro: `Deze Algemene Gebruiksvoorwaarden (hierna « AGV ») regelen de toegang tot en het gebruik van het AutoRA.be platform (hierna « AutoRA » of « het Platform »), uitgegeven door Alperen Gursever (natuurlijke persoon uitgever — bètafase, publieke pre-lancering), België. Contact: autoracontact@gmail.com.

Door toegang te nemen tot het Platform of een account aan te maken, aanvaardt de gebruiker deze AGV zonder voorbehoud. Indien u deze voorwaarden niet aanvaardt, gelieve het Platform niet te gebruiken.

AutoRA behoudt zich het recht voor deze AGV op elk moment te wijzigen. Gebruikers worden van wezenlijke wijzigingen op de hoogte gesteld via e-mail en/of via een melding op het Platform. Het verdere gebruik na kennisgeving geldt als aanvaarding van de nieuwe voorwaarden.`,
  sections: [
    {
      title: "1. Definities",
      body: `**Platform** : de website AutoRA.be en de bijbehorende mobiele applicaties.
**Gebruiker** : elke natuurlijke of rechtspersoon die toegang heeft tot het Platform.
**Verkoper** : gebruiker die één of meer advertenties voor de verkoop van voertuig(en) publiceert.
**Koper** : gebruiker die via het Platform een voertuig wenst te kopen.
**Advertentie** : publicatie met een beschrijving van een te koop aangeboden voertuig.
**Car-Pass** : officieel Belgisch document dat de kilometerstand van een voertuig certificeert.
**Inhoud** : alle informatie, tekst, afbeelding of gegevens gepubliceerd door een gebruiker.`,
    },
    {
      title: "2. Voorwerp en aard van het Platform",
      body: `AutoRA is een marktplaats voor de bemiddeling tussen verkopers en kopers van tweedehandse voertuigen. AutoRA treedt uitsluitend op als technisch tussenpersoon: zij is noch verkoper, noch koper, noch lasthebber van één van de partijen.

AutoRA is geen partij bij de transacties tussen gebruikers en garandeert de totstandkoming van transacties niet. Elke transactie wordt rechtstreeks gesloten tussen de verkoper en de koper, onder hun volledige verantwoordelijkheid.

Professionele verkopers (voertuigenhandelaars, leasing, enz.) zijn verplicht zich als zodanig te identificeren bij de registratie en in hun advertenties, overeenkomstig het Wetboek van economisch recht (art. VI.2 en volgende).`,
    },
    {
      title: "3. Registratie en toegang",
      body: `**3.1 Registratievoorwaarden**
De registratie staat open voor elke meerderjarige natuurlijke persoon (18 jaar of ouder) of elke rechtsgeldig opgerichte rechtspersoon naar Belgisch of buitenlands recht.

De bij de registratie verstrekte informatie moet correct, volledig en actueel zijn. Elke wijziging moet onverwijld worden doorgevoerd.

**3.2 Inloggegevens**
Elke gebruiker is verantwoordelijk voor de vertrouwelijkheid van zijn inloggegevens. Hij verbindt zich ertoe AutoRA onmiddellijk op de hoogte te stellen van elk ongeoorloofd gebruik van zijn account via autoracontact@gmail.com.

AutoRA kan niet aansprakelijk worden gesteld voor de gevolgen van frauduleus gebruik van inloggegevens als gevolg van nalatigheid van de gebruiker.

**3.3 Één account per persoon**
Elke gebruiker mag slechts één persoonlijk account aanmaken. Het aanmaken van meerdere accounts om een schorsing te omzeilen is verboden.`,
    },
    {
      title: "4. Verplichtingen van de gebruikers",
      body: `**4.1 Juistheid van advertenties**
De verkoper garandeert dat alle informatie in zijn advertentie juist, volledig en niet misleidend is, met name:
— de werkelijke kilometerstand van het voertuig (verplichte overeenstemming met de Car-Pass);
— de werkelijke staat van het voertuig (ongelukken, reparaties, bekende zichtbare en niet-zichtbare gebreken);
— de juridische situatie van het voertuig (geen pand, geen beslag, geen lopend leasing);
— het exacte jaar en de exacte versie van het voertuig.

Elke opzettelijke weglating of valse verklaring kan de burgerrechtelijke en strafrechtelijke aansprakelijkheid van de verkoper in het geding brengen.

**4.2 Car-Pass**
Voor tweedehandse voertuigen die in België geregistreerd zijn, kan de verkoper zijn Car-Pass-document indienen via zijn verkopersdashboard. Na indiening wordt de advertentie gemarkeerd als « In afwachting van verificatie » totdat het document handmatig door het AutoRA-team is gevalideerd (indicatieve termijn: 24-48 werkuren). Advertenties met een geverifieerde Car-Pass genieten een betere zichtbaarheid. AutoRA garandeert niet de authenticiteit van ingediende documenten — de verantwoordelijkheid voor de juistheid van de kilometerstand berust bij de verkoper.

**4.3 Foto's**
De gepubliceerde foto's moeten het betrokken voertuig weergeven. Het gebruik van gestolen foto's, software van derden of generieke beelden is verboden.

**4.4 Prijs**
De vermelde prijs moet de werkelijke verkoopprijs zijn. Prijzen « vanaf » of opzettelijk ondergewaardeerde prijzen om verkeer te genereren zijn verboden.`,
    },
    {
      title: "5. Verboden inhoud",
      body: `Het is verboden om op AutoRA te publiceren:
— gestolen voertuigen of voertuigen die het voorwerp zijn van een eigendomsgeschil;
— advertenties van voertuigen die niet voldoen aan de Belgische goedkeuringsnormen;
— pornografische, discriminerende, haatzaaiende of illegale inhoud;
— persoonsgegevens van derden zonder hun toestemming;
— links of doorverwijzingen naar phishing- of frauduleuze sites;
— inhoud met virussen of kwaadaardige code;
— spam of ongevraagde commerciële berichten via het berichtensysteem;
— advertenties voor reserveonderdelen of accessoires buiten de toegestane categorieën;
— alle andere inhoud die in strijd is met het toepasselijke Belgische of Europese recht.

AutoRA behoudt zich het recht voor zonder voorafgaande kennisgeving alle inhoud te verwijderen die in strijd is met deze regels.`,
    },
    {
      title: "6. Moderatie en meldingen",
      body: `**6.1 Moderatie**
AutoRA gaat over tot moderatie van advertenties vóór publicatie (of na publicatie voor bepaalde categorieën). Zij kan elke advertentie weigeren, wijzigen of verwijderen die niet voldoet aan deze AGV of haar redactionele regels.

**6.2 Meldingen**
Elke gebruiker kan illegale of verdachte inhoud melden via het meldingsformulier dat op elke advertentie beschikbaar is. AutoRA verbindt zich ertoe meldingen binnen een redelijke termijn te behandelen, overeenkomstig artikel XII.19 van het Wetboek van economisch recht.

**6.3 Advertentiestatussen**
Advertenties kunnen de volgende statussen hebben: concept, in afwachting van verificatie, goedgekeurd, geweigerd, geschorst. De wijziging van bepaalde gevoelige velden (prijs, kilometerstand, merk, model) van een goedgekeurde advertentie zet deze automatisch terug op de status « in afwachting van verificatie ».`,
    },
    {
      title: "7. Schorsing en beëindiging",
      body: `**7.1 Door AutoRA**
AutoRA kan een account zonder voorafgaande kennisgeving of vergoeding schorsen of beëindigen in geval van:
— schending van deze AGV;
— verstrekking van valse informatie bij de registratie;
— frauduleus gedrag of poging tot manipulatie van het Platform;
— gerechtelijke of administratieve beslissing die dit vereist.

**7.2 Door de gebruiker**
De gebruiker kan zijn account op elk moment sluiten via zijn accountinstellingen of door contact op te nemen met AutoRA. De sluiting leidt tot de verwijdering van persoonsgegevens volgens de modaliteiten beschreven in het privacybeleid.

**7.3 Actieve abonnementen**
In geval van accountbeëindiging met een actief betalend abonnement zijn de bepalingen van de Algemene Verkoopvoorwaarden van toepassing.`,
    },
    {
      title: "8. Betalende diensten en abonnementen",
      body: `AutoRA biedt betalende diensten aan (het uitlichten van advertenties, professionele abonnementen). Deze diensten zijn onderworpen aan de Algemene Verkoopvoorwaarden die beschikbaar zijn op https://autora.be/verkoopvoorwaarden.

De betaling wordt verwerkt door Stripe, Inc. De bankgegevens worden niet doorgegeven via de servers van AutoRA.`,
    },
    {
      title: "9. Aansprakelijkheid van AutoRA",
      body: `**9.1 Beperking**
AutoRA garandeert niet de juistheid van de door gebruikers gepubliceerde informatie, noch de afwezigheid van verborgen gebreken in de verkochte voertuigen. AutoRA is niet verantwoordelijk voor transacties tussen gebruikers, geschillen die daaruit voortvloeien, betalings- of leveringsgebreken.

**9.2 Beschikbaarheid**
AutoRA streeft ernaar het Platform 24/7 beschikbaar te houden, maar kan geen ononderbroken beschikbaarheid garanderen. Onderhoud kan worden uitgevoerd, bij voorkeur buiten de piekuren, met of zonder voorafgaande kennisgeving.

**9.3 Uitsluiting van garantie**
AutoRA sluit elke resultaatsgarantie uit met betrekking tot de gefaciliteerde transacties. Zij is slechts gehouden tot een inspanningsverplichting.`,
    },
    {
      title: "10. Intellectuele eigendom van gebruikersinhoud",
      body: `De gebruiker behoudt de eigendom van zijn inhoud. Door op AutoRA te publiceren, verleent hij AutoRA een niet-exclusieve, wereldwijde, kosteloze, sublicentieerbare en overdraagbare licentie om deze inhoud te gebruiken, te reproduceren, te wijzigen, aan te passen, te publiceren, te vertalen en te verspreiden, uitsluitend voor de werking en promotie van het Platform.

Deze licentie eindigt bij de verwijdering van de inhoud of het account, tenzij de inhoud door andere gebruikers is gedeeld.`,
    },
    {
      title: "11. Bescherming van persoonsgegevens",
      body: `De verwerking van persoonsgegevens van gebruikers wordt geregeld door het privacybeleid van AutoRA, in overeenstemming met de AVG (Verordening EU 2016/679), toegankelijk op: https://autora.be/confidentialite`,
    },
    {
      title: "12. Toepasselijk recht en geschillenbeslechting",
      body: `Deze AGV worden beheerst door het Belgisch recht, met uitsluiting van de conflictregels.

Elk geschil over de interpretatie of uitvoering van deze AGV zal vooraf het voorwerp uitmaken van een poging tot minnelijke schikking. Bij gebrek aan akkoord binnen 30 dagen zijn de rechtbanken bevoegd van het gerechtelijk arrondissement van de woonplaats van de uitgever, België, behoudens dwingende wettelijke bepalingen.

Consumenten die in België verblijven, kunnen ook een beroep doen op de consumentenombudsdienst (www.consumentenombudsdienst.be) of op het Europees platform voor onlinegeschillenbeslechting (https://ec.europa.eu/consumers/odr).`,
    },
  ],
};

const de = {
  title: "Allgemeine Nutzungsbedingungen",
  subtitle: "Gültige Version — Mai 2026",
  intro: `Diese Allgemeinen Nutzungsbedingungen (nachfolgend „ANB") regeln den Zugang zu und die Nutzung der Plattform AutoRA.be (nachfolgend „AutoRA" oder „die Plattform"), herausgegeben von Alperen Gursever (natürliche Person als Herausgeber — Beta-Phase, öffentlicher Pre-Launch), Belgien. Kontakt: autoracontact@gmail.com.

Durch den Zugang zur Plattform oder die Erstellung eines Kontos akzeptiert der Nutzer diese ANB ohne Vorbehalt. Wenn Sie diesen Bedingungen nicht zustimmen, nutzen Sie die Plattform bitte nicht.

AutoRA behält sich das Recht vor, diese ANB jederzeit zu ändern. Die Nutzer werden über wesentliche Änderungen per E-Mail und/oder über eine Benachrichtigung auf der Plattform informiert. Die weitere Nutzung nach der Benachrichtigung gilt als Zustimmung zu den neuen Bedingungen.`,
  sections: [
    {
      title: "1. Begriffsbestimmungen",
      body: `**Plattform** : die Website AutoRA.be und die zugehörigen mobilen Anwendungen.
**Nutzer** : jede natürliche oder juristische Person, die auf die Plattform zugreift.
**Verkäufer** : Nutzer, der eine oder mehrere Fahrzeugverkaufsanzeigen veröffentlicht.
**Käufer** : Nutzer, der über die Plattform ein Fahrzeug erwerben möchte.
**Anzeige** : Veröffentlichung mit einer Beschreibung eines zum Verkauf angebotenen Fahrzeugs.
**Car-Pass** : offizielles belgisches Dokument, das den Kilometerstand eines Fahrzeugs zertifiziert.
**Inhalt** : alle von einem Nutzer veröffentlichten Informationen, Texte, Bilder oder Daten.`,
    },
    {
      title: "2. Gegenstand und Art der Plattform",
      body: `AutoRA ist ein Marktplatz zur Vermittlung zwischen Verkäufern und Käufern von Gebrauchtfahrzeugen. AutoRA handelt ausschließlich als technischer Vermittler: Sie ist weder Verkäufer, noch Käufer, noch Bevollmächtigter einer der Parteien.

AutoRA ist nicht Vertragspartei der zwischen Nutzern abgeschlossenen Transaktionen und garantiert deren Zustandekommen nicht. Jede Transaktion wird direkt zwischen Verkäufer und Käufer unter deren alleiniger Verantwortung abgeschlossen.

Gewerbliche Verkäufer (Fahrzeughändler, Leasing usw.) sind verpflichtet, sich bei der Registrierung und in ihren Anzeigen als solche zu identifizieren, gemäß dem belgischen Wirtschaftsgesetzbuch (Art. VI.2 ff.).`,
    },
    {
      title: "3. Registrierung und Zugang",
      body: `**3.1 Registrierungsvoraussetzungen**
Die Registrierung steht jeder volljährigen natürlichen Person (18 Jahre oder älter) oder jeder nach belgischem oder ausländischem Recht ordnungsgemäß gegründeten juristischen Person offen.

Die bei der Registrierung angegebenen Informationen müssen korrekt, vollständig und aktuell sein. Änderungen müssen unverzüglich vorgenommen werden.

**3.2 Zugangsdaten**
Jeder Nutzer ist für die Vertraulichkeit seiner Zugangsdaten verantwortlich. Er verpflichtet sich, AutoRA unverzüglich über jede unbefugte Nutzung seines Kontos unter autoracontact@gmail.com zu informieren.

AutoRA haftet nicht für die Folgen einer betrügerischen Nutzung der Zugangsdaten aufgrund von Fahrlässigkeit des Nutzers.

**3.3 Ein Konto pro Person**
Jeder Nutzer darf nur ein persönliches Konto erstellen. Das Erstellen mehrerer Konten zum Umgehen einer Sperrung ist verboten.`,
    },
    {
      title: "4. Pflichten der Nutzer",
      body: `**4.1 Richtigkeit der Anzeigen**
Der Verkäufer garantiert, dass alle Informationen in seiner Anzeige korrekt, vollständig und nicht irreführend sind, insbesondere:
— der tatsächliche Kilometerstand des Fahrzeugs (zwingend übereinstimmend mit dem Car-Pass);
— der tatsächliche Zustand des Fahrzeugs (Unfälle, Reparaturen, bekannte sichtbare und nicht sichtbare Mängel);
— die rechtliche Situation des Fahrzeugs (kein Pfand, keine Pfändung, kein laufendes Leasing);
— das genaue Baujahr und die genaue Version des Fahrzeugs.

Jede vorsätzliche Auslassung oder falsche Angabe kann die zivilrechtliche und strafrechtliche Haftung des Verkäufers begründen.

**4.2 Car-Pass**
Für gebrauchte in Belgien zugelassene Fahrzeuge kann der Verkäufer sein Car-Pass-Dokument über sein Verkäufer-Dashboard einreichen. Nach der Einreichung wird die Anzeige als „In Bearbeitung" markiert, bis das Dokument vom AutoRA-Team manuell validiert wurde (Richtwert: 24-48 Arbeitsstunden). Anzeigen mit verifiziertem Car-Pass genießen eine bessere Sichtbarkeit. AutoRA übernimmt keine Garantie für die Echtheit der eingereichten Dokumente — die Verantwortung für die Richtigkeit des Kilometerstandes liegt beim Verkäufer.

**4.3 Fotos**
Die veröffentlichten Fotos müssen das betreffende Fahrzeug zeigen. Die Verwendung gestohlener Fotos, Software Dritter oder generischer Abbildungen ist verboten.

**4.4 Preis**
Der angegebene Preis muss dem tatsächlichen Verkaufspreis entsprechen. Preise „ab" oder absichtlich unterbewertete Preise zur Traffic-Generierung sind verboten.`,
    },
    {
      title: "5. Verbotene Inhalte",
      body: `Es ist verboten, auf AutoRA zu veröffentlichen:
— gestohlene Fahrzeuge oder solche, die Gegenstand eines Eigentumsstreits sind;
— Anzeigen für Fahrzeuge, die nicht den belgischen Zulassungsstandards entsprechen;
— pornografische, diskriminierende, hasserfüllte oder illegale Inhalte;
— personenbezogene Daten Dritter ohne deren Einwilligung;
— Links oder Weiterleitungen zu Phishing- oder betrügerischen Websites;
— Inhalte mit Viren oder Schadcode;
— Spam oder unerwünschte Werbenachrichten über das Nachrichtensystem;
— Anzeigen für Ersatzteile oder Zubehör außerhalb der erlaubten Kategorien;
— alle anderen Inhalte, die gegen belgisches oder europäisches Recht verstoßen.

AutoRA behält sich das Recht vor, Inhalte, die gegen diese Regeln verstoßen, ohne Vorankündigung zu entfernen.`,
    },
    {
      title: "6. Moderation und Meldungen",
      body: `**6.1 Moderation**
AutoRA moderiert Anzeigen vor der Veröffentlichung (oder nach der Veröffentlichung für bestimmte Kategorien). Sie kann jede Anzeige ablehnen, ändern oder entfernen, die diesen ANB oder ihren redaktionellen Richtlinien nicht entspricht.

**6.2 Meldungen**
Jeder Nutzer kann rechtswidrige oder verdächtige Inhalte über das Meldeformular melden, das bei jeder Anzeige zugänglich ist. AutoRA verpflichtet sich, Meldungen innerhalb einer angemessenen Frist zu bearbeiten, gemäß Art. XII.19 des belgischen Wirtschaftsgesetzbuches.

**6.3 Anzeigenstatus**
Anzeigen können folgende Status haben: Entwurf, ausstehende Prüfung, genehmigt, abgelehnt, gesperrt. Die Änderung bestimmter sensibler Felder (Preis, Kilometerstand, Marke, Modell) einer genehmigten Anzeige versetzt diese automatisch in den Status „ausstehende Prüfung".`,
    },
    {
      title: "7. Sperrung und Kündigung",
      body: `**7.1 Durch AutoRA**
AutoRA kann ein Konto ohne Vorankündigung oder Entschädigung sperren oder kündigen bei:
— Verstoß gegen diese ANB;
— Angabe falscher Informationen bei der Registrierung;
— betrügerischem Verhalten oder Manipulationsversuch auf der Plattform;
— gerichtlicher oder behördlicher Entscheidung, die dies erfordert.

**7.2 Durch den Nutzer**
Der Nutzer kann sein Konto jederzeit über seine Kontoeinstellungen oder durch Kontaktaufnahme mit AutoRA schließen. Die Schließung führt zur Löschung der personenbezogenen Daten gemäß den in der Datenschutzerklärung beschriebenen Modalitäten.

**7.3 Aktive Abonnements**
Bei Kontokündigung mit einem aktiven kostenpflichtigen Abonnement gelten die Bestimmungen der Allgemeinen Verkaufsbedingungen.`,
    },
    {
      title: "8. Kostenpflichtige Dienste und Abonnements",
      body: `AutoRA bietet kostenpflichtige Dienste an (Anzeigenhervorhebung, professionelle Abonnements). Diese Dienste unterliegen den Allgemeinen Verkaufsbedingungen, zugänglich unter https://autora.be/cgv.

Die Zahlung wird von Stripe, Inc. abgewickelt. Bankdaten werden nicht über die Server von AutoRA übermittelt.`,
    },
    {
      title: "9. Haftung von AutoRA",
      body: `**9.1 Haftungsbeschränkung**
AutoRA garantiert nicht die Richtigkeit der von Nutzern veröffentlichten Informationen, noch das Fehlen von versteckten Mängeln bei den verkauften Fahrzeugen. AutoRA haftet nicht für Transaktionen zwischen Nutzern, daraus entstehende Streitigkeiten, Zahlungs- oder Lieferausfälle.

**9.2 Verfügbarkeit**
AutoRA bemüht sich, die Plattform 24/7 verfügbar zu halten, kann jedoch keine ununterbrochene Verfügbarkeit garantieren. Wartungsarbeiten können, vorzugsweise außerhalb der Stoßzeiten, mit oder ohne Vorankündigung durchgeführt werden.

**9.3 Gewährleistungsausschluss**
AutoRA schließt jede Ergebnisgarantie hinsichtlich der vermittelten Transaktionen aus. Sie ist lediglich zu einer Bemühenspflicht verpflichtet.`,
    },
    {
      title: "10. Geistiges Eigentum an Nutzerinhalten",
      body: `Der Nutzer behält das Eigentum an seinen Inhalten. Durch die Veröffentlichung auf AutoRA gewährt er AutoRA eine nicht-exklusive, weltweite, kostenlose, unterlizenzierbare und übertragbare Lizenz zur Nutzung, Reproduktion, Änderung, Anpassung, Veröffentlichung, Übersetzung und Verbreitung dieser Inhalte, ausschließlich für den Betrieb und die Bewerbung der Plattform.

Diese Lizenz endet bei der Löschung des Inhalts oder des Kontos, es sei denn, die Inhalte wurden von anderen Nutzern geteilt.`,
    },
    {
      title: "11. Schutz personenbezogener Daten",
      body: `Die Verarbeitung personenbezogener Daten der Nutzer wird durch die Datenschutzerklärung von AutoRA geregelt, die der DSGVO (Verordnung EU 2016/679) entspricht und unter folgender Adresse zugänglich ist: https://autora.be/confidentialite`,
    },
    {
      title: "12. Anwendbares Recht und Streitbeilegung",
      body: `Diese ANB unterliegen belgischem Recht unter Ausschluss der Kollisionsnormen.

Jeder Streit über die Auslegung oder Durchführung dieser ANB wird zunächst einer gütlichen Einigung unterworfen. Wird innerhalb von 30 Tagen keine Einigung erzielt, sind die Gerichte des Gerichtsbezirks des Wohnsitzes des Herausgebers, Belgien, ausschließlich zuständig, vorbehaltlich zwingender gesetzlicher Bestimmungen.

Verbraucher mit Wohnsitz in Belgien können auch den Verbraucherschlichtungsdienst in Anspruch nehmen (www.mediationconsommateur.be) oder die europäische Online-Streitbeilegungsplattform (https://ec.europa.eu/consumers/odr).`,
    },
  ],
};

const en = {
  title: "Terms of Use",
  subtitle: "Version in force — May 2026",
  intro: `These Terms of Use (hereinafter "ToU") govern access to and use of the AutoRA.be platform (hereinafter "AutoRA" or "the Platform"), published by Alperen Gursever (natural person publisher — beta phase, public pre-launch), Belgium. Contact: autoracontact@gmail.com.

By accessing the Platform or creating an account, the user accepts these ToU without reservation. If you do not accept these terms, please do not use the Platform.

AutoRA reserves the right to modify these ToU at any time. Users will be informed of material changes by email and/or by notification on the Platform. Continued use after notification constitutes acceptance of the new terms.`,
  sections: [
    {
      title: "1. Definitions",
      body: `**Platform** : the AutoRA.be website and its associated mobile applications.
**User** : any natural or legal person accessing the Platform.
**Seller** : user publishing one or more vehicle sale listings.
**Buyer** : user seeking to purchase a vehicle via the Platform.
**Listing** : publication describing a vehicle offered for sale.
**Car-Pass** : official Belgian document certifying the mileage of a vehicle.
**Content** : any information, text, image or data published by a user.`,
    },
    {
      title: "2. Purpose and Nature of the Platform",
      body: `AutoRA is a marketplace connecting sellers and buyers of second-hand vehicles. AutoRA acts exclusively as a technical intermediary: it is neither seller, nor buyer, nor agent for any party.

AutoRA is not a party to transactions concluded between users and does not guarantee the completion of transactions. Every transaction is concluded directly between the seller and the buyer under their sole responsibility.

Professional sellers (vehicle dealers, leasing companies, etc.) are required to identify themselves as such when registering and in their listings, in accordance with the Belgian Code of Economic Law (Art. VI.2 et seq.).`,
    },
    {
      title: "3. Registration and Access",
      body: `**3.1 Registration conditions**
Registration is open to any adult natural person (18 years or older) or any legal entity validly incorporated under Belgian or foreign law.

Information provided during registration must be accurate, complete and up to date. Any changes must be updated without delay.

**3.2 Credentials**
Each user is responsible for the confidentiality of their credentials. They undertake to notify AutoRA immediately of any unauthorised use of their account at autoracontact@gmail.com.

AutoRA shall not be liable for the consequences of fraudulent use of credentials due to the user's negligence.

**3.3 One account per person**
Each user may only create one personal account. Creating multiple accounts to circumvent a suspension is prohibited.`,
    },
    {
      title: "4. User Obligations",
      body: `**4.1 Accuracy of listings**
The seller warrants that all information in their listing is accurate, complete and not misleading, in particular:
— the actual mileage of the vehicle (mandatory consistency with the Car-Pass);
— the actual condition of the vehicle (accidents, repairs, known visible and non-visible defects);
— the legal status of the vehicle (no pledge, seizure or ongoing leasing);
— the exact year and version of the vehicle.

Any intentional omission or misrepresentation may engage the seller's civil and criminal liability.

**4.2 Car-Pass**
For second-hand vehicles registered in Belgium, sellers may submit their Car-Pass document from their seller dashboard. After submission, the listing is marked "Pending verification" until the document is manually validated by the AutoRA team (indicative timeframe: 24-48 working hours). Listings with a verified Car-Pass benefit from greater visibility. AutoRA does not guarantee the authenticity of submitted documents — the responsibility for the accuracy of the mileage lies with the seller.

**4.3 Photos**
Published photos must depict the vehicle in question. The use of stolen photos, third-party software or generic visuals is prohibited.

**4.4 Price**
The stated price must be the actual sale price. "From" prices or intentionally undervalued prices to generate traffic are prohibited.`,
    },
    {
      title: "5. Prohibited Content",
      body: `It is prohibited to publish on AutoRA:
— stolen vehicles or those subject to an ownership dispute;
— listings of vehicles that do not comply with Belgian approval standards;
— pornographic, discriminatory, hate-inciting or illegal content;
— personal information of third parties without their consent;
— links or redirects to phishing or fraudulent sites;
— content containing viruses or malicious code;
— spam or unsolicited commercial messages via the messaging system;
— listings for spare parts or accessories outside authorised categories;
— any other content violating applicable Belgian or European law.

AutoRA reserves the right to remove without notice any content that violates these rules.`,
    },
    {
      title: "6. Moderation and Reporting",
      body: `**6.1 Moderation**
AutoRA moderates listings before publication (or after publication for certain categories). It may refuse, modify or remove any listing that does not comply with these ToU or its editorial guidelines.

**6.2 Reporting**
Any user may report illegal or suspicious content via the reporting form available on each listing. AutoRA undertakes to process reports within a reasonable timeframe, in accordance with Article XII.19 of the Belgian Code of Economic Law.

**6.3 Listing statuses**
Listings may have the following statuses: draft, pending verification, approved, rejected, suspended. Modifying certain sensitive fields (price, mileage, make, model) of an approved listing automatically returns it to "pending verification" status.`,
    },
    {
      title: "7. Suspension and Termination",
      body: `**7.1 By AutoRA**
AutoRA may suspend or terminate an account, without notice or compensation, in the event of:
— breach of these ToU;
— provision of false information during registration;
— fraudulent behaviour or attempted manipulation of the Platform;
— judicial or administrative decision requiring it.

**7.2 By the user**
The user may close their account at any time from their account settings or by contacting AutoRA. Closure results in the deletion of personal data as described in the privacy policy.

**7.3 Active subscriptions**
In the event of account termination with an active paid subscription, the provisions of the Terms of Sale apply.`,
    },
    {
      title: "8. Paid Services and Subscriptions",
      body: `AutoRA offers paid services (listing promotion, professional subscriptions). These services are subject to the Terms of Sale accessible at https://autora.be/cgv.

Payment is processed by Stripe, Inc. Banking details do not transit through AutoRA's servers.`,
    },
    {
      title: "9. AutoRA's Liability",
      body: `**9.1 Limitation**
AutoRA does not warrant the accuracy of information published by users, nor the absence of hidden defects in vehicles sold. AutoRA is not responsible for transactions between users, disputes arising therefrom, or payment or delivery failures.

**9.2 Availability**
AutoRA strives to keep the Platform accessible 24/7, but cannot guarantee uninterrupted availability. Maintenance may be performed, preferably during off-peak hours, with or without notice.

**9.3 Exclusion of warranty**
AutoRA excludes any warranty of results regarding facilitated transactions. It is bound only by a best-efforts obligation.`,
    },
    {
      title: "10. Intellectual Property of User Content",
      body: `The user retains ownership of their content. By publishing on AutoRA, they grant AutoRA a non-exclusive, worldwide, royalty-free, sublicensable and transferable licence to use, reproduce, modify, adapt, publish, translate and distribute such content, solely for the purposes of operating and promoting the Platform.

This licence ends upon deletion of the content or account, unless the content has been shared by other users.`,
    },
    {
      title: "11. Personal Data Protection",
      body: `The processing of users' personal data is governed by AutoRA's privacy policy, compliant with the GDPR (EU Regulation 2016/679), accessible at: https://autora.be/confidentialite`,
    },
    {
      title: "12. Applicable Law and Dispute Resolution",
      body: `These ToU are governed by Belgian law, excluding its conflict-of-laws rules.

Any dispute relating to the interpretation or performance of these ToU shall first be subject to an attempt at amicable resolution. Failing agreement within 30 days, the courts of the judicial district of the publisher's domicile, Belgium, shall have exclusive jurisdiction, subject to mandatory legal provisions.

Consumers residing in Belgium may also use the consumer mediation service (www.mediationconsommateur.be) or the European online dispute resolution platform (https://ec.europa.eu/consumers/odr).`,
    },
  ],
};

type Lang = "fr" | "nl" | "de" | "en";
const langs = { fr, nl, de, en };

const lastUpdated: Record<Lang, string> = {
  fr: "Dernière mise à jour : mai 2026",
  nl: "Laatste update: mei 2026",
  de: "Letzte Aktualisierung: Mai 2026",
  en: "Last updated: May 2026",
};

const CGU = () => {
  const { language } = useLanguage();
  const lang: Lang = (["fr", "nl", "de", "en"] as Lang[]).includes(language as Lang)
    ? (language as Lang)
    : "fr";
  const t = langs[lang];

  return (
    <>
      <SEOHead
        title={`${t.title} — AutoRA.be`}
        description="Conditions régissant l'utilisation de la marketplace AutoRA.be"
        noIndex
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <BackButton to="/" className="mb-6" />
        <h1 className="text-3xl font-bold mb-2 font-display">{t.title}</h1>
        <p className="text-sm text-muted-foreground mb-4 italic">{t.subtitle}</p>

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
          {lastUpdated[lang]}
        </p>
      </main>
      <Footer />
    </>
  );
};

export default CGU;
