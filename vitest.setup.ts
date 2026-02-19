import { vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openSqliteDb } from './lib/sqlite';

// On mock le module sqlite pour que les tests utilisent une base en mémoire
// Cela évite de polluer ton fichier products.db réel pendant les tests
vi.mock('./lib/sqlite', () => {
  // Création d'une instance unique en mémoire pour la session de test
  const db = new Database(':memory:');

  return {
    openSqliteDb: vi.fn(() => {
      // On s'assure que les tables sont créées avec les bonnes colonnes à chaque appel
      db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          category TEXT UNIQUE
        );
        
        CREATE TABLE IF NOT EXISTS nutriscore (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          nutriscore TEXT UNIQUE
        );
        
        CREATE TABLE IF NOT EXISTS ecoscore (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          ecoscore TEXT UNIQUE
        );

        CREATE TABLE IF NOT EXISTS enriched_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          raw_product_id INTEGER,
          enriched_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS enriched_value (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          enriched_products_id INTEGER UNIQUE,
          products_name TEXT,
          code TEXT,       -- Ajouté pour correspondre à ton service
          image_url TEXT,  -- Ajouté pour correspondre à ton service
          countries TEXT,
          categories_id INTEGER,
          nutriscore_id INTEGER,
          ecoscore_id INTEGER,
          FOREIGN KEY (enriched_products_id) REFERENCES enriched_products(id),
          FOREIGN KEY (categories_id) REFERENCES categories(id),
          FOREIGN KEY (nutriscore_id) REFERENCES nutriscore(id),
          FOREIGN KEY (ecoscore_id) REFERENCES ecoscore(id)
        );
      `);
      return db;
    }),
  };
});

// Optionnel : Nettoyer les tables entre chaque test pour éviter les collisions d'IDs
beforeEach(() => {
  const db = openSqliteDb();
  db.exec("DELETE FROM enriched_value");
  db.exec("DELETE FROM enriched_products");
  db.exec("DELETE FROM categories");
  db.exec("DELETE FROM nutriscore");
  db.exec("DELETE FROM ecoscore");
});