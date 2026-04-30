## Page « Mon Garage »

Une page personnelle unifiée, accessible aux utilisateurs connectés, qui regroupe en deux onglets :
- **Favoris** — voitures sauvegardées (réutilise la logique existante)
- **Historique** — voitures consultées récemment (nouveau)

### Routes (multilingues)
- `/garage` (FR), `/mijn-garage` (NL), `/my-garage` (EN), `/meine-garage` (DE)
- Protégée : redirection vers `/auth` si non connecté

### Onglet « Favoris »
Reprend l'expérience actuelle de `/favorites` :
- Grille 2 colonnes mobile / 3-4 desktop
- Chips de tri (Prix, Année, Marque)
- Empty state avec CTA « Découvrir »
- Compteur cœur animé

### Onglet « Historique de vues » (nouveau)
- Liste des 50 dernières voitures consultées par l'utilisateur connecté
- Triées par date de vue décroissante (la plus récente en haut)
- Déduplication : une voiture n'apparaît qu'une fois (sa vue la plus récente)
- Chaque carte affiche un petit timestamp relatif (« il y a 2h », « hier »)
- Bouton « Effacer l'historique » (avec confirmation)
- Empty state dédié : « Vous n'avez pas encore consulté de véhicule »
- Les voitures supprimées/non approuvées sont automatiquement filtrées

### Backend (Lovable Cloud)

**Politique RLS sur `car_views`** : ajouter une policy pour que les utilisateurs puissent lire leurs propres vues (`viewer_id = auth.uid()`) — actuellement seuls les vendeurs peuvent voir les vues sur leurs annonces.

**RPC `get_user_view_history(_limit int)`** (SECURITY DEFINER) :
- Retourne pour l'utilisateur courant les annonces vues récemment (jointure avec `car_listings_public`)
- Garde uniquement la dernière vue par voiture (DISTINCT ON)
- Filtre `status = 'approved'`
- Limite paramétrable (défaut 50)
- Retourne les colonnes standard (LIST_COLUMNS) + `last_viewed_at`

**RPC `clear_user_view_history()`** : supprime toutes les `car_views` où `viewer_id = auth.uid()`.

### Navigation & accès
- **BottomNav mobile** : remplacer l'icône « Favoris » (cœur) par « Garage » (icône `Warehouse` ou `Garage`) qui pointe vers la nouvelle page. Le badge affiche `favoritesCount`.
- **Header desktop** : même remplacement.
- **Redirection** : l'ancienne route `/favorites` redirige vers `/garage?tab=favorites` pour préserver les liens existants.
- **Onglet par défaut** : `?tab=favorites` (ou `history`), persisté dans l'URL pour partage / retour arrière.

### Composants à créer
```
src/pages/MyGarage.tsx              (page principale avec tabs)
src/features/garage/
  ├─ hooks/useViewHistory.ts        (React Query, RPC)
  ├─ hooks/useClearHistory.ts       (mutation)
  ├─ components/GarageTabs.tsx      (Tabs shadcn, deux contenus)
  ├─ components/HistoryList.tsx     (grille + timestamps relatifs)
  └─ index.ts
```

### Détails techniques

```text
MyGarage
├── Header + BackButton
├── Tabs (Favoris | Historique)
│   ├── Tab Favoris  → réutilise la logique de Favorites.tsx
│   └── Tab Historique
│       ├── useViewHistory() → RPC get_user_view_history
│       ├── CarCard + badge "il y a Xh"
│       └── Bouton "Effacer l'historique"
└── Footer
```

- **Cache React Query** : `staleTime` 2 min pour l'historique (évolue souvent), 5 min pour favoris
- **i18n** : ajouter clés `garage.title`, `garage.tabs.favorites`, `garage.tabs.history`, `garage.history.empty`, `garage.history.clear`, `garage.history.clearConfirm`, `garage.history.viewedAgo` dans FR/NL/DE/EN
- **SEO** : `noIndex` (page privée)
- **Mobile-first** : safe-area, tabs collantes sous le header, pull-to-refresh sur les deux onglets
- **Animations** : Framer Motion 200-300ms cohérentes avec l'identité Elite Green

### Hors périmètre
- Pas de statistiques (vues par jour, etc.) — déjà couvert côté vendeur
- Pas de notifications sur changement de prix d'une voiture vue (peut être une feature future via Smart Alerts)
- Pas de tri avancé sur l'historique (la chronologie inverse suffit)
