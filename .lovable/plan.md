

# Audit Pre-Lancement AutoRA -- Rapport Complet

---

## 1. BUGS CRITIQUES (a corriger immediatement)

### 1.1 Cle API Supabase en dur dans `index.html`

**Fichier:** `index.html` (lignes 27-35)

La cle anonyme Supabase (`eyJhbGci...`) est copiee en clair directement dans le script de prefetch inline de `index.html`. Si cette cle est modifiee dans le `.env`, le prefetch continuera d'utiliser l'ancienne cle, creant un bug silencieux.

**Correction:** Supprimer le script inline de prefetch ou, si la performance est critique, laisser les hooks React Query gerer les requetes initiales (le `staleTime` de 5 min suffit).

---

### 1.2 Securite RLS : Policies accessibles aux utilisateurs anonymes

Le linter de base de donnees a detecte **16 avertissements de securite**. Les politiques RLS sur presque toutes les tables (favorites, messages, conversations, user_alerts, user_preferences, push_subscriptions, reports, user_roles) sont appliquees au role `anon` en plus du role `authenticated`. Cela signifie qu'un utilisateur non connecte pourrait theoriquement exploiter ces policies via l'API REST directe.

**Tables critiques concernees :**
- `conversations` -- un anonyme ne devrait pas pouvoir lire des conversations
- `messages` -- idem
- `user_preferences` / `user_alerts` / `push_subscriptions` -- donnees privees

**Correction:** Pour chaque table privee, restreindre les policies au role `authenticated` uniquement en ajoutant `TO authenticated` dans chaque policy.

```sql
-- Exemple pour favorites
DROP POLICY "Users can view their own favorites" ON favorites;
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

---

### 1.3 Protection des mots de passe compromis desactivee

Le linter signale que **Leaked Password Protection** est desactivee. C'est un risque direct pour les comptes utilisateurs. A activer manuellement dans le backend (Authentication > Settings > Security).

---

### 1.4 Filtre `sellerTypeFilter` et `bodyType` absents du compteur de filtres actifs

Dans `useFilteredInfiniteCarListings.ts` (lignes 254-267), le `activeFiltersCount` ne compte pas `sellerTypeFilter` ni `bodyType`, alors que ces filtres existent dans `CarFilters`. Un utilisateur pourrait appliquer ces filtres et ne pas voir qu'ils sont actifs.

**Correction:** Ajouter au compteur :
```typescript
if (filters.sellerTypeFilter) count++;
if (filters.bodyType) count++;
```

---

### 1.5 Filtre `sellerTypeFilter` et `bodyType` absents du `buildQuery`

Dans `useFilteredInfiniteCarListings.ts`, la fonction `buildQuery` (lignes 40-132) n'applique PAS les filtres `sellerTypeFilter` ni `bodyType` a la requete serveur, alors que `vehicleQueries.ts` les supporte. Ces filtres sont silencieusement ignores cote infinite scroll.

**Correction:** Ajouter dans `buildQuery` :
```typescript
if (filters.sellerTypeFilter) {
  query = query.eq('seller_type', filters.sellerTypeFilter);
}
if (filters.bodyType) {
  query = query.ilike('body_type', filters.bodyType);
}
```

---

### 1.6 `useEffect` sans `fetchListings` dans les dependances

Dans `useFilteredInfiniteCarListings.ts` (ligne 226), le `useEffect` depend de `[filters, sortBy]` mais pas de `fetchListings`. Comme `fetchListings` est un `useCallback` qui depend de `buildQuery`, le linter ESLint devrait signaler cette dependance manquante. En pratique, ca fonctionne parce que `buildQuery` change quand `filters`/`sortBy` changent, mais c'est fragile.

---

## 2. AMELIORATIONS UX (pour convertir plus d'acheteurs)

### 2.1 Logo "Auto" blanc / "RA" vert -- Non implemente

Le Header (ligne 90-94) affiche simplement le texte `Autora` en `text-primary` (vert). Le branding souhaite "Auto" en blanc et "RA" en vert. Meme chose dans le Footer (ligne 31-33).

**Correction:**
```tsx
<span className="font-display font-bold text-lg">
  <span className="text-foreground">Auto</span>
  <span className="text-primary">RA</span>
</span>
```

---

### 2.2 Composant `AutoraTransparency` non traduit

Le composant `AutoraTransparency.tsx` a tout son texte en francais uniquement ("Document disponible", "Non verifie", "Controle Technique", etc.). Pour un site bilingue FR/NL, c'est une lacune.

---

### 2.3 Statistiques du Hero codees en dur

Dans `HeroSearch.tsx` (lignes 217-233), les chiffres `150+` vehicules, `98%` verifies, `50+` marques sont des constantes codees en dur. Pour un lancement, ces chiffres devraient refleter la realite (ou etre dynamiques via une requete `COUNT`).

---

### 2.4 Animations `animate-fade-up` sur les cartes de la grille

Dans `LoadMoreGrid.tsx` (ligne 220), chaque carte dans la grille a une animation `animate-fade-up` avec un delai echelonne. Lors du scroll infini, les nouvelles cartes apparaissent avec un "saut" visible. Cela affecte egalement le Cumulative Layout Shift (CLS) pour le SEO.

---

### 2.5 Pas de page d'erreur 404 personnalisee avec retour

La route `*` dans `App.tsx` pointe vers `NotFound` mais il serait bon de verifier qu'elle offre un bouton "Retour a l'accueil" clair.

---

## 3. PERFORMANCE & CODE

### 3.1 Transition CSS globale sur tous les elements -- Impact performance

Dans `index.css` (lignes 107-117), une transition CSS est appliquee a **tous les elements et pseudo-elements** du DOM :
```css
html, html *, html *::before, html *::after {
  transition: background-color 0.3s, border-color 0.3s, color 0.3s, ...
}
```
Cela force le navigateur a calculer les transitions pour chaque element, meme ceux qui ne changent jamais. C'est un ralentissement significatif, surtout sur mobile.

**Correction:** Retirer cette regle globale et appliquer les transitions uniquement la ou le dark mode switch est necessaire (header, cards, boutons).

---

### 3.2 Duplication de la logique de filtrage

La logique de construction des filtres Supabase est dupliquee entre :
- `vehicleQueries.ts` > `applyFilters()` (lignes 107-185)
- `useFilteredInfiniteCarListings.ts` > `buildQuery()` (lignes 40-132)

Et il y a une 3e copie client-side dans `useCarFilters.ts`.

Le risque : un filtre ajoute a un endroit est oublie ailleurs (c'est deja le cas avec `sellerTypeFilter` et `bodyType`).

**Correction:** Centraliser la logique dans `vehicleQueries.ts` et l'utiliser depuis le hook.

---

### 3.3 Images bien optimisees

Les images dans `VehicleCard` utilisent correctement `loading="lazy"`. Le prefetch API dans `index.html` parallelise le chargement des donnees avec le bundle JS. Les composants sous le fold sont lazy-loaded. `content-visibility: auto` est applique aux sections lourdes. C'est bien fait.

---

### 3.4 Routes propres et securisees

Les routes dans `App.tsx` sont correctement structurees avec lazy loading. Il n'y a pas de routes protegees explicites (pas de `ProtectedRoute` wrapper), mais les donnees privees sont protegees par RLS cote serveur. C'est acceptable pour un MVP.

---

## 4. SECURITE & LANCEMENT

### 4.1 Aucune cle secrete en dur dans le code source

Les recherches confirment que les cles API (Supabase, Resend, Stripe, VAPID) sont toutes stockees en secrets backend ou en variables d'environnement. Aucune fuite detectee. **L'exception est le script inline de `index.html`** qui contient la cle anon (publique par nature, mais la duplication est un risque de maintenance).

---

### 4.2 Single Points of Failure (1000 visiteurs)

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Supabase gratuit/Pro | Limites de connexions simultanees | Verifier le plan Supabase |
| Pas de CDN pour les images | Les photos de voitures sont servies depuis le storage backend | Les buckets sont publics, Supabase sert via CDN interne |
| Pas de rate-limiting serveur | Un bot pourrait spammer les requetes | Le rate-limiting client (`security.ts`) est implementable mais pas systematiquement applique |
| Requete COUNT + DATA separees | Chaque changement de filtre fait 2 requetes | Acceptable pour un MVP |

---

### 4.3 Footer et mentions legales

Le Footer contient bien :
- Lien vers CGV (`/terms`)
- Lien vers Politique de confidentialite RGPD (`/privacy`)
- Lien vers Mentions legales (`/legal`)
- Avertissement de non-responsabilite transactionnelle
- Notice RGPD
- Contact email : contact@autora.be
- Lien vers Car-Pass.be

**Conforme aux obligations belges** pour une plateforme en phase de lancement.

---

### 4.4 Favicon

Le favicon actuel (`/favicon.png`) est une image personnalisee. Il faudrait verifier visuellement qu'il s'agit bien du logo "RA" vert et non d'un placeholder.

---

## 5. PRO TIPS POUR LE FUTUR

1. **Centraliser les filtres** : Fusionner `buildQuery` et `applyFilters` en une seule fonction exportee pour eliminer la duplication et les bugs futurs.

2. **Ajouter des routes protegees** : Wrapper les pages `/dashboard`, `/messages`, `/settings`, `/mes-alertes` avec un composant `RequireAuth` qui redirige vers `/auth` si non connecte.

3. **Statistiques dynamiques** : Remplacer les compteurs en dur du Hero (150+, 98%, 50+) par des vraies donnees via une requete `SELECT COUNT(*)` en cache longue duree.

4. **Internationaliser completement** : Les composants `AutoraTransparency`, les badges LEZ ("Interdit", "Derogation"), et certains labels dans `LoadMoreGrid` ont du texte francais en dur.

5. **Performance CSS** : Supprimer la transition globale sur `html *` et appliquer les transitions uniquement aux composants qui en ont besoin pour le theme switching.

---

## RESUME DES PRIORITES

| Priorite | Action | Effort |
|----------|--------|--------|
| CRITIQUE | Restreindre les RLS policies au role `authenticated` | Moyen |
| CRITIQUE | Ajouter `sellerTypeFilter` et `bodyType` au `buildQuery` et au compteur | Faible |
| CRITIQUE | Activer Leaked Password Protection dans le backend | Manuel |
| IMPORTANT | Supprimer la cle anon dupliquee de `index.html` ou la synchroniser | Faible |
| IMPORTANT | Corriger le branding logo "Auto" blanc / "RA" vert | Faible |
| MOYEN | Supprimer la transition CSS globale `html *` | Faible |
| MOYEN | Centraliser la logique de filtrage | Moyen |
| FAIBLE | Internationaliser les textes en dur | Moyen |
| FAIBLE | Rendre les stats du Hero dynamiques | Faible |

