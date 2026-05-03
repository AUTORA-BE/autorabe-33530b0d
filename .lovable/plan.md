
# Finalisation « Grand Lancement » — ce qui reste

J'ai déjà livré dans le batch précédent :
- ✅ Suppression du badge "Beta" du Header
- ✅ Suppression du `EarlyAccessBanner` de la home
- ✅ Redirect `/favorites*` → `/garage` (multi-langue)
- ✅ Refonte hero gauche page Auth (logo AutoRA cohérent, suppression stats fictives 15K+/98%, 3 pills Car-Pass/LEZ/Pro&Particuliers)
- ✅ Logo mobile Auth unifié (suppression icône Car parasite)
- ✅ Redirection post-login intelligente (admin → `/admin`, sinon → `/`)
- ✅ Nouvelles clés i18n FR/NL/DE/EN : `auth.heroTitle`, `auth.heroSubtitle`, `auth.proAndPrivate`

## Reste à faire (ce batch)

### Auth — toggle Acheteur/Pro
- Ajouter un toggle 2 boutons en haut du formulaire signup (`Particulier` / `Vendeur Pro`) avec état actif Emerald.
- Conditionner l'affichage des champs **Nom du garage + Code postal** à `accountType === "pro"` uniquement.
- Remplacer les placeholders FR codés en dur par `t("auth.garageNamePlaceholder")` / `t("auth.postalCodePlaceholder")`.
- Mini-rassureur sous le bouton submit : « Connexion sécurisée • Aucune donnée revendue • RGPD ».
- Nouvelles clés i18n × 4 langues : `auth.rolePrivate`, `auth.rolePro`, `auth.garageNamePlaceholder`, `auth.postalCodePlaceholder`, `auth.secureNotice`.

### Home — retirer témoignages fictifs
- Commenter / retirer le bloc `<TestimonialsSection />` dans `src/pages/Index.tsx` tant qu'on n'a pas ≥ 5 vrais avis (réactivable en 1 ligne).
- Supprimer le skeleton `TestimonialsSkeleton` du tableau d'imports.

### Hero — nettoyage clés legacy
- Supprimer les clés inutilisées `hero.title1` / `hero.title2` / `auth.findIdealCar` / `auth.heroDesc` des 4 fichiers i18n (la home utilise `hero.titleLine1/2`).

### Technique — fusion hooks admin
- Remplacer `src/hooks/useIsAdmin.ts` par un ré-export de `src/features/admin/hooks/useAdminAuth.ts` (single source of truth, plus de double requête `has_role`).
- Vérifier que les 4 consommateurs (`Settings`, `CarDetail`, `Header`, `useFeatureAccess`) restent fonctionnels.

### Files touchés (estimation)
- `src/pages/Auth.tsx` (toggle + placeholders i18n + notice)
- `src/pages/Index.tsx` (retrait Testimonials)
- `src/i18n/{fr,nl,de,en}.json` (5 clés ajoutées, 4 supprimées)
- `src/hooks/useIsAdmin.ts` (ré-export)

### Pas dans ce batch (volontairement)
- Section USP "Made for Belgium" cards bento → batch 2 dédié pour ne pas exploser le scope.
- Trust strip avec compteurs DB live → nécessite nouveau RPC `get_marketplace_stats`, batch 2.
- Estimation IA, score Bon Match, PDF Confiance → batch 4 R&D.

Confirme et j'enchaîne tout en une passe.
