

# Plan de refonte premium AutoRA

## 1. Header -- Suppression du doublon "Vendre"

**Probleme** : Le lien `NavLink to="/sell"` dans la navigation ET le bouton CTA "Vendre ma voiture" dans `DesktopActions` creent un doublon.

**Solution** : Supprimer le `NavLink to="/sell"` de la navigation desktop dans `Header.tsx` (ligne 100). Le bouton CTA elegant dans `DesktopActions` reste le seul point d'entree. Idem dans `MobileMenu.tsx` : remplacer le lien texte "/sell" par un bouton CTA vert distinctif en haut du menu mobile.

**Fichiers** : `src/shared/components/Header.tsx`, `src/shared/components/MobileMenu.tsx`

---

## 2. Page d'inscription -- Textes professionnels et chaleureux

**Probleme** : Les textes actuels sont generiques ("Connexion", "Connectez-vous pour acceder a votre espace", "Inscrivez-vous pour commencer").

**Solution** : Reecrire les traductions FR et NL dans `LanguageContext.tsx` pour un ton chaleureux et rassurant adapte au marche belge :

| Cle | Ancien (FR) | Nouveau (FR) |
|-----|-------------|--------------|
| auth.login | Connexion | Content de vous revoir |
| auth.signup | Creer un compte | Rejoignez AutoRA |
| auth.loginSubtitle | Connectez-vous pour acceder a votre espace | Accedez a vos favoris, alertes et conversations en toute securite. |
| auth.signupSubtitle | Inscrivez-vous pour commencer | Creez votre compte gratuit et decouvrez des milliers de vehicules verifies en Belgique. |
| auth.noAccount | Pas encore de compte ? | Nouveau sur AutoRA ? |
| auth.hasAccount | Deja un compte ? | Vous avez deja un compte ? |
| auth.heroDesc | (actuel) | La plateforme automobile belge qui met la transparence et la confiance au coeur de chaque transaction. Car-Pass, compatibilite LEZ -- tout est verifie pour vous. |

Meme traitement pour NL, DE, EN.

**Fichier** : `src/contexts/LanguageContext.tsx`

---

## 3. Footer -- Carte visuelle des zones LEZ

**Solution** : Ajouter un composant `LezMapVisual` directement dans le footer, entre les colonnes et les warnings. Ce sera une carte stylisee de la Belgique en SVG simplifie avec les 3 zones LEZ (Bruxelles, Anvers, Gand) marquees par des points colores et une legende.

- SVG inline leger representant le contour de la Belgique
- 3 marqueurs positionnes sur Bruxelles, Anvers et Gand
- Legende : vert = autorise, orange = alerte, rouge = interdit
- Lien vers `/lez-belgique` pour plus de details
- Design sombre coherent avec le footer

**Fichiers** : Nouveau `src/components/LezMapFooter.tsx`, modification de `src/shared/components/Footer.tsx`

---

## 4. VehicleCard -- Hover effects immersifs avec Framer Motion

**Solution** : Ameliorer `CarCard.tsx` (le composant utilise dans la grille) avec des micro-animations Framer Motion elegantes :

- `whileHover` : leger scale (1.02) + elevation d'ombre progressive
- `whileTap` : scale (0.98) pour le feedback tactile
- Image : zoom progressif au hover via CSS (deja present, on l'ameliore)
- Ajout d'un effet de "shine" subtil qui traverse la carte au hover (gradient anime)
- Les specs badges (annee, km) transitionnent en vert au hover (deja present)
- Prix plus visible : fond glassmorphism avec backdrop-blur

Le tout reste CSS-first avec Framer Motion uniquement pour le scale/ombre de la carte entiere.

**Fichier** : `src/features/listings/components/CarCard.tsx`

---

## 5. Sensation de decouverte -- ScrollReveal ameliore

**Solution** : Ameliorer le composant `ScrollReveal` existant pour que les cartes apparaissent en cascade (stagger) avec un leger decalage entre chaque carte. Ajout d'un delai progressif base sur l'index dans `LoadMoreGrid`.

**Fichiers** : `src/components/LoadMoreGrid.tsx`

---

## Resume technique des fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/shared/components/Header.tsx` | Suppression NavLink "/sell" |
| `src/shared/components/MobileMenu.tsx` | Remplacement lien "/sell" par CTA vert |
| `src/contexts/LanguageContext.tsx` | Reecriture textes auth FR/NL/DE/EN |
| `src/shared/components/Footer.tsx` | Integration carte LEZ visuelle |
| `src/components/LezMapFooter.tsx` | Nouveau composant carte LEZ SVG |
| `src/features/listings/components/CarCard.tsx` | Framer Motion hover + shine effect |
| `src/components/LoadMoreGrid.tsx` | Stagger animation sur les cartes |

