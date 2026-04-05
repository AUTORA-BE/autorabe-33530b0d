import { useState, useMemo, useCallback } from "react";
import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { faqSchema } from "@/lib/seoSchemas";
import { HelpCircle, Search, X, User, ShoppingCart, Car, Shield, CreditCard, Link2, Check, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import Breadcrumbs from "@/components/Breadcrumbs";
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
      { id: "vente", label: "Vendre sur AutoRa", icon: Car },
      { id: "lez", label: "LEZ & Car-Pass", icon: Leaf },
      { id: "compte", label: "Compte", icon: User },
      { id: "securite", label: "Sécurité & Confidentialité", icon: Shield },
      { id: "paiement", label: "Paiement", icon: CreditCard },
    ],
    nl: [
      { id: "achat", label: "Een auto kopen", icon: ShoppingCart },
      { id: "vente", label: "Verkopen op AutoRa", icon: Car },
      { id: "lez", label: "LEZ & Car-Pass", icon: Leaf },
      { id: "compte", label: "Account", icon: User },
      { id: "securite", label: "Veiligheid & Privacy", icon: Shield },
      { id: "paiement", label: "Betaling", icon: CreditCard },
    ],
    de: [
      { id: "achat", label: "Ein Auto kaufen", icon: ShoppingCart },
      { id: "vente", label: "Auf AutoRa verkaufen", icon: Car },
      { id: "lez", label: "LEZ & Car-Pass", icon: Leaf },
      { id: "compte", label: "Konto", icon: User },
      { id: "securite", label: "Sicherheit & Datenschutz", icon: Shield },
      { id: "paiement", label: "Zahlung", icon: CreditCard },
    ],
    en: [
      { id: "achat", label: "Buying a Car", icon: ShoppingCart },
      { id: "vente", label: "Selling on AutoRa", icon: Car },
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
      { id: "car-pass", question: "Qu'est-ce que le Car-Pass ?", answer: "Le Car-Pass est un document officiel belge qui retrace l'historique kilométrique d'un véhicule. Il permet de vérifier que le compteur n'a pas été manipulé et garantit la transparence lors de l'achat d'une voiture d'occasion.", category: "lez" },
      { id: "verification-lez", question: "Comment fonctionne la vérification LEZ ?", answer: "Nous vérifions automatiquement la conformité de chaque véhicule aux zones de basses émissions (LEZ) de Bruxelles, Anvers et Gand. Les véhicules conformes Euro 6 ou supérieur peuvent circuler librement dans ces zones.", category: "lez" },
      { id: "contacter-vendeur", question: "Comment contacter un vendeur ?", answer: "Une fois connecté, vous pouvez envoyer un message directement au vendeur via notre système de messagerie intégré. Vos conversations sont sécurisées et restent privées.", category: "achat" },
      { id: "verification-vehicule", question: "Comment vérifier un véhicule avant l'achat ?", answer: "Vérifiez toujours le Car-Pass, demandez le contrôle technique en cours de validité, et inspectez le véhicule en personne. Ne payez jamais avant d'avoir vu la voiture.", category: "achat" },
      // Vente
      { id: "vendre-voiture", question: "Comment puis-je vendre ma voiture sur AutoRa ?", answer: "C'est simple ! Créez un compte, cliquez sur 'Vendre', remplissez les informations de votre véhicule avec photos et description, puis soumettez votre annonce. Notre équipe la vérifiera avant publication.", category: "vente" },
      { id: "annonces-gratuites", question: "Les annonces sont-elles gratuites ?", answer: "Oui, la publication d'annonces est entièrement gratuite pour les particuliers. Nous croyons en un accès démocratique au marché automobile belge.", category: "vente" },
      { id: "modifier-annonce", question: "Puis-je modifier mon annonce après publication ?", answer: "Oui, vous pouvez modifier votre annonce à tout moment depuis votre espace personnel. Les modifications seront visibles immédiatement après validation.", category: "vente" },
      { id: "documents-vente", question: "Quels documents dois-je fournir pour vendre ?", answer: "Vous aurez besoin du Car-Pass, de la carte grise, du contrôle technique en cours de validité et des photos de qualité de votre véhicule.", category: "vente" },
      // Compte
      { id: "creer-compte", question: "Comment créer un compte sur AutoRa ?", answer: "Cliquez sur 'Connexion' en haut à droite, puis sur 'Créer un compte'. Remplissez vos informations et validez votre email. Vous pouvez aussi vous connecter avec Google.", category: "compte" },
      { id: "modifier-mot-de-passe", question: "Comment modifier mon mot de passe ?", answer: "Connectez-vous à votre compte, accédez aux paramètres de profil et cliquez sur 'Modifier le mot de passe'. Vous recevrez un email de confirmation.", category: "compte" },
      // Sécurité
      { id: "detecter-fraude", question: "Que faire si je détecte une fraude ?", answer: "Signalez immédiatement l'annonce suspecte via le bouton de signalement. Notre équipe examine chaque signalement sous 24h et prend les mesures nécessaires pour protéger notre communauté.", category: "securite" },
      { id: "protection-donnees", question: "Mes données personnelles sont-elles protégées ?", answer: "Oui, nous prenons la protection de vos données très au sérieux. Toutes les informations sont cryptées et stockées de manière sécurisée conformément au RGPD.", category: "securite" },
      // Paiement
      { id: "financement", question: "AutoRa propose-t-il un service de financement ?", answer: "Nous travaillons avec des partenaires financiers pour vous proposer des solutions de crédit adaptées. Contactez-nous pour plus d'informations sur les options de financement disponibles.", category: "paiement" },
      { id: "paiement-securise", question: "Comment effectuer un paiement sécurisé ?", answer: "AutoRa n'est pas intermédiaire de paiement. Nous recommandons de ne jamais payer avant d'avoir vu le véhicule en personne et de privilégier les virements bancaires plutôt que l'argent liquide.", category: "paiement" },
    ],
    nl: [
      // Aankoop
      { id: "car-pass", question: "Wat is de Car-Pass?", answer: "De Car-Pass is een officieel Belgisch document dat de kilometergeschiedenis van een voertuig bijhoudt. Het maakt het mogelijk om te controleren of de teller niet is gemanipuleerd en garandeert transparantie bij de aankoop van een tweedehands auto.", category: "lez" },
      { id: "verification-lez", question: "Hoe werkt de LEZ-verificatie?", answer: "We controleren automatisch de conformiteit van elk voertuig met de lage-emissiezones (LEZ) van Brussel, Antwerpen en Gent. Voertuigen die voldoen aan Euro 6 of hoger mogen vrij rijden in deze zones.", category: "lez" },
      { id: "contacter-vendeur", question: "Hoe contacteer ik een verkoper?", answer: "Eenmaal ingelogd, kunt u rechtstreeks een bericht sturen naar de verkoper via ons geïntegreerde berichtensysteem. Uw gesprekken zijn beveiligd en blijven privé.", category: "achat" },
      { id: "verification-vehicule", question: "Hoe controleer ik een voertuig voor aankoop?", answer: "Controleer altijd de Car-Pass, vraag een geldig technisch keuringsrapport en inspecteer het voertuig persoonlijk. Betaal nooit voordat u de auto heeft gezien.", category: "achat" },
      // Verkoop
      { id: "vendre-voiture", question: "Hoe kan ik mijn auto verkopen op AutoRa?", answer: "Het is eenvoudig! Maak een account aan, klik op 'Verkopen', vul de informatie van uw voertuig in met foto's en beschrijving, en dien uw advertentie in. Ons team zal deze controleren voor publicatie.", category: "vente" },
      { id: "annonces-gratuites", question: "Zijn advertenties gratis?", answer: "Ja, het plaatsen van advertenties is volledig gratis voor particulieren. Wij geloven in democratische toegang tot de Belgische automarkt.", category: "vente" },
      { id: "modifier-annonce", question: "Kan ik mijn advertentie wijzigen na publicatie?", answer: "Ja, u kunt uw advertentie op elk moment wijzigen vanuit uw persoonlijke ruimte. Wijzigingen zijn direct zichtbaar na validatie.", category: "vente" },
      { id: "documents-vente", question: "Welke documenten heb ik nodig om te verkopen?", answer: "U heeft de Car-Pass, het kentekenbewijs, een geldig technisch keuringsrapport en kwaliteitsfoto's van uw voertuig nodig.", category: "vente" },
      // Account
      { id: "creer-compte", question: "Hoe maak ik een account aan op AutoRa?", answer: "Klik op 'Inloggen' rechtsboven, dan op 'Account aanmaken'. Vul uw gegevens in en valideer uw email. U kunt ook inloggen met Google.", category: "compte" },
      { id: "modifier-mot-de-passe", question: "Hoe wijzig ik mijn wachtwoord?", answer: "Log in op uw account, ga naar profielinstellingen en klik op 'Wachtwoord wijzigen'. U ontvangt een bevestigingsemail.", category: "compte" },
      // Veiligheid
      { id: "detecter-fraude", question: "Wat te doen als ik fraude detecteer?", answer: "Meld de verdachte advertentie onmiddellijk via de meldknop. Ons team onderzoekt elke melding binnen 24 uur en neemt de nodige maatregelen om onze gemeenschap te beschermen.", category: "securite" },
      { id: "protection-donnees", question: "Zijn mijn persoonlijke gegevens beschermd?", answer: "Ja, wij nemen de bescherming van uw gegevens zeer serieus. Alle informatie wordt versleuteld en veilig opgeslagen in overeenstemming met de GDPR.", category: "securite" },
      // Betaling
      { id: "financement", question: "Biedt AutoRa financieringsservices aan?", answer: "Wij werken samen met financiële partners om u aangepaste kredietoplossingen aan te bieden. Neem contact met ons op voor meer informatie over beschikbare financieringsopties.", category: "paiement" },
      { id: "paiement-securise", question: "Hoe kan ik veilig betalen?", answer: "AutoRa is geen betalingsintermediair. We raden aan nooit te betalen voordat u het voertuig persoonlijk heeft gezien en de voorkeur te geven aan bankoverschrijvingen boven contant geld.", category: "paiement" },
    ],
    de: [
      // Kauf
      { id: "car-pass", question: "Was ist der Car-Pass?", answer: "Der Car-Pass ist ein offizielles belgisches Dokument, das die Kilometerhistorie eines Fahrzeugs nachverfolgt. Es ermöglicht die Überprüfung, ob der Tacho nicht manipuliert wurde, und garantiert Transparenz beim Kauf eines Gebrauchtwagens.", category: "lez" },
      { id: "verification-lez", question: "Wie funktioniert die LEZ-Überprüfung?", answer: "Wir überprüfen automatisch die Konformität jedes Fahrzeugs mit den Umweltzonen (LEZ) von Brüssel, Antwerpen und Gent. Fahrzeuge mit Euro 6 oder höher dürfen in diesen Zonen frei fahren.", category: "lez" },
      { id: "contacter-vendeur", question: "Wie kontaktiere ich einen Verkäufer?", answer: "Nach der Anmeldung können Sie dem Verkäufer direkt über unser integriertes Nachrichtensystem eine Nachricht senden. Ihre Gespräche sind sicher und bleiben privat.", category: "achat" },
      { id: "verification-vehicule", question: "Wie überprüfe ich ein Fahrzeug vor dem Kauf?", answer: "Überprüfen Sie immer den Car-Pass, fordern Sie den gültigen TÜV-Bericht an und inspizieren Sie das Fahrzeug persönlich. Zahlen Sie nie, bevor Sie das Auto gesehen haben.", category: "achat" },
      // Verkauf
      { id: "vendre-voiture", question: "Wie kann ich mein Auto auf AutoRa verkaufen?", answer: "Ganz einfach! Erstellen Sie ein Konto, klicken Sie auf 'Verkaufen', geben Sie die Informationen Ihres Fahrzeugs mit Fotos und Beschreibung ein und reichen Sie Ihre Anzeige ein. Unser Team wird sie vor der Veröffentlichung überprüfen.", category: "vente" },
      { id: "annonces-gratuites", question: "Sind Anzeigen kostenlos?", answer: "Ja, das Einstellen von Anzeigen ist für Privatpersonen völlig kostenlos. Wir glauben an demokratischen Zugang zum belgischen Automarkt.", category: "vente" },
      { id: "modifier-annonce", question: "Kann ich meine Anzeige nach der Veröffentlichung bearbeiten?", answer: "Ja, Sie können Ihre Anzeige jederzeit in Ihrem persönlichen Bereich bearbeiten. Änderungen sind sofort nach Validierung sichtbar.", category: "vente" },
      { id: "documents-vente", question: "Welche Dokumente benötige ich zum Verkaufen?", answer: "Sie benötigen den Car-Pass, den Fahrzeugbrief, einen gültigen TÜV-Bericht und Qualitätsfotos Ihres Fahrzeugs.", category: "vente" },
      // Konto
      { id: "creer-compte", question: "Wie erstelle ich ein Konto bei AutoRa?", answer: "Klicken Sie oben rechts auf 'Anmelden' und dann auf 'Konto erstellen'. Füllen Sie Ihre Daten aus und bestätigen Sie Ihre E-Mail. Sie können sich auch mit Google anmelden.", category: "compte" },
      { id: "modifier-mot-de-passe", question: "Wie ändere ich mein Passwort?", answer: "Melden Sie sich bei Ihrem Konto an, gehen Sie zu den Profileinstellungen und klicken Sie auf 'Passwort ändern'. Sie erhalten eine Bestätigungs-E-Mail.", category: "compte" },
      // Sicherheit
      { id: "detecter-fraude", question: "Was soll ich tun, wenn ich Betrug erkenne?", answer: "Melden Sie die verdächtige Anzeige sofort über die Meldeschaltfläche. Unser Team prüft jede Meldung innerhalb von 24 Stunden und ergreift die notwendigen Maßnahmen zum Schutz unserer Gemeinschaft.", category: "securite" },
      { id: "protection-donnees", question: "Sind meine persönlichen Daten geschützt?", answer: "Ja, wir nehmen den Schutz Ihrer Daten sehr ernst. Alle Informationen werden verschlüsselt und sicher gemäß DSGVO gespeichert.", category: "securite" },
      // Zahlung
      { id: "financement", question: "Bietet AutoRa Finanzierungsservices an?", answer: "Wir arbeiten mit Finanzpartnern zusammen, um Ihnen angepasste Kreditlösungen anzubieten. Kontaktieren Sie uns für weitere Informationen zu verfügbaren Finanzierungsoptionen.", category: "paiement" },
      { id: "paiement-securise", question: "Wie kann ich sicher bezahlen?", answer: "AutoRa ist kein Zahlungsvermittler. Wir empfehlen, niemals zu bezahlen, bevor Sie das Fahrzeug persönlich gesehen haben, und Banküberweisungen gegenüber Bargeld zu bevorzugen.", category: "paiement" },
    ],
    en: [
      // Buying
      { id: "car-pass", question: "What is the Car-Pass?", answer: "The Car-Pass is an official Belgian document that tracks a vehicle's mileage history. It allows you to verify that the odometer has not been tampered with and guarantees transparency when buying a used car.", category: "lez" },
      { id: "verification-lez", question: "How does LEZ verification work?", answer: "We automatically verify each vehicle's compliance with the Low Emission Zones (LEZ) of Brussels, Antwerp, and Ghent. Vehicles meeting Euro 6 or higher standards can drive freely in these zones.", category: "lez" },
      { id: "contacter-vendeur", question: "How do I contact a seller?", answer: "Once logged in, you can send a message directly to the seller through our integrated messaging system. Your conversations are secure and remain private.", category: "achat" },
      { id: "verification-vehicule", question: "How do I check a vehicle before purchase?", answer: "Always check the Car-Pass, request the valid technical inspection report, and inspect the vehicle in person. Never pay before seeing the car.", category: "achat" },
      // Selling
      { id: "vendre-voiture", question: "How can I sell my car on AutoRa?", answer: "It's simple! Create an account, click 'Sell', fill in your vehicle information with photos and description, then submit your listing. Our team will review it before publication.", category: "vente" },
      { id: "annonces-gratuites", question: "Are listings free?", answer: "Yes, posting listings is completely free for private individuals. We believe in democratic access to the Belgian car market.", category: "vente" },
      { id: "modifier-annonce", question: "Can I edit my listing after publication?", answer: "Yes, you can edit your listing at any time from your personal space. Changes will be visible immediately after validation.", category: "vente" },
      { id: "documents-vente", question: "What documents do I need to sell?", answer: "You will need the Car-Pass, registration certificate, valid technical inspection report, and quality photos of your vehicle.", category: "vente" },
      // Account
      { id: "creer-compte", question: "How do I create an account on AutoRa?", answer: "Click 'Login' in the top right, then 'Create account'. Fill in your information and validate your email. You can also sign in with Google.", category: "compte" },
      { id: "modifier-mot-de-passe", question: "How do I change my password?", answer: "Log in to your account, go to profile settings, and click 'Change password'. You will receive a confirmation email.", category: "compte" },
      // Security
      { id: "detecter-fraude", question: "What should I do if I detect fraud?", answer: "Report the suspicious listing immediately via the report button. Our team reviews each report within 24 hours and takes necessary measures to protect our community.", category: "securite" },
      { id: "protection-donnees", question: "Is my personal data protected?", answer: "Yes, we take the protection of your data very seriously. All information is encrypted and stored securely in accordance with GDPR.", category: "securite" },
      // Payment
      { id: "financement", question: "Does AutoRa offer financing services?", answer: "We work with financial partners to offer you adapted credit solutions. Contact us for more information on available financing options.", category: "paiement" },
      { id: "paiement-securise", question: "How can I pay securely?", answer: "AutoRa is not a payment intermediary. We recommend never paying before seeing the vehicle in person and preferring bank transfers over cash.", category: "paiement" },
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
    fr: "Trouvez rapidement les réponses à vos questions sur AutoRa, le Car-Pass, les zones LEZ et bien plus encore.",
    nl: "Vind snel antwoorden op uw vragen over AutoRa, de Car-Pass, LEZ-zones en meer.",
    de: "Finden Sie schnell Antworten auf Ihre Fragen zu AutoRa, Car-Pass, LEZ-Zonen und mehr.",
    en: "Quickly find answers to your questions about AutoRa, Car-Pass, LEZ zones and more.",
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
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="flex justify-center mb-4">
            <Breadcrumbs
              items={[
                { label: "AutoRa", to: "/" },
                { label: "FAQ" },
              ]}
            />
          </div>
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