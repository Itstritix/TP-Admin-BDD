import { describe, it, expect, vi } from 'vitest';
import { enrichDb } from '@/services/enrichDb';
import { openSqliteDb } from '@/lib/sqlite'; // <--- L'IMPORT MANQUANT ICI

describe('Intégration Enrichissement', () => {
  it('doit lier le produit au bon ID de nutriscore et enregistrer le code', async () => {
    // Initialisation de la base (soit en mémoire via le mock, soit physique selon ton setup)
    const db = openSqliteDb();
    
    // Empêcher la fermeture automatique par le service pour pouvoir lire les data
    const originalClose = db.close;
    db.close = vi.fn(); 

    // Données de test bien structurées
    const mockData = [{
      id: 999,
      products_name: "Produit Test Import",
      code: "987654321",
      nutriscore: "a",
      categories: "Bio",
      image_url: "http://test.jpg",
      countries: "France",
      ecoscore: "b"
    }];

    try {
      // 1. Exécution du service avec les données mockées
      await enrichDb(mockData);

      // 2. Vérification SQL
      // On cherche spécifiquement le code qu'on vient d'insérer
      const row = db.prepare(`
        SELECT v.products_name, v.code, n.nutriscore 
        FROM enriched_value v
        JOIN nutriscore n ON v.nutriscore_id = n.id
        WHERE v.code = ?
      `).get("987654321") as any;

      // Assertions
      expect(row).toBeDefined();
      expect(row.products_name).toBe("Produit Test Import");
      expect(row.code).toBe("987654321");
      expect(row.nutriscore).toBe("a");

    } finally {
      // Nettoyage : on restaure la méthode close et on ferme réellement
      db.close = originalClose;
      db.close();
    }
  });
});