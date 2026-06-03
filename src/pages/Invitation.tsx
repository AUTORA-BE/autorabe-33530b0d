/**
 * Invitation — premium AutoRA invitation landing page.
 * Branded dark theme, radial gradients, glassmorphism, subtle entrance.
 * Route: /invitation (+ localized variants).
 * @module pages
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Car } from "lucide-react";
import autoraLogo from "@/assets/autora-logo.png";
import SEOHead from "@/components/SEOHead";

export default function Invitation() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0B] text-white">
      <SEOHead
        title="Invitation — AutoRA, la nouvelle référence automobile en Belgique"
        description="Rejoignez AutoRA, la marketplace premium d'occasions vérifiées Car-Pass en Belgique."
        noIndex
      />

      {/* ── Radial gradients background ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(60% 50% at 15% 10%, hsl(var(--primary) / 0.22) 0%, transparent 60%),
            radial-gradient(50% 40% at 90% 90%, hsl(var(--primary) / 0.18) 0%, transparent 60%),
            radial-gradient(40% 30% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)
          `,
        }}
      />
      {/* Soft grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      <main className="relative z-10 flex min-h-screen flex-col">
        {/* Logo */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="px-6 sm:px-10 pt-8"
        >
          <Link to="/" className="inline-flex items-center gap-2.5" aria-label="AutoRA — Accueil">
            <img src={autoraLogo} alt="AutoRA" className="h-10 w-10 rounded-xl shadow-lg" />
            <span className="text-xl font-semibold tracking-wider">
              <span className="text-white">Auto</span><span className="text-primary">RA</span>
            </span>
          </Link>
        </motion.header>

        {/* Hero */}
        <section className="flex-1 grid place-items-center px-6 sm:px-10 py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl"
          >
            {/* Glass card */}
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8 sm:p-14 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.7)]">
              {/* Top chip */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-300"
              >
                <Sparkles className="h-3 w-3" strokeWidth={2} />
                Invitation exclusive
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="mt-6 text-4xl sm:text-5xl md:text-6xl font-light leading-[1.05] tracking-tight"
              >
                Rejoignez{" "}
                <span className="bg-gradient-to-r from-white via-white to-primary bg-clip-text text-transparent">
                  AutoRA
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="mt-5 text-base sm:text-lg text-white/70 leading-relaxed max-w-xl"
              >
                La nouvelle référence de l'automobile en Belgique. Annonces vérifiées,
                Car-Pass intégré, vitrine pro et expérience premium — dès aujourd'hui.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="mt-9 flex flex-col sm:flex-row gap-3"
              >
                <Link
                  to="/auth"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)] transition hover:shadow-[0_14px_50px_-10px_hsl(var(--primary)/0.8)] hover:-translate-y-0.5"
                >
                  Créer mon compte
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </Link>
                <Link
                  to="/recherche"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.06] hover:border-white/25"
                >
                  Explorer les véhicules
                </Link>
              </motion.div>

              {/* Trust strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] uppercase tracking-[0.16em] text-white/55"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                  Car-Pass vérifié
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                  Marché belge
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                  Expérience premium
                </span>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <footer className="px-6 sm:px-10 pb-8 text-center text-[11px] text-white/40">
          © {new Date().getFullYear()} AutoRA — Belgique
        </footer>
      </main>
    </div>
  );
}
