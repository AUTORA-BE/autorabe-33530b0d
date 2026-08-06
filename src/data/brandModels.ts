/**
 * SOURCE UNIQUE des marques → modèles pour AutoRA.be
 *
 * Utilisée par :
 *  - le formulaire de vente (SellCarForm, dropdown en cascade)
 *  - les filtres de recherche (HeroSearch, FilterPanel, Recherche)
 *  - le carrousel de marques
 *  - la détection d'entités de la recherche vocale
 *
 * IMPORTANT — le filtre de recherche fait une correspondance EXACTE (ilike sans
 * joker). Les libellés définis ici sont donc CEUX qui sont écrits en base lors
 * de la publication : toute divergence rend une annonce introuvable.
 *
 * Couverture pensée pour le marché de l'OCCASION belge : les nomenclatures
 * abandonnées (Peugeot 206/307, Renault Twingo/Laguna, Opel Meriva, Ford
 * Mondeo, Toyota Auris, Škoda Yeti, Volvo V40, VW Touran…) sont incluses,
 * ainsi que les marques premium et exotiques.
 */

export const BRAND_MODELS: Record<string, string[]> = {
  "Abarth": ["500", "595", "695", "124 Spider", "600e"],
  "Alfa Romeo": ["147", "156", "159", "166", "GT", "Brera", "Spider", "MiTo", "Giulietta", "Giulia", "Stelvio", "Tonale", "Junior", "4C", "8C"],
  "Alpine": ["A110", "A290"],
  "Aston Martin": ["V8 Vantage", "Vantage", "DB9", "DB11", "DB12", "DBS", "DBX", "Rapide", "Vanquish"],
  "Audi": ["A1", "A2", "A3", "A4", "A4 Allroad", "A5", "A6", "A6 Allroad", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron", "TT", "TTS", "TT RS", "R8", "e-tron", "e-tron GT", "S1", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8", "RS3", "RS4", "RS5", "RS6", "RS7", "RS Q3", "RS Q8"],
  "Bentley": ["Continental GT", "Flying Spur", "Bentayga", "Mulsanne"],
  "BMW": ["Série 1", "Série 2", "Série 2 Active Tourer", "Série 2 Gran Coupé", "Série 3", "Série 3 Touring", "Série 4", "Série 5", "Série 5 Touring", "Série 6", "Série 7", "Série 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z3", "Z4", "i3", "i4", "i5", "i7", "iX", "iX1", "iX2", "iX3", "M2", "M3", "M4", "M5", "M8", "X3 M", "X5 M", "X6 M"],
  "BYD": ["Atto 2", "Atto 3", "Dolphin", "Dolphin Surf", "Seal", "Seal U", "Sealion 7", "Han", "Tang"],
  "Chevrolet": ["Aveo", "Cruze", "Captiva", "Spark", "Orlando", "Trax", "Camaro", "Corvette"],
  "Chrysler": ["300C", "Voyager", "PT Cruiser", "Pacifica"],
  "Citroën": ["C1", "C2", "C3", "C3 Aircross", "C3 Picasso", "C4", "C4 Cactus", "C4 Picasso", "C4 SpaceTourer", "C4 X", "C5", "C5 Aircross", "C5 X", "C6", "C8", "DS3", "DS4", "DS5", "Berlingo", "Jumpy", "Jumper", "Nemo", "SpaceTourer", "Xsara Picasso", "Ami", "ë-C3", "ë-C4", "ë-Berlingo"],
  "Cupra": ["Ateca", "Born", "Formentor", "Leon", "Tavascan", "Terramar"],
  "Dacia": ["Sandero", "Sandero Stepway", "Logan", "Duster", "Bigster", "Jogger", "Lodgy", "Dokker", "Spring"],
  "Daihatsu": ["Cuore", "Terios", "Sirion", "Materia"],
  "Dodge": ["Journey", "Nitro", "Caliber", "Challenger", "RAM 1500"],
  "DS": ["DS 3", "DS 3 Crossback", "DS 4", "DS 5", "DS 7", "DS 7 Crossback", "DS 9", "DS N°8"],
  "Ferrari": ["California", "Portofino", "Roma", "F8 Tributo", "488", "458 Italia", "812 Superfast", "SF90", "296 GTB", "Purosangue"],
  "Fiat": ["500", "500e", "500C", "500L", "500X", "600", "Panda", "Grande Panda", "Punto", "Grande Punto", "Tipo", "Bravo", "Doblo", "Qubo", "Fiorino", "Scudo", "Ducato", "Freemont", "Multipla", "Sedici"],
  "Ford": ["Ka", "Ka+", "Fiesta", "Focus", "Focus C-Max", "C-Max", "Grand C-Max", "B-Max", "S-Max", "Galaxy", "Mondeo", "Fusion", "Puma", "EcoSport", "Kuga", "Edge", "Explorer", "Mustang", "Mustang Mach-E", "Ranger", "Transit", "Transit Custom", "Transit Connect", "Tourneo Connect", "Tourneo Courier", "Capri"],
  "Honda": ["Jazz", "Civic", "Accord", "CR-V", "HR-V", "ZR-V", "e:Ny1", "Honda e", "CR-Z", "Insight", "FR-V", "Legend"],
  "Hyundai": ["i10", "i20", "i30", "i40", "ix20", "ix35", "Bayon", "Kona", "Tucson", "Santa Fe", "Ioniq", "Ioniq 5", "Ioniq 6", "Nexo", "Staria", "H-1", "Getz", "Matrix", "Inster"],
  "Infiniti": ["Q30", "Q50", "QX30", "QX70"],
  "Isuzu": ["D-Max"],
  "Iveco": ["Daily"],
  "Jaguar": ["XE", "XF", "XJ", "XK", "S-Type", "X-Type", "F-Type", "E-Pace", "F-Pace", "I-Pace"],
  "Jeep": ["Renegade", "Compass", "Avenger", "Cherokee", "Grand Cherokee", "Wrangler", "Patriot", "Commander", "Gladiator"],
  "Kia": ["Picanto", "Rio", "Venga", "Ceed", "ProCeed", "XCeed", "Cee'd", "Stonic", "Soul", "Niro", "Sportage", "Sorento", "Carens", "Carnival", "Stinger", "EV3", "EV6", "EV9", "Optima", "Cerato"],
  "Lada": ["Niva"],
  "Lamborghini": ["Gallardo", "Huracán", "Aventador", "Urus", "Revuelto"],
  "Lancia": ["Ypsilon", "Delta", "Musa", "Thema", "Voyager"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar"],
  "Lexus": ["CT 200h", "IS", "ES", "GS", "LS", "UX", "NX", "RX", "RZ", "LBX", "LC", "LX", "RC"],
  "Lotus": ["Elise", "Exige", "Evora", "Emira", "Eletre"],
  "Lucid": ["Air", "Gravity"],
  "Maserati": ["Ghibli", "Quattroporte", "Levante", "GranTurismo", "Grecale", "MC20"],
  "Mazda": ["Mazda2", "Mazda3", "Mazda5", "Mazda6", "CX-3", "CX-5", "CX-30", "CX-60", "CX-80", "MX-5", "MX-30", "RX-8", "Premacy", "Tribute"],
  "Mercedes-Benz": ["Classe A", "Classe B", "Classe C", "Classe E", "Classe S", "Classe G", "Classe R", "Classe V", "CLA", "CLK", "CLS", "SL", "SLK", "SLC", "GLA", "GLB", "GLC", "GLE", "GLS", "GLK", "ML", "GL", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "AMG GT", "Citan", "Vito", "Viano", "Sprinter"],
  "MG": ["MG3", "MG4", "MG5", "ZS", "ZS EV", "HS", "Marvel R", "Cyberster", "MGB"],
  "Mini": ["Cooper", "Cooper S", "One", "Clubman", "Countryman", "Cabrio", "Paceman", "Coupé", "Roadster", "Aceman", "Mini Electric"],
  "Mitsubishi": ["Colt", "Space Star", "ASX", "Eclipse Cross", "Outlander", "Pajero", "Lancer", "L200", "i-MiEV", "Grandis"],
  "Nissan": ["Micra", "Note", "Juke", "Qashqai", "Qashqai+2", "X-Trail", "Murano", "Pathfinder", "Navara", "Leaf", "Ariya", "Pulsar", "Almera", "Primera", "Townstar", "NV200", "Interstar", "370Z", "GT-R"],
  "Opel": ["Adam", "Karl", "Agila", "Corsa", "Corsa-e", "Astra", "Insignia", "Vectra", "Zafira", "Zafira Life", "Meriva", "Antara", "Mokka", "Mokka-e", "Crossland", "Grandland", "Combo", "Vivaro", "Movano", "Frontera", "Tigra", "Signum", "GT", "Rocks-e"],
  "Peugeot": ["106", "107", "108", "206", "207", "208", "e-208", "301", "306", "307", "308", "e-308", "406", "407", "408", "508", "1007", "2008", "e-2008", "3008", "e-3008", "5008", "e-5008", "4007", "4008", "807", "Bipper", "Partner", "Rifter", "Expert", "Traveller", "Boxer", "RCZ"],
  "Polestar": ["Polestar 1", "Polestar 2", "Polestar 3", "Polestar 4"],
  "Porsche": ["911", "718 Cayman", "718 Boxster", "Cayman", "Boxster", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Renault": ["Twingo", "Clio", "Captur", "Zoe", "Modus", "Mégane", "Mégane E-Tech", "Scénic", "Grand Scénic", "Scenic E-Tech", "Laguna", "Latitude", "Talisman", "Espace", "Kadjar", "Austral", "Arkana", "Koleos", "Rafale", "Symbioz", "Kangoo", "Trafic", "Master", "Fluence", "Wind", "Avantime", "R5 E-Tech", "R4 E-Tech"],
  "Rolls-Royce": ["Ghost", "Phantom", "Wraith", "Cullinan", "Spectre"],
  "Rover": ["25", "45", "75"],
  "Saab": ["9-3", "9-5"],
  "Seat": ["Mii", "Ibiza", "Leon", "Toledo", "Altea", "Alhambra", "Arona", "Ateca", "Tarraco", "Exeo", "Cordoba"],
  "Škoda": ["Citigo", "Fabia", "Rapid", "Scala", "Octavia", "Superb", "Yeti", "Roomster", "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Enyaq Coupé", "Elroq", "Praktik"],
  "Smart": ["ForTwo", "ForFour", "Roadster", "#1", "#3", "#5"],
  "SsangYong": ["Tivoli", "Korando", "Rexton", "Musso"],
  "Subaru": ["Impreza", "Legacy", "Outback", "Forester", "XV", "Crosstrek", "Levorg", "BRZ", "Solterra", "Justy", "Trezia"],
  "Suzuki": ["Alto", "Celerio", "Splash", "Swift", "Baleno", "Ignis", "SX4", "SX4 S-Cross", "S-Cross", "Vitara", "Grand Vitara", "Jimny", "Across", "Swace"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster"],
  "Toyota": ["Aygo", "Aygo X", "Yaris", "Yaris Cross", "Auris", "Corolla", "Corolla Cross", "Avensis", "Camry", "Prius", "Prius+", "C-HR", "RAV4", "Highlander", "Land Cruiser", "Hilux", "Verso", "Verso-S", "Urban Cruiser", "iQ", "GT86", "GR86", "GR Yaris", "GR Supra", "Supra", "bZ4X", "Proace", "Proace City", "Mirai"],
  "Volkswagen": ["Up!", "Fox", "Lupo", "Polo", "Golf", "Golf Plus", "Golf Sportsvan", "Jetta", "Beetle", "New Beetle", "Passat", "Passat CC", "CC", "Arteon", "Scirocco", "Eos", "Touran", "Sharan", "Tiguan", "Tiguan Allspace", "Touareg", "T-Cross", "T-Roc", "Taigo", "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz", "Caddy", "Transporter", "Multivan", "Caravelle", "Crafter", "Amarok", "Phaeton"],
  "Volvo": ["C30", "C40", "S40", "S60", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90", "EX30", "EX40", "EX90", "EC40"],
  "Xpeng": ["G6", "G9", "P7", "X9"],
  "NIO": ["ET5", "ET7", "EL6", "EL7", "ES8", "EC7"],
  "Rivian": ["R1T", "R1S"],
  "Vinfast": ["VF 6", "VF 7", "VF 8", "VF 9"],
};

/** Liste triée de toutes les marques */
export const ALL_BRANDS = Object.keys(BRAND_MODELS).sort((a, b) =>
  a.localeCompare(b, "fr")
);

/** Normalise une chaîne : minuscules, sans accents ni diacritiques, sans espaces superflus */
const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const BRAND_LOOKUP: Record<string, string> = Object.keys(BRAND_MODELS).reduce(
  (acc, brand) => {
    acc[normalize(brand)] = brand;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Renvoie le libellé canonique d'une marque (tolérant aux accents et à la casse).
 * Ex : "skoda", "ŠKODA", "Škoda " → "Škoda". Renvoie null si inconnue.
 */
export const canonicalBrand = (brand: string): string | null => {
  if (!brand) return null;
  return BRAND_LOOKUP[normalize(brand)] ?? null;
};

/**
 * Renvoie les modèles d'une marque, quelle que soit l'orthographe fournie.
 * Renvoie un tableau vide si la marque est inconnue.
 */
export const getModelsForBrand = (brand: string): string[] => {
  const canonical = canonicalBrand(brand);
  return canonical ? BRAND_MODELS[canonical] : [];
};
