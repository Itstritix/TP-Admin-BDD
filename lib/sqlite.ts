import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "db", "db.sqlite");

export type SqliteDb = Database;

export function openSqliteDb(): SqliteDb {
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS enriched_products (
      id TEXT PRIMARY KEY,
      raw_product_id TEXT NOT NULL,
      enriched_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS enriched_value (
      enriched_products_id TEXT NOT NULL,
      products_name TEXT,
      categories TEXT,
      countries TEXT,
      eco_score TEXT,
      nutriscore TEXT,
      FOREIGN KEY (enriched_products_id) REFERENCES enriched_products(id)
    );
  `);

  return db;
}
