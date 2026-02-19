import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import { enrichDb } from "@/services/enrichDb";

export const runtime = "nodejs";

/**
 * GET : transfère tous les produits enrichis depuis MongoDB vers SQLite.
 * Crée les enregistrements dans les tables enriched_products et enriched_value.
 */
export async function GET(request: Request) {
  await connectMongo();

  try {
    const result = await enrichDb();

    return NextResponse.json({
      status: "success",
      totalProcessed: result.totalProcessed,
      totalInserted: result.totalInserted,
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
