import { NextRequest, NextResponse } from "next/server";
import { openSqliteDb } from "@/lib/sqlite";

export async function GET(request: NextRequest) {
  const db = openSqliteDb();
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const nutriscoreFilter = searchParams.get("nutriscore");
    const search = searchParams.get("search"); // Pour nom ou code

    let whereClauses = [];
    let params = [];

    if (nutriscoreFilter) {
      whereClauses.push("n.nutriscore = ?");
      params.push(nutriscoreFilter.toLowerCase());
    }
    if (search) {
      whereClauses.push("(v.products_name LIKE ? OR v.code LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const items = db.prepare(`
      SELECT p.id, v.code, p.enriched_at, v.products_name, v.countries, v.image_url,
             c.category as categories, n.nutriscore, e.ecoscore
      FROM enriched_products p
      JOIN enriched_value v ON p.id = v.enriched_products_id
      LEFT JOIN categories c ON v.categories_id = c.id
      LEFT JOIN nutriscore n ON v.nutriscore_id = n.id
      LEFT JOIN ecoscore e ON v.ecoscore_id = e.id
      ${whereSql}
      ORDER BY p.enriched_at DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = (db.prepare(`
      SELECT COUNT(*) as count FROM enriched_products p 
      JOIN enriched_value v ON p.id = v.enriched_products_id
      LEFT JOIN nutriscore n ON v.nutriscore_id = n.id
      ${whereSql}
    `).get(...params) as any).count;

    return NextResponse.json({ items, total, page, pageSize });
  } finally {
    db.close();
  }
}