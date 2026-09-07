/**
 * Normalisation et filtrage de la localisation des annonces.
 *
 * Le champ `location` de `car_listings` est du texte libre : il contient
 * aussi bien un nom de commune ("Namur") qu'un code postal ("5100"), avec
 * parfois des espaces parasites. Ce module centralise :
 *  - le nettoyage (`normalizeLocation`) ;
 *  - l'affichage (`formatLocation`), qui ne doit jamais rendre un nombre nu
 *    à côté d'un prix ;
 *  - le filtre par province, tolérant aux deux formes.
 *
 * @module features/listings/utils/location
 */

/** Nettoie une localisation saisie : trim + espaces internes compactés. */
export function normalizeLocation(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

/** Vrai si la valeur commence par un code postal belge à 4 chiffres. */
export function isPostalCodeOnly(value: string | null | undefined): boolean {
  return /^\d{4}$/.test(normalizeLocation(value));
}

/**
 * Rendu lisible d'une localisation.
 * Un code postal seul est préfixé ("CP 5100") pour qu'il ne se lise jamais
 * comme un montant lorsqu'il est affiché près du prix.
 */
export function formatLocation(value: string | null | undefined): string {
  const clean = normalizeLocation(value);
  if (!clean) return '';
  return isPostalCodeOnly(clean) ? `CP ${clean}` : clean;
}

/**
 * Mapping province ID → communes représentatives (texte libre).
 */
export const PROVINCE_CITIES: Record<string, string[]> = {
  bruxelles: ['bruxelles', 'brussel', 'brussels', 'ixelles', 'uccle', 'schaerbeek', 'anderlecht', 'molenbeek', 'etterbeek', 'forest', 'jette', 'woluwe', 'evere', 'auderghem'],
  anvers: ['anvers', 'antwerpen', 'antwerp', 'malines', 'mechelen', 'turnhout', 'lierre', 'lier', 'geel', 'mortsel'],
  'brabant-flamand': ['louvain', 'leuven', 'vilvorde', 'vilvoorde', 'hal', 'halle', 'tirlemont', 'tienen', 'diest', 'aerschot', 'aarschot'],
  'brabant-wallon': ['wavre', 'nivelles', 'ottignies', 'louvain-la-neuve', 'jodoigne', 'tubize', "braine-l'alleud", 'rixensart', 'genappe'],
  'flandre-occidentale': ['bruges', 'brugge', 'courtrai', 'kortrijk', 'ostende', 'oostende', 'roulers', 'roeselare', 'ypres', 'ieper', 'furnes', 'veurne', 'menin', 'menen'],
  'flandre-orientale': ['gand', 'gent', 'alost', 'aalst', 'saint-nicolas', 'sint-niklaas', 'termonde', 'dendermonde', 'audenarde', 'oudenaarde', 'renaix', 'ronse', 'eeklo'],
  hainaut: ['mons', 'charleroi', 'tournai', 'la louvière', 'la louviere', 'mouscron', 'soignies', 'ath', 'binche', 'thuin', 'chimay'],
  liege: ['liège', 'liege', 'verviers', 'huy', 'seraing', 'herstal', 'spa', 'eupen', 'malmedy', 'waremme', 'visé', 'vise'],
  limbourg: ['hasselt', 'genk', 'tongres', 'tongeren', 'saint-trond', 'sint-truiden', 'bilzen', 'lommel', 'maaseik', 'beringen'],
  luxembourg: ['arlon', 'bastogne', 'marche-en-famenne', 'neufchâteau', 'neufchateau', 'virton', 'durbuy', 'libramont', 'saint-hubert'],
  namur: ['namur', 'dinant', 'philippeville', 'gembloux', 'andenne', 'ciney', 'rochefort', 'florennes'],
};

/**
 * Mapping province ID → préfixes de codes postaux belges.
 *
 * Source : découpage national bpost des codes postaux belges par province
 * (plan à 4 chiffres, blocs par province) :
 *   1000-1299 Bruxelles-Capitale · 1300-1499 Brabant wallon
 *   1500-1999 + 3000-3499 Brabant flamand · 2000-2999 Anvers
 *   3500-3999 Limbourg · 4000-4999 Liège · 5000-5999 Namur
 *   6000-6599 + 7000-7999 Hainaut · 6600-6999 Luxembourg
 *   8000-8999 Flandre occidentale · 9000-9999 Flandre orientale
 *
 * Les préfixes ci-dessous se lisent : « code postal commençant par … ».
 * Aucune province n'a été devinée ; ce découpage est celui des blocs
 * nationaux, stable et sans chevauchement.
 */
export const PROVINCE_POSTAL_PREFIXES: Record<string, string[]> = {
  bruxelles: ['10', '11', '12'],
  'brabant-wallon': ['13', '14'],
  'brabant-flamand': ['15', '16', '17', '18', '19', '30', '31', '32', '33', '34'],
  anvers: ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'],
  limbourg: ['35', '36', '37', '38', '39'],
  liege: ['4'],
  namur: ['5'],
  hainaut: ['60', '61', '62', '63', '64', '65', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79'],
  luxembourg: ['66', '67', '68', '69'],
  'flandre-occidentale': ['8'],
  'flandre-orientale': ['9'],
};

/**
 * Construit la chaîne de conditions PostgREST `.or()` pour une province.
 * Accepte les deux formes du champ `location` :
 *  - un nom de commune (ilike %commune%) ;
 *  - un code postal belge à 4 chiffres, éventuellement suivi d'un libellé
 *    ("5100 Jambes") → `like` avec autant de `_` que de chiffres manquants.
 */
export function buildProvinceLocationFilter(province: string): string {
  const cities = PROVINCE_CITIES[province] || [province];
  const conditions = cities.map((c) => `location.ilike.%${c}%`);

  for (const prefix of PROVINCE_POSTAL_PREFIXES[province] ?? []) {
    const wildcards = '_'.repeat(4 - prefix.length);
    conditions.push(`location.like.${prefix}${wildcards}*`);
  }

  return conditions.join(',');
}
