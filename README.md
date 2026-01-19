<div align="center">

  <img src="https://via.placeholder.com/200x80/22c55e/ffffff?text=AutoRA.be" alt="AutoRA.be Logo" width="220" />

  <h1>AutoRA.be</h1>
  <p><strong>La marketplace automobile belge d'occasion la plus transparente et équitable</strong></p>

  <p>
    <a href="https://autora.be"><strong>Site live →</strong></a> •
    <a href="#fonctionnalités">Fonctionnalités</a> •
    <a href="#roadmap">Roadmap 2026</a> •
    <a href="#installation">Installation locale</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  </p>

</div>

## Pourquoi AutoRA.be ?

Dans un marché belge où les plateformes dominantes augmentent leurs tarifs de façon démesurée, AutoRA.be naît pour offrir une alternative **locale, transparente et abordable** :

- Voitures d'occasion vérifiées **LEZ & Car-Pass**
- Recherche ultra-fluide avec filtres intelligents
- Signalement facile des annonces suspectes
- Interface multilingue (FR / NL / DE / EN)
- Expérience mobile irréprochable
- Abonnements pros équitables (lancement prochain)

## Fonctionnalités actuelles (MVP – janvier 2026)

- **Recherche avancée** : marque → modèles auto-populés, prix, année, km, carburant, compatibilité LEZ
- **Slider marques premium** : logos officiels HD (BMW, Toyota, VW, Audi, Mercedes, Peugeot, Renault, Citroën, Ford, Opel)
- **Listings enrichis** : 40+ annonces réalistes avec photos, détails complets, badges LEZ/Car-Pass
- **Signalement d'annonces** : modal intuitif + dashboard admin pour modération
- **Multilingue complet** : Français, Néerlandais (Flamand), Allemand, Anglais
- **Navigation fluide** : scroll progress, scroll-to-top automatique, responsive 100 % mobile
- **Conformité RGPD** : cookie banner + mentions légales claires

## Roadmap 2026

| Trimestre | Priorités clés |
|-----------|----------------|
| Q1 2026   | Auth email + Google, formulaire "Vendre", 100+ annonces, abonnements Stripe (freemium), SEO complet |
| Q2 2026   | Dashboard vendeur, infinite scroll, app mobile React Native, partenariats garages |
| Q3 2026   | Analytics avancés, comparateur véhicules, intégration Calendly (rdv visites) |
| Q4 2026   | Scaling (1000+ garages), levée pré-seed, expansion Luxembourg / Nord de France |

## Installation locale (pour développeurs)

```bash
# 1. Cloner le repo
git clone https://github.com/54gtjx8c8b-png/AutoRA.git

# 2. Aller dans le dossier
cd AutoRA

# 3. Installer les dépendances
npm install

# 4. Créer .env à la racine
cp .env.example .env
# → Ajouter tes clés Supabase :
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# 5. Lancer le serveur de dev
npm run dev
