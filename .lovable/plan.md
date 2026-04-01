

# Audit de lancement AutoRA — 1er avril 2026

## 1. Erreurs de build critiques (bloquantes)

7 Edge Functions ne compilent plus à cause d'une version incompatible de `@supabase/supabase-js`.

**Problème** : `npm:@supabase/supabase-js@2.57.2` n'est pas trouvé dans l'environnement Deno. Cette version est probablement trop récente ou absente du cache.

**Fichiers concernés** (7) :
- `check-subscription/index.ts`
- `customer-portal/index.ts`
- `delete-account/index.ts`
- `export-user-data/index.ts`
- `create-checkout/index.ts`
- `create-boost-checkout/index.ts`
- `stripe-webhook/index.ts`

**Fix** : Remplacer `npm:@supabase/supabase-js@2.57.2` par `npm:@supabase/supabase-js@2` (résolution flexible) dans ces 7 fichiers — c'est le pattern utilisé par `process-email-queue` qui compile correctement.

**Bonus** : `process-email-queue` a aussi des erreurs TypeScript (types `never` sur les inserts/rpc). Fix : typer le client Supabase comme `any` ou utiliser des casts explicites pour contourner le typage strict auto-généré.

---

## 2. Fonctionnalités en place (prêtes)

| Domaine | Statut |
|---|---|
| Authentification (email, Google, Apple) | ✅ |
| RGPD (cookies, suppression compte, export données) | ✅ |
| PWA (install banner, push notifications, splash screens) | ✅ |
| SEO (meta dynamiques, JSON-LD, sitemap, robots.txt) | ✅ |
| Système de messagerie (chat, typing, online status) | ✅ |
| Publication d'annonces (formulaire, photos, validation) | ✅ |
| Calculateur TCO belge | ✅ |
| Zones LEZ Belgique | ✅ |
| Recherche et filtres | ✅ |
| Favoris et alertes | ✅ |
| Comparateur de véhicules | ✅ |
| Mode Beta / Early Access (paywall désactivé) | ✅ |
| Widget prix carburants | ✅ |
| Swipe Discovery ("Pour toi") | ✅ |
| Dashboard vendeur | ✅ |
| Système de boost (Stripe) | ✅ |
| Multi-langue (FR/NL/EN/DE) | ✅ |

---

## 3. Actions restantes pour le lancement

### A. Corrections critiques (bloquantes)
1. **Fixer les imports Supabase** dans les 7 Edge Functions → `npm:@supabase/supabase-js@2`
2. **Fixer les erreurs TypeScript** dans `process-email-queue` (casts `any`)
3. **Redéployer** toutes les Edge Functions corrigées

### B. Vérifications recommandées (non bloquantes mais importantes)
4. **Tester le flux d'inscription complet** (email + vérification)
5. **Vérifier le domaine personnalisé** `autora.be` (DNS, SSL actif)
6. **Tester le flux de publication d'annonce** de bout en bout (upload photos, validation, affichage)
7. **Vérifier les notifications push** sur mobile (iOS/Android)
8. **S'assurer que le CookieBanner** fonctionne correctement dans les 4 langues

### C. Polish optionnel (post-lancement OK)
9. Confettis au swipe droit dans le "Pour toi"
10. Harmonisation du design "Elite Green" sur toutes les pages secondaires
11. Tests de performance (Lighthouse score)

---

## Section technique

| Étape | Détail |
|---|---|
| Fix imports | Rechercher/remplacer `@2.57.2` → `@2` dans 7 fichiers |
| Fix process-email-queue | Ajouter `as any` sur les appels `supabase.from()` et `supabase.rpc()` |
| Déploiement | Redéployer les 8 fonctions via `deploy_edge_functions` |
| Estimation | ~15 minutes de travail |

