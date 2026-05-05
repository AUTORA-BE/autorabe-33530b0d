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
      title: "4. Destinataires des données",
      body: `Vos données peuvent être transmises aux prestataires suivants, dans le strict cadre de leurs missions :

**Supabase Inc.** (hébergement base de données)
970 Toa Payoh North, Singapore — Données transférées aux États-Unis sur la base de clauses contractuelles types (CCT) approuvées par la Commission européenne.

**Vercel Inc.** (hébergement web)
San Francisco, CA, États-Unis — Données transférées aux États-Unis sur la base de CCT.

**Stripe, Inc.** (traitement des paiements)
354 Oyster Point Blvd, South San Francisco, CA, États-Unis — Données transférées aux États-Unis sur la base de CCT. Stripe est certifié PCI DSS niveau 1.

**Resend, Inc.** (envoi d'emails transactionnels)
États-Unis — Données transférées sur la base de CCT. Seuls les emails nécessaires au fonctionnement du service sont transmis.

Nous ne vendons jamais vos données à des tiers. Aucun partage à des fins publicitaires tierces.`,
    },
    {
      title: "5. Transferts hors Union européenne",
      body: `Plusieurs de nos prestataires sont établis aux États-Unis. Ces transferts sont encadrés par des clauses contractuelles types (CCT) adoptées par la Commission européenne, conformément à l'article 46 du RGPD, garantissant un niveau de protection adéquat de vos données.

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

Nous répondrons à votre demande dans un délai maximum de 30 jours.`,
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
— Plausible Analytics : mesure d'audience anonymisée, sans cookie tiers, sans identifiant persistant. Ces données ne quittent pas l'UE.

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
  intro: `Dit privacybeleid beschrijft hoe AutoRA.be (hierna « AutoRA ») persoonsgegevens van gebruikers verzamelt, gebruikt en beschermt, conform de Algemene Verordening Gegevensbescherming (AVG) en de Belgische wet van 30 juli 2018.`,
  sections: [
    {
      title: "1. Verwerkingsverantwoordelijke",
      body: `**Verwerkingsverantwoordelijke** : AutoRA.be — [Naam — in te vullen], België
**E-mail** : autoracontact@gmail.com`,
    },
    {
      title: "2. Verzamelde gegevens",
      body: `We verzamelen identificatiegegevens (e-mail, naam), advertentiegegevens (voertuiginfo, foto's), navigatiegegevens (IP, browser) en transactiegegevens (via Stripe).`,
    },
    {
      title: "3. Doeleinden en rechtsgronden",
      body: `Uitvoering van de overeenkomst (art. 6.1.b AVG): accountbeheer, advertenties, betalingen.
Gerechtvaardigd belang (art. 6.1.f AVG): fraudepreventie, dienstverlening.
Wettelijke verplichting (art. 6.1.c AVG): boekhoudkundige bewaring.
Toestemming (art. 6.1.a AVG): analytische cookies.`,
    },
    {
      title: "4. Ontvangers",
      body: `Uw gegevens worden gedeeld met: Supabase Inc. (VS), Vercel Inc. (VS), Stripe Inc. (VS), Resend Inc. (VS) — allemaal op basis van door de Europese Commissie goedgekeurde modelcontractbepalingen.`,
    },
    {
      title: "5. Uw rechten",
      body: `U heeft het recht op inzage, rectificatie, wissing, beperking, overdraagbaarheid en bezwaar. Neem contact op via autoracontact@gmail.com. U kunt ook een klacht indienen bij de Gegevensbeschermingsautoriteit (GBA): [https://www.gegevensbeschermingsautoriteit.be](https://www.gegevensbeschermingsautoriteit.be).`,
    },
    {
      title: "6. Cookies",
      body: `Essentiële cookies: sessiebeheer, taalvoorkeur.
Analytische cookies (met toestemming): Plausible Analytics, geanonimiseerd.
Betalingscookies: Stripe.js (alleen op betalingspagina's).`,
    },
  ],
};

const Confidentialite = () => {
  const { language } = useLanguage();
  const lang = language === "nl" ? "nl" : "fr";
  const t = lang === "nl" ? nl : fr;

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
          {lang === "fr" ? "Dernière mise à jour : mai 2026" : "Laatste update: mei 2026"}
        </p>
      </main>
      <Footer />
    </>
  );
};

export default Confidentialite;
