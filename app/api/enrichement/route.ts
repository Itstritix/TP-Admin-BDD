import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import { runFullEnrichmentFromDb } from "@/services/enrichment";

/**
 * GET : enrichit toute la base MongoDB.
 * Parcourt tous les RawProduct par lots, enrichit ceux qui ne le sont pas encore
 * et enregistre les résultats dans EnrichedProduct.
 * Query: batchSize (optionnel, défaut 100) — taille de chaque lot.
 */
export async function GET(request: Request) {
  await connectMongo();

  const { searchParams } = new URL(request.url);
  const batchSize = Number(searchParams.get("batchSize") ?? 100);

  try {
    const result = await runFullEnrichmentFromDb({
      batchSize: batchSize > 0 ? batchSize : 100,
    });

    return NextResponse.json({
      status: "success",
      totalRawProcessed: result.totalRawProcessed,
      totalEnrichedInserted: result.totalEnrichedInserted,
      batches: result.batches,
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
