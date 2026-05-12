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
  title: "Politique de confidentialité",
  subtitle: "Conforme au RGPD (Règlement UE 2016/679) — Version mai 2026",
  intro: `La présente politique de confidentialité décrit la manière dont AutoRA.be (ci-après « AutoRA ») collecte, utilise et protège les données personnelles des utilisateurs de sa plateforme, conformément au Règlement général sur la protection des données (RGPD) et à la loi belge du 30 juillet 2018 relative à la protection des personnes physiques à l'égard des traitements de données à caractère personnel.`,
  sections: [
    {
      title: "1. Responsable du traitement",
      body: `**Responsable du traitement** : AutoRA.be — [Nom complet / Société — à compléter]
**Adresse** : [Adresse — à compléter], Belgique
**Email de contact RGPD** : autoracontact@gmail.com

Pour toute question relative au traitement de vos données personnelles, vous pouvez nous contacter à l'adresse ci-dessus.`,
    },
    {
      title: "2. Données collectées",
      body: `**2.1 Données fournies lors de l'inscription**
— Adresse email (obligatoire)
— Nom et prénom (optionnel)
— Numéro de téléphone (optionnel)
— Type de compte (particulier / professionnel)

**2.2 Données liées aux annonces**
— Informations sur le(s) véhicule(s) (marque, modèle, année, kilométrage, prix, etc.)
— Photos des véhicules
— Documents Car-Pass (si téléchargés)
— Localisation géographique (ville ou commune)

**2.3 Données de navigation**
— Adresse IP
— Type et version du navigateur et du système d'exploitation
— Pages consultées, durée des sessions, clics
— Requêtes de recherche effectuées sur la Plateforme

**2.4 Données de transaction**
— Historique des abonnements et paiements (via Stripe)
— Identifiants de transaction Stripe (nous ne stockons jamais les numéros de carte bancaire)

**2.5 Données de communication**
— Messages échangés entre utilisateurs via le système de messagerie interne
— Contenu des formulaires de contact`,
    },
    {
      title: "3. Finalités et bases légales",
      body: `Conformément à l'article 6 du RGPD, nous traitons vos données sur les bases légales suivantes :

**Exécution du contrat (art. 6.1.b RGPD)**
— Création et gestion de votre compte utilisateur
— Publication et gestion de vos annonces
— Traitement des paiements et abonnements
— Envoi de notifications relatives à vos annonces et messages

**Intérêt légitime (art. 6.1.f RGPD)**
— Prévention de la fraude et sécurité de la Plateforme
— Amélioration de nos services et analyse des usages (données agrégées)
— Modération des contenus

**Obligation légale (art. 6.1.c RGPD)**
— Conservation des données de transaction à des fins comptables et fiscales
— Réponse aux réquisitions judiciaires ou administratives

**Consentement (art. 6.1.a RGPD)**
— Cookies non essentiels et analytics (si vous y avez consenti via notre bandeau)
— Communications marketing (si vous y avez explicitement consenti)`,
    },
    {
      title: "4. Destinataires des données (sous-traitants)",
      body: `Vos données peuvent être transmises aux prestataires suivants, dans le strict cadre de leurs missions :

**Lovable Inc.** (hébergement web et infrastructure applicative)
San Francisco, CA, États-Unis — Données transférées aux États-Unis sur la base de clauses contractuelles types (CCT) approuvées par la Commission européenne.

**Supabase Inc.** (base de données, authentification, stockage de fichiers)
970 Toa Payoh North, Singapore — Données transférées aux États-Unis sur la base de CCT.

**Stripe, Inc.** (traitement des paiements — carte, Bancontact, SEPA)
354 Oyster Point Blvd, South San Francisco, CA, États-Unis — Données transférées aux États-Unis sur la base de CCT. Stripe est certifié PCI DSS niveau 1.

**Resend, Inc.** (envoi d'emails transactionnels)
États-Unis — Données transférées sur la base de CCT. Seuls les emails nécessaires au fonctionnement du service sont transmis.

**Anthropic PBC / Google LLC** (intelligence artificielle — fonctionnalités d'aide à la description et d'estimation fiscale)
États-Unis — Les données envoyées au modèle d'IA (description du véhicule, type de transaction) sont traitées aux États-Unis sur la base de CCT. Aucune donnée directement identifiante (nom, email) n'est transmise au modèle.

**Plausible Analytics** (mesure d'audience anonymisée)
Tallinn, Estonie (UE) — Aucune donnée personnelle identifiable, aucun cookie tiers. Les données restent dans l'Union européenne.

Nous ne vendons jamais vos données à des tiers. Aucun partage à des fins publicitaires tierces.`,
    },
    {
      title: "5. Transferts hors Union européenne",
      body: `Plusieurs de nos prestataires sont établis aux États-Unis. Ces transferts sont encadrés par des clauses contractuelles types (CCT) adoptées par la Commission européenne, conformément à l'article 46 du RGPD, garantissant un niveau de protection adéquat de vos données.

Plausible Analytics est hébergé dans l'UE — aucun transfert hors UE pour cet outil.

Pour obtenir une copie des garanties mises en place, contactez-nous à autoracontact@gmail.com.`,
    },
    {
      title: "6. Durée de conservation",
      body: `**Données de compte** : conservées pendant toute la durée de votre inscription, puis supprimées dans les 30 jours suivant la clôture du compte (sauf obligations légales).

**Annonces** : conservées pendant la durée de publication, puis archivées 12 mois avant suppression définitive.

**Données de transaction** : conservées 10 ans à compter de la transaction (obligation comptable belge — art. III.86 du Code de droit économique).

**Logs de connexion et sécurité** : 12 mois.

**Messages entre utilisateurs** : supprimés lors de la clôture du compte.

**Formulaires de contact** : 3 ans.`,
    },
    {
      title: "7. Vos droits",
      body: `Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :

**Droit d'accès** (art. 15) : obtenir la confirmation que des données vous concernant sont traitées et en obtenir une copie.
**Droit de rectification** (art. 16) : corriger les données inexactes ou incomplètes.
**Droit à l'effacement** (« droit à l'oubli ») (art. 17) : obtenir la suppression de vos données sous certaines conditions. Vous pouvez exercer ce droit directement depuis vos paramètres de compte.
**Droit à la limitation** (art. 18) : obtenir la limitation du traitement dans certains cas.
**Droit à la portabilité** (art. 20) : recevoir vos données dans un format structuré et couramment utilisé.
**Droit d'opposition** (art. 21) : vous opposer à certains traitements basés sur notre intérêt légitime.
**Droit de retirer votre consentement** à tout moment, sans que cela ne remette en cause la licéité des traitements effectués avant le retrait.

Pour exercer vos droits, contactez-nous à : autoracontact@gmail.com

Nous répondrons à votre demande dans un délai maximum de **30 jours**.`,
    },
    {
      title: "8. Droit de plainte",
      body: `Si vous estimez que vos droits ne sont pas respectés, vous avez le droit d'introduire une plainte auprès de l'Autorité de protection des données (APD) :

**Autorité de Protection des Données (APD)**
Rue de la Presse 35 — 1000 Bruxelles
Tél. : +32 (0)2 274 48 00
Email : contact@apd-gba.be
Site web : [https://www.autoriteprotectiondonnees.be](https://www.autoriteprotectiondonnees.be)`,
    },
    {
      title: "9. Cookies",
      body: `**Cookies strictement nécessaires** (pas de consentement requis)
— Gestion de session d'authentification (Supabase)
— Préférences de langue et de thème
— Panier / comparateur de véhicules (sessionStorage)

**Cookies analytiques** (soumis à consentement)
— Plausible Analytics : mesure d'audience anonymisée, sans cookie tiers, sans identifiant persistant. Ces données restent dans l'UE.

**Cookies de paiement** (chargés uniquement sur les pages de paiement)
— Stripe.js : prévention de la fraude (chargé après affichage d'une page de paiement)

Vous pouvez gérer vos préférences à tout moment via le lien « Paramètres cookies » en bas de page ou dans notre [politique de cookies](https://autora.be/cookies).`,
    },
    {
      title: "10. Sécurité des données",
      body: `AutoRA met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
— Chiffrement en transit (TLS 1.3)
— Chiffrement au repos (base de données Supabase)
— Contrôle d'accès par rôle (Row Level Security)
— Authentification sécurisée (hachage bcrypt des mots de passe, JWT)
— Politique de sécurité des contenus (CSP) pour prévenir les injections XSS
— Audits de sécurité réguliers

En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, AutoRA notifiera l'APD dans les 72 heures et vous en informera sans délai injustifié, conformément à l'article 33 du RGPD.`,
    },
    {
      title: "11. Modifications",
      body: `AutoRA se réserve le droit de modifier la présente politique à tout moment. En cas de modification substantielle, vous serez notifié par email et/ou par bannière sur la Plateforme. La date de dernière mise à jour figure en bas de cette page.`,
    },
  ],
};

const nl = {
  title: "Privacybeleid",
  subtitle: "Conform de AVG (EU-verordening 2016/679) — Versie mei 2026",
  intro: `Dit privacybeleid beschrijft hoe AutoRA.be (hierna « AutoRA ») persoonsgegevens van gebruikers verzamelt, gebruikt en beschermt, conform de Algemene Verordening Gegevensbescherming (AVG) en de Belgische wet van 30 juli 2018 betreffende de bescherming van natuurlijke personen met betrekking tot de verwerking van persoonsgegevens.`,
  sections: [
    {
      title: "1. Verwerkingsverantwoordelijke",
      body: `**Verwerkingsverantwoordelijke** : AutoRA.be — [Volledige naam / Vennootschap — in te vullen]
**Adres** : [Adres — in te vullen], België
**GDPR-contactadres** : autoracontact@gmail.com

Voor vragen over de verwerking van uw persoonsgegevens kunt u contact opnemen via bovenstaand adres.`,
    },
    {
      title: "2. Verzamelde gegevens",
      body: `**2.1 Gegevens verstrekt bij registratie**
— E-mailadres (verplicht)
— Voor- en achternaam (optioneel)
— Telefoonnummer (optioneel)
— Accounttype (particulier / professioneel)

**2.2 Advertentiegegevens**
— Voertuiginformatie (merk, model, jaar, kilometerstand, prijs, enz.)
— Foto's van voertuigen
— Car-Pass-documenten (indien geüpload)
— Geografische locatie (stad of gemeente)

**2.3 Navigatiegegevens**
— IP-adres
— Browser- en besturingssysteemtype en -versie
— Bezochte pagina's, sessieduur, klikken
— Zoekopdrachten op het Platform

**2.4 Transactiegegevens**
— Abonnements- en betalingsgeschiedenis (via Stripe)
— Stripe-transactie-ID's (wij slaan nooit creditcardnummers op)

**2.5 Communicatiegegevens**
— Berichten uitgewisseld via het interne berichtensysteem
— Inhoud van contactformulieren`,
    },
    {
      title: "3. Doeleinden en rechtsgronden",
      body: `Conform artikel 6 AVG verwerken wij uw gegevens op de volgende rechtsgronden :

**Uitvoering van de overeenkomst (art. 6.1.b AVG)**
— Aanmaken en beheren van uw gebruikersaccount
— Plaatsen en beheren van uw advertenties
— Verwerking van betalingen en abonnementen
— Verzenden van meldingen over uw advertenties en berichten

**Gerechtvaardigd belang (art. 6.1.f AVG)**
— Fraudepreventie en platformbeveiliging
— Verbetering van onze diensten en gebruiksanalyse (geaggregeerde gegevens)
— Inhoudsmoderatie

**Wettelijke verplichting (art. 6.1.c AVG)**
— Bewaring van transactiegegevens voor boekhoudkundige en fiscale doeleinden
— Beantwoording van gerechtelijke of administratieve verzoeken

**Toestemming (art. 6.1.a AVG)**
— Niet-essentiële cookies en analytics (indien u daarmee hebt ingestemd)
— Marketingcommunicatie (indien u daar uitdrukkelijk mee hebt ingestemd)`,
    },
    {
      title: "4. Ontvangers (verwerkers)",
      body: `Uw gegevens kunnen worden doorgegeven aan de volgende dienstverleners, uitsluitend in het kader van hun opdrachten :

**Lovable Inc.** (webhosting en applicatie-infrastructuur)
San Francisco, CA, Verenigde Staten — Gegevens overgedragen op basis van door de Europese Commissie goedgekeurde standaardcontractbepalingen (SCB).

**Supabase Inc.** (database, authenticatie, bestandsopslag)
Singapore — Gegevens overgedragen naar de VS op basis van SCB.

**Stripe, Inc.** (betalingsverwerking — kaart, Bancontact, SEPA)
South San Francisco, CA, VS — Gegevens overgedragen op basis van SCB. Stripe is PCI DSS niveau 1 gecertificeerd.

**Resend, Inc.** (verzending van transactionele e-mails)
VS — Gegevens overgedragen op basis van SCB. Alleen e-mails die noodzakelijk zijn voor de dienstverlening worden doorgegeven.

**Anthropic PBC / Google LLC** (kunstmatige intelligentie — hulp bij beschrijvingen en fiscale schattingen)
VS — Gegevens verwerkt in de VS op basis van SCB. Geen direct identificeerbare gegevens (naam, e-mail) worden aan het AI-model doorgegeven.

**Plausible Analytics** (geanonimiseerde publieksanalyse)
Tallinn, Estland (EU) — Geen identificeerbare persoonsgegevens, geen cookies van derden. Gegevens blijven in de EU.

Wij verkopen uw gegevens nooit aan derden. Geen gegevens worden gedeeld voor reclamedoeleinden van derden.`,
    },
    {
      title: "5. Doorgifte buiten de Europese Unie",
      body: `Verschillende dienstverleners zijn gevestigd in de VS. Deze doorgiften zijn geregeld door standaardcontractbepalingen (SCB) van de Europese Commissie, conform artikel 46 AVG.

Plausible Analytics is gehost in de EU — geen doorgifte buiten de EU voor dit instrument.

Voor een kopie van de geldende garanties kunt u contact opnemen via autoracontact@gmail.com.`,
    },
    {
      title: "6. Bewaartermijnen",
      body: `**Accountgegevens** : bewaard gedurende uw registratie, daarna verwijderd binnen 30 dagen na accountsluiting (tenzij wettelijk vereist).

**Advertenties** : bewaard gedurende de publicatieperiode, daarna 12 maanden gearchiveerd alvorens definitief te worden verwijderd.

**Transactiegegevens** : 10 jaar bewaard (Belgische boekhoudverplichting — art. III.86 Wetboek van economisch recht).

**Verbindings- en beveiligingslogboeken** : 12 maanden.

**Berichten tussen gebruikers** : verwijderd bij accountsluiting.

**Contactformulieren** : 3 jaar.`,
    },
    {
      title: "7. Uw rechten",
      body: `Conform de AVG (artikelen 15 tot 22) beschikt u over de volgende rechten :

**Recht op inzage** (art. 15) : bevestiging krijgen dat uw gegevens worden verwerkt en een kopie ontvangen.
**Recht op rectificatie** (art. 16) : onjuiste of onvolledige gegevens corrigeren.
**Recht op wissing** (art. 17) : verwijdering van uw gegevens verkrijgen onder bepaalde voorwaarden. U kunt dit recht uitoefenen via uw accountinstellingen.
**Recht op beperking** (art. 18) : beperking van de verwerking verkrijgen in bepaalde gevallen.
**Recht op overdraagbaarheid** (art. 20) : uw gegevens ontvangen in een gestructureerd en gangbaar formaat.
**Recht van bezwaar** (art. 21) : bezwaar maken tegen bepaalde verwerkingen op basis van ons gerechtvaardigd belang.
**Recht om toestemming in te trekken** : op elk moment, zonder afbreuk te doen aan de rechtmatigheid van de verwerking vóór de intrekking.

Om uw rechten uit te oefenen, neem contact op via : autoracontact@gmail.com

Wij beantwoorden uw verzoek binnen maximaal **30 dagen**.`,
    },
    {
      title: "8. Klachtrecht",
      body: `Als u van mening bent dat uw rechten niet worden gerespecteerd, kunt u een klacht indienen bij de Gegevensbeschermingsautoriteit (GBA) :

**Gegevensbeschermingsautoriteit (GBA)**
Drukpersstraat 35 — 1000 Brussel
Tel. : +32 (0)2 274 48 00
E-mail : contact@apd-gba.be
Website : [https://www.gegevensbeschermingsautoriteit.be](https://www.gegevensbeschermingsautoriteit.be)`,
    },
    {
      title: "9. Cookies",
      body: `**Strikt noodzakelijke cookies** (geen toestemming vereist)
— Authenticatiesessiebeheer (Supabase)
— Taal- en themavoorkeuren
— Winkelmandje / voertuigvergelijker (sessionStorage)

**Analytische cookies** (met toestemming)
— Plausible Analytics : geanonimiseerde publieksanalyse, zonder cookies van derden, zonder persistente identifier. Gegevens blijven in de EU.

**Betalingscookies** (alleen geladen op betalingspagina's)
— Stripe.js : fraudepreventie

U kunt uw voorkeuren beheren via de link « Cookie-instellingen » onderaan de pagina of in ons [cookiebeleid](https://autora.be/cookies).`,
    },
    {
      title: "10. Gegevensbeveiliging",
      body: `AutoRA neemt passende technische en organisatorische maatregelen om uw gegevens te beschermen :
— Versleuteling tijdens overdracht (TLS 1.3)
— Versleuteling in rust (Supabase-database)
— Rolgebaseerde toegangscontrole (Row Level Security)
— Veilige authenticatie (bcrypt-wachtwoordhashing, JWT)
— Content Security Policy (CSP) ter voorkoming van XSS-injecties
— Regelmatige beveiligingsaudits

Bij een datalek dat een risico inhoudt voor uw rechten en vrijheden, stelt AutoRA de GBA binnen 72 uur op de hoogte en informeert u zonder onnodige vertraging, conform artikel 33 AVG.`,
    },
    {
      title: "11. Wijzigingen",
      body: `AutoRA behoudt zich het recht voor dit beleid op elk moment te wijzigen. Bij wezenlijke wijzigingen wordt u per e-mail en/of via een banner op het Platform op de hoogte gesteld. De datum van de laatste update staat onderaan deze pagina.`,
    },
  ],
};

const de = {
  title: "Datenschutzerklärung",
  subtitle: "Gemäß DSGVO (EU-Verordnung 2016/679) — Version Mai 2026",
  intro: `Diese Datenschutzerklärung beschreibt, wie AutoRA.be (nachfolgend « AutoRA ») personenbezogene Daten der Nutzer seiner Plattform erhebt, verarbeitet und schützt, gemäß der Datenschutz-Grundverordnung (DSGVO) und dem belgischen Gesetz vom 30. Juli 2018 zum Schutz natürlicher Personen hinsichtlich der Verarbeitung personenbezogener Daten.`,
  sections: [
    {
      title: "1. Verantwortlicher",
      body: `**Verantwortlicher** : AutoRA.be — [Vollständiger Name / Gesellschaft — auszufüllen]
**Adresse** : [Adresse — auszufüllen], Belgien
**DSGVO-Kontakt** : autoracontact@gmail.com

Bei Fragen zur Verarbeitung Ihrer personenbezogenen Daten wenden Sie sich bitte an die oben genannte Adresse.`,
    },
    {
      title: "2. Erhobene Daten",
      body: `**2.1 Bei der Registrierung bereitgestellte Daten**
— E-Mail-Adresse (Pflichtfeld)
— Vor- und Nachname (optional)
— Telefonnummer (optional)
— Kontotyp (Privatperson / gewerblich)

**2.2 Inseratsdaten**
— Fahrzeuginformationen (Marke, Modell, Baujahr, Kilometerstand, Preis usw.)
— Fahrzeugfotos
— Car-Pass-Dokumente (falls hochgeladen)
— Geografischer Standort (Stadt oder Gemeinde)

**2.3 Navigationsdaten**
— IP-Adresse
— Browser- und Betriebssystemtyp und -version
— Besuchte Seiten, Sitzungsdauer, Klicks
— Suchanfragen auf der Plattform

**2.4 Transaktionsdaten**
— Abonnement- und Zahlungsverlauf (über Stripe)
— Stripe-Transaktions-IDs (Kreditkartennummern werden niemals gespeichert)

**2.5 Kommunikationsdaten**
— Über das interne Nachrichtensystem ausgetauschte Nachrichten
— Inhalte von Kontaktformularen`,
    },
    {
      title: "3. Zwecke und Rechtsgrundlagen",
      body: `Gemäß Artikel 6 DSGVO verarbeiten wir Ihre Daten auf folgenden Rechtsgrundlagen :

**Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)**
— Erstellung und Verwaltung Ihres Nutzerkontos
— Veröffentlichung und Verwaltung Ihrer Inserate
— Verarbeitung von Zahlungen und Abonnements
— Versand von Benachrichtigungen zu Ihren Inseraten und Nachrichten

**Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)**
— Betrugsprävention und Plattformsicherheit
— Verbesserung unserer Dienste und Nutzungsanalyse (aggregierte Daten)
— Inhaltsmoderation

**Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)**
— Aufbewahrung von Transaktionsdaten zu buchhalterischen und steuerlichen Zwecken
— Beantwortung gerichtlicher oder behördlicher Anfragen

**Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)**
— Nicht notwendige Cookies und Analytics (sofern Sie dem zugestimmt haben)
— Marketingkommunikation (sofern Sie ausdrücklich zugestimmt haben)`,
    },
    {
      title: "4. Empfänger (Auftragsverarbeiter)",
      body: `Ihre Daten können an folgende Dienstleister weitergegeben werden, ausschließlich im Rahmen ihrer Aufgaben :

**Lovable Inc.** (Web-Hosting und Anwendungsinfrastruktur)
San Francisco, CA, USA — Datenübermittlung in die USA auf Grundlage von Standardvertragsklauseln (SCC), die von der Europäischen Kommission genehmigt wurden.

**Supabase Inc.** (Datenbank, Authentifizierung, Dateispeicherung)
Singapur — Datenübermittlung in die USA auf Grundlage von SCC.

**Stripe, Inc.** (Zahlungsabwicklung — Karte, Bancontact, SEPA)
South San Francisco, CA, USA — Datenübermittlung auf Grundlage von SCC. Stripe ist PCI DSS Level 1 zertifiziert.

**Resend, Inc.** (Versand transaktionaler E-Mails)
USA — Datenübermittlung auf Grundlage von SCC. Nur für den Dienst notwendige E-Mails werden übermittelt.

**Anthropic PBC / Google LLC** (Künstliche Intelligenz — Beschreibungshilfe und Steuereinschätzung)
USA — Daten werden in den USA auf Grundlage von SCC verarbeitet. Keine direkt identifizierenden Daten (Name, E-Mail) werden an das KI-Modell übermittelt.

**Plausible Analytics** (anonymisierte Reichweitenmessung)
Tallinn, Estland (EU) — Keine identifizierbaren personenbezogenen Daten, keine Drittanbieter-Cookies. Daten verbleiben in der EU.

Wir verkaufen Ihre Daten niemals an Dritte. Keine Weitergabe zu Werbezwecken Dritter.`,
    },
    {
      title: "5. Übermittlungen außerhalb der EU",
      body: `Mehrere unserer Dienstleister sind in den USA ansässig. Diese Übermittlungen werden durch Standardvertragsklauseln (SCC) der Europäischen Kommission gemäß Artikel 46 DSGVO geregelt.

Plausible Analytics wird in der EU gehostet — keine Übermittlung außerhalb der EU für dieses Instrument.

Für eine Kopie der geltenden Garantien wenden Sie sich bitte an autoracontact@gmail.com.`,
    },
    {
      title: "6. Speicherdauer",
      body: `**Kontodaten** : für die Dauer der Registrierung gespeichert, danach innerhalb von 30 Tagen nach Kontoschließung gelöscht (sofern keine gesetzliche Aufbewahrungspflicht besteht).

**Inserate** : für die Veröffentlichungsdauer gespeichert, danach 12 Monate archiviert, bevor sie endgültig gelöscht werden.

**Transaktionsdaten** : 10 Jahre aufbewahrt (belgische Buchführungspflicht — Art. III.86 Wirtschaftsgesetzbuch).

**Verbindungs- und Sicherheitsprotokolle** : 12 Monate.

**Nachrichten zwischen Nutzern** : bei Kontoschließung gelöscht.

**Kontaktformulare** : 3 Jahre.`,
    },
    {
      title: "7. Ihre Rechte",
      body: `Gemäß DSGVO (Artikel 15 bis 22) stehen Ihnen folgende Rechte zu :

**Auskunftsrecht** (Art. 15) : Bestätigung erhalten, dass Ihre Daten verarbeitet werden, und eine Kopie erhalten.
**Berichtigungsrecht** (Art. 16) : unrichtige oder unvollständige Daten korrigieren lassen.
**Recht auf Löschung** (Art. 17) : Löschung Ihrer Daten unter bestimmten Voraussetzungen verlangen. Sie können dieses Recht direkt über Ihre Kontoeinstellungen ausüben.
**Recht auf Einschränkung** (Art. 18) : in bestimmten Fällen Einschränkung der Verarbeitung verlangen.
**Recht auf Datenübertragbarkeit** (Art. 20) : Ihre Daten in einem strukturierten und gängigen Format erhalten.
**Widerspruchsrecht** (Art. 21) : der Verarbeitung auf Grundlage unserer berechtigten Interessen widersprechen.
**Recht auf Widerruf der Einwilligung** : jederzeit, ohne Auswirkung auf die Rechtmäßigkeit der vor dem Widerruf erfolgten Verarbeitung.

Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter : autoracontact@gmail.com

Wir beantworten Ihre Anfrage innerhalb von maximal **30 Tagen**.`,
    },
    {
      title: "8. Beschwerderecht",
      body: `Wenn Sie der Ansicht sind, dass Ihre Rechte nicht gewahrt werden, haben Sie das Recht, eine Beschwerde bei der belgischen Datenschutzbehörde (APD/GBA) einzureichen :

**Datenschutzbehörde (APD/GBA)**
Drukpersstraat 35 — 1000 Brüssel
Tel. : +32 (0)2 274 48 00
E-Mail : contact@apd-gba.be
Website : [https://www.autoriteprotectiondonnees.be](https://www.autoriteprotectiondonnees.be)`,
    },
    {
      title: "9. Cookies",
      body: `**Unbedingt notwendige Cookies** (keine Einwilligung erforderlich)
— Authentifizierungs-Sitzungsverwaltung (Supabase)
— Sprach- und Designeinstellungen
— Warenkorb / Fahrzeugvergleich (sessionStorage)

**Analyse-Cookies** (mit Einwilligung)
— Plausible Analytics : anonymisierte Reichweitenmessung, ohne Drittanbieter-Cookies, ohne persistente Kennungen. Daten verbleiben in der EU.

**Zahlungs-Cookies** (nur auf Zahlungsseiten geladen)
— Stripe.js : Betrugsprävention

Sie können Ihre Einstellungen jederzeit über den Link « Cookie-Einstellungen » am Seitenende oder in unserer [Cookie-Richtlinie](https://autora.be/cookies) verwalten.`,
    },
    {
      title: "10. Datensicherheit",
      body: `AutoRA trifft angemessene technische und organisatorische Maßnahmen zum Schutz Ihrer Daten :
— Verschlüsselung bei der Übertragung (TLS 1.3)
— Verschlüsselung im Ruhezustand (Supabase-Datenbank)
— Rollenbasierte Zugangskontrolle (Row Level Security)
— Sichere Authentifizierung (bcrypt-Passwort-Hashing, JWT)
— Content Security Policy (CSP) zur Verhinderung von XSS-Injektionen
— Regelmäßige Sicherheitsaudits

Bei einer Datenpanne, die ein Risiko für Ihre Rechte und Freiheiten darstellt, benachrichtigt AutoRA die APD/GBA innerhalb von 72 Stunden und informiert Sie unverzüglich gemäß Artikel 33 DSGVO.`,
    },
    {
      title: "11. Änderungen",
      body: `AutoRA behält sich das Recht vor, diese Erklärung jederzeit zu ändern. Bei wesentlichen Änderungen werden Sie per E-Mail und/oder über ein Banner auf der Plattform informiert. Das Datum der letzten Aktualisierung finden Sie am Ende dieser Seite.`,
    },
  ],
};

const en = {
  title: "Privacy Policy",
  subtitle: "Compliant with GDPR (EU Regulation 2016/679) — Version May 2026",
  intro: `This privacy policy describes how AutoRA.be (hereinafter « AutoRA ») collects, uses and protects the personal data of users of its platform, in accordance with the General Data Protection Regulation (GDPR) and the Belgian law of 30 July 2018 on the protection of natural persons with regard to the processing of personal data.`,
  sections: [
    {
      title: "1. Data Controller",
      body: `**Data Controller** : AutoRA.be — [Full name / Company — to be completed]
**Address** : [Address — to be completed], Belgium
**GDPR contact** : autoracontact@gmail.com

For any questions regarding the processing of your personal data, please contact us at the above address.`,
    },
    {
      title: "2. Data Collected",
      body: `**2.1 Data provided upon registration**
— Email address (required)
— First and last name (optional)
— Phone number (optional)
— Account type (private / professional)

**2.2 Listing data**
— Vehicle information (make, model, year, mileage, price, etc.)
— Vehicle photos
— Car-Pass documents (if uploaded)
— Geographic location (town or municipality)

**2.3 Navigation data**
— IP address
— Browser and operating system type and version
— Pages visited, session duration, clicks
— Search queries made on the Platform

**2.4 Transaction data**
— Subscription and payment history (via Stripe)
— Stripe transaction identifiers (credit card numbers are never stored)

**2.5 Communication data**
— Messages exchanged via the internal messaging system
— Content of contact forms`,
    },
    {
      title: "3. Purposes and Legal Bases",
      body: `In accordance with Article 6 of the GDPR, we process your data on the following legal bases :

**Performance of a contract (Art. 6(1)(b) GDPR)**
— Creating and managing your user account
— Publishing and managing your listings
— Processing payments and subscriptions
— Sending notifications about your listings and messages

**Legitimate interest (Art. 6(1)(f) GDPR)**
— Fraud prevention and platform security
— Improvement of our services and usage analysis (aggregated data)
— Content moderation

**Legal obligation (Art. 6(1)(c) GDPR)**
— Retention of transaction data for accounting and tax purposes
— Responding to judicial or administrative requests

**Consent (Art. 6(1)(a) GDPR)**
— Non-essential cookies and analytics (if you have consented via our banner)
— Marketing communications (if you have explicitly consented)`,
    },
    {
      title: "4. Recipients (Sub-processors)",
      body: `Your data may be shared with the following service providers, strictly within the scope of their services :

**Lovable Inc.** (web hosting and application infrastructure)
San Francisco, CA, United States — Data transferred to the US under Standard Contractual Clauses (SCCs) approved by the European Commission.

**Supabase Inc.** (database, authentication, file storage)
Singapore — Data transferred to the US under SCCs.

**Stripe, Inc.** (payment processing — card, Bancontact, SEPA)
South San Francisco, CA, United States — Data transferred under SCCs. Stripe is PCI DSS Level 1 certified.

**Resend, Inc.** (transactional email delivery)
United States — Data transferred under SCCs. Only emails necessary for the service are transmitted.

**Anthropic PBC / Google LLC** (artificial intelligence — description assistance and tax estimation)
United States — Data processed in the US under SCCs. No directly identifying data (name, email) is transmitted to the AI model.

**Plausible Analytics** (anonymised audience measurement)
Tallinn, Estonia (EU) — No identifiable personal data, no third-party cookies. Data remains within the EU.

We never sell your data to third parties. No sharing for third-party advertising purposes.`,
    },
    {
      title: "5. Transfers Outside the European Union",
      body: `Several of our service providers are established in the United States. These transfers are governed by Standard Contractual Clauses (SCCs) adopted by the European Commission, in accordance with Article 46 of the GDPR.

Plausible Analytics is hosted within the EU — no transfer outside the EU for this tool.

To obtain a copy of the safeguards in place, please contact us at autoracontact@gmail.com.`,
    },
    {
      title: "6. Retention Periods",
      body: `**Account data** : retained for the duration of your registration, then deleted within 30 days of account closure (unless legally required).

**Listings** : retained for the publication period, then archived for 12 months before permanent deletion.

**Transaction data** : retained for 10 years from the transaction (Belgian accounting obligation — Art. III.86 of the Code of Economic Law).

**Connection and security logs** : 12 months.

**Messages between users** : deleted upon account closure.

**Contact forms** : 3 years.`,
    },
    {
      title: "7. Your Rights",
      body: `In accordance with the GDPR (Articles 15 to 22), you have the following rights :

**Right of access** (Art. 15) : obtain confirmation that your data is being processed and receive a copy.
**Right to rectification** (Art. 16) : correct inaccurate or incomplete data.
**Right to erasure** ("right to be forgotten") (Art. 17) : obtain deletion of your data under certain conditions. You can exercise this right directly from your account settings.
**Right to restriction** (Art. 18) : obtain restriction of processing in certain cases.
**Right to data portability** (Art. 20) : receive your data in a structured and commonly used format.
**Right to object** (Art. 21) : object to certain processing based on our legitimate interests.
**Right to withdraw consent** : at any time, without affecting the lawfulness of processing carried out before withdrawal.

To exercise your rights, contact us at : autoracontact@gmail.com

We will respond to your request within a maximum of **30 days**.`,
    },
    {
      title: "8. Right to Complain",
      body: `If you believe your rights are not being respected, you have the right to lodge a complaint with the Belgian Data Protection Authority (APD/GBA) :

**Data Protection Authority (APD/GBA)**
Rue de la Presse 35 — 1000 Brussels
Tel. : +32 (0)2 274 48 00
Email : contact@apd-gba.be
Website : [https://www.autoriteprotectiondonnees.be](https://www.autoriteprotectiondonnees.be)`,
    },
    {
      title: "9. Cookies",
      body: `**Strictly necessary cookies** (no consent required)
— Authentication session management (Supabase)
— Language and theme preferences
— Shopping basket / vehicle comparator (sessionStorage)

**Analytics cookies** (subject to consent)
— Plausible Analytics : anonymised audience measurement, no third-party cookies, no persistent identifiers. Data remains in the EU.

**Payment cookies** (loaded only on payment pages)
— Stripe.js : fraud prevention

You can manage your preferences at any time via the « Cookie settings » link at the bottom of the page or in our [cookie policy](https://autora.be/cookies).`,
    },
    {
      title: "10. Data Security",
      body: `AutoRA implements appropriate technical and organisational measures to protect your data :
— Encryption in transit (TLS 1.3)
— Encryption at rest (Supabase database)
— Role-based access control (Row Level Security)
— Secure authentication (bcrypt password hashing, JWT)
— Content Security Policy (CSP) to prevent XSS injections
— Regular security audits

In the event of a data breach likely to result in a risk to your rights and freedoms, AutoRA will notify the APD/GBA within 72 hours and inform you without undue delay, in accordance with Article 33 of the GDPR.`,
    },
    {
      title: "11. Amendments",
      body: `AutoRA reserves the right to modify this policy at any time. In the event of a substantial modification, you will be notified by email and/or via a banner on the Platform. The date of the last update appears at the bottom of this page.`,
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

const Confidentialite = () => {
  const { language } = useLanguage();
  const lang: Lang = (["fr", "nl", "de", "en"] as const).includes(language as Lang)
    ? (language as Lang)
    : "fr";
  const t = langs[lang];

  return (
    <>
      <SEOHead
        title={`${t.title} — AutoRA.be`}
        description="Politique de confidentialité et protection des données personnelles RGPD"
        noIndex
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 font-display">{t.title}</h1>
        <p className="text-sm text-muted-foreground mb-8 italic">{t.subtitle}</p>

        <div className="text-sm text-muted-foreground leading-relaxed mb-10 p-4 bg-muted/30 rounded-xl border border-border/20">
          <p>{t.intro}</p>
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

export default Confidentialite;
