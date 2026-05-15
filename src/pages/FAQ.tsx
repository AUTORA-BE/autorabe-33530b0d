import { useState, useMemo, useCallback } from "react";
import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { faqSchema } from "@/lib/seoSchemas";
import { HelpCircle, Search, X, User, ShoppingCart, Car, Shield, CreditCard, Link2, Check, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const categoriesByLang: Record<Language, { id: string; label: string; icon: any }[]> = {
    fr: [
      { id: "achat", label: "Acheter une voiture", icon: ShoppingCart },
      { id: "vente", label: "Vendre sur AutoRA", icon: Car },
      { id: "lez", label: "LEZ & Car-Pass", icon: Leaf },
      { id: "compte", label: "Compte", icon: User },
      { id: "securite", label: "Sécurité & Confidentialité", icon: Shield },
      { id: "paiement", label: "Paiement", icon: CreditCard },
    ],
    nl: [
      { id: "achat", label: "Een auto kopen", icon: ShoppingCart },
      { id: "vente", label: "Verkopen op AutoRA", icon: Car },
      { id: "lez", label: "LEZ & Car-Pass", icon: Leaf },
      { id: "compte", label: "Account", icon: User },
      { id: "securite", label: "Veiligheid & Privacy", icon: Shield },
      { id: "paiement", label: "Betaling", icon: CreditCard },
    ],
    de: [
      { id: "achat", label: "Ein Auto kaufen", icon: ShoppingCart },
      { id: "vente", label: "Auf AutoRA verkaufen", icon: Car },
      { id: "lez", label: "LEZ & Car-Pass", icon: Leaf },
      { id: "compte", label: "Konto", icon: User },
      { id: "securite", label: "Sicherheit & Datenschutz", icon: Shield },
      { id: "paiement", label: "Zahlung", icon: CreditCard },
    ],
    en: [
      { id: "achat", label: "Buying a Car", icon: ShoppingCart },
      { id: "vente", label: "Selling on AutoRA", icon: Car },
      { id: "lez", label: "LEZ & Car-Pass", icon: Leaf },
      { id: "compte", label: "Account", icon: User },
      { id: "securite", label: "Security & Privacy", icon: Shield },
      { id: "paiement", label: "Payment", icon: CreditCard },
    ],
  };

  const categories = categoriesByLang[language] || categoriesByLang.fr;

  const faqsByLang: Record<Language, { id: string; question: string; answer: string; category: string }[]> = {
    fr: [
      // Achat
      { id: "contacter-vendeur", question: "Comment entrer en contact avec un vendeur sur AutoRA ?", answer: "Ouvrez la fiche du véhicule qui vous intéresse et cliquez sur « Contacter le vendeur ». Notre messagerie sécurisée vous permet d'échanger directement et en temps réel. Vos coordonnées restent confidentielles jusqu'à ce que vous choisissiez de les partager.", category: "achat" },
      { id: "verification-vehicule", question: "Quelles vérifications dois-je effectuer avant d'acheter une voiture d'occasion ?", answer: "Exigez systématiquement le Car-Pass (historique kilométrique officiel), le contrôle technique en cours de validité (moins de 12 mois pour les véhicules de plus de 4 ans) et une facture d'entretien récente. Inspectez le véhicule en personne et, si possible, faites-le contrôler par un expert indépendant. Ne versez jamais d'acompte avant d'avoir physiquement vu la voiture.", category: "achat" },
      { id: "alerte-vehicule", question: "Comment être notifié dès qu'une voiture correspond à mes critères ?", answer: "Configurez une alerte personnalisée depuis la page « Mes alertes » : choisissez la marque, le modèle, la fourchette de prix, la région et le type de carburant. Vous recevrez une notification par email dès qu'une annonce correspondante est publiée.", category: "achat" },
      { id: "tco-calculateur", question: "À quoi sert le calculateur de coût total (TCO) ?", answer: "Le calculateur TCO estime le coût réel de possession sur 5 ans en intégrant le prix d'achat, le carburant (prix belges actuels), l'entretien, l'assurance, la taxe de circulation régionale et la dépréciation. Il vous aide à comparer objectivement deux véhicules au-delà du seul prix d'achat.", category: "achat" },
      { id: "comparaison", question: "Puis-je comparer plusieurs véhicules simultanément ?", answer: "Oui. Ajoutez jusqu'à 3 véhicules à votre comparateur via l'icône de comparaison sur chaque annonce. Le tableau de comparaison met en regard les caractéristiques techniques, le prix, la norme Euro, la compatibilité LEZ et le coût TCO estimé.", category: "achat" },
      // Vente
      { id: "vendre-voiture", question: "Comment publier une annonce sur AutoRA ?", answer: "Connectez-vous, cliquez sur « Vendre ma voiture » et suivez le formulaire en 3 étapes : informations du véhicule (marque, modèle, kilométrage, carburant…), photos (jusqu'à 15 photos haute résolution) et coordonnées. L'annonce est soumise à une validation manuelle avant mise en ligne, généralement sous 24 heures ouvrées.", category: "vente" },
      { id: "car-pass-vente", question: "Le Car-Pass est-il obligatoire pour vendre ?", answer: "Oui, le Car-Pass est obligatoire lors de toute vente de véhicule d'occasion en Belgique (article 7 de l'AR du 15 mars 1968 modifié). Sur AutoRA, l'upload du Car-Pass est requis avant la publication de votre annonce. Vous pouvez l'obtenir sur carpass.be.", category: "vente" },
      { id: "annonces-gratuites", question: "La publication d'une annonce est-elle payante ?", answer: "Non. La publication d'une annonce est entièrement gratuite pour les particuliers. Des options payantes (boost de visibilité, positionnement prioritaire) sont disponibles pour les professionnels et les particuliers souhaitant vendre plus rapidement. Consultez la page Tarifs pour le détail.", category: "vente" },
      { id: "modifier-annonce", question: "Puis-je modifier ou supprimer mon annonce après publication ?", answer: "Oui, à tout moment depuis votre tableau de bord vendeur. Les modifications de prix ou de description sont effectives immédiatement. Pour une suppression définitive, rendez-vous dans « Mes annonces » et cliquez sur « Archiver ». L'annonce est retirée instantanément.", category: "vente" },
      { id: "documents-vente", question: "Quels documents sont nécessaires pour vendre mon véhicule sur AutoRA ?", answer: "Préparez : le Car-Pass (obligatoire), le certificat d'immatriculation (carte grise), le procès-verbal du contrôle technique en cours de validité, et si disponible, le carnet d'entretien. Ces documents rassurent les acheteurs et accélèrent la vente.", category: "vente" },
      { id: "lien-concurrent", question: "Mon véhicule est déjà annoncé sur un autre site. Puis-je l'importer ?", answer: "Oui. Dans le formulaire de publication, vous pouvez coller l'URL de votre annonce existante (AutoScout24, 2dehands, etc.) dans le champ « Lien annonce similaire ». Vous pouvez aussi ajouter une capture d'écran parmi vos photos. Cela facilite la vérification et peut accélérer la validation.", category: "vente" },
      // LEZ & Car-Pass
      { id: "car-pass", question: "Qu'est-ce que le Car-Pass et pourquoi est-il indispensable ?", answer: "Le Car-Pass est un registre officiel belge géré par CarPass asbl. Il enregistre chaque relevé kilométrique effectué lors d'un entretien ou d'un contrôle technique. Il protège l'acheteur contre la fraude au compteur, l'une des arnaques les plus fréquentes en Belgique. AutoRA le rend obligatoire sur toutes ses annonces.", category: "lez" },
      { id: "verification-lez", question: "Comment AutoRA vérifie-t-il la compatibilité LEZ d'un véhicule ?", answer: "Chaque annonce affiche un badge LEZ calculé automatiquement à partir de la norme Euro et du type de carburant déclarés. Trois villes sont couvertes : Bruxelles, Anvers et Gand. Un code couleur (vert / orange / rouge) indique immédiatement si le véhicule est autorisé, en alerte ou interdit dans chacune de ces zones. Vérifiez toujours les calendriers officiels sur lez.brussels, lage-emissiezone.antwerpen.be ou stad.gent.", category: "lez" },
      { id: "lez-achat", question: "Comment savoir si une voiture peut circuler librement dans les LEZ belges ?", answer: "Les véhicules électriques et hybrides sont autorisés dans toutes les zones sans restriction. Pour les thermiques, la règle générale en 2026 est : diesel Euro 6d ou 6d-TEMP ✅, diesel Euro 5 et inférieur ❌ à Bruxelles. Les règles évoluent chaque année — consultez les sites officiels pour votre situation précise et votre région.", category: "lez" },
      // Compte
      { id: "creer-compte", question: "Comment créer un compte sur AutoRA ?", answer: "Cliquez sur « Connexion » en haut à droite, puis « Créer un compte ». Saisissez votre email, choisissez un mot de passe robuste (minimum 10 caractères) et confirmez votre identité via le lien reçu par email. Connexion Google disponible pour simplifier l'inscription.", category: "compte" },
      { id: "modifier-mot-de-passe", question: "Comment réinitialiser mon mot de passe ?", answer: "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Saisissez votre adresse email : vous recevrez un lien sécurisé valable 24 heures. Le lien est à usage unique. En cas de problème, contactez notre support.", category: "compte" },
      { id: "supprimer-compte", question: "Comment supprimer définitivement mon compte ?", answer: "Accédez à Paramètres → Confidentialité → Supprimer mon compte. Cette action est irréversible : toutes vos données personnelles, annonces et messages sont supprimés conformément au RGPD. Vos abonnements Stripe actifs sont résiliés automatiquement.", category: "compte" },
      // Sécurité
      { id: "detecter-fraude", question: "Comment reconnaître une annonce frauduleuse et que faire ?", answer: "Soyez vigilant si : le prix est anormalement bas, le vendeur refuse une inspection physique, on vous demande un paiement Western Union ou crypto, ou les photos semblent volées sur internet (recherche inversée). Signalez l'annonce via le bouton « Signaler » — notre équipe traite chaque signalement sous 24h ouvrées et peut suspendre le compte concerné.", category: "securite" },
      { id: "protection-donnees", question: "Comment AutoRA protège-t-il mes données personnelles ?", answer: "AutoRA est conforme au RGPD européen. Vos données sont chiffrées en transit (TLS) et au repos. Votre email et numéro de téléphone ne sont jamais affichés publiquement. Vous pouvez demander l'export ou la suppression de vos données depuis vos paramètres de compte.", category: "securite" },
      // Paiement
      { id: "plans-abonnement", question: "Quels sont les plans disponibles et en quoi se différencient-ils ?", answer: "AutoRA propose 5 niveaux : Particulier Gratuit (1 annonce active), Particulier Pro (annonces multiples + statistiques), Garage (jusqu'à 50 annonces + badge vérifié), Concession (annonces illimitées + position prioritaire) et Concession Premium (account manager dédié + API). Consultez la page Tarifs pour les prix exacts et la comparaison complète.", category: "paiement" },
      { id: "paiement-securise", question: "Comment fonctionne le paiement sur AutoRA ?", answer: "AutoRA n'intervient jamais dans la transaction entre acheteur et vendeur. Les abonnements professionnels sont gérés via Stripe, leader mondial du paiement en ligne (PCI-DSS niveau 1). Pour l'achat d'un véhicule, nous recommandons le virement bancaire et déconseillons fortement les paiements en liquide ou par plateformes non traçables.", category: "paiement" },
      { id: "annuler-abonnement", question: "Comment annuler un abonnement professionnel ?", answer: "Accédez à votre espace personnel → Abonnement → Gérer mon abonnement. Vous serez redirigé vers le portail Stripe sécurisé où vous pouvez annuler, modifier ou mettre en pause votre abonnement. L'annulation prend effet à la fin de la période de facturation en cours, sans frais.", category: "paiement" },
    ],
    nl: [
      // Aankoop
      { id: "contacter-vendeur", question: "Hoe neem ik contact op met een verkoper op AutoRA?", answer: "Open de voertuigpagina en klik op 'Verkoper contacteren'. Onze beveiligde berichtenservice laat u direct en in real-time communiceren. Uw contactgegevens blijven vertrouwelijk totdat u zelf beslist ze te delen.", category: "achat" },
      { id: "verification-vehicule", question: "Welke controles moet ik uitvoeren vóór de aankoop van een tweedehands auto?", answer: "Vraag altijd de Car-Pass (officieel kilometerregister), een geldig keuringsrapport (minder dan 12 maanden oud voor voertuigen ouder dan 4 jaar) en recente onderhoudsbewijzen. Inspecteer het voertuig persoonlijk en laat het eventueel door een onafhankelijke expert controleren. Betaal nooit een voorschot voordat u de wagen fysiek heeft gezien.", category: "achat" },
      { id: "alerte-vehicule", question: "Hoe word ik gewaarschuwd zodra een auto aan mijn criteria voldoet?", answer: "Stel een gepersonaliseerde zoekopdracht in via de pagina 'Mijn alertes': kies merk, model, prijsbereik, regio en brandstoftype. U ontvangt onmiddellijk een e-mailmelding zodra een overeenkomstige advertentie wordt gepubliceerd.", category: "achat" },
      { id: "tco-calculateur", question: "Waarvoor dient de TCO-calculator?", answer: "De TCO-calculator schat de totale eigendomskosten over 5 jaar: aankoopprijs, brandstof (actuele Belgische prijzen), onderhoud, verzekering, verkeersbelasting per gewest en waardevermindering. Zo kunt u twee voertuigen objectief vergelijken, verder dan alleen de aankoopprijs.", category: "achat" },
      { id: "comparaison", question: "Kan ik meerdere voertuigen tegelijk vergelijken?", answer: "Ja. Voeg tot 3 voertuigen toe via het vergelijkingspictogram op elke advertentie. De vergelijkingstabel toont technische specificaties, prijs, Euro-norm, LEZ-conformiteit en de geschatte TCO naast elkaar.", category: "achat" },
      // Verkoop
      { id: "vendre-voiture", question: "Hoe publiceer ik een advertentie op AutoRA?", answer: "Log in, klik op 'Mijn auto verkopen' en volg het 3-stappen formulier: voertuiggegevens (merk, model, kilometerstand, brandstof…), foto's (tot 15 foto's in hoge resolutie) en contactgegevens. De advertentie wordt handmatig geverifieerd vóór publicatie, gewoonlijk binnen 24 werkuren.", category: "vente" },
      { id: "car-pass-vente", question: "Is de Car-Pass verplicht om te verkopen?", answer: "Ja, de Car-Pass is verplicht bij elke verkoop van een tweedehands voertuig in België (KB van 15 maart 1968). Op AutoRA is het uploaden van de Car-Pass vereist vóór publicatie van uw advertentie. U kunt deze aanvragen op carpass.be.", category: "vente" },
      { id: "annonces-gratuites", question: "Is het publiceren van een advertentie betalend?", answer: "Nee. Het plaatsen van een advertentie is volledig gratis voor particulieren. Betalende opties (zichtbaarheidsboost, prioritaire positionering) zijn beschikbaar voor professionals en particulieren die sneller willen verkopen. Raadpleeg de Tarieven-pagina voor meer details.", category: "vente" },
      { id: "modifier-annonce", question: "Kan ik mijn advertentie wijzigen of verwijderen na publicatie?", answer: "Ja, op elk moment via uw verkopersdashboard. Prijs- of beschrijvingswijzigingen zijn onmiddellijk van kracht. Voor definitieve verwijdering gaat u naar 'Mijn advertenties' en klikt u op 'Archiveren'.", category: "vente" },
      { id: "documents-vente", question: "Welke documenten zijn nodig om mijn voertuig te verkopen op AutoRA?", answer: "Bereid voor: de Car-Pass (verplicht), het inschrijvingsbewijs (kentekenbewijs), het geldig keuringsrapport en, indien beschikbaar, het onderhoudsboekje. Deze documenten stellen kopers gerust en versnellen de verkoop.", category: "vente" },
      { id: "lien-concurrent", question: "Mijn voertuig staat al op een andere site. Kan ik het importeren?", answer: "Ja. In het publicatieformulier kunt u de URL van uw bestaande advertentie (AutoScout24, 2dehands, enz.) plakken in het veld 'Link naar vergelijkbare advertentie'. U kunt ook een screenshot toevoegen bij de foto's. Dit vergemakkelijkt de verificatie en kan de validatie versnellen.", category: "vente" },
      // LEZ & Car-Pass
      { id: "car-pass", question: "Wat is de Car-Pass en waarom is hij onmisbaar?", answer: "De Car-Pass is een officieel Belgisch register beheerd door CarPass vzw. Het registreert elke kilometerstand afgelezen bij onderhoud of keuring. Het beschermt kopers tegen tellerfraudeurs, een van de meest voorkomende oplichterijen in België. AutoRA maakt het verplicht op alle advertenties.", category: "lez" },
      { id: "verification-lez", question: "Hoe controleert AutoRA de LEZ-conformiteit van een voertuig?", answer: "Elke advertentie toont een LEZ-badge automatisch berekend op basis van de Euro-norm en het opgegeven brandstoftype. Drie steden worden gedekt: Brussel, Antwerpen en Gent. Een kleurcode (groen/oranje/rood) geeft onmiddellijk aan of het voertuig is toegelaten, in waakzaamheid of verboden. Controleer altijd de officiële kalenders op lez.brussels, lage-emissiezone.antwerpen.be of stad.gent.", category: "lez" },
      { id: "lez-achat", question: "Hoe weet ik of een auto vrij kan rijden in de Belgische LEZ?", answer: "Elektrische en hybride voertuigen zijn in alle zones toegelaten zonder beperking. Voor thermische voertuigen geldt in 2026 als algemene regel: diesel Euro 6d of 6d-TEMP ✅, diesel Euro 5 en lager ❌ in Brussel. De regels veranderen elk jaar — raadpleeg de officiële sites voor uw exacte situatie.", category: "lez" },
      // Account
      { id: "creer-compte", question: "Hoe maak ik een account aan op AutoRA?", answer: "Klik rechtsboven op 'Inloggen', dan op 'Account aanmaken'. Vul uw e-mailadres in, kies een sterk wachtwoord (minimaal 10 tekens) en bevestig uw identiteit via de link in uw e-mail. Google-aanmelding is beschikbaar voor eenvoudige registratie.", category: "compte" },
      { id: "modifier-mot-de-passe", question: "Hoe reset ik mijn wachtwoord?", answer: "Klik op de aanmeldingspagina op 'Wachtwoord vergeten'. Voer uw e-mailadres in: u ontvangt een beveiligde link geldig voor 24 uur. De link is voor eenmalig gebruik. Bij problemen kunt u contact opnemen met onze support.", category: "compte" },
      { id: "supprimer-compte", question: "Hoe verwijder ik mijn account definitief?", answer: "Ga naar Instellingen → Privacy → Account verwijderen. Deze actie is onomkeerbaar: alle persoonlijke gegevens, advertenties en berichten worden verwijderd conform de GDPR. Actieve Stripe-abonnementen worden automatisch opgezegd.", category: "compte" },
      // Veiligheid
      { id: "detecter-fraude", question: "Hoe herken ik een frauduleuze advertentie en wat moet ik doen?", answer: "Wees waakzaam als: de prijs abnormaal laag is, de verkoper een fysieke inspectie weigert, betaling via Western Union of crypto gevraagd wordt, of foto's gestolen lijken (gebruik omgekeerd zoeken). Meld de advertentie via de knop 'Melden' — ons team behandelt elke melding binnen 24 werkuren.", category: "securite" },
      { id: "protection-donnees", question: "Hoe beschermt AutoRA mijn persoonlijke gegevens?", answer: "AutoRA voldoet aan de Europese GDPR. Uw gegevens zijn versleuteld tijdens overdracht (TLS) en opslag. Uw e-mail en telefoonnummer worden nooit publiek weergegeven. U kunt een export of verwijdering van uw gegevens aanvragen via uw accountinstellingen.", category: "securite" },
      // Betaling
      { id: "plans-abonnement", question: "Welke abonnementen zijn beschikbaar en wat zijn de verschillen?", answer: "AutoRA biedt 5 niveaus: Particulier Gratis (1 actieve advertentie), Particulier Pro (meerdere advertenties + statistieken), Garage (tot 50 advertenties + geverifieerde badge), Concessie (onbeperkte advertenties + prioritaire positie) en Concessie Premium (dedicated accountmanager + API). Raadpleeg de Tarieven-pagina voor exacte prijzen.", category: "paiement" },
      { id: "paiement-securise", question: "Hoe werkt het betalingsproces op AutoRA?", answer: "AutoRA treedt nooit op als tussenpersoon bij transacties tussen koper en verkoper. Professionele abonnementen worden beheerd via Stripe, wereldleider in online betalingen (PCI-DSS niveau 1). Voor de aankoop van een voertuig raden wij bankoverschrijving aan en raden wij contante betaling of niet-traceerbare platforms ten zeerste af.", category: "paiement" },
      { id: "annuler-abonnement", question: "Hoe annuleer ik een professioneel abonnement?", answer: "Ga naar Mijn ruimte → Abonnement → Mijn abonnement beheren. U wordt doorgestuurd naar de beveiligde Stripe-portal waar u uw abonnement kunt annuleren, wijzigen of pauzeren. Annulering gaat in aan het einde van de lopende factureringsperiode, zonder kosten.", category: "paiement" },
    ],
    de: [
      // Kauf
      { id: "contacter-vendeur", question: "Wie nehme ich auf AutoRA Kontakt mit einem Verkäufer auf?", answer: "Öffnen Sie die Fahrzeugseite und klicken Sie auf 'Verkäufer kontaktieren'. Unser sicheres Nachrichtensystem ermöglicht eine direkte Kommunikation in Echtzeit. Ihre Kontaktdaten bleiben vertraulich, bis Sie sich entscheiden, diese zu teilen.", category: "achat" },
      { id: "verification-vehicule", question: "Welche Überprüfungen sollte ich vor dem Kauf eines Gebrauchtwagens durchführen?", answer: "Fordern Sie immer den Car-Pass (offizielles Kilometerregister), einen gültigen TÜV-Bericht (weniger als 12 Monate alt bei Fahrzeugen über 4 Jahre) und aktuelle Wartungsnachweise an. Besichtigen Sie das Fahrzeug persönlich und lassen Sie es ggf. von einem unabhängigen Experten prüfen. Zahlen Sie niemals eine Anzahlung, bevor Sie das Auto physisch gesehen haben.", category: "achat" },
      { id: "alerte-vehicule", question: "Wie werde ich benachrichtigt, wenn ein Auto meinen Kriterien entspricht?", answer: "Richten Sie eine personalisierte Suche auf der Seite 'Meine Benachrichtigungen' ein: Marke, Modell, Preisbereich, Region und Kraftstofftyp. Sie erhalten sofort eine E-Mail-Benachrichtigung, wenn eine entsprechende Anzeige veröffentlicht wird.", category: "achat" },
      { id: "tco-calculateur", question: "Wozu dient der TCO-Rechner?", answer: "Der TCO-Rechner schätzt die Gesamtbetriebskosten über 5 Jahre: Kaufpreis, Kraftstoff (aktuelle belgische Preise), Wartung, Versicherung, regionale Kfz-Steuer und Wertverlust. So können Sie zwei Fahrzeuge objektiv vergleichen, über den reinen Kaufpreis hinaus.", category: "achat" },
      { id: "comparaison", question: "Kann ich mehrere Fahrzeuge gleichzeitig vergleichen?", answer: "Ja. Fügen Sie bis zu 3 Fahrzeuge über das Vergleichssymbol auf jeder Anzeige hinzu. Die Vergleichstabelle zeigt technische Spezifikationen, Preis, Euro-Norm, LEZ-Konformität und den geschätzten TCO nebeneinander.", category: "achat" },
      // Verkauf
      { id: "vendre-voiture", question: "Wie veröffentliche ich eine Anzeige auf AutoRA?", answer: "Melden Sie sich an, klicken Sie auf 'Mein Auto verkaufen' und folgen Sie dem 3-Schritte-Formular: Fahrzeugdaten (Marke, Modell, Kilometerstand, Kraftstoff…), Fotos (bis zu 15 hochauflösende Fotos) und Kontaktdaten. Die Anzeige wird vor der Veröffentlichung manuell geprüft, in der Regel innerhalb von 24 Werktunden.", category: "vente" },
      { id: "car-pass-vente", question: "Ist der Car-Pass beim Verkauf Pflicht?", answer: "Ja, der Car-Pass ist bei jedem Gebrauchtwagenverkauf in Belgien gesetzlich vorgeschrieben (KB vom 15. März 1968). Auf AutoRA ist das Hochladen des Car-Pass vor der Veröffentlichung Ihrer Anzeige erforderlich. Er kann auf carpass.be angefragt werden.", category: "vente" },
      { id: "annonces-gratuites", question: "Ist das Einstellen einer Anzeige kostenpflichtig?", answer: "Nein. Das Einstellen einer Anzeige ist für Privatpersonen völlig kostenlos. Kostenpflichtige Optionen (Sichtbarkeitsboost, Priorisierung) sind für Profis und Privatpersonen verfügbar, die schneller verkaufen möchten. Details auf der Tarifsseite.", category: "vente" },
      { id: "modifier-annonce", question: "Kann ich meine Anzeige nach der Veröffentlichung ändern oder löschen?", answer: "Ja, jederzeit über Ihr Verkäufer-Dashboard. Preis- oder Beschreibungsänderungen sind sofort wirksam. Zur endgültigen Löschung gehen Sie zu 'Meine Anzeigen' und klicken auf 'Archivieren'.", category: "vente" },
      { id: "documents-vente", question: "Welche Dokumente benötige ich, um mein Fahrzeug auf AutoRA zu verkaufen?", answer: "Bereiten Sie vor: den Car-Pass (Pflicht), den Fahrzeugschein, einen gültigen TÜV-Bericht und, falls vorhanden, das Serviceheft. Diese Dokumente stärken das Vertrauen der Käufer und beschleunigen den Verkauf.", category: "vente" },
      { id: "lien-concurrent", question: "Mein Fahrzeug ist bereits auf einer anderen Plattform inseriert. Kann ich es importieren?", answer: "Ja. Im Veröffentlichungsformular können Sie die URL Ihrer bestehenden Anzeige (AutoScout24, 2dehands usw.) in das Feld 'Link zur ähnlichen Anzeige' einfügen. Sie können auch einen Screenshot zu den Fotos hinzufügen. Dies erleichtert die Überprüfung.", category: "vente" },
      // LEZ & Car-Pass
      { id: "car-pass", question: "Was ist der Car-Pass und warum ist er unverzichtbar?", answer: "Der Car-Pass ist ein offizielles belgisches Register, das von der CarPass VoG verwaltet wird. Es erfasst jeden Kilometerstand bei Wartung oder TÜV. Es schützt Käufer vor Tacho-Betrug, einem der häufigsten Betrugsdelikte in Belgien. AutoRA macht ihn bei allen Anzeigen zur Pflicht.", category: "lez" },
      { id: "verification-lez", question: "Wie überprüft AutoRA die LEZ-Konformität eines Fahrzeugs?", answer: "Jede Anzeige zeigt ein LEZ-Badge, das automatisch anhand der angegebenen Euro-Norm und des Kraftstofftyps berechnet wird. Drei Städte werden abgedeckt: Brüssel, Antwerpen und Gent. Ein Farbcode (grün/orange/rot) zeigt sofort an, ob das Fahrzeug zugelassen, im Warnbereich oder verboten ist. Prüfen Sie immer die offiziellen Kalender.", category: "lez" },
      { id: "lez-achat", question: "Wie erkenne ich, ob ein Auto frei in den belgischen LEZ fahren kann?", answer: "Elektro- und Hybridfahrzeuge sind in allen Zonen ohne Einschränkung zugelassen. Für Verbrenner gilt 2026 als allgemeine Regel: Diesel Euro 6d oder 6d-TEMP ✅, Diesel Euro 5 und niedriger ❌ in Brüssel. Die Regeln ändern sich jährlich.", category: "lez" },
      // Konto
      { id: "creer-compte", question: "Wie erstelle ich ein Konto auf AutoRA?", answer: "Klicken Sie oben rechts auf 'Anmelden', dann auf 'Konto erstellen'. Geben Sie Ihre E-Mail ein, wählen Sie ein starkes Passwort (mindestens 10 Zeichen) und bestätigen Sie Ihre Identität über den per E-Mail erhaltenen Link. Google-Anmeldung steht ebenfalls zur Verfügung.", category: "compte" },
      { id: "modifier-mot-de-passe", question: "Wie setze ich mein Passwort zurück?", answer: "Klicken Sie auf der Anmeldeseite auf 'Passwort vergessen'. Geben Sie Ihre E-Mail-Adresse ein: Sie erhalten einen sicheren Link, der 24 Stunden gültig ist. Der Link ist nur einmal verwendbar.", category: "compte" },
      { id: "supprimer-compte", question: "Wie lösche ich mein Konto endgültig?", answer: "Gehen Sie zu Einstellungen → Datenschutz → Konto löschen. Diese Aktion ist unwiderruflich: Alle persönlichen Daten, Anzeigen und Nachrichten werden gemäß DSGVO gelöscht. Aktive Stripe-Abonnements werden automatisch gekündigt.", category: "compte" },
      // Sicherheit
      { id: "detecter-fraude", question: "Wie erkenne ich eine betrügerische Anzeige und was soll ich tun?", answer: "Seien Sie vorsichtig, wenn: der Preis ungewöhnlich niedrig ist, der Verkäufer eine physische Besichtigung ablehnt, Western Union oder Krypto-Zahlung verlangt wird, oder Fotos gestohlen wirken. Melden Sie die Anzeige über die Schaltfläche 'Melden' — unser Team bearbeitet jede Meldung innerhalb von 24 Werktunden.", category: "securite" },
      { id: "protection-donnees", question: "Wie schützt AutoRA meine persönlichen Daten?", answer: "AutoRA entspricht der europäischen DSGVO. Ihre Daten sind bei der Übertragung (TLS) und Speicherung verschlüsselt. Ihre E-Mail und Telefonnummer werden nie öffentlich angezeigt. Sie können einen Export oder die Löschung Ihrer Daten über Ihre Kontoeinstellungen beantragen.", category: "securite" },
      // Zahlung
      { id: "plans-abonnement", question: "Welche Abonnements gibt es und was sind die Unterschiede?", answer: "AutoRA bietet 5 Stufen: Privatperson Kostenlos (1 aktive Anzeige), Privatperson Pro (mehrere Anzeigen + Statistiken), Garage (bis zu 50 Anzeigen + verifiziertes Badge), Autohaus (unbegrenzte Anzeigen + Prioritätsplatzierung) und Autohaus Premium (dedizierter Account-Manager + API). Details auf der Tarifsseite.", category: "paiement" },
      { id: "paiement-securise", question: "Wie funktioniert der Zahlungsvorgang auf AutoRA?", answer: "AutoRA tritt niemals als Zahlungsvermittler zwischen Käufer und Verkäufer auf. Professionelle Abonnements werden über Stripe abgewickelt, dem weltweit führenden Online-Zahlungsanbieter (PCI-DSS Level 1). Für den Fahrzeugkauf empfehlen wir Banküberweisung.", category: "paiement" },
      { id: "annuler-abonnement", question: "Wie kündige ich ein professionelles Abonnement?", answer: "Gehen Sie zu Mein Bereich → Abonnement → Mein Abonnement verwalten. Sie werden zum sicheren Stripe-Portal weitergeleitet, wo Sie Ihr Abonnement kündigen, ändern oder pausieren können. Die Kündigung wird am Ende des laufenden Abrechnungszeitraums wirksam, kostenfrei.", category: "paiement" },
    ],
    en: [
      // Buying
      { id: "contacter-vendeur", question: "How do I contact a seller on AutoRA?", answer: "Open the vehicle listing and click 'Contact Seller'. Our secure messaging system allows direct, real-time communication. Your contact details remain confidential until you choose to share them.", category: "achat" },
      { id: "verification-vehicule", question: "What checks should I carry out before buying a used car?", answer: "Always request the Car-Pass (official mileage register), a valid technical inspection report (less than 12 months old for vehicles over 4 years) and recent service records. Inspect the vehicle in person and, if possible, have it checked by an independent expert. Never pay a deposit before physically seeing the car.", category: "achat" },
      { id: "alerte-vehicule", question: "How can I be notified when a car matching my criteria is listed?", answer: "Set up a personalised alert on the 'My Alerts' page: choose brand, model, price range, region and fuel type. You will receive an email notification as soon as a matching listing is published.", category: "achat" },
      { id: "tco-calculateur", question: "What is the TCO calculator for?", answer: "The TCO calculator estimates the true cost of ownership over 5 years, including purchase price, fuel (current Belgian prices), maintenance, insurance, regional road tax and depreciation. It helps you objectively compare two vehicles beyond the purchase price alone.", category: "achat" },
      { id: "comparaison", question: "Can I compare several vehicles at the same time?", answer: "Yes. Add up to 3 vehicles using the comparison icon on each listing. The comparison table displays technical specifications, price, Euro standard, LEZ compliance and estimated TCO side by side.", category: "achat" },
      // Selling
      { id: "vendre-voiture", question: "How do I publish a listing on AutoRA?", answer: "Log in, click 'Sell My Car' and complete the 3-step form: vehicle details (brand, model, mileage, fuel…), photos (up to 15 high-resolution images) and contact information. The listing is subject to manual review before going live, typically within 24 working hours.", category: "vente" },
      { id: "car-pass-vente", question: "Is the Car-Pass mandatory to sell?", answer: "Yes, the Car-Pass is legally required for every used car sale in Belgium (RD of 15 March 1968). On AutoRA, uploading the Car-Pass is required before your listing is published. It can be requested at carpass.be.", category: "vente" },
      { id: "annonces-gratuites", question: "Is publishing a listing free of charge?", answer: "Yes. Publishing a listing is completely free for private individuals. Paid options (visibility boost, priority placement) are available for professionals and individuals who wish to sell faster. See the Pricing page for full details.", category: "vente" },
      { id: "modifier-annonce", question: "Can I edit or remove my listing after publication?", answer: "Yes, at any time from your seller dashboard. Price or description changes take effect immediately. For permanent removal, go to 'My Listings' and click 'Archive'.", category: "vente" },
      { id: "documents-vente", question: "What documents do I need to sell my vehicle on AutoRA?", answer: "Prepare: the Car-Pass (mandatory), registration certificate, valid technical inspection report, and the service booklet if available. These documents build buyer confidence and speed up the sale.", category: "vente" },
      { id: "lien-concurrent", question: "My vehicle is already listed on another site. Can I import it?", answer: "Yes. In the listing form, you can paste the URL of your existing listing (AutoScout24, 2dehands, etc.) in the 'Similar listing link' field. You can also add a screenshot to the photos. This facilitates the verification process.", category: "vente" },
      // LEZ & Car-Pass
      { id: "car-pass", question: "What is the Car-Pass and why is it essential?", answer: "The Car-Pass is an official Belgian register managed by CarPass asbl. It records every odometer reading taken during maintenance or technical inspection. It protects buyers against odometer fraud, one of the most common scams in Belgium. AutoRA makes it mandatory on all listings.", category: "lez" },
      { id: "verification-lez", question: "How does AutoRA verify a vehicle's LEZ compliance?", answer: "Every listing displays an LEZ badge automatically calculated from the declared Euro standard and fuel type. Three cities are covered: Brussels, Antwerp and Ghent. A colour code (green/orange/red) immediately indicates whether the vehicle is permitted, on alert or prohibited. Always check the official calendars at lez.brussels, lage-emissiezone.antwerpen.be or stad.gent.", category: "lez" },
      { id: "lez-achat", question: "How do I know if a car can circulate freely in Belgian LEZs?", answer: "Electric and hybrid vehicles are permitted in all zones without restriction. For combustion engines, the general rule in 2026 is: diesel Euro 6d or 6d-TEMP ✅, diesel Euro 5 and below ❌ in Brussels. Rules change every year — check the official sites for your specific situation.", category: "lez" },
      // Account
      { id: "creer-compte", question: "How do I create an account on AutoRA?", answer: "Click 'Login' in the top right, then 'Create account'. Enter your email, choose a strong password (minimum 10 characters) and confirm your identity via the link sent by email. Google sign-in is also available.", category: "compte" },
      { id: "modifier-mot-de-passe", question: "How do I reset my password?", answer: "Click 'Forgot password' on the login page. Enter your email address: you will receive a secure link valid for 24 hours. The link is single-use only.", category: "compte" },
      { id: "supprimer-compte", question: "How do I permanently delete my account?", answer: "Go to Settings → Privacy → Delete my account. This action is irreversible: all personal data, listings and messages are deleted in accordance with GDPR. Active Stripe subscriptions are automatically cancelled.", category: "compte" },
      // Security
      { id: "detecter-fraude", question: "How do I recognise a fraudulent listing and what should I do?", answer: "Be wary if: the price is abnormally low, the seller refuses a physical inspection, payment via Western Union or crypto is requested, or photos appear stolen (use reverse image search). Report the listing via the 'Report' button — our team handles every report within 24 working hours.", category: "securite" },
      { id: "protection-donnees", question: "How does AutoRA protect my personal data?", answer: "AutoRA complies with European GDPR. Your data is encrypted in transit (TLS) and at rest. Your email and phone number are never displayed publicly. You can request an export or deletion of your data from your account settings.", category: "securite" },
      // Payment
      { id: "plans-abonnement", question: "What plans are available and how do they differ?", answer: "AutoRA offers 5 tiers: Free Private (1 active listing), Pro Private (multiple listings + statistics), Garage (up to 50 listings + verified badge), Dealership (unlimited listings + priority placement) and Premium Dealership (dedicated account manager + API). See the Pricing page for exact prices and a full comparison.", category: "paiement" },
      { id: "paiement-securise", question: "How does the payment process work on AutoRA?", answer: "AutoRA never acts as a payment intermediary between buyers and sellers. Professional subscriptions are managed via Stripe, the world leader in online payments (PCI-DSS Level 1). For vehicle purchases, we recommend bank transfers and strongly advise against cash or untraceable payment platforms.", category: "paiement" },
      { id: "annuler-abonnement", question: "How do I cancel a professional subscription?", answer: "Go to My Space → Subscription → Manage my subscription. You will be redirected to the secure Stripe portal where you can cancel, modify or pause your subscription. Cancellation takes effect at the end of the current billing period, free of charge.", category: "paiement" },
    ],
  };

  const faqs = faqsByLang[language] || faqsByLang.fr;

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyFaqLink = useCallback((faqId: string) => {
    const url = `${window.location.origin}/faq#${faqId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(faqId);
      toast.success(t("faq.linkCopied"));
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, [t]);

  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  const filteredFaqs = useMemo(() => {
    let results = faqs;
    
    if (activeCategory) {
      results = results.filter(faq => faq.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        faq => 
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query)
      );
    }
    
    return results;
  }, [searchQuery, activeCategory, faqs]);

  const seoTitles: Record<Language, string> = {
    fr: "Questions fréquentes - FAQ",
    nl: "Veelgestelde vragen - FAQ",
    de: "Häufig gestellte Fragen - FAQ",
    en: "Frequently Asked Questions - FAQ",
  };

  const seoDescriptions: Record<Language, string> = {
    fr: "Trouvez rapidement les réponses à vos questions sur AutoRA, le Car-Pass, les zones LEZ et bien plus encore.",
    nl: "Vind snel antwoorden op uw vragen over AutoRA, de Car-Pass, LEZ-zones en meer.",
    de: "Finden Sie schnell Antworten auf Ihre Fragen zu AutoRA, Car-Pass, LEZ-Zonen und mehr.",
    en: "Quickly find answers to your questions about AutoRA, Car-Pass, LEZ zones and more.",
  };

  const allLabels: Record<Language, string> = {
    fr: "Toutes",
    nl: "Alle",
    de: "Alle",
    en: "All",
  };

  return (
    <div className="page-gradient">
      <SEOHead 
        title={seoTitles[language]}
        description={seoDescriptions[language]}
        url="https://autora.be/faq"
        jsonLd={faqSchema(faqs.map(f => ({ question: f.question, answer: f.answer })))}
      />
      <Header />
      
      <main className="pt-24">
        <div className="container mx-auto px-6 pt-4">
          <BackButton to="/" className="mb-2" />
        </div>
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-3xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              {t("faq.helpCenter")}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t("faq.title").split(" ").slice(0, -1).join(" ")} <span className="gradient-text">{t("faq.title").split(" ").slice(-1)}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {t("faq.subtitle")}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("faq.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 py-6 text-base rounded-xl bg-card border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            
            {/* Category filters */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                {allLabels[language]}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-6 pb-16">
          <div className="max-w-3xl mx-auto">
            {/* Results counter */}
            {(searchQuery || activeCategory) && (
              <div className="mb-6 text-center">
                <span className="text-sm text-muted-foreground">
                  {filteredFaqs.length === 0 
                    ? t("faq.noResult")
                    : filteredFaqs.length === 1 
                      ? `1 ${t("faq.resultFor")}`
                      : `${filteredFaqs.length} ${t("faq.resultsFor")}`}
                  {searchQuery && (
                    <>
                      {` ${t("faq.for")} `}
                      <span className="font-medium text-foreground">"{searchQuery}"</span>
                    </>
                  )}
                  {activeCategory && (
                    <>
                      {` ${t("faq.in")} `}
                      <span className="font-medium text-foreground">
                        {categories.find(c => c.id === activeCategory)?.label}
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}
            
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t("faq.noResults")}
                </p>
              </div>
            ) : (
              <Accordion 
                key={`${activeCategory}-${searchQuery}`}
                type="single" 
                collapsible 
                className="space-y-4"
              >
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem 
                    key={faq.id}
                    id={faq.id}
                    value={faq.id}
                    className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-lg transition-shadow animate-fade-in"
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary py-5">
                      <div className="flex items-start gap-3 w-full pr-4">
                        <span className="flex-1">{highlightText(faq.question, searchQuery)}</span>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {categories.find(c => c.id === faq.category)?.label}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex-1">{highlightText(faq.answer, searchQuery)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyFaqLink(faq.id);
                          }}
                          className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                          aria-label="Copy link"
                        >
                          {copiedId === faq.id ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Link2 className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-6 py-16 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                {t("faq.notFound")}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("faq.notFoundDesc")}
              </p>
              <a 
                href="mailto:autoracontact@gmail.com" 
                className="btn-primary-gradient inline-flex items-center gap-2"
              >
                {t("faq.contactUs")}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;