/**
 * Cookies Policy page — RGPD detailed disclosure
 * Lists every cookie/storage item used and lets the user re-open consent.
 */

import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Cookie, Shield, BarChart3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getConsent, resetConsent, setConsent, onConsentChange } from "@/lib/consent";
import { BackButton } from "@/shared/components";

export default function Cookies() {
  const { language } = useLanguage();
  const [consent, setConsentState] = useState(getConsent());

  useEffect(() => onConsentChange(setConsentState), []);

  const t = {
    fr: {
      title: "Politique cookies — AutoRA",
      h1: "Politique de cookies",
      intro:
        "Cette page détaille les cookies et technologies de stockage utilisés par AutoRA et vous permet de modifier votre consentement à tout moment, conformément au RGPD et à la loi belge sur les communications électroniques.",
      essentialTitle: "Cookies essentiels",
      essentialDesc:
        "Indispensables au fonctionnement du site (authentification, panier, préférences de langue). Ne peuvent pas être désactivés.",
      essentialList: [
        "supabase.auth.token — session utilisateur",
        "autora_cookie_consent — mémorisation de votre choix",
        "autora_lang — langue d'affichage",
      ],
      analyticsTitle: "Cookies analytiques",
      analyticsDesc:
        "Nous utilisons Cloudflare Web Analytics, un outil de mesure d'audience sans cookie et sans tracking inter-sites. Aucune donnée personnelle identifiable n'est collectée ni partagée avec des tiers à des fins publicitaires.",
      analyticsList: [
        "cloudflareinsights.com — pages vues anonymisées, sans cookie",
      ],
      noTracking:
        "Nous n'utilisons aucun cookie publicitaire, aucun pixel Meta/Google Ads, et nous ne revendons aucune donnée.",
      manageTitle: "Gérer mes préférences",
      manageDesc: "Votre choix actuel :",
      consented: "Choix enregistré",
      notConsented: "Aucun choix enregistré",
      analyticsAccepted: "Analytiques acceptés",
      analyticsRefused: "Analytiques refusés",
      accept: "Accepter les analytiques",
      refuse: "Refuser les analytiques",
      reset: "Réinitialiser mon consentement",
    },
    en: {
      title: "Cookie Policy — AutoRA",
      h1: "Cookie Policy",
      intro:
        "This page lists every cookie and storage technology used by AutoRA and lets you change your consent at any time, in compliance with GDPR.",
      essentialTitle: "Essential cookies",
      essentialDesc:
        "Required for the site to work (auth, cart, language). Cannot be disabled.",
      essentialList: [
        "supabase.auth.token — user session",
        "autora_cookie_consent — your consent choice",
        "autora_lang — display language",
      ],
      analyticsTitle: "Analytics cookies",
      analyticsDesc:
        "We use Cloudflare Web Analytics, a cookieless audience-measurement tool with no cross-site tracking. No identifiable personal data is collected or shared with third parties for advertising.",
      analyticsList: ["cloudflareinsights.com — anonymised pageviews, cookieless"],
      noTracking:
        "We do not use ad cookies, Meta/Google Ads pixels, and we do not sell any data.",
      manageTitle: "Manage preferences",
      manageDesc: "Your current choice:",
      consented: "Choice saved",
      notConsented: "No choice saved",
      analyticsAccepted: "Analytics accepted",
      analyticsRefused: "Analytics refused",
      accept: "Accept analytics",
      refuse: "Refuse analytics",
      reset: "Reset my consent",
    },
    nl: {
      title: "Cookiebeleid — AutoRA",
      h1: "Cookiebeleid",
      intro:
        "Deze pagina toont elke cookie die AutoRA gebruikt en laat je toestemming op elk moment wijzigen, conform GDPR.",
      essentialTitle: "Essentiële cookies",
      essentialDesc: "Nodig voor de werking van de site. Kunnen niet uitgeschakeld worden.",
      essentialList: [
        "supabase.auth.token — gebruikerssessie",
        "autora_cookie_consent — uw keuze",
        "autora_lang — taal",
      ],
      analyticsTitle: "Analytische cookies",
      analyticsDesc:
        "We gebruiken Cloudflare Web Analytics, cookievrij en zonder cross-site tracking. Geen identificeerbare persoonsgegevens, geen verkoop van data.",
      analyticsList: ["cloudflareinsights.com — geanonimiseerde paginabezoeken, cookievrij"],
      noTracking: "We gebruiken geen advertentiecookies en verkopen geen data.",
      manageTitle: "Voorkeuren beheren",
      manageDesc: "Uw huidige keuze:",
      consented: "Keuze opgeslagen",
      notConsented: "Geen keuze opgeslagen",
      analyticsAccepted: "Analytics geaccepteerd",
      analyticsRefused: "Analytics geweigerd",
      accept: "Accepteer analytics",
      refuse: "Weiger analytics",
      reset: "Reset toestemming",
    },
    de: {
      title: "Cookie-Richtlinie — AutoRA",
      h1: "Cookie-Richtlinie",
      intro:
        "Diese Seite listet jeden von AutoRA verwendeten Cookie auf und ermöglicht es Ihnen, Ihre Einwilligung jederzeit zu ändern (DSGVO-konform).",
      essentialTitle: "Wesentliche Cookies",
      essentialDesc:
        "Für den Betrieb der Website erforderlich. Können nicht deaktiviert werden.",
      essentialList: [
        "supabase.auth.token — Sitzung",
        "autora_cookie_consent — Ihre Wahl",
        "autora_lang — Sprache",
      ],
      analyticsTitle: "Analytische Cookies",
      analyticsDesc:
        "Wir verwenden Cloudflare Web Analytics, cookielos und ohne Cross-Site-Tracking. Keine identifizierbaren personenbezogenen Daten, kein Datenverkauf.",
      analyticsList: [
        "cloudflareinsights.com — anonymisierte Seitenaufrufe, cookielos",
      ],
      noTracking: "Keine Werbecookies, kein Datenverkauf.",
      manageTitle: "Einstellungen verwalten",
      manageDesc: "Ihre aktuelle Wahl:",
      consented: "Wahl gespeichert",
      notConsented: "Keine Wahl gespeichert",
      analyticsAccepted: "Analytics akzeptiert",
      analyticsRefused: "Analytics abgelehnt",
      accept: "Analytics akzeptieren",
      refuse: "Analytics ablehnen",
      reset: "Einwilligung zurücksetzen",
    },
  }[language] || {} as never;

  return (
    <>
      <Helmet>
        <title>{t.title}</title>
        <meta name="description" content={t.intro.slice(0, 155)} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://autora.be/cookies" />
      </Helmet>

      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-3xl">
        <BackButton to="/" className="mb-6" />
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Cookie className="w-3.5 h-3.5" />
            RGPD
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            {t.h1}
          </h1>
          <p className="text-muted-foreground leading-relaxed">{t.intro}</p>
        </header>

        <section className="mb-10 rounded-2xl border border-border/40 bg-card/40 p-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold mb-1">{t.essentialTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.essentialDesc}</p>
            </div>
          </div>
          <ul className="text-xs font-mono text-muted-foreground space-y-1 ml-8 list-disc list-inside">
            {t.essentialList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-10 rounded-2xl border border-border/40 bg-card/40 p-6">
          <div className="flex items-start gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold mb-1">{t.analyticsTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.analyticsDesc}</p>
            </div>
          </div>
          <ul className="text-xs font-mono text-muted-foreground space-y-1 ml-8 list-disc list-inside mb-4">
            {t.analyticsList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground italic ml-8">{t.noTracking}</p>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="font-semibold mb-2">{t.manageTitle}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t.manageDesc}{" "}
            <span className="font-medium text-foreground">
              {consent.consented ? t.consented : t.notConsented}
              {consent.consented &&
                ` — ${consent.analytics ? t.analyticsAccepted : t.analyticsRefused}`}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setConsent(true)} disabled={consent.analytics}>
              {t.accept}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConsent(false)}
              disabled={consent.consented && !consent.analytics}
            >
              {t.refuse}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetConsent}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              {t.reset}
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
