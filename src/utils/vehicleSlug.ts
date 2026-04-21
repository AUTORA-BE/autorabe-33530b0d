/**
 * SEO slug helpers for vehicle detail URLs.
 * Format: brand-model-year-location-{uuid}
 * The UUID is always the last 36-char segment, allowing safe extraction.
 */

const UUID_RE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export interface VehicleSlugInput {
  id: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  location?: string | null;
}

/**
 * Build an SEO-friendly slug for a vehicle.
 * Falls back to plain UUID if no metadata.
 */
export const buildVehicleSlug = (v: VehicleSlugInput): string => {
  const parts = [v.brand, v.model, v.year?.toString(), v.location]
    .filter(Boolean)
    .map((p) => slugify(String(p)))
    .filter((p) => p.length > 0);
  return parts.length ? `${parts.join("-")}-${v.id}` : v.id;
};

/**
 * Extract the UUID from a slug (or return as-is if it's already a UUID).
 * Returns null if no UUID can be found.
 */
export const extractIdFromSlug = (slugOrId: string): string | null => {
  const match = slugOrId.match(UUID_RE);
  return match ? match[1] : null;
};
