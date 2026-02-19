import { OpenFoodFactsProduct } from "@/types/openFoodFacts";
import { computeEcoScore } from "@/services/computeEcoScore";
import { computeCustomNutriscore } from "@/services/computeCustomNutriscore";
import type { Types } from "mongoose";
import RawProduct from "@/models/rawProducts";
import EnrichedProduct from "@/models/EnrichedProducts";

export type EnrichedValue = {
  product_name: string;
  categories: string;
  countries: string;
  eco_score: string;
  nutriscore: string;
  code: string;
  image_url: string;
};

export type EnrichedRecord = {
  raw_product_id: Types.ObjectId;
  status: boolean;
  enriched_at: Date;
  enriched_value: EnrichedValue;
};

export type RawProductDoc = {
  _id: Types.ObjectId;
  payload: OpenFoodFactsProduct;
};

export type RunEnrichmentResult = {
  rawFound: number;
  enrichedInserted: number;
};

export type RunFullEnrichmentResult = {
  totalRawProcessed: number;
  totalEnrichedInserted: number;
  batches: number;
};

/**
 * Enrichit un produit brut : récupère nom, catégorie, pays depuis le payload,
 * récupère l'EcoScore et calcule le Nutri-Score personnalisé, et retourne un
 * enregistrement conforme au modèle EnrichedProducts (enriched_value = objet nommé).
 */
export function enrichProduct(raw: RawProductDoc): EnrichedRecord {
  const payload = raw.payload;

  const name = payload.product_name ?? "";
  const category = payload.categories ?? "";
  const countries = payload.countries ?? "";
  const code = payload.code ?? "";
  const image_url = payload.image_url ?? "";

  // 1. Calculer le Nutri-Score en premier
  const customNutriscore = computeCustomNutriscore(payload);

  // 2. Calculer l'Eco-Score en lui passant le Nutri-Score
  const ecoScore = computeEcoScore(payload, customNutriscore);

  const enriched_value: EnrichedValue = {
    product_name: name,
    categories: category,
    countries,
    eco_score: ecoScore,
    nutriscore: customNutriscore,
    code: code,
    image_url: image_url
  };

  return {
    raw_product_id: raw._id,
    status: true,
    enriched_at: new Date(),
    enriched_value,
  };
}

/**
 * Récupère les produits bruts depuis MongoDB (RawProduct), les enrichit et enregistre
 * les résultats dans la collection EnrichedProduct.
 * Ne ré-enrichit pas les raw_product_id déjà présents en base.
 * Utilise les modèles définis dans models/rawProducts et models/EnrichedProducts.
 */
export async function runEnrichmentFromDb(options: {
  page: number;
  limit: number;
}): Promise<RunEnrichmentResult> {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const rawProducts = await RawProduct.find().skip(skip).limit(limit).lean();

  const existingIds = await EnrichedProduct.distinct("raw_product_id", {
    raw_product_id: { $in: rawProducts.map((p) => p._id) },
  });
  const existingSet = new Set(existingIds.map((id) => id.toString()));

  let inserted = 0;
  for (const raw of rawProducts) {
    if (existingSet.has(raw._id.toString())) continue;

    const enriched = enrichProduct({
      _id: raw._id,
      payload: raw.payload,
    });
    await EnrichedProduct.create(enriched);
    inserted++;
  }

  return {
    rawFound: rawProducts.length,
    enrichedInserted: inserted,
  };
}

const DEFAULT_BATCH_SIZE = 100;

/**
 * Enrichit toute la base : parcourt tous les RawProduct par lots,
 * enrichit ceux qui ne le sont pas encore et les enregistre dans EnrichedProduct.
 * Option batchSize pour limiter la taille de chaque lot (défaut 100).
 */
export async function runFullEnrichmentFromDb(options?: {
  batchSize?: number;
}): Promise<RunFullEnrichmentResult> {
  const limit = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  let page = 1;
  let totalRawProcessed = 0;
  let totalEnrichedInserted = 0;
  let batches = 0;

  let hasMore = true;
  while (hasMore) {
    const result = await runEnrichmentFromDb({ page, limit });
    batches++;
    totalRawProcessed += result.rawFound;
    totalEnrichedInserted += result.enrichedInserted;

    if (result.rawFound === 0 || result.rawFound < limit) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return {
    totalRawProcessed,
    totalEnrichedInserted,
    batches,
  };
}
