/**
 * Hook for fetching car listings
 * Provides real-time updates from Supabase
 * @module features/listings/hooks/useCarListings
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapListingToVehicle } from '../api/vehicleQueries';
import type { Car, VehicleListingRow } from '../types/vehicle.types';

/**
 * Map database listing to Car type
 * @param listing - Raw database row
 * @returns Mapped Car object
 */
const mapListingToCar = (listing: VehicleListingRow): Car => {
  return mapListingToVehicle(listing);
};

/**
 * Hook to fetch and subscribe to car listings
 * @returns Object containing cars array, loading state, and error
 */
export function useCarListings() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        
        // Use the secure public view that excludes sensitive data
        const { data, error: fetchError } = await supabase
          .from('car_listings_public')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching listings:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (data) {
          const mappedCars = data.map(mapListingToCar);
          setCars(mappedCars);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Erreur lors du chargement des annonces');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('car-listings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'car_listings'
        },
        () => {
          // Refetch on any change
          fetchListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    cars,
    isLoading,
    error,
    hasDbCars: cars.length > 0,
  };
}
