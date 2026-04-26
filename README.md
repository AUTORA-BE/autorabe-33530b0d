# 🚗 AutoRA.be — Premium Belgian Car Marketplace

Marketplace automobile belge premium pour acheter et vendre des voitures d'occasion vérifiées Car-Pass, avec compatibilité LEZ garantie, calculateur TCO et simulateurs de taxes régionales (Wallonie / Bruxelles / Flandre).

> **Status** : Private Beta — v1.0.0-beta.1
> **Live** : [autora.be](https://autora.be) · [www.autora.be](https://www.autora.be)
> **Stack** : React 18 · Vite 5 · TypeScript strict · Tailwind · shadcn/ui · Supabase · TanStack Query · Framer Motion · PWA

---

## ✨ Fonctionnalités

- 🔍 Recherche avancée + filtres dynamiques (marque, modèle, prix, LEZ, province, Euro Norm…)
- 💬 Messagerie temps réel (Supabase Realtime, typing/présence, partage d'image)
- ⭐ Favoris + Comparaison (jusqu'à 3 véhicules) + Alertes intelligentes
- 📊 Calculateur TCO 5 ans (prix carburants belges en temps réel)
- 🇧🇪 Conformité belge : Car-Pass obligatoire, badges LEZ, distinction Pro/Particulier
- 💳 Stripe : abonnements 5 paliers + boost annonces (24h–7j)
- 🌍 4 langues : FR, NL, DE, EN
- 📱 PWA installable (offline, push notifications, splash screens iOS)
- 🤖 Conseiller fiscal IA (Lovable AI Gateway)

---

## 🚀 Quick Start

```bash
npm install
npm run dev          # http://localhost:8080
npm run build
npm run lint
```

---

## 🔐 Variables d'environnement

`.env` est **auto-géré par Lovable Cloud** — ne jamais l'éditer.

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé anon publique (sûre côté client) |
| `VITE_SUPABASE_PROJECT_ID` | ID projet Supabase |

### Secrets backend (Edge Functions)

Configurés dans **Lovable Cloud → Settings → Secrets** :

| Secret | Usage |
|---|---|
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Paiements + abonnements |
| `RESEND_API_KEY` | Emails transactionnels |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Push notifications |
| `LOVABLE_API_KEY` | AI Gateway (Gemini, GPT) |

---

## 🏗 Architecture

```
src/
├── features/          # Modules feature-based (auth, listings, messaging, search, tco, admin…)
│   └── <feature>/{api, components, hooks, types, index.ts}
├── shared/            # Composants/hooks transverses
├── components/        # UI shadcn + composants legacy
├── pages/             # Routes React Router
├── integrations/supabase/   # Client + types auto-générés (NE PAS ÉDITER)
├── lib/               # Utils (security, seoSchemas, lezData)
└── i18n/              # Traductions FR/NL/DE/EN

supabase/
├── functions/         # Edge Functions Deno
└── migrations/        # SQL migrations versionnées
```

### Standards

- TypeScript strict — aucun `any`
- Colonnes explicites dans Supabase (jamais `select('*')`)
- RLS systématique, rôle admin via RPC `has_role`
- React Query `staleTime: 5min`
- Lazy loading routes + composants lourds
- Bundle splitting (`vendor-react`, `vendor-query`, `vendor-motion`, etc.)

---

## 🔒 Sécurité

- ✅ HIBP Password Check + Email confirmation activés
- ✅ CSP stricte dans `index.html`
- ✅ Rate limiting serveur via edge function
- ✅ Aucune PII (email/téléphone) exposée publiquement
- ✅ Stripe webhooks signés
- ✅ GDPR : cookie banner, droit à l'oubli, export JSON

---

## 🔍 SEO

- React Helmet Async sur toutes les pages publiques
- Open Graph + Twitter + canonical + hreflang FR/NL/DE/EN
- JSON-LD : `Organization`, `WebSite`, `Vehicle`+`Offer`, `BreadcrumbList`, `FAQPage`
- Sitemap dynamique via edge function `dynamic-sitemap`

---

## 📱 PWA

- Manifest complet + icônes 192/512/maskable
- Splash screens iOS multi-résolutions
- Service Worker auto-désactivé en preview Lovable (`src/main.tsx`)
- Runtime caching : NetworkFirst (API), CacheFirst (images/fonts)

---

## 🚢 Déploiement

### Lovable Cloud (actuel)

```
1. Cliquer "Publish" en haut à droite
2. Frontend → bouton Update pour mise en prod
3. Backend (Edge Functions, migrations) → déploiement automatique
```

Custom domain : `autora.be` + `www.autora.be` (Project Settings → Domains). SPA fallback inclus.

### Vercel (optionnel)

```bash
npm run build           # → /dist
# Vercel : Build = npm run build, Output = dist
# Env : VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
# vercel.json : { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## ✅ Checklist Private Beta

| Catégorie | Status |
|---|---|
| HIBP + email confirmation | ✅ |
| RLS sur toutes les tables | ✅ |
| Aucune PII publique | ✅ |
| 25 annonces démo (toutes provinces) | ✅ |
| Compte démo (sur demande via [contact](https://autora.be/contact)) | ✅ |
| 4 langues complètes | ✅ |
| SEOHead sur toutes les pages | ✅ |
| JSON-LD Vehicle/Organization | ✅ |
| Sitemap + robots.txt | ✅ |
| PWA + offline + splash iOS | ✅ |
| Lighthouse mobile ≥ 90 | ⏳ à valider |
| Tests E2E (signup → publication → message) | ⏳ à valider |

---

## 📚 Liens

- [Lovable Docs](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Schema.org Vehicle](https://schema.org/Car)

---

🇧🇪 *Premium Belgian car marketplace — Built with care.*
