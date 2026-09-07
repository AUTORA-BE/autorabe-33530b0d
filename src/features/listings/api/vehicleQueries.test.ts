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
    or: (val: unknown) => (calls.push({ op: 'or', col: '_or', val }), q),
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

describe('applyFilters — filtre par province', () => {
  const orValue = (province: string) =>
    String(run({ province }).find((c) => c.op === 'or')?.val ?? '');

  it('accepte les codes postaux en plus des communes (Namur → 5000/5100)', () => {
    const f = orValue('namur');
    expect(f).toContain('location.ilike.%namur%');
    expect(f).toContain('location.like.5___*');
  });

  it('accepte les deux blocs postaux du Hainaut', () => {
    const f = orValue('hainaut');
    expect(f).toContain('location.like.60__*');
    expect(f).toContain('location.like.70__*');
  });

  it("n'applique aucun or() sans province", () => {
    expect(run({}).filter((c) => c.op === 'or')).toHaveLength(0);
  });
});
