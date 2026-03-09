/**
 * Footer component with navigation, legal links, and contact info
 * @module shared/components
 */

import { Link } from "react-router-dom";
import autoraLogo from "@/assets/autora-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, FileCheck, Mail, MapPin, HelpCircle, Calculator } from "lucide-react";


const Footer = () => {
  const { language, setLanguage } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[hsl(224,30%,6%)] text-gray-300 mt-12 sm:mt-20 border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* 1. Logo & Slogan */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={autoraLogo}
                alt="Autora Logo"
                className="w-9 h-9 rounded-2xl object-cover"
              />
              <span className="font-display text-xl font-bold tracking-wider">
                <span className="text-white">Auto</span><span className="text-primary">RA</span>
              </span>
            </Link>
            <p className="text-primary font-semibold text-xs sm:text-sm">
              {language === "nl" ? "Uw auto met vertrouwen" : "L'auto en toute confiance"}
            </p>
            <p className="text-gray-500 text-xs leading-relaxed hidden sm:block">
              {language === "nl"
                ? "Het eerste autoplatform gewijd aan de Belgische markt."
                : "La première plateforme d'annonces auto dédiée au marché belge."}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Car-Pass</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <FileCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>LEZ</span>
              </div>
            </div>
          </div>

          {/* 2. Liens rapides */}
          <div>
            <h4 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-wide">
              {language === "nl" ? "Snelle links" : "Liens rapides"}
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/", label: language === "nl" ? "Een auto kopen" : "Acheter une voiture" },
                { to: "/sell", label: language === "nl" ? "Mijn auto verkopen" : "Vendre ma voiture" },
                { to: "/favorites", label: language === "nl" ? "Mijn favorieten" : "Mes favoris" },
                { to: "/compare", label: language === "nl" ? "Vergelijken" : "Comparer" },
                { to: "/calculateur-tco", label: language === "nl" ? "TCO Calculator" : "Calculateur TCO" },
                { to: "/pricing", label: language === "nl" ? "Tarieven" : "Tarifs" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Aide & FAQ */}
          <div>
            <h4 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-wide">
              {language === "nl" ? "Hulp & FAQ" : "Aide & FAQ"}
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/faq", label: "FAQ", icon: HelpCircle },
                { to: "/about", label: language === "nl" ? "Over ons" : "À propos" },
                { to: "/terms", label: language === "nl" ? "Algemene voorwaarden" : "Conditions générales" },
                { to: "/privacy", label: language === "nl" ? "Privacybeleid (GDPR)" : "Politique de confidentialité" },
                { to: "/legal", label: language === "nl" ? "Wettelijke vermeldingen" : "Mentions légales" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://www.carpass.be"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Car-Pass Belgique
                </a>
              </li>
            </ul>
          </div>

          {/* 4. Contact */}
          <div>
            <h4 className="font-display font-bold text-white mb-4 text-sm uppercase tracking-wide">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {language === "nl" ? "Contactformulier" : "Formulaire de contact"}
                </Link>
              </li>
              <li className="text-gray-400 text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                autoracontact@gmail.com
              </li>
              <li className="text-gray-400 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                Belgique / België
              </li>
            </ul>
          </div>
        </div>

        {/* LEZ reassurance strip */}
        <div className="mt-10 p-3 sm:p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-semibold text-emerald-300">
              LEZ Compliance
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-emerald-200/60 leading-relaxed text-center sm:text-left">
            {language === "nl"
              ? "Elke advertentie op AutoRA vermeldt duidelijk de LEZ-compatibiliteit (Brussel, Antwerpen, Gent). Geen onaangename verrassingen."
              : "Chaque annonce sur AutoRA indique clairement la compatibilité LEZ (Bruxelles, Anvers, Gand). Zéro mauvaise surprise."}
          </p>
        </div>

        {/* Warnings */}
        <div className="mt-10 space-y-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] sm:text-xs text-amber-200/80 leading-relaxed">
              <strong className="text-amber-200">⚠️ {language === "nl" ? "Opgelet" : "Attention"} :</strong>{" "}
              {language === "nl"
                ? "Autora is een advertentieplatform. Wij zijn niet verantwoordelijk voor de transactie of de staat van het voertuig."
                : "Autora est une plateforme d'annonces. Nous ne sommes pas responsables de la transaction ou de l'état du véhicule."}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-[10px] sm:text-xs text-blue-200/80 leading-relaxed">
              <strong className="text-blue-200">🔒 {language === "nl" ? "Privacy" : "RGPD"} :</strong>{" "}
              {language === "nl"
                ? "Uw persoonlijke gegevens worden verwerkt in overeenstemming met de GDPR-wetgeving."
                : "Vos données personnelles sont traitées conformément au règlement RGPD."}
            </p>
          </div>
        </div>

        {/* Bottom bar — language selector + copyright */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-xs bg-white/5 rounded-full px-1.5 py-1">
            {(["fr", "nl", "de", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  language === lang
                    ? "bg-primary text-white font-semibold"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                aria-label={`Change language to ${lang.toUpperCase()}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <p className="text-[10px] sm:text-xs text-gray-600">
            © {currentYear} Autora · {language === "nl" ? "Alle rechten voorbehouden" : "Tous droits réservés"} · {language === "nl" ? "Gemaakt in België" : "Fait en Belgique"} 🇧🇪
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
