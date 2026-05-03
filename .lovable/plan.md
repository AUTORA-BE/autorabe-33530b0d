# Plan — ErrorBoundary global production-grade

## Constat

Tu as **déjà** un `ErrorBoundary` branché dans `src/main.tsx` au plus haut niveau (avant `HelmetProvider` et `App`). Le composant existe à `src/components/ErrorBoundary.tsx` avec un fallback Elite Green basique (icône, message, bouton retry). Pas besoin de le re-créer — on l'**améliore**.

## Ce qui sera amélioré

### 1. Logs structurés JSON (cohérent avec le webhook Stripe)

Au lieu de `console.error('[ErrorBoundary]', error, errorInfo)`, on émet un payload JSON identique en forme à ce qui sort du webhook Stripe :

```json
{
  "level": "error",
  "fn": "react-error-boundary",
  "step": "render_error",
  "ts": "2026-05-03T16:30:00Z",
  "error_id": "err_lwz3k_a8f2",
  "message": "...",
  "name": "TypeError",
  "stack": "...",
  "url": "/voiture/abc-123",
  "ua": "...",
  "component_stack": "..."
}
```

Avantages : filtrable par `step`, traçable par `error_id`, exploitable par n'importe quel outil d'observabilité ajouté plus tard sans changer le code.

### 2. Capture des `unhandledrejection` (window-level)

React n'attrape **pas** les promesses rejetées non catchées (ex: `await fetch(...)` qui throw sans `try/catch`). On ajoute un listener `window.addEventListener('unhandledrejection', ...)` au mount qui les loggue avec le même format (mais sans déclencher le fallback UI — ce serait trop agressif pour des erreurs réseau transitoires).

### 3. Event Plausible automatique

Si Plausible est chargé (déjà le cas via `index.html`), chaque erreur catchée envoie un event :
```js
plausible('Error', { props: { step, name, message: '...' } })
```
→ visible directement dans ton dashboard Plausible existant, **zéro nouveau secret**.

### 4. Fallback UI enrichi

Trois actions au lieu d'une (toutes en touch-target 44px, mobile-first) :

```text
┌──────────────────────────────────┐
│      [icône AlertTriangle]       │
│                                  │
│   Oups, quelque chose s'est      │
│         mal passé                │
│                                  │
│   Une erreur inattendue est      │
│   survenue. Vous pouvez...       │
│                                  │
│   ▼ Détails techniques (collap.) │
│     Error: Cannot read prop...   │
│     ID: err_lwz3k_a8f2           │
│                                  │
│  [Réessayer] [Recharger] [Home]  │
└──────────────────────────────────┘
```

- **Réessayer** — reset l'état local du boundary (utile si l'erreur était transitoire)
- **Recharger** — `window.location.reload()` (utile si état React corrompu)
- **Retour à l'accueil** — `window.location.href = '/'` (utile si la route entière est cassée)

L'`error_id` affiché permet à un user qui te contacte de te donner une référence précise pour retrouver la trace dans les logs.

### 5. i18n via `react-i18next`

Wrap avec `withTranslation()` (compatible class component). 4 nouvelles clés ajoutées dans `fr.json`, `nl.json`, `de.json`, `en.json` :
- `errorBoundary.title`
- `errorBoundary.description`
- `errorBoundary.details`
- `errorBoundary.retry`
- `errorBoundary.reload`
- `errorBoundary.home`

Fallback gracieux : si i18n n'est pas encore initialisé (le boundary peut catcher des erreurs au boot avant que i18next soit prêt), le composant utilise les textes FR par défaut. Pas de crash dans le crash handler.

### 6. Style cohérent charte

- Fond `bg-background`, fallback en `min-h-screen` centré
- Icône `lucide-react` `strokeWidth={1.5}` (charte Elite Green)
- Titre en `font-serif` (Playfair Display) pour cohérence luxe
- Boutons 44px min, mobile-first stacking

## Fichiers modifiés

1. **`src/components/ErrorBoundary.tsx`** — réécriture complète (~180 lignes), même API publique (props `children`, `fallback`, `onError`) → aucun appelant à modifier
2. **`src/i18n/fr.json`** — ajout de 6 clés `errorBoundary.*`
3. **`src/i18n/nl.json`** — ajout des 6 clés traduites
4. **`src/i18n/de.json`** — ajout des 6 clés traduites
5. **`src/i18n/en.json`** — ajout des 6 clés traduites

## Ce qui ne change pas

- `src/main.tsx` — déjà branché correctement
- L'API du composant — props identiques, pas de breaking change
- Aucun nouveau secret, aucune nouvelle dépendance npm
- Aucune migration DB

## Détails techniques

- Class component (obligatoire pour `getDerivedStateFromError` / `componentDidCatch`)
- `withTranslation()` HOC pour récupérer `t` dans une class
- Listener `unhandledrejection` ajouté/retiré dans `componentDidMount` / `componentWillUnmount`
- Type augmentation pour `window.plausible` (déjà global dans `index.html`)
- Strict TS, zéro `any`
- Stack trace tronquée à 8 lignes pour éviter de polluer les logs

## Hors scope

- Pas de Sentry / Axiom / GlitchTip — décidé précédemment de rester sur les logs structurés + Plausible
- Pas de UI dédiée pour les erreurs réseau transitoires (les `unhandledrejection` sont juste loggés, pas affichés à l'utilisateur — c'est volontaire)
