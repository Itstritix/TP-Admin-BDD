import EnrichedProduct from "@/models/EnrichedProducts";
import { openSqliteDb } from "@/lib/sqlite";

/**
 * Mapping des catégories vers les IDs 1 à 10
 */
const mapCategoryToId = (tags: string): number => {
  if (!tags) return 8;
  const t = tags.toLowerCase();
  if (t.includes('beverage') || t.includes('boisson') || t.includes('eau') || t.includes('water') || t.includes('café')) return 1;
  if (t.includes('dairies') || t.includes('laitier') || t.includes('cheese') || t.includes('fromage') || t.includes('yaourt')) return 2;
  if (t.includes('biscuits') || t.includes('chocolat') || t.includes('snack sucré') || t.includes('confiserie')) return 3;
  if (t.includes('chips') || t.includes('salé') || t.includes('snack salé') || t.includes('aperitivo')) return 4;
  if (t.includes('tartiner') || t.includes('spread') || t.includes('confiture') || t.includes('margarine')) return 5;
  if (t.includes('bread') || t.includes('pain') || t.includes('brioche') || t.includes('viennoiserie')) return 6;
  if (t.includes('cereals') || t.includes('céréales') || t.includes('muesli') || t.includes('avoine')) return 7;
  if (t.includes('sauce') || t.includes('condiment') || t.includes('sel') || t.includes('vinaigre') || t.includes('ketchup')) return 8;
  if (t.includes('plant-based') || t.includes('végétal') || t.includes('tofu')) return 9;
  if (t.includes('fish') || t.includes('poisson') || t.includes('maquereau') || t.includes('sardine') || t.includes('mer')) return 10;
  return 8; 
};

/**
 * Convertit un score (a-e) en ID numérique (1-5)
 */
const scoreToId = (score: string | null): number | null => {
  if (!score) return null;
  const s = score.toLowerCase().trim();
  const map: Record<string, number> = { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5 };
  return map[s] || null;
};

/**
 * Service d'enrichissement SQLite
 */
export const enrichDb = async (data?: any[]) => {
  const db = openSqliteDb();
  db.pragma('foreign_keys = ON'); 

  let totalInserted = 0;

  try {
    const productsToProcess = data || await EnrichedProduct.find().lean().exec();

    if (!productsToProcess || !Array.isArray(productsToProcess)) {
      return { totalProcessed: 0, totalInserted: 0 };
    }

    // 1. Initialisation des tables de référence (Catégories et Scores)
    db.transaction(() => {
      // Catégories (1-10)
      const categories = [
        'Boissons', 'Produits laitiers', 'Snacks sucrés', 'Snacks salés', 
        'Produits à tartiner', 'Boulangerie', 'Céréales', 'Épicerie & Sauces', 
        'Alternatives végétales', 'Produits de la mer'
      ];
      categories.forEach((name, i) => {
        db.prepare(`INSERT OR IGNORE INTO categories (id, category) VALUES (?, ?)`).run(i + 1, name);
      });

      // Nutriscore & Ecoscore (1-5)
      ['a', 'b', 'c', 'd', 'e'].forEach((letter, i) => {
        db.prepare(`INSERT OR IGNORE INTO nutriscore (id, nutriscore) VALUES (?, ?)`).run(i + 1, letter);
        db.prepare(`INSERT OR IGNORE INTO ecoscore (id, ecoscore) VALUES (?, ?)`).run(i + 1, letter);
      });
    })();

    // 2. Préparation des requêtes
    const insertProductStmt = db.prepare(`
      INSERT INTO enriched_products (id, raw_product_id, enriched_at) 
      VALUES (?, ?, ?)
    `);

    const insertValueStmt = db.prepare(`
      INSERT INTO enriched_value (
        enriched_products_id, products_name, categories_id, countries, 
        ecoscore_id, nutriscore_id, image_url, code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 3. Exécution de la transaction principale
    const runTransaction = db.transaction((items: any[]) => {
      // Optionnel : décommenter pour vider avant import
      // db.prepare("DELETE FROM enriched_value").run();
      // db.prepare("DELETE FROM enriched_products").run();

      for (const item of items) {
        const details = item.enriched_value || item;
        
        // Identifiants
        const internalId = Math.random().toString(36).substring(2, 15); // ID text pour enriched_products
        const rawId = String(item.raw_product_id || item._id || item.id);
        const now = new Date().toISOString();

        // Mapping
        const nutriId = scoreToId(details.nutriscore);
        const ecoId = scoreToId(details.ecoscore);
        const catId = mapCategoryToId(details.categories || details.category || "");

        // A. Table Parent
        insertProductStmt.run(internalId, rawId, now);

        // B. Table Enfant (Liaison)
        insertValueStmt.run(
          internalId,
          String(details.products_name || details.product_name || "Inconnu"),
          catId,
          String(details.countries || "NC"),
          ecoId,   // Référence ecoscore.id (1-5)
          nutriId, // Référence nutriscore.id (1-5)
          details.image_url ? String(details.image_url) : null,
          String(details.code || "N/A")
        );
        
        totalInserted++;
      }
    });

    runTransaction(productsToProcess);

    console.log(`✅ ${totalInserted} produits insérés.`);

    // 4. Retour de l'objet attendu par l'API
    return {
      totalProcessed: productsToProcess.length,
      totalInserted: totalInserted
    };

  } catch (error) {
    console.error("❌ Erreur lors de l'enrichissement SQL:", error);
    throw error;
  } finally {
    if (db.open) db.close();
  }
};