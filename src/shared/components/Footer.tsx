/**
 * Premium Footer – Stripe/Apple-inspired 4-column layout
 * @module shared/components
 */

import { Link } from "react-router-dom";
import autoraLogo from "@/assets/autora-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const { language, setLanguage } = useLanguage();
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: language === "nl" ? "Kopen" : language === "en" ? "Buy" : language === "de" ? "Kaufen" : "Acheter",
      links: [
        { to: "/?brand=Volkswagen", label: "Volkswagen" },
        { to: "/?brand=BMW", label: "BMW" },
        { to: "/?brand=Audi", label: "Audi" },
        { to: "/?brand=Mercedes", label: "Mercedes" },
        { to: "/?brand=Peugeot", label: "Peugeot" },
        { to: "/?brand=Renault", label: "Renault" },
        { to: "/", label: language === "nl" ? "Alle merken" : language === "en" ? "All brands" : language === "de" ? "Alle Marken" : "Toutes les marques" },
        { to: "/calculateur-tco", label: language === "nl" ? "TCO Calculator" : "Calculateur TCO" },
      ],
    },
    {
      title: language === "nl" ? "Verkopen" : language === "en" ? "Sell" : language === "de" ? "Verkaufen" : "Vendre",
      links: [
        { to: "/sell", label: language === "nl" ? "Mijn auto verkopen" : language === "en" ? "Sell my car" : language === "de" ? "Auto verkaufen" : "Publier une annonce" },
        { to: "/pricing", label: language === "nl" ? "Tarieven Pro" : language === "en" ? "Pro pricing" : language === "de" ? "Pro Preise" : "Tarifs Pro" },
        { to: "/dashboard", label: "Dashboard" },
        { to: "/faq", label: language === "nl" ? "Hulp" : language === "en" ? "Help" : language === "de" ? "Hilfe" : "Aide" },
      ],
    },
    {
      title: language === "nl" ? "Bedrijf" : language === "en" ? "Company" : language === "de" ? "Unternehmen" : "Société",
      links: [
        { to: "/about", label: language === "nl" ? "Over ons" : language === "en" ? "About us" : language === "de" ? "Über uns" : "À propos" },
        { to: "/services", label: language === "nl" ? "Onze diensten" : language === "en" ? "Our services" : language === "de" ? "Unsere Dienste" : "Nos services" },
        { to: "/contact", label: "Contact" },
        { to: "/blog", label: "Blog" },
        { to: "/faq", label: "FAQ" },
      ],
    },
    {
      title: language === "nl" ? "Juridisch" : language === "en" ? "Legal" : language === "de" ? "Rechtliches" : "Légal",
      links: [
        { to: "/terms", label: language === "nl" ? "Algemene voorwaarden" : language === "en" ? "Terms of Service" : language === "de" ? "AGB" : "Conditions générales" },
        { to: "/privacy", label: language === "nl" ? "Privacybeleid" : language === "en" ? "Privacy Policy" : language === "de" ? "Datenschutz" : "Confidentialité" },
        { to: "/cookies", label: language === "nl" ? "Cookiebeleid" : language === "en" ? "Cookie Policy" : language === "de" ? "Cookie-Richtlinie" : "Politique cookies" },
        { to: "/legal", label: language === "nl" ? "Wettelijke vermeldingen" : language === "en" ? "Legal Notice" : language === "de" ? "Impressum" : "Mentions légales" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden mt-12 sm:mt-20 border-t border-border/10 pb-24 md:pb-0">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 bg-[hsl(224,30%,5%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Main grid */}
        <div className="py-12 sm:py-16 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 space-y-5">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={autoraLogo} alt="AutoRa" className="w-8 h-8 rounded-xl object-cover" />
              <span className="font-display text-lg font-bold tracking-wider">
                <span className="text-white">Auto</span>
                <span className="text-primary">RA</span>
              </span>
            </Link>
            <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-[240px]">
              {language === "nl"
                ? "Het eerste autoplatform gewijd aan de Belgische markt."
                : language === "en"
                  ? "The first car marketplace dedicated to the Belgian market."
                  : language === "de"
                    ? "Die erste Autoplattform für den belgischen Markt."
                    : "La première plateforme d'annonces auto dédiée au marché belge."}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <Shield className="w-3 h-3 text-primary/70" />
                Car-Pass
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <Shield className="w-3 h-3 text-primary/70" />
                LEZ
              </div>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/10" />

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Language selector */}
          <div className="flex items-center gap-0.5 text-[11px] bg-white/[0.04] rounded-full p-0.5">
            {(["fr", "nl", "de", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
                  language === lang
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
                aria-label={`Change language to ${lang.toUpperCase()}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Contact & copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-[11px] text-muted-foreground/40">
            <a href="mailto:autoracontact@gmail.com" className="flex items-center gap-1.5 hover:text-muted-foreground transition-colors">
              <Mail className="w-3 h-3" />
              autoracontact@gmail.com
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              Belgique 🇧🇪
            </span>
            <span>© {currentYear} AutoRa · {language === "nl" ? "Alle rechten voorbehouden" : language === "en" ? "All rights reserved" : language === "de" ? "Alle Rechte vorbehalten" : "Tous droits réservés"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
