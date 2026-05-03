
# Audit AutoRA & plan « Grand Lancement »

Objectif : livrer un site propre, cohérent et premium, prêt pour un lancement public proche. On supprime toute trace de "Beta", on corrige les incohérences, on refond la home et la page connexion, on pose les fondations de différenciation.

---

## 1. Incohérences détectées (à corriger)

### Page Auth (`/auth`)
- Doublon textuel : `hero.title1` (« Trouvez votre prochaine ») suivi de `auth.findIdealCar` (« Trouvez votre voiture idéale ») = « Trouvez votre… Trouvez votre… ».
- Stats codées en dur (« 15K+ véhicules », « 98% Car-Pass ») non vérifiables → on les remplace par des compteurs DB live.
- Champs Garage / Code postal toujours visibles, même pour un acheteur particulier → confusion.
- Placeholders « Nom du garage (facultatif) » et « Code postal » non traduits NL/DE/EN.
- Logo `Car` + « AutoRa » → incohérent avec le branding officiel `AutoRA` (RA en Emerald) du Header.
- Redirection post-login → `/dashboard` (page vendeur) pour TOUS les users, y compris acheteurs.

### Page d'accueil (`/`)
- Deux jeux de titres hero (`hero.title1/2` vs `hero.titleLine1/2`) = dette i18n.
- Mention « Beta » dans Header + `EarlyAccessBanner` → à retirer entièrement.
- Témoignages fictifs en boucle (vu en session replay) → érodent la confiance.
- Pas de USP visible above-the-fold.
- Aucun KPI réel (annonces, vendeurs, villes).

### Reste du site
- `/favorites` (legacy) coexiste avec `/garage` → redirect manquant.
- `useIsAdmin` et `useAdminAuth` font la même requête `has_role` → fusion possible.
- Console : warning OAuth `Unknown message type: authorization_response` (non bloquant).
- `EarlyAccessBanner` à retirer (cohérence "lancement").

---

## 2. Plan d'exécution (3 batchs livrés d'un coup)

### Batch 1 — Page Auth refresh (cohérence + confiance)
- Refonte hero gauche : titre unique « La marketplace auto belge — vérifiée, transparente, locale ». Suppression des stats fictives → 3 pills `Car-Pass vérifié` · `LEZ Belgique` · `Pro & Particuliers`.
- Logo Auth = identique Header (Auto blanc + RA Emerald, sans icône Car).
- Toggle « Acheteur / Vendeur Pro » au-dessus du formulaire signup → champs Garage/Code postal affichés **uniquement si Pro**.
- Sous-titre signup honnête et orienté lancement : « Rejoignez la nouvelle référence belge de la voiture d'occasion. »
- Redirection post-login intelligente : admin → `/admin`, sinon → `/`.
- Mini-rassureur sous le bouton : « Connexion sécurisée • Aucune donnée revendue • RGPD ».
- i18n FR/NL/DE/EN : nouvelles clés (`auth.heroTitle`, `auth.heroSubtitle`, `auth.rolePrivate`, `auth.rolePro`, `auth.garageNamePlaceholder`, `auth.postalCodePlaceholder`, `auth.secureNotice`).

### Batch 2 — Home « grand lancement »
- Hero unifié, une seule paire de clés `hero.headline` / `hero.subheadline`.
- **Suppression du badge Beta** dans Header + retrait `EarlyAccessBanner`.
- Trust strip réelle alimentée par compteurs DB (annonces approuvées, vendeurs, villes couvertes) via un petit RPC public `get_marketplace_stats`.
- Section USP « Pourquoi AutoRA » : 4 cards bento Lucide stroke 1.5 — Car-Pass automatique, LEZ par région, TCO 5 ans, Match IA belge.
- Témoignages fictifs masqués tant qu'on n'a pas ≥ 5 avis réels — remplacés par carrousel « Dernières annonces vérifiées ».
- Section différenciation **Made for Belgium** : carte LEZ, simulateur taxe régionale 1 clic, badges Car-Pass.
- Double CTA above-the-fold : Acheteur (Recherche) / Vendeur (Estimer ma voiture en 60 s).

### Batch 3 — Clean technique
- Redirect `/favorites*` → `/garage`.
- Fusion `useIsAdmin` + `useAdminAuth` → un seul `useAdminRole`.
- Suppression des clés i18n legacy `hero.title1/2`.
- Suppression `EarlyAccessBanner` du bundle.
- Filtrage du warning OAuth résiduel.
- Vérification `<link rel="canonical">` dynamique sur toutes les routes.

---

## 3. Idées différenciantes (votre projet « millionaire »)

| Feature | Pourquoi ça différencie |
|---|---|
| **Estimation IA gratuite en 60 s** (Gemini Flash + comps DB) | Aucun concurrent BE ne l'offre gratuitement, hook viral |
| **Car-Pass automatique** (upload PDF → OCR Gemini → score transparence) | Élimine la friction n°1 du marché belge |
| **Score « Bon Match »** acheteur/voiture (TCO + LEZ + budget + usage) | Recommandation, pas simple filtre |
| **Garage virtuel** (favoris + historique + alertes + estimations) | Rétention même sans achat |
| **Carte LEZ live** + alerte « bannie d'ici X années » | Personne ne le fait clairement en BE |
| **Badge "AutoRA Verified Pro"** payant (KYC garage) | Revenu récurrent + premium trust |
| **Mode "Vendre en 48 h"** (photo studio + boost + visites filtrées) | Service à forte marge |
| **Programme parrainage acheteur** (50 € si transaction via AutoRA) | Acquisition virale |
| **Rapport PDF "Confiance AutoRA"** par mail à chaque visite | Différenciation perçue + SEO partagé |

→ Ces features feront l'objet d'un Batch 4 dédié (R&D produit) une fois le refresh validé.

---

## 4. Décisions à confirmer
- ✅ Aucune mention "Beta" — confirmé.
- OK pour **masquer les témoignages fictifs** tant qu'on n'a pas ≥ 5 vrais avis ?
- OK pour **toggle Acheteur/Pro** au signup (au lieu d'afficher tous les champs) ?
- Je propose d'enchaîner directement Batch 1 + 2 + 3 pour un rendu visible immédiat. Confirmez et je lance.
