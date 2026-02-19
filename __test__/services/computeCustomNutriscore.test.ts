import { describe, it, expect } from 'vitest';
import { computeCustomNutriscore } from '@/services/computeCustomNutriscore';

describe('computeCustomNutriscore', () => {
  it('devrait retourner "a" pour un produit très sain (pomme)', () => {
    const apple = {
      nutriments: {
        "energy-kcal_100g": 52,
        "sugars_100g": 10,
        "fiber_100g": 2.4,
        "proteins_100g": 0.3,
        "fruits-vegetables-legumes-estimate-from-ingredients_100g": 100
      }
    } as any;
    expect(computeCustomNutriscore(apple)).toBe('a');
  });

  it('devrait retourner "e" pour un produit ultra-transformé gras et sucré', () => {
    const junkFood = {
      nutriments: {
        "energy-kcal_100g": 600,
        "saturated-fat_100g": 25,
        "sugars_100g": 50,
        "salt_100g": 3,
        "nova-group": 4
      }
    } as any;
    expect(computeCustomNutriscore(junkFood)).toBe('e');
  });

  it('devrait utiliser nutriscore_grade si aucune donnée nutritionnelle n’est présente', () => {
    const emptyProduct = {
      nutriscore_grade: 'c',
      nutriments: {}
    } as any;
    expect(computeCustomNutriscore(emptyProduct)).toBe('c');
  });
});