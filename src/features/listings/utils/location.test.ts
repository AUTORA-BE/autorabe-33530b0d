import { describe, it, expect } from 'vitest';
import {
  normalizeLocation,
  isPostalCodeOnly,
  formatLocation,
  buildProvinceLocationFilter,
  PROVINCE_CITIES,
  PROVINCE_POSTAL_PREFIXES,
} from './location';

describe('normalizeLocation', () => {
  it('retire les espaces de bord', () => {
    expect(normalizeLocation('Namur ')).toBe('Namur');
  });
  it('compacte les espaces internes', () => {
    expect(normalizeLocation('  La   Louvière ')).toBe('La Louvière');
  });
  it('gère null/undefined', () => {
    expect(normalizeLocation(null)).toBe('');
    expect(normalizeLocation(undefined)).toBe('');
  });
});

describe('formatLocation', () => {
  it('préfixe un code postal nu pour qu’il ne se lise pas comme un prix', () => {
    expect(formatLocation('5100')).toBe('CP 5100');
  });
  it('laisse un nom de commune intact (trimé)', () => {
    expect(formatLocation('Namur ')).toBe('Namur');
  });
  it('ne préfixe pas "5100 Jambes"', () => {
    expect(formatLocation('5100 Jambes')).toBe('5100 Jambes');
  });
  it('retourne une chaîne vide si absent', () => {
    expect(formatLocation(null)).toBe('');
  });
  it('isPostalCodeOnly ne matche que 4 chiffres', () => {
    expect(isPostalCodeOnly('5000')).toBe(true);
    expect(isPostalCodeOnly('500')).toBe(false);
    expect(isPostalCodeOnly('Namur')).toBe(false);
  });
});

describe('buildProvinceLocationFilter — tolérance aux codes postaux', () => {
  it('couvre 5000 et 5100 pour Namur', () => {
    const f = buildProvinceLocationFilter('namur');
    expect(f).toContain('location.ilike.%namur%');
    expect(f).toContain('location.like.5___*');
  });

  it('ajoute les préfixes postaux du Hainaut (6xxx et 7xxx)', () => {
    const f = buildProvinceLocationFilter('hainaut');
    expect(f).toContain('location.like.60__*');
    expect(f).toContain('location.like.70__*');
  });

  it('reste sur les communes pour une province inconnue', () => {
    expect(buildProvinceLocationFilter('atlantide')).toBe('location.ilike.%atlantide%');
  });

  it('chaque province a des communes ET des préfixes postaux', () => {
    for (const id of Object.keys(PROVINCE_CITIES)) {
      expect(PROVINCE_POSTAL_PREFIXES[id]?.length, id).toBeGreaterThan(0);
    }
  });

  it('les préfixes postaux ne se chevauchent pas entre provinces', () => {
    const seen = new Map<string, string>();
    for (const [id, prefixes] of Object.entries(PROVINCE_POSTAL_PREFIXES)) {
      for (const p of prefixes) {
        for (const [other, ownerId] of seen) {
          if (other.startsWith(p) || p.startsWith(other)) {
            expect.fail(`Chevauchement ${p} (${id}) / ${other} (${ownerId})`);
          }
        }
        seen.set(p, id);
      }
    }
  });
});
