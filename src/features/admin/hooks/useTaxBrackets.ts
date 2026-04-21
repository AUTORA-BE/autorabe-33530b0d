/**
 * Hook for managing Belgian tax brackets (TMC + annual tax + age reductions).
 * Public read for everyone, admin-only writes.
 * @module features/admin/hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Region = 'bruxelles' | 'wallonie' | 'flandre';

export interface TmcBracket {
  id: string;
  region: Region;
  cv_min: number;
  cv_max: number;
  base_amount: number;
  notes: string | null;
  updated_at: string;
}

export interface AnnualTaxBracket {
  id: string;
  region: Region;
  cv_min: number;
  cv_max: number;
  base_amount: number;
  diesel_surcharge_pct: number;
  lpg_surcharge_per_cv: number;
  electric_amount: number;
  notes: string | null;
  updated_at: string;
}

export interface AgeReduction {
  id: string;
  region: Region;
  age_min_years: number;
  age_max_years: number | null;
  coefficient: number;
}

const TAX_BRACKETS_KEY = ['belgian-tax-brackets'] as const;

export function useTaxBrackets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: TAX_BRACKETS_KEY,
    queryFn: async () => {
      const [tmc, annual, ages] = await Promise.all([
        supabase
          .from('belgian_tmc_brackets')
          .select('id, region, cv_min, cv_max, base_amount, notes, updated_at')
          .order('region')
          .order('cv_min'),
        supabase
          .from('belgian_annual_tax_brackets')
          .select('id, region, cv_min, cv_max, base_amount, diesel_surcharge_pct, lpg_surcharge_per_cv, electric_amount, notes, updated_at')
          .order('region')
          .order('cv_min'),
        supabase
          .from('belgian_tmc_age_reductions')
          .select('id, region, age_min_years, age_max_years, coefficient')
          .order('region')
          .order('age_min_years'),
      ]);

      if (tmc.error) throw tmc.error;
      if (annual.error) throw annual.error;
      if (ages.error) throw ages.error;

      return {
        tmc: (tmc.data ?? []) as TmcBracket[],
        annual: (annual.data ?? []) as AnnualTaxBracket[],
        ages: (ages.data ?? []) as AgeReduction[],
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const updateTmc = useMutation({
    mutationFn: async ({ id, base_amount }: { id: string; base_amount: number }) => {
      const { error } = await supabase
        .from('belgian_tmc_brackets')
        .update({ base_amount })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_BRACKETS_KEY });
      toast.success('Tranche TMC mise à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAnnual = useMutation({
    mutationFn: async (
      patch: { id: string } & Partial<Pick<AnnualTaxBracket, 'base_amount' | 'diesel_surcharge_pct' | 'lpg_surcharge_per_cv' | 'electric_amount'>>
    ) => {
      const { id, ...fields } = patch;
      const { error } = await supabase
        .from('belgian_annual_tax_brackets')
        .update(fields)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_BRACKETS_KEY });
      toast.success('Tranche taxe annuelle mise à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAgeReduction = useMutation({
    mutationFn: async ({ id, coefficient }: { id: string; coefficient: number }) => {
      const { error } = await supabase
        .from('belgian_tmc_age_reductions')
        .update({ coefficient })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_BRACKETS_KEY });
      toast.success('Coefficient de réduction mis à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateTmc,
    updateAnnual,
    updateAgeReduction,
  };
}

/** Pure helpers used by the calculator (consume DB rows, no fallback constants). */

export function computeFiscalCV(kw: number): number {
  if (kw <= 0) return 0;
  if (kw <= 70) return Math.max(1, Math.round(kw / 7.35));
  return Math.round(kw / 6.5);
}

export function findBracket<T extends { cv_min: number; cv_max: number; region: string }>(
  brackets: T[],
  region: Region,
  cv: number
): T | undefined {
  return brackets.find((b) => b.region === region && cv >= b.cv_min && cv <= b.cv_max);
}

export function findAgeCoefficient(ages: AgeReduction[], region: Region, vehicleAge: number): number {
  if (region === 'flandre') {
    // Flanders linear: -5% per year, floor 0
    return Math.max(0, 1 - vehicleAge * 0.05);
  }
  const match = ages.find(
    (a) => a.region === region && vehicleAge >= a.age_min_years && (a.age_max_years === null || vehicleAge < a.age_max_years)
  );
  return match?.coefficient ?? 1;
}

export function computeTmcFromDb(
  brackets: TmcBracket[],
  ages: AgeReduction[],
  region: Region,
  cv: number,
  vehicleAge: number
): number {
  const bracket = findBracket(brackets, region, cv);
  if (!bracket) return 0;
  let amount = Number(bracket.base_amount);
  // Over-17 surcharge: keep simple +500€/CV rule baked into the constant for now
  if (cv > 17) amount += (cv - 17) * 500;
  amount *= findAgeCoefficient(ages, region, vehicleAge);
  return Math.round(amount);
}

export function computeAnnualTaxFromDb(
  brackets: AnnualTaxBracket[],
  region: Region,
  cv: number,
  fuelType: string
): number {
  const bracket = findBracket(brackets, region, cv);
  if (!bracket) return 0;

  const fuel = fuelType.toLowerCase();
  const isElectric = fuel.includes('lectrique') || fuel.includes('electric');
  if (isElectric) return Math.round(Number(bracket.electric_amount));

  let amount = Number(bracket.base_amount);
  if (cv > 17) amount += (cv - 17) * 200;

  if (fuel.includes('diesel') && bracket.diesel_surcharge_pct > 0) {
    amount *= 1 + Number(bracket.diesel_surcharge_pct) / 100;
  }
  if (fuel.includes('gpl') || fuel.includes('lpg')) {
    amount += cv * Number(bracket.lpg_surcharge_per_cv);
  }
  return Math.round(amount);
}
