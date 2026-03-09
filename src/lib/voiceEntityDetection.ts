/**
 * Voice search entity detection utilities
 * Extracts structured data from voice transcripts for vehicle search
 * @module lib/voiceEntityDetection
 */

import { getAllBrands } from "@/utils/carUtils";
import { BUDGET_OPTIONS } from "@/features/search/types/search.types";

/** Types of entities that can be detected from voice input */
export type EntityType = 'brand' | 'budget' | 'mileage' | 'fuel' | 'transmission' | 'euroNorm';

/** A detected entity from voice transcript */
export interface DetectedEntity {
  /** Type of entity detected */
  type: EntityType;
  /** Display value for the entity */
  value: string;
}

/** Parsed search parameters from voice input */
export interface VoiceSearchParams {
  /** Detected car brand */
  brand?: string;
  /** Maximum budget in EUR */
  maxBudget?: number;
  /** Maximum mileage in km */
  maxMileage?: number;
  /** Fuel type filter value */
  fuelType?: string;
  /** Transmission filter value */
  transmission?: string;
  /** Euro emission norm */
  euroNorm?: string;
  /** Remaining text after removing detected entities (potential model) */
  remainingText: string;
}

/** Keyword mapping for fuel type detection */
const FUEL_KEYWORDS: { keywords: string[]; label: string; value: string }[] = [
  { keywords: ['électrique', 'electrique', 'electric', 'elektrisch'], label: 'Électrique', value: 'electrique' },
  { keywords: ['hybride', 'hybrid'], label: 'Hybride', value: 'hybride' },
  { keywords: ['diesel'], label: 'Diesel', value: 'diesel' },
  { keywords: ['essence', 'benzine', 'gasoline', 'petrol'], label: 'Essence', value: 'essence' },
];

/** Keyword mapping for transmission detection */
const TRANSMISSION_KEYWORDS: { keywords: string[]; label: string; value: string }[] = [
  { keywords: ['automatique', 'automatic', 'automatisch'], label: 'Automatique', value: 'automatique' },
  { keywords: ['manuelle', 'manuel', 'manual', 'manueel'], label: 'Manuelle', value: 'manuelle' },
];

/** Euro norm detection pattern */
const EURO_NORM_PATTERN = /euro\s*(6d|6|5|4|3|2|1)/i;

/** Words to strip when extracting potential model name */
const NOISE_WORDS = /(moins de|budget|euros|€|prix|maximum|max|kilomètres|kilometers|essence|diesel|électrique|electrique|hybride|automatique|manuelle|manuel|boîte|auto)/gi;

/**
 * Detects entities from a voice transcript for display purposes
 * @param transcript - Raw voice transcript text
 * @param brands - Optional array of brand names (defaults to getAllBrands())
 * @returns Array of detected entities with display values
 */
export function detectEntities(transcript: string, brands?: string[]): DetectedEntity[] {
  if (!transcript) return [];
  
  const lower = transcript.toLowerCase();
  const entities: DetectedEntity[] = [];
  const brandList = brands ?? getAllBrands();

  // Brand detection
  const foundBrand = brandList.find(b => lower.includes(b.toLowerCase()));
  if (foundBrand) {
    entities.push({ type: 'brand', value: foundBrand });
  }

  // Budget detection
  const budgetMatch = lower.match(/(\d+[\s.]?\d*)\s*(euro|€)/i);
  if (budgetMatch) {
    let budget = parseInt(budgetMatch[1].replace(/\D/g, ''));
    if (budget < 1000 && budget > 0) budget *= 1000;
    const option = BUDGET_OPTIONS.find(o => o.value >= budget);
    if (option) {
      entities.push({ type: 'budget', value: option.label });
    }
  }

  // Mileage detection
  const kmMatch = lower.match(/(\d+[\s.]?\d*)\s*(km|kilomètre|kilometer|kilo)/i);
  if (kmMatch) {
    let km = parseInt(kmMatch[1].replace(/\D/g, ''));
    if (km < 1000 && km > 0) km *= 1000;
    entities.push({ type: 'mileage', value: `${km.toLocaleString('fr-BE')} km` });
  }

  // Fuel type detection
  for (const fuel of FUEL_KEYWORDS) {
    if (fuel.keywords.some(k => lower.includes(k))) {
      entities.push({ type: 'fuel', value: fuel.label });
      break;
    }
  }

  // Transmission detection
  for (const trans of TRANSMISSION_KEYWORDS) {
    if (trans.keywords.some(k => lower.includes(k))) {
      entities.push({ type: 'transmission', value: trans.label });
      break;
    }
  }

  // Euro norm detection
  const euroMatch = lower.match(EURO_NORM_PATTERN);
  if (euroMatch) {
    entities.push({ type: 'euroNorm', value: `Euro ${euroMatch[1].toUpperCase()}` });
  }

  return entities;
}

/**
 * Parses a voice transcript into structured search parameters
 * @param transcript - Raw voice transcript text
 * @param brands - Optional array of brand names (defaults to getAllBrands())
 * @returns Structured search parameters for filter application
 */
export function parseVoiceTranscript(transcript: string, brands?: string[]): VoiceSearchParams {
  const lower = transcript.toLowerCase();
  const brandList = brands ?? getAllBrands();
  const result: VoiceSearchParams = { remainingText: '' };

  // Brand detection
  const foundBrand = brandList.find(b => lower.includes(b.toLowerCase()));
  if (foundBrand) {
    result.brand = foundBrand;
  }

  // Budget detection
  const budgetMatch = lower.match(/(\d+[\s.]?\d*)\s*(euro|€|mille)/i);
  if (budgetMatch) {
    let budget = parseInt(budgetMatch[1].replace(/\D/g, ''));
    if (lower.includes("mille")) budget *= 1000;
    else if (budget < 1000 && budget > 0) budget *= 1000;
    
    const option = BUDGET_OPTIONS.find(o => o.value >= budget);
    result.maxBudget = option?.value ?? 1000000;
  }

  // Mileage detection
  const kmMatch = lower.match(/(\d+[\s.]?\d*)\s*(km|kilomètre|kilometer|kilo)/i);
  if (kmMatch) {
    let km = parseInt(kmMatch[1].replace(/\D/g, ''));
    if (km < 1000 && km > 0) km *= 1000;
    result.maxMileage = km;
  }

  // Fuel type detection
  for (const fuel of FUEL_KEYWORDS) {
    if (fuel.keywords.some(k => lower.includes(k))) {
      result.fuelType = fuel.value;
      break;
    }
  }

  // Transmission detection
  for (const trans of TRANSMISSION_KEYWORDS) {
    if (trans.keywords.some(k => lower.includes(k))) {
      result.transmission = trans.value;
      break;
    }
  }

  // Euro norm detection
  const euroMatch = lower.match(EURO_NORM_PATTERN);
  if (euroMatch) {
    result.euroNorm = euroMatch[1].toUpperCase();
  }

  // Extract remaining text (potential model name)
  result.remainingText = transcript
    .replace(new RegExp(foundBrand ?? '', 'ig'), '')
    .replace(new RegExp(budgetMatch?.[0] ?? '', 'ig'), '')
    .replace(new RegExp(kmMatch?.[0] ?? '', 'ig'), '')
    .replace(new RegExp(euroMatch?.[0] ?? '', 'ig'), '')
    .replace(NOISE_WORDS, '')
    .trim();

  return result;
}
