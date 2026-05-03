import { useState, useEffect } from "react";
import { trackEvent, EVENTS } from "@/lib/analytics";

const FAVORITES_KEY = "autora_favorites";

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (carId: string) => {
    setFavorites((prev) => {
      const isAdding = !prev.includes(carId);
      if (isAdding) {
        trackEvent(EVENTS.FAVORITE_ADDED, { car_id: carId });
      }
      return isAdding ? [...prev, carId] : prev.filter((id) => id !== carId);
    });
  };

  const isFavorite = (carId: string) => favorites.includes(carId);

  const clearFavorites = () => setFavorites([]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: favorites.length,
  };
};
