/**
 * Comprehensive brand → model mapping for the Belgian market.
 * Used in SellCarForm (cascading dropdown) and BrandCarousel (chip filters).
 */
export const BRAND_MODELS: Record<string, string[]> = {
  "Audi": ["A1","A3","A4","A5","A6","A7","A8","Q2","Q3","Q4 e-tron","Q5","Q7","Q8","TT","e-tron","RS3","RS5","RS6","S3","S5","S6","SQ5","SQ7"],
  "BMW": ["Série 1","Série 2","Série 3","Série 4","Série 5","Série 7","Série 8","X1","X2","X3","X4","X5","X6","X7","iX","i4","i5","i7","M2","M3","M4","M5","Z4"],
  "BYD": ["Atto 3","Dolphin","Han","Seal","Tang","Atto 2"],
  "Citroën": ["C1","C3","C3 Aircross","C4","C5 Aircross","C5 X","Berlingo","SpaceTourer","Jumpy","Jumper","ë-C4","ë-Berlingo"],
  "Cupra": ["Formentor","Born","Ateca","Leon","Terramar"],
  "Dacia": ["Sandero","Logan","Duster","Spring","Jogger","Dokker"],
  "DS": ["DS 3","DS 4","DS 7","DS 9","DS 3 E-Tense","DS 4 E-Tense","DS 7 E-Tense"],
  "Fiat": ["500","500X","500L","Tipo","Panda","Doblo","Ducato","500e","Scudo"],
  "Ford": ["Fiesta","Focus","Puma","Kuga","Mustang Mach-E","Explorer","Ranger","Transit","Transit Custom","Galaxy","S-Max","EcoSport","Tourneo"],
  "Honda": ["Civic","Jazz","HR-V","CR-V","e","ZR-V","Accord"],
  "Hyundai": ["i10","i20","i30","Tucson","Santa Fe","Ioniq 5","Ioniq 6","Kona","Nexo","Staria","i20 N","i30 N"],
  "Jaguar": ["XE","XF","F-Type","E-Pace","F-Pace","I-Pace"],
  "Jeep": ["Renegade","Compass","Cherokee","Grand Cherokee","Wrangler","Avenger"],
  "Kia": ["Picanto","Rio","Ceed","Stinger","Sportage","Sorento","Stonic","Niro","EV6","EV9","Carnival","ProCeed"],
  "Land Rover": ["Defender","Discovery","Discovery Sport","Range Rover","Range Rover Sport","Range Rover Evoque","Range Rover Velar","Freelander"],
  "Lexus": ["UX","NX","RX","ES","GS","IS","LC","LX","CT 200h"],
  "Mazda": ["Mazda2","Mazda3","Mazda6","CX-3","CX-30","CX-5","CX-60","MX-5","MX-30"],
  "Mercedes-Benz": ["Classe A","Classe B","Classe C","Classe E","Classe S","CLA","CLS","GLA","GLB","GLC","GLE","GLS","EQA","EQB","EQC","EQE","EQS","AMG GT","G-Classe","Sprinter","Vito"],
  "MG": ["MG4","MG5","ZS","MG3","ZS EV","Marvel R"],
  "Mini": ["Mini 3 portes","Mini 5 portes","Mini Cabrio","Mini Clubman","Mini Countryman","Mini Paceman","Mini Electric","Mini Aceman"],
  "Mitsubishi": ["ASX","Eclipse Cross","Outlander","L200","Space Star","Colt"],
  "Nissan": ["Micra","Juke","Qashqai","X-Trail","Leaf","Ariya","Navara","Townstar","Interstar"],
  "Opel": ["Corsa","Astra","Mokka","Crossland","Grandland","Zafira","Insignia","Combo","Vivaro","Movano","Rocks-e","Corsa-e","Mokka-e"],
  "Peugeot": ["108","208","308","408","508","2008","3008","5008","Rifter","Partner","Expert","Boxer","e-208","e-2008","e-308"],
  "Polestar": ["Polestar 2","Polestar 3","Polestar 4"],
  "Porsche": ["911","Cayenne","Macan","Panamera","Taycan","718 Cayman","718 Boxster"],
  "Renault": ["Clio","Captur","Mégane","Arkana","Kadjar","Koleos","Scenic","Espace","Trafic","Master","Zoe","Megane E-Tech","Austral","Rafale"],
  "Seat": ["Ibiza","Leon","Ateca","Arona","Tarraco","Alhambra","Mii Electric"],
  "Škoda": ["Fabia","Scala","Octavia","Superb","Rapid","Kamiq","Karoq","Kodiaq","Enyaq","Enyaq Coupé"],
  "Subaru": ["Impreza","Outback","Forester","XV","BRZ","Solterra","Legacy"],
  "Suzuki": ["Swift","Ignis","Vitara","S-Cross","Jimny","Swace","Across"],
  "Tesla": ["Model 3","Model S","Model X","Model Y","Cybertruck"],
  "Toyota": ["Yaris","Corolla","C-HR","RAV4","Prius","Camry","Land Cruiser","Proace","Aygo X","bZ4X","GR Yaris","GR86","Hilux","Proace City"],
  "Volkswagen": ["Golf","Polo","Tiguan","Passat","T-Roc","T-Cross","ID.3","ID.4","ID.5","ID.7","Touareg","Sharan","Caddy","Transporter","Crafter","Arteon"],
  "Volvo": ["XC40","XC60","XC90","S60","S90","V60","V90","C40 Recharge","EX30","EX90","EC40"],
  "Xpeng": ["P7","G9","G6","X9"],
};

/** Sorted list of all brand names */
export const ALL_BRANDS = Object.keys(BRAND_MODELS).sort();
