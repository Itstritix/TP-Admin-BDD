import { describe, it, expect } from 'vitest';
import { computeEcoScore } from '@/services/computeEcoScore';

describe('computeEcoScore', () => {
  it('devrait dégrader l’Eco-Score si le Nutri-Score est "e"', () => {
  const payload = { ecoscore_grade: 'a' }; // À la base, il est vert
  const result = computeEcoScore(payload as any, 'e'); // Mais il est mauvais pour la santé
  
  expect(result).toBe('b'); // Il perd une étoile
});
});