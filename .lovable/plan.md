# Diagnostic et reset cache PWA

## Le vrai problème

Tes modifications **sont bien dans le code** (Plausible, HomeFAQ, suppression EarlyAccessBanner, analytics, etc.). Ce que tu vois dans le preview / sur ton téléphone, c'est **l'ancienne version mise en cache par le Service Worker PWA**.

C'est un piège classique des PWA : une fois la PWA installée ou visitée une fois, le Service Worker intercepte toutes les requêtes et sert le cache. Les nouvelles versions ne s'appliquent qu'après un cycle complet de mise à jour SW (qui peut prendre plusieurs reloads).

De plus, en preview Lovable, on attend que l'analytics Plausible soit **désactivé** (c'est volontaire dans `analytics.ts` via `IS_PREVIEW`) — donc tu ne verras jamais d'événements depuis le preview, seulement depuis `autora.be` en prod.

## Plan d'action

### 1. Bump version PWA + cache-busting forcé
- Mettre à jour la version dans `vite.config.ts` (manifest description) pour forcer une régénération SW
- Ajouter un mécanisme de "kill switch" : un fichier `public/sw-version.json` lu au boot pour forcer `skipWaiting` + `clients.claim()` + reload si version différente
- Renforcer le guard de `main.tsx` pour purger **toutes** les caches au démarrage en preview (déjà fait, mais ajouter aussi sur le domaine autora.be temporairement pour 1 release)

### 2. Vérification visuelle des modifs récentes
Ouvrir le preview en mode browser tool (hors iframe) pour confirmer que :
- La bannière `EarlyAccessBanner` est bien retirée de la home
- Le composant `HomeFAQ` est bien rendu sur Index
- Plausible script est injecté dans `<head>` (vérifié via DOM)
- `useAnalytics` ne crashe pas

### 3. Instructions claires pour toi (utilisateur)
- **Sur desktop preview Lovable** : Ouvrir DevTools (F12) → Application → Service Workers → "Unregister" → Storage → "Clear site data" → recharger
- **Sur PWA mobile installée** : Désinstaller la PWA, vider le cache du navigateur, réinstaller
- **Sur autora.be publié** : Attendre ~30s après publication, puis hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### 4. Confirmation du bon fonctionnement Plausible
- Plausible n'enregistre **rien** en preview/dev/iframe (par design dans `analytics.ts`)
- Pour tester : aller sur `autora.be` (prod) après publish → ouvrir Plausible dashboard → vérifier les événements `pageview`, puis `signup_started` sur /auth

## Détails techniques

**Fichiers à modifier :**
- `vite.config.ts` — bump description manifest pour forcer un nouveau hash SW
- `public/sw-kill.js` — petit kill-switch one-shot à enregistrer une fois pour purger l'ancien SW
- `src/main.tsx` — déjà OK mais ajouter un message console clair "[PWA] cache purged" pour debug

**À ne PAS faire :**
- Ne pas réécrire l'analytics, il fonctionne
- Ne pas re-supprimer/recréer HomeFAQ, il est déjà en place
- Ne pas désactiver complètement la PWA (tu en as besoin pour le mobile)

## Résultat attendu

Après application + un hard refresh de ta part :
- Preview Lovable affiche la **vraie** dernière version (HomeFAQ visible, plus de EarlyAccessBanner)
- PWA mobile se met à jour automatiquement au prochain lancement
- Plausible commence à tracker dès que tu visites autora.be (URL publiée)

Approuve et j'applique. Si tu préfères, je peux aussi juste te guider pour le hard reset cache **sans toucher au code** — dis-le-moi.
