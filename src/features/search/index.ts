/**
 * Search feature barrel export
 * Re-exports all public APIs from the search feature
 * @module features/search
 */

// Components
export { FilterPanel, HeroSearch, BrandCarousel } from './components';
export type { FilterPanelProps, HeroSearchProps, BrandCarouselProps } from './components';

// Hooks
export { useCarFilters } from './hooks';

// Types
export type { BudgetOption, BelgianProvince, BrandConfig, QuickSearchParams } from './types/search.types';
export { BUDGET_OPTIONS, EURO_NORMS, BELGIAN_PROVINCES } from './types/search.types';
