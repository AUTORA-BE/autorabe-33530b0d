/**
 * Search feature type definitions
 * @module features/search/types
 */

/**
 * Budget option for price range selection
 */
export interface BudgetOption {
  /** Display label */
  label: string;
  /** Maximum price value */
  value: number;
}

/**
 * Available budget presets
 */
export const BUDGET_OPTIONS: BudgetOption[] = [
  { label: "< 15 000€", value: 15000 },
  { label: "15 000€ - 25 000€", value: 25000 },
  { label: "25 000€ - 40 000€", value: 40000 },
  { label: "40 000€ - 60 000€", value: 60000 },
  { label: "60 000€ - 100 000€", value: 100000 },
  { label: "> 100 000€", value: 1000000 },
];

/**
 * Euro emission norms available for filtering
 */
export const EURO_NORMS = ["Euro 1", "Euro 2", "Euro 3", "Euro 4", "Euro 5", "Euro 6", "Euro 6d"] as const;

/**
 * Belgian provinces for location filtering
 */
export interface BelgianProvince {
  id: string;
  label: string;
}

export const BELGIAN_PROVINCES: BelgianProvince[] = [
  { id: "", label: "Toutes les provinces" },
  { id: "bruxelles", label: "Bruxelles" },
  { id: "anvers", label: "Anvers (Flandres)" },
  { id: "brabant-flamand", label: "Brabant Flamand (Flandres)" },
  { id: "brabant-wallon", label: "Brabant Wallon" },
  { id: "flandre-occidentale", label: "Flandre Occidentale" },
  { id: "flandre-orientale", label: "Flandre Orientale" },
  { id: "hainaut", label: "Hainaut" },
  { id: "liege", label: "Liège" },
  { id: "limbourg", label: "Limbourg (Flandres)" },
  { id: "luxembourg", label: "Luxembourg" },
  { id: "namur", label: "Namur" },
];

/**
 * Brand configuration with logo and color
 */
export interface BrandConfig {
  name: string;
  logo: string;
  color: string;
}

/**
 * Quick search parameters from hero section
 */
export interface QuickSearchParams {
  brand: string;
  model: string;
  maxPrice: number;
}
