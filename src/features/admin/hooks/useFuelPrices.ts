/**
 * Hook to manage fuel prices from database
 * @module features/admin/hooks
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FuelPrices {
  id: string;
  diesel: number;
  essence95: number;
  essence98: number;
  electric_home: number;
  electric_public: number;
  updated_at: string;
}

export function useFuelPrices() {
  const [prices, setPrices] = useState<FuelPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchPrices = async () => {
    const { data, error } = await supabase
      .from('fuel_prices')
      .select('*')
      .limit(1)
      .single();

    if (!error && data) {
      setPrices(data as unknown as FuelPrices);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const updatePrices = async (updated: Partial<Omit<FuelPrices, 'id' | 'updated_at'>>) => {
    if (!prices) return;
    setSaving(true);
    const { error } = await supabase
      .from('fuel_prices')
      .update({ ...updated, updated_at: new Date().toISOString() })
      .eq('id', prices.id);

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour les prix', variant: 'destructive' });
    } else {
      toast({ title: 'Prix mis à jour', description: 'Les nouveaux prix sont maintenant affichés sur le site' });
      await fetchPrices();
    }
    setSaving(false);
  };

  return { prices, loading, saving, updatePrices };
}
