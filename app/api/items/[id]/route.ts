import { NextRequest, NextResponse } from "next/server";
import { openSqliteDb } from "@/lib/sqlite";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Type mis à jour en Promise
) {
  const db = openSqliteDb();
  
  // Correction : On attend la résolution des params
  const { id } = await params;

  try {
    const item = db.prepare(`
      SELECT 
        p.id, 
        v.code, 
        v.products_name, 
        v.image_url,
        c.category as categories, 
        n.nutriscore, 
        e.ecoscore,
        v.countries,
        p.enriched_at
      FROM enriched_products p
      JOIN enriched_value v ON p.id = v.enriched_products_id
      LEFT JOIN categories c ON v.categories_id = c.id
      LEFT JOIN nutriscore n ON v.nutriscore_id = n.id
      LEFT JOIN ecoscore e ON v.ecoscore_id = e.id
      WHERE p.id = ?
    `).get(id);

    if (!item) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Erreur API Item ID:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  } finally {
    db.close();
  }
}