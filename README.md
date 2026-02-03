<div align="center">

  <img src="https://via.placeholder.com/220x80/22c55e/ffffff?text=Autora.be" alt="AutoRA.be" width="220" />

  <h1>AutoRA.be</h1>
  <h3>La nouvelle façon de trouver sa prochaine voiture en Belgique</h3>

</div>

## Ce que nous faisons différemment

AutoRA.be est né d'un constat simple : acheter ou vendre une voiture d'occasion en Belgique doit être **clair**, **fiable** et **agréable**.

Nous mettons l'accent sur :
- Des véhicules vérifiés **LEZ** et **Car-Pass**
- Une recherche rapide et intelligente
- Une interface pensée pour les Belges (FR / NL / DE / EN)
- La tranquillité d'esprit grâce au signalement facile et à la modération active

## Ce que tu peux faire aujourd'hui

- Chercher par marque, modèle, budget, année, kilométrage ou compatibilité LEZ
- Découvrir les annonces avec photos nettes et détails complets
- Signaler une annonce en 2 clics si quelque chose cloche
- Passer en 4 langues en un clic
- Naviguer facilement sur mobile ou ordinateur

## Fonctionnalités phares

- Filtres intelligents (marque → modèles suggérés automatiquement)
- Slider des marques avec logos officiels HD
- Page détail véhicule claire et complète
- Signalement intégré + dashboard de modération
- Navigation fluide (scroll progressif, retour en haut automatique)
- Expérience mobile irréprochable
- Conformité RGPD (cookie banner + mentions légales)

## Installation rapide (pour développeurs)

```bash
git clone https://github.com/54gtjx8c8b-png/AutoRA.git
cd AutoRA
npm install
npm run dev
```

---

## 🏗️ Architecture

Le projet suit une architecture **Feature Folders** qui organise le code par domaine fonctionnel plutôt que par type technique.

```
src/
├── features/           # Domaines fonctionnels
│   ├── auth/           # Authentification
│   ├── listings/       # Annonces véhicules
│   ├── messaging/      # Messagerie temps réel
│   └── search/         # Recherche et filtres
├── shared/             # Ressources transversales
│   ├── components/     # Composants de layout (Header, Footer)
│   └── hooks/          # Hooks génériques (useDebounce, useLocalStorage)
├── components/         # Composants UI (shadcn/ui)
├── pages/              # Pages de l'application
├── hooks/              # Hooks globaux
├── contexts/           # Contextes React (Language, Compare)
└── integrations/       # Intégrations externes (Supabase)
```

---

## 📁 Features

Chaque feature est autonome et contient ses propres composants, hooks, types et requêtes API.

### `/features/auth`

Gestion de l'authentification et des profils utilisateurs.

```
auth/
├── hooks/
│   ├── useAuth.ts              # Connexion, inscription, déconnexion
│   ├── useUserProfile.ts       # Gestion des profils
│   └── usePasswordValidation.ts # Validation temps réel des mots de passe
├── types/
│   └── auth.types.ts           # Types AuthUser, LoginCredentials, etc.
└── index.ts                    # Barrel export
```

**Utilisation :**
```typescript
import { useAuth, useUserProfile } from '@/features/auth';

const { user, signIn, signOut, isLoading } = useAuth();
```

---

### `/features/listings`

Gestion des annonces de véhicules.

```
listings/
├── api/
│   └── vehicleQueries.ts       # Requêtes Supabase centralisées
├── components/
│   ├── VehicleCard.tsx         # Carte véhicule
│   ├── VehicleGrid.tsx         # Grille de véhicules
│   └── PopularVehicles.tsx     # Section véhicules populaires
├── hooks/
│   ├── useVehicleSearch.ts     # Recherche avec filtres
│   ├── useVehicleDetail.ts     # Détails d'un véhicule
│   └── usePopularVehicles.ts   # Véhicules les plus vus
├── types/
│   └── vehicle.types.ts        # Types Vehicle, VehicleFilters, etc.
└── index.ts
```

**Utilisation :**
```typescript
import { useVehicleSearch, VehicleCard } from '@/features/listings';

const { vehicles, isLoading, filters } = useVehicleSearch();
```

---

### `/features/messaging`

Système de messagerie temps réel entre acheteurs et vendeurs.

```
messaging/
├── hooks/
│   ├── useConversations.ts     # Liste des conversations
│   ├── useTypingIndicator.ts   # Indicateur de saisie
│   ├── useOnlineStatus.ts      # Statut de présence
│   └── useUnreadMessages.ts    # Compteur de messages non lus
├── types/
│   └── messaging.types.ts      # Types Conversation, Message, etc.
└── index.ts
```

**Utilisation :**
```typescript
import { useConversations, useUnreadMessages } from '@/features/messaging';

const { conversations, isLoading } = useConversations(userId);
const { unreadCount } = useUnreadMessages(userId);
```

---

### `/features/search`

Composants et logique de recherche.

```
search/
├── components/
│   ├── HeroSearch.tsx          # Barre de recherche principale
│   ├── FilterPanel.tsx         # Panneau de filtres
│   └── BrandCarousel.tsx       # Carrousel des marques
├── types/
│   └── search.types.ts         # Types SearchFilters, SearchState
└── index.ts
```

---

## 🔧 Shared

Ressources réutilisables à travers toute l'application.

### `/shared/components`

Composants de mise en page globaux.

```typescript
import { Header, Footer } from '@/shared/components';
```

### `/shared/hooks`

Hooks utilitaires génériques.

```typescript
import { useDebounce, useLocalStorage } from '@/shared/hooks';

const debouncedValue = useDebounce(searchTerm, 300);
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

---

## 📊 State Management

### React Query (TanStack Query)

Gestion de l'état serveur avec configuration optimisée :

```typescript
// Configuration globale (App.tsx)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,      // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### Contextes React

- **LanguageContext** : Internationalisation (FR, NL, EN)
- **CompareContext** : Comparaison de véhicules

---

## 🗄️ Couche API

Les interactions avec la base de données sont centralisées dans des fichiers `*Queries.ts` :

```typescript
// features/listings/api/vehicleQueries.ts
export async function fetchVehicles(filters: VehicleFilters): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('car_listings_public')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapToVehicle);
}
```

---

## 🛠️ Standards de Développement

| Règle | Description |
|-------|-------------|
| **TypeScript strict** | Aucun type `any`, interfaces typées |
| **JSDoc** | Documentation systématique des fonctions exportées |
| **Barrel exports** | Chaque feature expose via `index.ts` |
| **Tokens sémantiques** | Utiliser `bg-primary` plutôt que couleurs directes |

---

## 🚀 Stack Technique

| Technologie | Usage |
|-------------|-------|
| **React 18** | Framework UI |
| **TypeScript** | Typage statique |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Composants UI |
| **React Query** | État serveur |
| **React Router** | Routing |
| **Supabase** | Backend (Auth, DB, Realtime) |
| **Framer Motion** | Animations |

---

## 📝 Conventions de Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase | `VehicleCard.tsx` |
| Hooks | camelCase avec `use` | `useVehicleSearch.ts` |
| Types | PascalCase | `vehicle.types.ts` |
| API | camelCase avec suffixe | `vehicleQueries.ts` |
