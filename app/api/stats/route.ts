import { NextResponse } from "next/server";
import { openSqliteDb } from "@/lib/sqlite";

export const runtime = "nodejs";

export async function GET() {
  const db = openSqliteDb();

  try {
    const totalItems = db
      .prepare(`SELECT COUNT(*) as count FROM enriched_products`)
      .get() as { count: number };

    const byNutriscore = db
      .prepare(
        `
        SELECT nutriscore, COUNT(*) as count
        FROM enriched_value
        GROUP BY nutriscore
      `
      )
      .all();

    const byEcoScore = db
      .prepare(
        `
        SELECT eco_score, COUNT(*) as count
        FROM enriched_value
        GROUP BY eco_score
      `
      )
      .all();

    return NextResponse.json({
      totalItems: totalItems.count,
      byNutriscore,
      byEcoScore,
    });
  } finally {
    db.close();
  }
}
