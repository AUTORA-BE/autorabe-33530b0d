/**
 * Hook qui produit des URLs localisées en fonction de la langue active.
 *
 * Exemples (langue = "nl") :
 *   useLocalizedHref()("/sell")                 -> "/nl/verkopen"
 *   useLocalizedHref()("/car/uuid-...")         -> "/nl/auto/uuid-..."
 *   localizedVehicleHref(vehicle)               -> "/nl/auto/bmw-serie-3-2020-bruxelles-uuid"
 *
 * Les URLs retournées respectent les SLUG_MAP de src/lib/routes.ts. Les segments
 * non listés (ex: ids, slugs SEO) passent à travers sans transformation.
 */
import { useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedPath } from "@/lib/routes";
import { buildVehicleSlug, type VehicleSlugInput } from "@/utils/vehicleSlug";

/** Hook principal : retourne une fonction (path) => path localisé. */
export const useLocalizedHref = () => {
  const { language } = useLanguage();
  return useCallback((path: string) => localizedPath(path, language), [language]);
};

/**
 * Hook spécialisé pour les liens de fiche véhicule : construit l'URL localisée
 * avec un slug SEO (marque-modèle-année-ville-uuid) au lieu du seul UUID.
 */
export const useLocalizedVehicleHref = () => {
  const { language } = useLanguage();
  return useCallback(
    (vehicle: VehicleSlugInput) =>
      localizedPath(`/car/${buildVehicleSlug(vehicle)}`, language),
    [language],
  );
};
