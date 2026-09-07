import { describe, it, expect } from 'vitest';
import { applyFilters } from './vehicleQueries';
import { defaultVehicleFilters, type VehicleFilters } from '../types/vehicle.types';

/** Requête factice qui enregistre les appels gte/lte reçus. */
function makeQuery() {
  const calls: { op: string; col: string; val: unknown }[] = [];
  const q: any = {
    calls,
    gte: (col: string, val: unknown) => (calls.push({ op: 'gte', col, val }), q),
    lte: (col: string, val: unknown) => (calls.push({ op: 'lte', col, val }), q),
    eq: () => q,
    ilike: () => q,
    or: () => q,
    contains: () => q,
  };
  return q;
}

function run(overrides: Partial<VehicleFilters>) {
  const q = makeQuery();
  applyFilters(q, { ...defaultVehicleFilters, ...overrides });
  return q.calls as { op: string; col: string; val: unknown }[];
}

describe('applyFilters — bornes numériques', () => {
  it('applique gte sur year quand yearMin = 2005', () => {
    expect(run({ yearMin: 2005 })).toContainEqual({ op: 'gte', col: 'year', val: 2005 });
  });

  it("n'applique rien sur year au défaut", () => {
    expect(run({}).filter((c) => c.col === 'year')).toHaveLength(0);
  });

  it('applique lte sur price quand maxPrice = 250000', () => {
    expect(run({ maxPrice: 250000 })).toContainEqual({ op: 'lte', col: 'price', val: 250000 });
  });

  it("n'applique rien sur price au défaut", () => {
    expect(run({}).filter((c) => c.col === 'price')).toHaveLength(0);
  });

  it('applique lte sur mileage quand kmMax = 200000', () => {
    expect(run({ kmMax: 200000 })).toContainEqual({ op: 'lte', col: 'mileage', val: 200000 });
  });

  it("n'applique rien sur mileage au défaut", () => {
    expect(run({}).filter((c) => c.col === 'mileage')).toHaveLength(0);
  });
});
