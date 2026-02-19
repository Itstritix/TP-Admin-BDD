import { describe, it, expect } from 'vitest';
import { enrichProduct } from '@/services/enrichment';
import { Types } from 'mongoose';

describe('enrichProduct', () => {
  it('devrait transformer correctement un RawProduct en EnrichedRecord', () => {
    const mockId = new Types.ObjectId();
    const rawDoc = {
      _id: mockId,
      payload: {
        product_name: "Test Product",
        categories: "Snacks",
        countries: "France",
        ecoscore_grade: "b",
        nutriments: { "energy-kcal_100g": 100 }
      }
    };

    const result = enrichProduct(rawDoc as any);

    expect(result.raw_product_id).toBe(mockId);
    expect(result.enriched_value.product_name).toBe("Test Product");
    expect(result.enriched_value.eco_score).toBe("b");
    expect(result.status).toBe(true);
    expect(result.enriched_at).toBeInstanceOf(Date);
  });
});