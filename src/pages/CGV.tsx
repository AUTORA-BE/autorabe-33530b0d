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
  title: "Conditions Générales de Vente",
  subtitle: "Abonnements et services payants — Version mai 2026",
  intro: `Les présentes Conditions Générales de Vente (ci-après « CGV ») s'appliquent à tous les achats de services payants effectués sur la plateforme AutoRA.be (ci-après « AutoRA »), éditée par Alperen Gursever (personne physique éditrice — phase bêta, pré-lancement public), Belgique. Contact : autoracontact@gmail.com.

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

Durant la phase bêta, AutoRA n'est pas assujettie à la TVA et aucun service payant n'est facturé. Les factures électroniques (au format PDF, disponibles dans l'espace client) seront émises dès l'activation des fonctionnalités payantes, avec mention du numéro BCE et, le cas échéant, du numéro de TVA de l'éditeur.`,
    },
    {
      title: "8. Service après-vente et litiges",
      body: `Pour toute question relative à une commande, contactez-nous à autoracontact@gmail.com.

**Médiation** : Conformément à l'article VI.73 du Code de droit économique, tout consommateur peut recourir gratuitement au service de médiation pour le consommateur en cas de litige non résolu : [https://www.mediationconsommateur.be](https://www.mediationconsommateur.be)

**Plateforme ODR** : [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr)`,
    },
    {
      title: "9. Droit applicable",
      body: `Les présentes CGV sont régies par le droit belge. Tout litige est soumis à la compétence exclusive des tribunaux de l'arrondissement judiciaire du domicile de l'éditeur, Belgique, sous réserve des dispositions légales impératives applicables aux consommateurs.`,
    },
  ],
};

const nl = {
  title: "Algemene Verkoopvoorwaarden",
  subtitle: "Abonnementen en betalende diensten — Versie mei 2026",
  intro: `Deze Algemene Verkoopvoorwaarden (hierna « AVV ») zijn van toepassing op alle aankopen van betalende diensten op het AutoRA.be platform, uitgegeven door Alperen Gursever (natuurlijke persoon uitgever — bètafase, publieke pre-lancering), België. Contact: autoracontact@gmail.com.

Deze AVV vormen het contract tussen AutoRA en de koper. Zij hebben voorrang op elk document van de koper.`,
  sections: [
    {
      title: "1. Aanbod en diensten",
      body: `AutoRA biedt de volgende betalende diensten aan:

**Advertentieboost** : het uitlichten van een specifieke advertentie in de zoekresultaten gedurende een bepaalde periode.
**Professioneel abonnement** : toegang tot geavanceerde functies voor professionele verkopers (advertentiequotum, statistieken, pro-badge, enz.).

De gedetailleerde kenmerken en prijzen van elk aanbod zijn beschikbaar op https://autora.be/pricing.

Prijzen zijn vermeld in euro (EUR), inclusief alle belastingen (BTW inbegrepen) voor Belgische consumenten. Voor professionele klanten die BTW-plichtig zijn, wordt de toepasselijke Belgische BTW op de factuur vermeld.`,
    },
    {
      title: "2. Bestelproces",
      body: `**2.1 Stappen**
Om een betalende dienst af te nemen, moet de gebruiker:
1. Ingelogd zijn op zijn AutoRA-account;
2. Het gewenste aanbod selecteren;
3. De vóór de betaling samengevatte kenmerken en prijs verifiëren;
4. Zijn betalingsgegevens invoeren via Stripe;
5. De bestelling bevestigen.

**2.2 Bevestiging**
Een bevestigingsmail wordt verzonden naar het e-mailadres van het account binnen enkele minuten na de betaling. Deze e-mail geldt als bewijs van de transactie.

**2.3 Factuur**
Een elektronische factuur is beschikbaar in de klantenruimte voor elke transactie.`,
    },
    {
      title: "3. Betaling",
      body: `**3.1 Verwerker**
Betalingen worden verwerkt door **Stripe, Inc.** (354 Oyster Point Blvd, South San Francisco, CA 94080, VS), gecertificeerd PCI DSS niveau 1. AutoRA heeft nooit toegang tot uw volledige bankgegevens.

**3.2 Aanvaarde betaalmiddelen**
— Bankkaart (Visa, Mastercard, American Express)
— Bancontact

**3.3 Beveiliging**
Alle transacties zijn beveiligd met TLS-versleuteling. Kaarten worden door Stripe getokeniseerd.

**3.4 Automatische verlenging (abonnementen)**
Abonnementen worden automatisch verlengd bij het verstrijken, tenzij vooraf opgezegd. Het verlengingsbedrag komt overeen met het tarief dat op het moment van verlenging van kracht is. U wordt 7 dagen voor de verlenging per e-mail op de hoogte gesteld.`,
    },
    {
      title: "4. Herroepingsrecht",
      body: `**4.1 Principe**
Overeenkomstig artikel VI.47 van het Belgisch Wetboek van economisch recht (omzetting van richtlijn 2011/83/EU) beschikt de consument over een herroepingstermijn van **14 kalenderdagen** vanaf de contractsluiting om zijn herroepingsrecht uit te oefenen, zonder zijn beslissing te moeten rechtvaardigen of een boete te betalen.

**4.2 Uitoefening van het recht**
Om uw herroepingsrecht uit te oefenen, moet u AutoRA per e-mail op de hoogte stellen via autoracontact@gmail.com met duidelijke vermelding van uw intentie om te herroepen.

**4.3 Uitzonderingen**
Overeenkomstig artikel VI.53 van het Wetboek van economisch recht is het herroepingsrecht niet van toepassing op:
— Digitale inhoud op immateriële drager waarvan de uitvoering is begonnen met de uitdrukkelijke voorafgaande toestemming van de consument en zijn uitdrukkelijke afstand van zijn herroepingsrecht;
— Volledig uitgevoerde diensten vóór het einde van de herroepingstermijn, met de uitdrukkelijke voorafgaande toestemming van de consument.

**4.4 Modelformulier voor herroeping**
Te sturen naar autoracontact@gmail.com:
« Ik/Wij deel/delen u hierbij mede dat ik/wij herroep/herroepen van het contract betreffende [gekochte dienst], besteld op [datum], onder transactienummer [Stripe ID]. Naam: [uw naam]. Datum: [datum]. »

**4.5 Terugbetaling**
Bij geldige herroeping verwerkt AutoRA de terugbetaling binnen 14 dagen na ontvangst van de kennisgeving, via hetzelfde betaalmiddel als dat bij de oorspronkelijke transactie is gebruikt.`,
    },
    {
      title: "5. Duur en opzegging van abonnementen",
      body: `**5.1 Duur**
Abonnementen worden afgesloten voor een duur van één maand (of één jaar afhankelijk van het gekozen aanbod), automatisch verlengbaar.

**5.2 Opzegging door de gebruiker**
De gebruiker kan zijn abonnement op elk moment opzeggen via zijn klantenruimte (Instellingen → Abonnement → Opzeggen). De opzegging gaat in aan het einde van de lopende periode, zonder terugbetaling van het niet-gebruikte gedeelte, tenzij wettelijk anders bepaald.

**5.3 Opzegging door AutoRA**
AutoRA kan een abonnement opzeggen met pro-rata terugbetaling bij sluiting van de dienst, of zonder terugbetaling bij ernstige schending van de AGV door de gebruiker.`,
    },
    {
      title: "6. Garanties en aansprakelijkheid",
      body: `**6.1 Inspanningsverplichting**
AutoRA verbindt zich ertoe de geabonneerde diensten online te brengen binnen de aangekondigde termijnen. In geval van een technische storing die aan AutoRA te wijten is en die de uitvoering van de dienst meer dan 24 opeenvolgende uren verhindert, zal een gelijkwaardig tegoed worden aangeboden.

**6.2 Aansprakelijkheidsbeperking**
De aansprakelijkheid van AutoRA is beperkt tot het bedrag dat voor de betrokken dienst is betaald in de afgelopen 12 maanden. AutoRA is niet aansprakelijk voor indirecte verliezen (winstderving, verlies van klanten).

**6.3 Overmacht**
AutoRA kan niet aansprakelijk worden gesteld voor het niet-nakomen van haar verplichtingen in geval van overmacht, overeenkomstig artikel 7.1.1 van het nieuwe Belgisch Burgerlijk Wetboek.`,
    },
    {
      title: "7. Facturatie en BTW",
      body: `Professionele gebruikers (verkopers die bij de registratie als professioneel zijn opgegeven) kunnen hun intracommunautair BTW-nummer opgeven om te profiteren van het verleggingsmechanisme dat van toepassing is op B2B-diensten.

Tijdens de bètafase is AutoRA niet BTW-plichtig en wordt er geen enkele betalende dienst gefactureerd. Elektronische facturen (PDF, beschikbaar in de klantenruimte) zullen worden uitgereikt zodra de betalende functies geactiveerd zijn, met vermelding van het KBO-nummer en, in voorkomend geval, het BTW-nummer van de uitgever.`,
    },
    {
      title: "8. Klantenservice en geschillen",
      body: `Voor vragen over een bestelling, neem contact met ons op via autoracontact@gmail.com.

**Bemiddeling** : Overeenkomstig artikel VI.73 van het Wetboek van economisch recht kan elke consument kosteloos een beroep doen op de consumentenombudsdienst in geval van een onopgelost geschil: [https://www.consumentenombudsdienst.be](https://www.consumentenombudsdienst.be)

**ODR-platform** : [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr)`,
    },
    {
      title: "9. Toepasselijk recht",
      body: `Deze AVV worden beheerst door het Belgisch recht. Elk geschil valt onder de exclusieve bevoegdheid van de rechtbanken van het gerechtelijk arrondissement van de woonplaats van de uitgever, België, onder voorbehoud van de dwingende wettelijke bepalingen die op consumenten van toepassing zijn.`,
    },
  ],
};

const de = {
  title: "Allgemeine Verkaufsbedingungen",
  subtitle: "Abonnements und kostenpflichtige Dienste — Version Mai 2026",
  intro: `Diese Allgemeinen Verkaufsbedingungen (nachfolgend „AVB") gelten für alle Käufe kostenpflichtiger Dienste auf der Plattform AutoRA.be (nachfolgend „AutoRA"), herausgegeben von Alperen Gursever (natürliche Person als Herausgeber — Beta-Phase, öffentlicher Pre-Launch), Belgien. Kontakt: autoracontact@gmail.com.

Diese AVB bilden den zwischen AutoRA und dem Käufer geschlossenen Vertrag. Sie haben Vorrang vor allen Dokumenten des Käufers.`,
  sections: [
    {
      title: "1. Angebote und Dienste",
      body: `AutoRA bietet folgende kostenpflichtige Dienste an:

**Anzeigen-Boost** : Hervorhebung einer bestimmten Anzeige in den Suchergebnissen für eine festgelegte Dauer.
**Professionelles Abonnement** : Zugang zu erweiterten Funktionen für professionelle Verkäufer (Anzeigenkontingent, Statistiken, Pro-Badge usw.).

Die detaillierten Merkmale und Preise jedes Angebots sind unter https://autora.be/pricing verfügbar.

Preise sind in Euro (EUR) angegeben, inklusive aller Steuern (inkl. MwSt.) für belgische Verbraucher. Für MwSt.-pflichtige gewerbliche Kunden wird die anwendbare belgische MwSt. auf der Rechnung ausgewiesen.`,
    },
    {
      title: "2. Bestellprozess",
      body: `**2.1 Schritte**
Um einen kostenpflichtigen Dienst zu abonnieren, muss der Nutzer:
1. In seinem AutoRA-Konto eingeloggt sein;
2. Das gewünschte Angebot auswählen;
3. Die vor der Zahlung zusammengefassten Merkmale und den Preis überprüfen;
4. Seine Zahlungsdaten über Stripe eingeben;
5. Die Bestellung bestätigen.

**2.2 Bestätigung**
Eine Bestätigungs-E-Mail wird innerhalb weniger Minuten nach der Zahlung an die mit dem Konto verknüpfte E-Mail-Adresse gesendet. Diese E-Mail dient als Transaktionsnachweis.

**2.3 Rechnung**
Eine elektronische Rechnung ist im Kundenbereich für jede Transaktion verfügbar.`,
    },
    {
      title: "3. Zahlung",
      body: `**3.1 Zahlungsdienstleister**
Zahlungen werden von **Stripe, Inc.** (354 Oyster Point Blvd, South San Francisco, CA 94080, USA), PCI DSS Level 1 zertifiziert, abgewickelt. AutoRA hat niemals Zugang zu Ihren vollständigen Bankdaten.

**3.2 Akzeptierte Zahlungsmittel**
— Bankkarte (Visa, Mastercard, American Express)
— Bancontact

**3.3 Sicherheit**
Alle Transaktionen sind durch TLS-Verschlüsselung gesichert. Karten werden von Stripe tokenisiert.

**3.4 Automatische Verlängerung (Abonnements)**
Abonnements werden automatisch bei Ablauf verlängert, sofern sie nicht vorher gekündigt werden. Der Verlängerungsbetrag entspricht dem zum Zeitpunkt der Verlängerung geltenden Tarif. Sie werden 7 Tage vor der Verlängerung per E-Mail benachrichtigt.`,
    },
    {
      title: "4. Widerrufsrecht",
      body: `**4.1 Grundsatz**
Gemäß Art. VI.47 des belgischen Wirtschaftsgesetzbuches (Umsetzung der Richtlinie 2011/83/EU) hat der Verbraucher das Recht, den Vertrag innerhalb von **14 Kalendertagen** ab Vertragsabschluss ohne Angabe von Gründen und ohne Zahlung einer Vertragsstrafe zu widerrufen.

**4.2 Ausübung des Rechts**
Um Ihr Widerrufsrecht auszuüben, müssen Sie AutoRA per E-Mail an autoracontact@gmail.com informieren und Ihre Widerrufsabsicht klar angeben.

**4.3 Ausnahmen**
Gemäß Art. VI.53 des Wirtschaftsgesetzbuches gilt das Widerrufsrecht nicht für:
— Digitale Inhalte auf nicht-körperlichem Träger, deren Ausführung mit ausdrücklicher vorheriger Zustimmung des Verbrauchers und seinem ausdrücklichen Verzicht auf sein Widerrufsrecht begonnen hat;
— Vollständig erbrachte Dienstleistungen vor Ablauf der Widerrufsfrist mit ausdrücklicher vorheriger Zustimmung des Verbrauchers.

**4.4 Muster-Widerrufsformular**
An autoracontact@gmail.com senden:
„Ich/Wir widerrufe/widerrufen hiermit den Vertrag über [gekaufter Dienst], bestellt am [Datum], unter Transaktionsnummer [Stripe-ID]. Name: [Ihr Name]. Datum: [Datum]."

**4.5 Erstattung**
Bei gültigem Widerruf erstattet AutoRA den Betrag innerhalb von 14 Tagen nach Eingang der Mitteilung über dasselbe Zahlungsmittel, das bei der ursprünglichen Transaktion verwendet wurde.`,
    },
    {
      title: "5. Laufzeit und Kündigung von Abonnements",
      body: `**5.1 Laufzeit**
Abonnements werden für eine Laufzeit von einem Monat (oder einem Jahr je nach gewähltem Angebot) abgeschlossen und automatisch verlängert.

**5.2 Kündigung durch den Nutzer**
Der Nutzer kann sein Abonnement jederzeit über seinen Kundenbereich kündigen (Einstellungen → Abonnement → Kündigen). Die Kündigung wird zum Ende der laufenden Periode wirksam, ohne anteilige Erstattung des nicht genutzten Zeitraums, sofern gesetzlich nicht anderes vorgeschrieben.

**5.3 Kündigung durch AutoRA**
AutoRA kann ein Abonnement mit anteiliger Erstattung bei Schließung des Dienstes oder ohne Erstattung bei schwerwiegendem Verstoß gegen die ANB durch den Nutzer kündigen.`,
    },
    {
      title: "6. Gewährleistungen und Haftung",
      body: `**6.1 Bemühenspflicht**
AutoRA verpflichtet sich, die abonnierten Dienste innerhalb der angekündigten Fristen bereitzustellen. Bei einer AutoRA zuzurechnenden technischen Störung, die die Erbringung des Dienstes für mehr als 24 aufeinanderfolgende Stunden verhindert, wird ein gleichwertiges Guthaben angeboten.

**6.2 Haftungsbeschränkung**
Die Haftung von AutoRA ist auf den für den betreffenden Dienst in den letzten 12 Monaten gezahlten Betrag begrenzt. AutoRA haftet nicht für mittelbare Schäden (entgangener Gewinn, Kundenverlust).

**6.3 Höhere Gewalt**
AutoRA kann nicht für die Nichterfüllung ihrer Verpflichtungen im Falle höherer Gewalt haftbar gemacht werden, gemäß Art. 7.1.1 des neuen belgischen Zivilgesetzbuches.`,
    },
    {
      title: "7. Rechnungsstellung und Mehrwertsteuer",
      body: `Gewerbliche Nutzer (bei der Registrierung als professionell gemeldete Verkäufer) können ihre innergemeinschaftliche Umsatzsteuer-ID angeben, um vom Reverse-Charge-Mechanismus für B2B-Dienstleistungen zu profitieren.

Während der Beta-Phase ist AutoRA nicht mehrwertsteuerpflichtig und es werden keine kostenpflichtigen Dienste in Rechnung gestellt. Elektronische Rechnungen (PDF, im Kundenbereich verfügbar) werden ausgestellt, sobald die kostenpflichtigen Funktionen aktiviert sind, mit Angabe der ZUD-Nummer (BCE/KBO) und gegebenenfalls der USt-IdNr. des Herausgebers.`,
    },
    {
      title: "8. Kundendienst und Streitbeilegung",
      body: `Bei Fragen zu einer Bestellung wenden Sie sich an autoracontact@gmail.com.

**Schlichtung** : Gemäß Art. VI.73 des Wirtschaftsgesetzbuches kann jeder Verbraucher bei einem ungelösten Streit kostenlos den Verbraucherschlichtungsdienst in Anspruch nehmen: [https://www.mediationconsommateur.be](https://www.mediationconsommateur.be)

**ODR-Plattform** : [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr)`,
    },
    {
      title: "9. Anwendbares Recht",
      body: `Diese AVB unterliegen belgischem Recht. Alle Streitigkeiten fallen unter die ausschließliche Zuständigkeit der Gerichte des Gerichtsbezirks des Wohnsitzes des Herausgebers, Belgien, vorbehaltlich der auf Verbraucher anwendbaren zwingenden gesetzlichen Bestimmungen.`,
    },
  ],
};

const en = {
  title: "Terms of Sale",
  subtitle: "Subscriptions and paid services — Version May 2026",
  intro: `These Terms of Sale (hereinafter "ToS") apply to all purchases of paid services made on the AutoRA.be platform (hereinafter "AutoRA"), published by Alperen Gursever (natural person publisher — beta phase, public pre-launch), Belgium. Contact: autoracontact@gmail.com.

These ToS constitute the contract concluded between AutoRA and the buyer. They prevail over any buyer document.`,
  sections: [
    {
      title: "1. Offers and services",
      body: `AutoRA offers the following paid services:

**Listing boost** : promotion of a specific listing in search results for a set period.
**Professional subscription** : access to advanced features for professional sellers (listing quota, statistics, pro badge, etc.).

Detailed features and prices for each offer are available at https://autora.be/pricing.

Prices are stated in euros (EUR), inclusive of all taxes (VAT included) for Belgian consumers. For VAT-registered professional customers, applicable Belgian VAT will be indicated on the invoice.`,
    },
    {
      title: "2. Order process",
      body: `**2.1 Steps**
To subscribe to a paid service, the user must:
1. Be logged in to their AutoRA account;
2. Select the desired offer;
3. Verify the features and price summarised before payment;
4. Enter their payment details via Stripe;
5. Confirm the order.

**2.2 Confirmation**
A confirmation email is sent to the account's associated email address within minutes of payment. This email constitutes proof of the transaction.

**2.3 Invoice**
An electronic invoice is available in the customer area for each transaction.`,
    },
    {
      title: "3. Payment",
      body: `**3.1 Payment processor**
Payments are processed by **Stripe, Inc.** (354 Oyster Point Blvd, South San Francisco, CA 94080, USA), PCI DSS Level 1 certified. AutoRA never accesses your complete banking details.

**3.2 Accepted payment methods**
— Bank card (Visa, Mastercard, American Express)
— Bancontact

**3.3 Security**
All transactions are secured by TLS encryption. Cards are tokenised by Stripe.

**3.4 Automatic renewal (subscriptions)**
Subscriptions are automatically renewed at expiry, unless cancelled beforehand. The renewal amount corresponds to the rate in force at the time of renewal. You will be notified by email 7 days before renewal.`,
    },
    {
      title: "4. Right of withdrawal",
      body: `**4.1 Principle**
In accordance with Article VI.47 of the Belgian Code of Economic Law (transposing Directive 2011/83/EU), the consumer has **14 calendar days** from the conclusion of the contract to exercise their right of withdrawal, without having to justify their decision or pay a penalty.

**4.2 Exercise of the right**
To exercise your right of withdrawal, you must notify AutoRA by email at autoracontact@gmail.com clearly stating your intention to withdraw.

**4.3 Exceptions**
Pursuant to Article VI.53 of the Code of Economic Law, the right of withdrawal does not apply to:
— Digital content provided on a non-tangible medium whose performance has begun with the consumer's express prior consent and their express waiver of the right of withdrawal;
— Services fully performed before the end of the withdrawal period, with the consumer's express prior consent.

**4.4 Model withdrawal form**
To be sent to autoracontact@gmail.com:
"I/We hereby give notice of my/our withdrawal from the contract for [purchased service], ordered on [date], under transaction number [Stripe ID]. Name: [your name]. Date: [date]."

**4.5 Refund**
In the event of a valid withdrawal, AutoRA processes the refund within 14 days of receiving the notification, via the same payment method used for the original transaction.`,
    },
    {
      title: "5. Term and cancellation of subscriptions",
      body: `**5.1 Term**
Subscriptions are taken out for a period of one month (or one year depending on the chosen offer), automatically renewable.

**5.2 Cancellation by the user**
The user may cancel their subscription at any time from their customer area (Settings → Subscription → Cancel). Cancellation takes effect at the end of the current period, without refund of the unused portion, unless otherwise required by law.

**5.3 Cancellation by AutoRA**
AutoRA may cancel a subscription with pro-rata refund upon service closure, or without refund in the event of serious breach of the ToU by the user.`,
    },
    {
      title: "6. Warranties and liability",
      body: `**6.1 Best efforts**
AutoRA undertakes to make subscribed services available within the announced timeframes. In the event of a technical failure attributable to AutoRA preventing service delivery for more than 24 consecutive hours, an equivalent credit will be offered.

**6.2 Limitation of liability**
AutoRA's liability is limited to the amount paid for the relevant service over the past 12 months. AutoRA is not responsible for indirect losses (loss of earnings, loss of customers).

**6.3 Force majeure**
AutoRA cannot be held liable for the non-performance of its obligations in the event of force majeure, in accordance with Article 7.1.1 of the new Belgian Civil Code.`,
    },
    {
      title: "7. Invoicing and VAT",
      body: `Professional users (sellers declared as professionals at registration) may provide their intra-community VAT number to benefit from the reverse charge mechanism applicable to B2B services.

During the beta phase, AutoRA is not VAT-registered and no paid service is invoiced. Electronic invoices (PDF, available in the customer area) will be issued as soon as paid features are activated, with the publisher's BCE/KBO number and, where applicable, VAT number.`,
    },
    {
      title: "8. Customer service and disputes",
      body: `For any questions regarding an order, contact us at autoracontact@gmail.com.

**Mediation** : In accordance with Article VI.73 of the Code of Economic Law, any consumer may use the consumer mediation service free of charge in the event of an unresolved dispute: [https://www.mediationconsommateur.be](https://www.mediationconsommateur.be)

**ODR platform** : [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr)`,
    },
    {
      title: "9. Applicable law",
      body: `These ToS are governed by Belgian law. All disputes are subject to the exclusive jurisdiction of the courts of the judicial district of the publisher's domicile, Belgium, subject to mandatory legal provisions applicable to consumers.`,
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

const CGV = () => {
  const { language } = useLanguage();
  const lang: Lang = (["fr", "nl", "de", "en"] as Lang[]).includes(language as Lang)
    ? (language as Lang)
    : "fr";
  const t = langs[lang];

  return (
    <>
      <SEOHead
        title={`${t.title} — AutoRA.be`}
        description="Conditions générales de vente des abonnements AutoRA.be"
        noIndex
      />
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <BackButton to="/" className="mb-6" />
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
          {lastUpdated[lang]}
        </p>
      </main>
      <Footer />
    </>
  );
};

export default CGV;
