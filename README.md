<div align="center">

  <img src="public/pwa-icon-192.png" alt="AutoRA.be" width="96" />

  <h1>AutoRA.be</h1>
  <h3>La nouvelle façon de trouver sa prochaine voiture en Belgique</h3>

  <p><strong>🇧🇪 Private Beta MVP — v1.0.0-beta.1</strong></p>

</div>

---

## 🧪 Private Beta — Instructions pour testeurs

> Bienvenue ! Vous testez la version pré-lancement d'AutoRA.be.
> Votre feedback nous aide à finaliser la plateforme avant l'ouverture publique.

### 🔗 Accès

- **Application** : https://autora.be
- **Aperçu Lovable** : https://autorabe.lovable.app

### ✅ Ce qu'il faut tester en priorité

1. **Création de compte** (email + Google) — vérification du téléphone +32 obligatoire
2. **Recherche** — filtres marque/modèle/budget/km, persistance dans l'URL, partage d'une recherche
3. **Page véhicule** — galerie photos, badges Car-Pass / LEZ, contact vendeur
4. **Mise en vente** (`/sell`) — wizard 3 étapes, upload photos (max 15), Car-Pass obligatoire
5. **Messagerie** temps réel — typing indicator, lecture, partage d'image
6. **Favoris & Comparateur** — jusqu'à 3 véhicules
7. **PWA** — installation sur iOS (Safari → Partager → Sur l'écran d'accueil) et Android (menu navigateur → Installer)
8. **Mobile / Tablette / Desktop** — testez sur Galaxy Tab S10 Ultra, iPhone, et PC
9. **Mode hors ligne** — coupez votre wifi : la page offline élégante doit s'afficher
10. **Multilingue** — bascule FR / NL / DE / EN

### 🐛 Comment remonter un bug

- **Email** : beta@autora.be (ou via le formulaire `/contact`)
- **Captures d'écran bienvenues** — précisez l'appareil, le navigateur et l'URL exacte
- **Erreurs console** : ouvrez les DevTools (F12) et copiez le message rouge

### ⚠️ Connu / en cours

- Stripe est en **mode Beta gratuit** : tous les comptes ont accès aux fonctions Pro sans paiement
- Le seed de 25 annonces de démo n'est pas encore inséré (à venir)
- Les emails transactionnels passent par `notify.autora.be`

---

## ⚙️ Sécurité repo (à faire manuellement)

> **Important** : le fichier `.env` est généré automatiquement par Lovable Cloud
> et **ne doit jamais être versionné**. Si vous travaillez en local après un
> `git clone`, exécutez ces commandes une seule fois :

```bash
# 1. Retirer .env du tracking git (garde le fichier local)
git rm --cached .env

# 2. Vérifier que .gitignore ignore bien tous les fichiers d'env
echo -e "\n# Local env files\n.env\n.env.*\n!.env.example" >> .gitignore

# 3. Commit
git add .gitignore
git commit -m "chore(security): untrack .env and ignore env files"
```

Sur Lovable, le fichier `.env` est régénéré automatiquement à chaque session — il
n'est jamais exposé publiquement via la preview ou la production.

---

## 🚀 Installation locale (développeurs)

```bash
git clone https://github.com/AUTORA-BE/Autorabe.git
cd Autorabe
npm install
npm run dev
```

L'app démarre sur `http://localhost:8080`.

---

## 🏗️ Architecture (Feature Folders)

```
src/
├── features/           # Domaines fonctionnels autonomes
│   ├── auth/           # Connexion, profils, vérification téléphone
│   ├── listings/       # Annonces, wizard de vente, dashboard vendeur
│   ├── messaging/      # Chat temps réel (Supabase Realtime)
│   ├── search/         # Hero, filtres, persistance URL
│   ├── favorites/      # Favoris + compteur public
│   ├── compare/        # Comparateur 3 véhicules
│   ├── tco/            # Calculateur TCO 5 ans
│   ├── alerts/         # Alertes intelligentes (email + push)
│   ├── admin/          # Modération, stats, gestion users
│   └── subscription/   # Abonnements Stripe (5 paliers)
├── shared/             # Layout (Header, Footer, BottomNav) + hooks génériques
├── components/         # shadcn/ui + composants transverses
├── pages/              # Routes principales (lazy-loaded)
└── integrations/       # Supabase client (auto-généré)
```

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Framework | React 18 + Vite + TypeScript strict |
| UI | Tailwind CSS + shadcn/ui + Framer Motion |
| State | TanStack React Query (staleTime 5 min) |
| Routing | React Router v6 (BrowserRouter, SPA fallback géré par Lovable) |
| Backend | Lovable Cloud (Supabase) — Auth, DB, Storage, Realtime, Edge Functions |
| Paiements | Stripe (5 paliers d'abonnement + boosts d'annonces) |
| Emails | Resend via `notify.autora.be` (6 templates React Email) |
| PWA | vite-plugin-pwa (autoUpdate, runtime cache, offline page premium) |
| AI | Lovable AI Gateway (Gemini Flash pour conseiller fiscal) |
| i18n | FR / NL / DE / EN |

---

## 🎨 Design system "Elite Green"

- **Palette** : noir profond (`#0A0A0B`), Emerald-600 primaire, glassmorphism premium
- **Typographie** : Playfair Display (titres) + Inter (corps)
- **Mode sombre par défaut** (avec toggle clair)
- **Animations** : Framer Motion 200-300 ms, micro-interactions raffinées
- **Mobile-first** : safe-areas iOS, targets 44 px, BottomNav blur, drawers via portails

---

## 📊 Standards de développement

| Règle | Description |
|---|---|
| TypeScript strict | Aucun `any`, JSDoc systématique |
| Tokens sémantiques | `bg-primary` plutôt que couleurs littérales |
| Barrel exports | Chaque feature expose via `index.ts` |
| Requêtes explicites | `LIST_COLUMNS` plutôt que `select('*')` |
| Sécurité | RLS Supabase sur toutes les tables, `has_role()` pour les admins |

---

## 📜 Licence & contact

© 2026 AutoRA.be — tous droits réservés.
Pour toute question : **support@autora.be**
