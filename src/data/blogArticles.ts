/**
 * Static blog articles for SEO — Belgian car market
 * @module data/blogArticles
 */

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  readTime: number;
  category: string;
  content: string;
}

export const blogArticles: BlogArticle[] = [
  {
    slug: "guide-achat-voiture-occasion-belgique-2026",
    title: "Guide complet : acheter une voiture d'occasion en Belgique en 2026",
    description: "Tout ce qu'il faut savoir pour acheter une voiture d'occasion en Belgique : Car-Pass, contrôle technique, zones LEZ, taxes et pièges à éviter.",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&h=630&fit=crop",
    datePublished: "2026-03-15",
    dateModified: "2026-04-10",
    readTime: 12,
    category: "Guide",
    content: `
## Pourquoi acheter d'occasion en Belgique ?

Le marché de l'occasion belge représente plus de **500 000 transactions par an**. Avec des prix compétitifs par rapport au neuf et un parc automobile bien entretenu, c'est une option attractive pour de nombreux acheteurs.

### Le Car-Pass : votre meilleure protection

Le **Car-Pass** est un document obligatoire en Belgique qui retrace l'historique kilométrique du véhicule. Il permet de détecter les fraudes au compteur, un problème qui touche encore **5 à 10 % des véhicules** vendus.

**Ce que vérifie le Car-Pass :**
- L'historique des relevés kilométriques
- La cohérence entre les différentes lectures
- Les alertes en cas d'anomalie

### Le contrôle technique

Le contrôle technique (CT) est obligatoire pour la vente d'un véhicule d'occasion en Belgique. Le vendeur doit fournir un **certificat de contrôle technique valide** datant de moins de 2 mois.

**Points vérifiés :**
- Freinage et direction
- Émissions polluantes
- Structure et châssis
- Éclairage et signalisation
- Pneus et suspensions

### Les zones de basses émissions (LEZ)

Trois villes belges ont instauré des zones LEZ :
- **Bruxelles** : la plus stricte, norme Euro 4+ diesel requise depuis 2025
- **Anvers** : restrictions progressives sur les anciens véhicules
- **Gand** : zone limitée au centre-ville

Vérifiez toujours la **norme Euro** du véhicule avant d'acheter si vous circulez dans ces zones.

### Les taxes à prévoir

En Belgique, l'achat d'un véhicule d'occasion entraîne deux taxes principales :
1. **La taxe de mise en circulation (TMC)** — variable selon la région (Wallonie, Bruxelles, Flandre), la puissance fiscale et le CO₂
2. **La taxe de circulation annuelle** — basée sur la cylindrée et la puissance fiscale

### 5 pièges à éviter

1. **Pas de Car-Pass** = ne signez jamais
2. **CT expiré** = demandez un nouveau contrôle
3. **Prix trop bas** = méfiez-vous des arnaques
4. **Vendeur pressé** = prenez votre temps
5. **Pas de facture** = exigez toujours un document écrit

### Conclusion

Acheter une voiture d'occasion en Belgique est sûr et encadré, à condition de respecter quelques règles simples. Utilisez AutoRa pour trouver des véhicules vérifiés avec Car-Pass et compatibilité LEZ garantie.
    `.trim(),
  },
  {
    slug: "zones-lez-belgique-guide-pratique",
    title: "Zones LEZ en Belgique : tout comprendre en 5 minutes",
    description: "Bruxelles, Anvers, Gand : quelles voitures sont autorisées dans les zones de basses émissions belges ? Normes Euro, amendes et calendrier 2026.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=630&fit=crop",
    datePublished: "2026-02-20",
    dateModified: "2026-04-01",
    readTime: 5,
    category: "Réglementation",
    content: `
## Qu'est-ce qu'une zone LEZ ?

Une **zone de basses émissions** (LEZ — Low Emission Zone) est un périmètre urbain où la circulation de certains véhicules polluants est restreinte ou interdite.

### Bruxelles — La plus stricte

Depuis janvier 2025, seuls les véhicules respectant au minimum la **norme Euro 4 (diesel)** et **Euro 2 (essence)** peuvent circuler dans la Région de Bruxelles-Capitale.

**Calendrier de renforcement :**
- 2025 : Euro 4 diesel / Euro 2 essence
- 2028 : Euro 5 diesel / Euro 3 essence
- 2030 : Euro 6 diesel / Euro 4 essence
- 2035 : Zéro émission uniquement

### Anvers

La LEZ d'Anvers couvre une grande partie de la ville. Les restrictions sont similaires à Bruxelles avec un calendrier légèrement décalé.

### Gand

La zone LEZ de Gand est limitée au centre-ville historique. Les restrictions sont progressives et suivent un calendrier propre.

### Amendes

Les amendes varient selon la ville :
- **Bruxelles** : 350 € par infraction
- **Anvers** : 150 € à 300 €
- **Gand** : 150 € à 300 €

### Comment vérifier votre véhicule ?

1. Consultez votre carte grise pour trouver la **norme Euro**
2. Utilisez le simulateur sur AutoRa pour vérifier la compatibilité
3. Vérifiez le badge LEZ sur chaque annonce AutoRa

### Alternatives si votre véhicule est interdit

- **Day-pass** : certaines villes proposent un pass journalier (max 8 jours/an à Bruxelles)
- **Retrofit** : conversion au gaz naturel (rare)
- **Remplacement** : trouvez un véhicule compatible sur AutoRa
    `.trim(),
  },
  {
    slug: "car-pass-belgique-pourquoi-essentiel",
    title: "Le Car-Pass belge : pourquoi est-il essentiel pour acheter d'occasion ?",
    description: "Comprendre le Car-Pass en Belgique : comment il protège les acheteurs contre la fraude au compteur, où le vérifier et ce qu'il contient.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=630&fit=crop",
    datePublished: "2026-01-10",
    dateModified: "2026-03-25",
    readTime: 6,
    category: "Guide",
    content: `
## Le Car-Pass : une exclusivité belge

La Belgique est l'un des rares pays européens à disposer d'un **système centralisé de suivi kilométrique**. Le Car-Pass, géré par l'asbl Car-Pass, enregistre chaque relevé de compteur effectué lors d'un entretien, contrôle technique ou réparation.

### Comment ça fonctionne ?

Chaque fois qu'un véhicule passe par un professionnel agréé, le kilométrage est enregistré dans la base de données centrale. Le Car-Pass compile ensuite ces données en un **document chronologique**.

### Que contient un Car-Pass ?

- **Numéro de châssis** du véhicule
- **Historique complet** des relevés kilométriques
- **Date et source** de chaque relevé
- **Alerte** en cas d'incohérence (compteur trafiqué)

### Obligation légale

Depuis 2004, le vendeur d'un véhicule d'occasion en Belgique est **légalement tenu** de fournir un Car-Pass valide à l'acheteur. Sans ce document, la vente peut être annulée.

### Fraude au compteur : les chiffres

- **5 à 10 %** des véhicules d'occasion ont un compteur manipulé en Europe
- En Belgique, le Car-Pass a réduit ce chiffre à **moins de 2 %**
- La fraude au compteur coûte en moyenne **3 000 €** de surcoût à l'acheteur

### Comment vérifier un Car-Pass ?

1. Demandez le document au vendeur **avant** de vous déplacer
2. Vérifiez la cohérence entre le kilométrage affiché et l'historique
3. Sur AutoRa, les véhicules avec Car-Pass vérifié portent un **badge vert**

### Conclusion

Le Car-Pass est votre meilleur allié pour acheter en toute confiance. Sur AutoRa, nous vérifions systématiquement la présence du Car-Pass pour chaque annonce.
    `.trim(),
  },
  {
    slug: "taxe-mise-en-circulation-belgique-2026",
    title: "TMC 2026 : calculer la taxe de mise en circulation en Belgique",
    description: "Guide complet sur la taxe de mise en circulation (TMC) en Belgique par région : Wallonie, Bruxelles et Flandre. Barèmes, exemptions et simulateur.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=630&fit=crop",
    datePublished: "2026-01-25",
    dateModified: "2026-04-05",
    readTime: 8,
    category: "Fiscalité",
    content: `
## La TMC en Belgique : 3 régions, 3 systèmes

La **taxe de mise en circulation** (TMC) est due lors de la première immatriculation d'un véhicule dans une région belge. Le montant varie considérablement selon votre domicile.

### Wallonie

La TMC wallonne est basée sur :
- La **puissance fiscale** (CV fiscaux)
- L'**âge du véhicule**
- Les **émissions de CO₂**

Un véhicule de 7 CV fiscaux de plus de 5 ans coûte environ **500 à 800 €** en TMC.

### Bruxelles

La Région bruxelloise applique un système similaire à la Wallonie, avec un **éco-malus** supplémentaire pour les véhicules les plus polluants (émissions CO₂ > 146 g/km).

### Flandre

La Flandre a réformé sa TMC en 2016 pour la baser principalement sur :
- Les **émissions de CO₂**
- La **norme Euro**
- Le **type de carburant**

Les véhicules électriques bénéficient d'une **exemption totale** en Flandre.

### Exemptions et réductions

- **Véhicules électriques** : exemptés en Flandre, réduits ailleurs
- **Personnes handicapées** : exemption totale dans les 3 régions
- **Véhicules de collection** : tarif réduit (+ de 25 ans)

### Taxe de circulation annuelle

En plus de la TMC, une **taxe annuelle** est due. Elle est basée sur la cylindrée et la puissance fiscale, avec un montant moyen de **200 à 600 €/an** pour une voiture standard.

### Simulez votre taxe

Utilisez le **calculateur fiscal intégré** sur AutoRa pour estimer précisément la TMC et la taxe annuelle selon votre région et votre véhicule.
    `.trim(),
  },
  {
    slug: "voiture-electrique-occasion-belgique",
    title: "Acheter une voiture électrique d'occasion en Belgique : le guide 2026",
    description: "Tout savoir sur l'achat d'une voiture électrique d'occasion en Belgique : autonomie réelle, batterie, aides fiscales et coût total de possession.",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&h=630&fit=crop",
    datePublished: "2026-03-01",
    dateModified: "2026-04-12",
    readTime: 10,
    category: "Guide",
    content: `
## Le marché de l'électrique d'occasion explose

En 2026, le parc de véhicules électriques d'occasion en Belgique a considérablement augmenté. Les premiers modèles de masse (Tesla Model 3, VW ID.3, Renault Zoé) arrivent sur le marché secondaire à des prix attractifs.

### Vérifier l'état de la batterie

La batterie est le composant le plus cher d'un véhicule électrique. Voici comment évaluer son état :

- **State of Health (SoH)** : un pourcentage indiquant la capacité restante
- **Seuil acceptable** : au-dessus de 80 % de SoH
- **Garantie constructeur** : généralement 8 ans ou 160 000 km

### Autonomie réelle vs annoncée

L'autonomie réelle est souvent **20 à 30 % inférieure** à l'autonomie WLTP annoncée, surtout en hiver ou sur autoroute.

**Exemples d'autonomie réelle :**
- Tesla Model 3 SR+ : ~350 km (WLTP 491 km)
- VW ID.3 Pro : ~300 km (WLTP 426 km)
- Renault Zoé R135 : ~280 km (WLTP 395 km)

### Coût total de possession (TCO)

Sur 5 ans, un véhicule électrique d'occasion est souvent **moins cher** qu'un équivalent thermique grâce à :
- **Carburant** : 3-5 €/100 km vs 8-12 €/100 km
- **Entretien** : 50 % moins cher (pas de vidange, moins de freins)
- **Taxes** : exemption TMC en Flandre, réduction ailleurs
- **Assurance** : comparable au thermique

### Recharge en Belgique

Le réseau de bornes belge s'est considérablement développé :
- **+10 000 bornes publiques** fin 2025
- **Recharge à domicile** : la solution la plus économique (0,30 €/kWh)
- **Bornes rapides** : 0,50-0,80 €/kWh sur autoroute

### Points d'attention

1. Vérifiez le **SoH de la batterie** avec un diagnostic
2. Testez l'**autonomie réelle** lors de l'essai
3. Assurez-vous d'avoir une **solution de recharge** (domicile ou travail)
4. Comparez le **TCO** avec notre calculateur intégré sur AutoRa

### Conclusion

L'électrique d'occasion en Belgique est une opportunité en 2026. Les prix baissent, le réseau de recharge s'étoffe et les avantages fiscaux restent attractifs.
    `.trim(),
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find((a) => a.slug === slug);
}
