# 🧪 AutoRA.be — Tests E2E manuels (MVP v1.0.0)

Checklist reproductible des **5 flux critiques** à valider avant chaque release.
Compte test recommandé : créez un compte jetable type `qa+<timestamp>@autora.be`.

> Remplir ✅/❌/⚠️ + commentaire dans la colonne *Résultat*.

---

## Flux 1 — Inscription → Confirmation email → Connexion

| # | Étape | Attendu | Résultat |
|---|---|---|---|
| 1.1 | Aller sur `/auth` | Formulaire signup visible (email + mot de passe + téléphone +32) | |
| 1.2 | Soumettre avec mot de passe faible (`123456`) | Erreur HIBP / validation force | |
| 1.3 | Soumettre avec mot de passe fort + téléphone valide | Toast "Email de confirmation envoyé" | |
| 1.4 | Vérifier inbox (template `signup` from `notify.autora.be`) | Email reçu < 60 s, template Resend FR | |
| 1.5 | Cliquer le lien de confirmation | Redirection vers `/` avec session active | |
| 1.6 | Se déconnecter puis se reconnecter | Login OK, redirige vers la page d'origine | |
| 1.7 | "Mot de passe oublié" → email recovery | Email reçu, lien valide 24 h | |
| 1.8 | Tester signup Google | Popup Google, profil créé en DB avec `display_name` | |

**Fichiers concernés** : `src/pages/Auth.tsx`, `supabase/functions/auth-email-hook/`

---

## Flux 2 — Publication d'une annonce avec photos → Validation admin

| # | Étape | Attendu | Résultat |
|---|---|---|---|
| 2.1 | Connecté, aller sur `/sell` | Wizard multi-étapes affiché | |
| 2.2 | Étape 1 : pré-remplissage contact_name/email depuis profil | Champs remplis automatiquement | |
| 2.3 | Étape photos : uploader 5 images (>4 Mo chacune) | Compression WebP < 1920 px, prévisualisation OK | |
| 2.4 | Tester upload >15 photos | Bloqué avec message clair | |
| 2.5 | Soumettre l'annonce | Status `pending`, toast confirmation, email vendeur reçu | |
| 2.6 | Connexion admin → `/admin/listings` | Annonce visible dans "En attente" | |
| 2.7 | Approuver | Status `approved`, email "Annonce publiée" envoyé au vendeur | |
| 2.8 | Vérifier annonce visible sur `/` (homepage + recherche) | Carte affichée, photos correctes | |
| 2.9 | Refuser une annonce avec raison | Email "Annonce refusée" + raison | |

**Fichiers concernés** : `src/components/SellCarForm.tsx`, `supabase/functions/notify-listing-status/`

---

## Flux 3 — Envoi d'un message à un vendeur → Réception temps réel

| # | Étape | Attendu | Résultat |
|---|---|---|---|
| 3.1 | Compte A : ouvrir une annonce du compte B → "Contacter" | Modal de message ouvert | |
| 3.2 | Envoyer "Bonjour" | Message apparaît côté A immédiatement | |
| 3.3 | Compte B (autre navigateur/onglet) sur `/messages` | Notification temps réel + toast Sonner | |
| 3.4 | B répond → A reçoit en realtime sans refresh | Message apparaît < 2 s | |
| 3.5 | Tester indicateur de saisie (typing) | Bulle "..." visible chez le destinataire | |
| 3.6 | Envoyer image (chat-images bucket) | Upload OK, image affichée des 2 côtés | |
| 3.7 | Vérifier limite quotidienne (50 msg/j) | Au 51e, blocage par `useMessageLimit` | |
| 3.8 | Compte C tente d'écouter le canal A↔B (devtools) | RLS bloque (pas de souscription possible) | |

**Fichiers concernés** : `src/features/messaging/`, `src/components/ChatWindow.tsx`

---

## Flux 4 — Favoris → Comparaison 2-3 véhicules

| # | Étape | Attendu | Résultat |
|---|---|---|---|
| 4.1 | Cliquer cœur sur 3 annonces différentes | Compteur favoris s'incrémente, animation OK | |
| 4.2 | Aller sur `/favorites` | Les 3 annonces listées avec dates d'ajout | |
| 4.3 | Ajouter les 3 à la comparaison | CompareBar apparaît en bas | |
| 4.4 | Tenter d'ajouter un 4e | Toast "Maximum 3 véhicules" | |
| 4.5 | Cliquer "Comparer" → `/compare` | Tableau desktop ou cartes mobile | |
| 4.6 | Retirer 1 véhicule | Mise à jour immédiate, persistance (refresh OK) | |
| 4.7 | Logout puis login | Favoris persistent en DB | |

**Fichiers concernés** : `src/features/favorites/`, `src/features/compare/`

---

## Flux 5 — Souscription Stripe → Accès features premium

| # | Étape | Attendu | Résultat |
|---|---|---|---|
| 5.1 | Aller sur `/pricing` | 5 paliers affichés (Particulier Free → Pro+) | |
| 5.2 | Cliquer "Choisir Particulier Pro" | Redirection Stripe Checkout (nouvel onglet) | |
| 5.3 | Carte test `4242 4242 4242 4242` | Paiement OK → `/payment-success` | |
| 5.4 | Vérifier `subscriptions` en DB | Ligne créée avec `status = active`, `product_id` correct | |
| 5.5 | Recharger l'app → `useSubscription` | Tier reconnu, badge premium visible | |
| 5.6 | Accès aux features (boost annonce, alertes illimitées) | Débloquées | |
| 5.7 | Customer Portal (`Mon abonnement → Gérer`) | Stripe Portal s'ouvre | |
| 5.8 | Annuler depuis Portal | Webhook `stripe-webhook` met `status = canceled` < 30 s | |
| 5.9 | Tester boost annonce (24h / 4€) | Checkout boost, badge "Boosté" sur l'annonce après paiement | |

**Fichiers concernés** : `src/features/subscription/`, `supabase/functions/{create-checkout,stripe-webhook,check-subscription}/`

---

## ✅ Checklist sécurité finale

- [ ] HIBP password check actif (signup et reset)
- [ ] RLS testée : compte A ne peut PAS lire annonces non-approuvées de B
- [ ] Contacts vendeur masqués tant qu'aucune conversation ouverte
- [ ] Bucket `car-pass` non-listable (test URL directe → 403)
- [ ] Cookie banner GDPR : visible 1× puis mémorisé (FR/NL/DE/EN)
- [ ] `https://www.autora.be` → 302 vers `https://autora.be`
- [ ] `https://autora.be/sitemap.xml` → 200 (sitemap index)
- [ ] `https://autora.be/robots.txt` → 200
- [ ] CSP active (DevTools → Network → headers `content-security-policy`)
- [ ] Rate limiting `signup`/`login` testé (5 tentatives → 429)

---

## 📊 Lighthouse mobile cible : ≥ 90

Audit à exécuter **en mode navigation privée** sur Chrome mobile, throttling "Slow 4G + 4× CPU" :

```
Performance ≥ 90  | Accessibility ≥ 95  | Best Practices ≥ 95  | SEO 100
LCP < 2.5 s       | CLS < 0.1           | INP < 200 ms
```

Routes prioritaires à tester : `/`, `/recherche`, `/voiture/<slug>`, `/auth`, `/sell`.

---

*Dernière mise à jour : v1.0.0-mvp — `2026-04-26`*
