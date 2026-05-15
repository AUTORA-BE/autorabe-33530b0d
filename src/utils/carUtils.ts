/**
 * Utility functions for car/vehicle operations
 * @module utils/carUtils
 */
import { supabase } from "@/integrations/supabase/client";
import { mapListingToVehicle } from "@/features/listings/api/vehicleQueries";
import type { Car, VehicleListingRow } from "@/features/listings/types/vehicle.types";

const mapListingToCar = (listing: VehicleListingRow): Car => {
  return mapListingToVehicle(listing);
};

// Common car brands for Belgium — includes pure EV brands
const commonBrands = [
  "Alfa Romeo", "Audi", "BMW", "BYD", "Citroën", "Cupra", "Dacia", "DS", "Fiat", "Ford",
  "Honda", "Hyundai", "Jaguar", "Jeep", "Kia", "Land Rover", "Lexus", "Lucid",
  "Mazda", "Mercedes-Benz", "MG", "Mini", "Mitsubishi", "NIO", "Nissan", "Opel",
  "Peugeot", "Polestar", "Porsche", "Renault", "Rivian", "Seat", "Skoda", "Smart",
  "Subaru", "Suzuki", "Tesla", "Toyota", "Vinfast", "Volkswagen", "Volvo", "XPENG"
];

/** Complete known models per brand — shown even if not currently in stock */
const BRAND_MODELS: Record<string, string[]> = {
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "Giulietta", "MiTo", "4C", "159"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "e-tron", "e-tron GT", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "S4", "S5", "TT", "R8"],
  "BMW": ["Série 1", "Série 2", "Série 3", "Série 4", "Série 5", "Série 6", "Série 7", "Série 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z4", "i3", "i4", "i5", "i7", "iX", "iX1", "iX3", "M2", "M3", "M4", "M5", "M8"],
  "Citroën": ["C1", "C3", "C3 Aircross", "C4", "C4 X", "C5 Aircross", "C5 X", "Berlingo", "ë-C4", "ë-Berlingo", "Ami", "SpaceTourer"],
  "Cupra": ["Formentor", "Leon", "Born", "Ateca", "Tavascan"],
  "Dacia": ["Sandero", "Duster", "Jogger", "Spring", "Logan"],
  "DS": ["DS 3", "DS 4", "DS 7", "DS 9"],
  "Fiat": ["500", "500X", "500e", "Panda", "Tipo", "Punto", "Doblo"],
  "Ford": ["Fiesta", "Focus", "Puma", "Kuga", "Mustang", "Mustang Mach-E", "Explorer", "Mondeo", "EcoSport", "Ranger", "Transit", "Galaxy", "S-Max", "Tourneo"],
  "Honda": ["Civic", "Jazz", "HR-V", "CR-V", "ZR-V", "e:Ny1", "e"],
  "Hyundai": ["i10", "i20", "i30", "Tucson", "Kona", "Bayon", "Ioniq 5", "Ioniq 6", "Santa Fe", "Nexo", "Staria"],
  "Jaguar": ["E-Pace", "F-Pace", "I-Pace", "XE", "XF", "F-Type"],
  "Jeep": ["Renegade", "Compass", "Avenger", "Wrangler", "Cherokee", "Grand Cherokee"],
  "Kia": ["Picanto", "Rio", "Ceed", "Sportage", "Niro", "EV6", "EV9", "Sorento", "Stonic", "XCeed", "ProCeed", "Soul"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar"],
  "Lexus": ["UX", "NX", "RX", "ES", "IS", "LC", "LS", "LBX", "RZ"],
  "Mazda": ["2", "3", "CX-3", "CX-30", "CX-5", "CX-60", "MX-5", "MX-30"],
  "Mercedes-Benz": ["Classe A", "Classe B", "Classe C", "Classe E", "Classe S", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "EQA", "EQB", "EQC", "EQE", "EQS", "AMG GT", "Vito", "Sprinter"],
  "MG": ["MG4", "ZS", "HS", "5", "Marvel R", "Cyberster"],
  "Mini": ["Cooper", "Countryman", "Clubman", "Cabrio", "Electric"],
  "Mitsubishi": ["ASX", "Eclipse Cross", "Outlander", "Space Star", "L200"],
  "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "Townstar"],
  "Opel": ["Corsa", "Astra", "Mokka", "Crossland", "Grandland", "Combo", "Zafira", "Insignia", "Vivaro"],
  "Peugeot": ["108", "208", "308", "408", "508", "2008", "3008", "5008", "e-208", "e-308", "e-2008", "e-3008", "Rifter", "Partner", "Expert", "Traveller"],
  "Porsche": ["911", "718 Cayman", "718 Boxster", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Renault": ["Clio", "Captur", "Mégane", "Mégane E-Tech", "Arkana", "Austral", "Espace", "Scénic", "Kangoo", "Twingo", "Zoe", "Trafic", "Master"],
  "Seat": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
  "Skoda": ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Citigo"],
  "Smart": ["ForTwo", "ForFour", "#1", "#3"],
  "Subaru": ["Impreza", "XV", "Forester", "Outback", "Solterra", "BRZ"],
  "Suzuki": ["Swift", "Ignis", "Vitara", "S-Cross", "Jimny", "Across"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  "Toyota": ["Yaris", "Yaris Cross", "Corolla", "C-HR", "RAV4", "Camry", "Highlander", "Land Cruiser", "Supra", "GR86", "Aygo X", "bZ4X", "Proace", "Hilux"],
  "Volkswagen": ["Polo", "Golf", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Passat", "Arteon", "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz", "Up!", "Caddy", "Transporter", "Multivan"],
  "Volvo": ["XC40", "XC60", "XC90", "C40", "S60", "S90", "V60", "V90", "EX30", "EX90"],
  "BYD": ["Atto 3", "Han", "Tang", "Seal", "Dolphin", "Atto 2", "Sea Lion 6"],
  "Polestar": ["Polestar 2", "Polestar 3", "Polestar 4"],
  "Lucid": ["Air", "Gravity"],
  "NIO": ["ET5", "ET7", "EL6", "EL7", "ES8", "EC7"],
  "Rivian": ["R1T", "R1S"],
  "Vinfast": ["VF 8", "VF 9", "VF 6", "VF 7"],
  "XPENG": ["G6", "G9", "P7", "P5"],
};

export const getAllBrands = (): string[] => {
  return commonBrands;
};

/**
 * Get models by brand — merges known models with any additional models from the database
 */
export const getModelsByBrand = async (brand: string): Promise<string[]> => {
  if (!brand) return [];

  const knownModels = BRAND_MODELS[brand] || [];

  try {
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('model')
      .eq('brand', brand)
      .eq('status', 'approved');

    if (error || !data) return knownModels;

    const dbModels = [...new Set(data.map(item => item.model).filter(Boolean))] as string[];
    // Merge known + db, deduplicate, sort
    const merged = [...new Set([...knownModels, ...dbModels])];
    return merged.sort();
  } catch {
    return knownModels;
  }
};

export const getPriceRange = (): { min: number; max: number } => {
  return { min: 0, max: 1000000 };
};

export const getYearRange = (): { min: number; max: number } => {
  return { min: 1900, max: new Date().getFullYear() };
};

export const getMileageRange = (): { min: number; max: number } => {
  return { min: 0, max: 500000 };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatMileage = (km: number): string => {
  return new Intl.NumberFormat("fr-BE").format(km) + " km";
};

export const getCarByIdFromDb = async (id: string): Promise<Car | null> => {
  try {
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data || !data.id) return null;
    return mapListingToCar(data as VehicleListingRow);
  } catch {
    return null;
  }
};

export const getSellerContact = async (listingId: string): Promise<{
  contact_name: string;
  contact_phone: string | null;
  contact_email: string;
  user_id: string;
} | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_seller_contact', { listing_id: listingId });
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
};

export const getRelatedCarsFromList = (car: Car, allCars: Car[], limit: number = 4) => {
  return allCars
    .filter((c) => c.id !== car.id && (c.brand === car.brand || c.fuelType === car.fuelType))
    .slice(0, limit);
};
