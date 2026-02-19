import { describe, it, expect, vi } from 'vitest';
import { enrichDb } from '@/services/enrichDb';
import EnrichedProduct from "@/models/EnrichedProducts";
import { openSqliteDb } from "@/lib/sqlite";

vi.mock("@/models/EnrichedProducts");

describe('Vérification des relations SQL', () => {
  it('doit lier le produit au bon ID de nutriscore et enregistrer le code', async () => {
    const db = openSqliteDb();
    
    // On empêche la fermeture pour pouvoir lire la DB après l'exécution
    const originalClose = db.close;
    db.close = vi.fn(); 

    // 1. Mock des données (Mise à jour avec code et image_url)
    const mockData = [{
      _id: "mongo_id_unique", 
      id: 12345, // Simule le raw_product_id (INTEGER)
      products_name: "Produit Test",
      code: "3017620422003",
      image_url: "http://test.com/image.jpg",
      nutriscore: "a",
      categories: "Bio",
      countries: "France",
      ecoscore: "b"
    }];

    // On mock le retour de MongoDB
    (EnrichedProduct.find as any).mockReturnValue({ 
      lean: () => ({
        exec: () => Promise.resolve(mockData) 
      }) 
    });

    // 2. Exécution de l'enrichissement
    // Note : On passe mockData directement si ton enrichDb prend des data en paramètre, 
    // sinon il ira chercher le mock d'EnrichedProduct.find
    await enrichDb(mockData); 

    // 3. Vérification avec les nouvelles colonnes
    // On récupère le produit le plus récent (le dernier inséré)
    const row = db.prepare(`
      SELECT 
        v.products_name, 
        v.code, 
        v.image_url, 
        n.nutriscore,
        c.category
      FROM enriched_value v
      JOIN nutriscore n ON v.nutriscore_id = n.id
      JOIN categories c ON v.categories_id = c.id
      ORDER BY v.id DESC LIMIT 1
    `).get() as any;

    // Assertions
    expect(row).toBeDefined();
    expect(row.products_name).toBe("Produit Test");
    expect(row.code).toBe("3017620422003");
    expect(row.image_url).toBe("http://test.com/image.jpg");
    expect(row.nutriscore).toBe("a");
    expect(row.category).toBe("Bio");

    // Nettoyage : on restaure et on ferme
    db.close = originalClose;
    db.close(); 
  });
});