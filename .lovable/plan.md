
# Refonte page Paramètres — Style iOS-like premium

Refonte complète de `src/pages/Settings.tsx` (608 lignes) pour passer d'une liste plate de cartes glassmorphism à une expérience **iOS Settings native** : sections sémantiques claires, recherche instantanée, nouvelle zone Sécurité, et touch targets calibrés mobile.

## 1. Refonte visuelle — Sections iOS-like

**Hero profil** (conservé, allégé) : avatar + nom + email + badges (Premium / Admin) + CTA upgrade.

**Sections regroupées** avec en-têtes sticky type iOS (`SF` style — Playfair pour le titre, Inter caps tracking pour les labels de section). Chaque section = un GlassCard avec **icône colorée carrée** (style iOS) par row :

| Section | Icône / couleur | Rows |
|---|---|---|
| **Mon activité** | Bleu | Mes annonces, Favoris, Messages, Mes alertes |
| **Compte** | Indigo | Nom affiché, Email, Téléphone, Avatar |
| **Sécurité** *(nouvelle)* | Rouge | Changer mot de passe, Sessions actives, Déconnecter partout |
| **Préférences** | Emerald (primary) | Langue, Thème (clair/sombre/auto), Région |
| **Notifications** | Orange | Email, Push, Alertes véhicules, Messages |
| **Confidentialité** | Violet | Cookies, Exporter mes données, Profil public |
| **Abonnement** | Gold | Plan actuel, Gérer abonnement, Historique paiements |
| **À propos** | Gris | Version app, CGU, Confidentialité, Contact support |
| **Zone danger** | Destructive | Supprimer le compte, Déconnexion |

Les icônes carrées colorées (style iOS Settings — fond saturé, icône blanche 18px) remplacent les bulles `bg-primary/10` actuelles.

## 2. Recherche dans les paramètres

Barre de recherche **sticky** sous le header (style iOS Spotlight) :
- Input `Rechercher dans les paramètres…` avec icône loupe
- Filtre live sur **label + description + keywords** de chaque row (matching fuzzy basique, case-insensitive)
- Résultats affichés en liste plate avec breadcrumb de section (`Préférences › Langue`)
- État vide élégant si 0 résultat

Implémenté en client (registre statique de rows) — pas de backend nécessaire.

## 3. Section Sécurité (nouvelle)

Trois actions :
1. **Changer le mot de passe** → modal avec champs *Mot de passe actuel / nouveau / confirmation* + validation force (réutilise `usePasswordValidation`). Appel `supabase.auth.updateUser({ password })` après ré-auth.
2. **Sessions actives** → liste des sessions Supabase (`auth.admin.listUserSessions` côté edge function `list-user-sessions`, sinon affichage simplifié de la session courante avec user-agent et dernière activité)
3. **Déconnecter tous les autres appareils** → `supabase.auth.signOut({ scope: 'others' })`

Note technique : `list-user-sessions` nécessite une **edge function** (Supabase n'expose pas la liste côté client). Première version : afficher uniquement la session courante + bouton "Déconnecter partout". L'edge function peut être ajoutée en V2 si tu valides.

## 4. UX mobile native

- **Touch targets** : tous les rows passent à `min-h-[52px]` (au-dessus des 44px iOS)
- **Pull-to-refresh** sur la page (réutilise `<PullToRefresh>` existant) pour recharger profil + prefs
- **Transitions natives** : ChevronRight + active scale 0.97, haptic feedback (useHapticFeedback) sur tap des rows
- **Sticky header compact** au scroll : titre "Paramètres" qui apparaît dans le header quand on scroll, hero profil qui réduit
- **Safe area** : `pb-[calc(env(safe-area-inset-bottom)+96px)]` pour éviter BottomNav
- **Séparateurs iOS** : `border-t border-border/15 ml-[60px]` (commence après l'icône, style iOS)
- **Cards rounded** `rounded-[14px]` au lieu de `[20px]` pour matcher iOS Settings

## 5. Architecture fichiers

```
src/features/settings/
├── components/
│   ├── SettingsSection.tsx       (GlassCard + titre + rows)
│   ├── SettingsRow.tsx           (extrait, icône carrée colorée)
│   ├── SettingsSearch.tsx        (sticky search + résultats)
│   ├── ProfileHero.tsx           (avatar + nom + badges)
│   ├── SecuritySection.tsx       (mot de passe, sessions, logout all)
│   └── ChangePasswordModal.tsx
├── hooks/
│   └── useSettingsSearch.ts      (registre + filtre)
└── index.ts
```

`Settings.tsx` devient un orchestrateur léger (~150 lignes) qui assemble ces composants.

## Détails techniques

- Aucune migration DB requise (tout existe déjà : `user_preferences`, `profiles`, `auth.users`)
- Réutilise hooks existants : `useFavorites`, `useSubscription`, `useIsAdmin`, `usePushNotifications`, `useSellerListings`, `usePasswordValidation`, `useHapticFeedback`
- i18n : ajouter ~15 clés (`settings.search.placeholder`, `settings.security.title`, `settings.security.changePassword`, etc.) dans les 4 fichiers `fr/nl/de/en.json`
- Pas de changement de comportement business — seulement la couche présentation et l'ajout de la section Sécurité (changement mot de passe + logout all)
- Animations Framer Motion conservées (stagger), durées 200-300ms (respecte la mémoire projet)
- Désactive le sticky search header sur desktop (`md:static`)

## Hors-scope (à confirmer en V2 si besoin)

- 2FA (TOTP) : Supabase MFA disponible mais demande un flow complet (enroll + verify + recovery codes) — peut être ajouté plus tard
- Liste détaillée des sessions actives : nécessite edge function `list-user-sessions`
- Authentification biométrique (WebAuthn / passkeys)
