# TP Admin BDD — Catalogue Qualité Produits

Application web de gestion et de consultation d’un catalogue de produits alimentaires, alimentée par **Open Food Facts**. Le projet couvre la collecte de données brutes, l’enrichissement (Nutri-Score personnalisé, Eco-Score), le stockage dans **MongoDB** puis le transfert vers **SQLite** pour la consultation et les filtres.

---

## Instructions d’installation

### Prérequis

- **Node.js** 18+ (recommandé : 20+)
- **npm** (ou yarn / pnpm)
- **MongoDB** (local ou Atlas) — utilisé pour les données brutes et enrichies avant transfert SQLite

### Étapes

1. **Cloner le dépôt et entrer dans le projet**
   ```bash
   cd TP-Admin-BDD
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d’environnement**
   Créer un fichier `.env` à la racine du projet :
   ```env
   MONGODB_URI=mongodb://localhost:27017/tp-admin-bdd
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
   - `MONGODB_URI` : chaîne de connexion MongoDB (obligatoire pour collecte et enrichissement).
   - `NEXT_PUBLIC_BASE_URL` : URL de base de l’app (optionnel en dev, utile pour les appels API depuis le serveur).

4. **Base SQLite**
   La base est créée automatiquement au premier usage dans le dossier `db/` à la racine. Créer le dossier si besoin :
   ```bash
   mkdir -p db
   ```

5. **Lancer l’application en développement**
   ```bash
   npm run dev
   ```
   Ouvrir [http://localhost:3000](http://localhost:3000).

6. **Alimenter et utiliser l’application (workflow recommandé)**
   - **Collecte** : récupérer des produits Open Food Facts dans MongoDB  
     `GET /api/collect?page=1&limit=100`
   - **Enrichissement** : calculer Nutri-Score / Eco-Score et remplir la collection enrichie dans MongoDB  
     `GET /api/enrichement?batchSize=100`
   - **Transfert SQLite** : copier les produits enrichis de MongoDB vers SQLite (catalogue consultable)  
     `GET /api/enrich_db`
   - **Consultation** : aller sur `/dashboard` pour la liste paginée et les filtres, et sur `/items/[id]` pour la fiche produit.

### Scripts disponibles

| Commande              | Description                    |
|-----------------------|--------------------------------|
| `npm run dev`         | Serveur de développement      |
| `npm run build`       | Build de production           |
| `npm run start`       | Démarrer le build en prod     |
| `npm run lint`        | Linter ESLint                 |
| `npm run test`        | Tests Vitest                  |
| `npm run test:ui`     | Tests avec interface Vitest   |
| `npm run test:coverage` | Couverture de code          |

---

## Description de l’architecture

### Vue d’ensemble

Le système suit un **pipeline en trois étapes** : collecte → enrichissement (MongoDB) → transfert vers SQLite pour la lecture et l’affichage.

```
Open Food Facts API
        ↓
   [Collecte]  →  RawProduct (MongoDB)
        ↓
   [Enrichissement]  →  EnrichedProduct (MongoDB)
        ↓
   [Transfert]  →  SQLite (enriched_products + enriched_value + tables de référence)
        ↓
   [Consultation]  →  Dashboard / Fiche produit (Next.js)
```

### Répertoires et rôles

| Dossier / Fichier        | Rôle |
|--------------------------|------|
| `app/`                   | App Router Next.js : pages (`page.tsx`), routes API (`app/api/...`). |
| `app/dashboard/`         | Page catalogue avec tableau, pagination et filtres (Nutri-Score, recherche). |
| `app/items/[id]/`        | Page de détail d’un produit (fiche). |
| `app/api/collect/`       | Collecte de produits depuis l’API Open Food Facts → écriture dans `RawProduct`. |
| `app/api/enrichement/`   | Enrichissement par lots des `RawProduct` → création/mise à jour `EnrichedProduct`. |
| `app/api/enrich_db/`     | Transfert des `EnrichedProduct` (MongoDB) vers SQLite (tables normalisées). |
| `app/api/items/`         | Liste paginée et filtrée des produits (lecture SQLite). |
| `app/api/items/[id]/`    | Détail d’un produit par ID (lecture SQLite). |
| `app/api/stats/`         | Statistiques globales (nombre de produits, répartition Nutri-Score / Eco-Score). |
| `components/`            | Composants réutilisables (ex. `FilterBar` pour recherche et filtres). |
| `lib/`                   | Connexions et accès aux bases : `sqlite.ts`, `mongo.ts`. |
| `models/`                | Schémas Mongoose : `rawProducts.ts`, `EnrichedProducts.ts`. |
| `services/`              | Logique métier : `openFood.ts`, `enrichment.ts`, `enrichDb.ts`, `computeCustomNutriscore.ts`, `computeEcoScore.ts`. |
| `types/`                 | Types TypeScript (ex. `openFoodFacts.ts`). |
| `__test__/`              | Tests unitaires et d’intégration (Vitest). |

### Modèles de données

- **MongoDB**
  - **RawProduct** : `source`, `fetched_at`, `raw_hash` (dédoublonnage), `payload` (objet brut Open Food Facts).
  - **EnrichedProduct** : `raw_product_id`, `status`, `enriched_at`, `enriched_value` (nom, catégorie, pays, `eco_score`, `nutriscore`, `code`, `image_url`).

- **SQLite** (schéma cible utilisé par l’API et par `enrichDb` dans les tests)
  - **enriched_products** : `id`, `raw_product_id`, `enriched_at`.
  - **enriched_value** : `enriched_products_id`, `products_name`, `categories_id`, `countries`, `ecoscore_id`, `nutriscore_id`, `image_url`, `code`.
  - **Tables de référence** : `categories`, `nutriscore`, `ecoscore` (identifiants numériques pour jointures).

Les routes API de lecture (`/api/items`, `/api/items/[id]`) s’appuient sur ce schéma normalisé (jointures avec `categories`, `nutriscore`, `ecoscore`).

### Flux de données

1. **Collecte** (`/api/collect`) : appel à l’API Open Food Facts, hash SHA1 du payload pour éviter les doublons, insertion dans `RawProduct`.
2. **Enrichissement** (`/api/enrichement`) : lecture des `RawProduct` par lots, calcul du Nutri-Score personnalisé et de l’Eco-Score, écriture dans `EnrichedProduct` (sans ré-enrichir les `raw_product_id` déjà traités).
3. **Transfert** (`/api/enrich_db`) : lecture de tous les `EnrichedProduct`, mapping catégories / scores vers des IDs, insertion dans SQLite (enriched_products + enriched_value + lignes de référence).
4. **Consultation** : le dashboard et la fiche produit lisent uniquement SQLite via `/api/items` et `/api/items/[id]`.

---

## Choix techniques

- **Next.js 16 (App Router)** : rendu serveur, routes API intégrées, bon support TypeScript.
- **React 19** : composants modernes (y compris async des `searchParams` / `params` en Next.js 15+).
- **MongoDB + Mongoose** : stockage des données brutes et enrichies, dédoublonnage par `raw_hash`, souplesse du schéma pour le payload OFF.
- **SQLite (better-sqlite3)** : base relationnelle locale pour la lecture rapide, la pagination et les filtres (Nutri-Score, recherche texte) sans dépendance à un serveur SQL.
- **Double stockage** : MongoDB pour le pipeline d’ingestion et d’enrichissement ; SQLite pour un catalogue normalisé et performant côté lecture.
- **Nutri-Score personnalisé** : calcul à partir des nutriments (énergie, sucres, gras, sel, protéines, fibres, fruits/légumes, calcium, Nova) selon une logique type score négatif/positif, avec repli sur `nutriscore_grade` OFF si données insuffisantes.
- **Eco-Score** : basé sur `ecoscore_grade` Open Food Facts, avec dégradation d’un cran si le Nutri-Score est D ou E.
- **Tailwind CSS 4** : styles utilitaires et thème (variables CSS, mode sombre optionnel).
- **Lucide React** : icônes.
- **Vitest** : tests unitaires (enrichissement, calcul de scores) et d’intégration (SQL, schéma), avec mock de SQLite en mémoire dans `vitest.setup.ts`.

---

## Limites du projet

1. **Schéma SQLite en production**  
   Le fichier `lib/sqlite.ts` ne crée que les tables `enriched_products` et `enriched_value` avec des colonnes « plates » (ex. `categories`, `nutriscore`, `eco_score` en texte). En revanche, `enrichDb` et les routes `/api/items` supposent un schéma **normalisé** (tables `categories`, `nutriscore`, `ecoscore` et colonnes `*_id` dans `enriched_value`). Pour un démarrage from scratch, il peut être nécessaire d’étendre `lib/sqlite.ts` pour créer aussi les tables de référence (comme dans `vitest.setup.ts`), sous peine d’échec au premier appel à `/api/enrich_db` ou de requêtes API incorrectes.

2. **Filtre par pays non appliqué côté API**  
   La barre de filtres du dashboard propose un filtre par pays (`country`), mais la route `/api/items` n’utilise pas ce paramètre. Seuls les filtres **Nutri-Score** et **recherche (nom / code)** sont pris en compte. Le filtre pays est donc uniquement côté URL/UI pour l’instant.

3. **Collecte et enrichissement manuels**  
   Aucune tâche planifiée ni file d’attente : la collecte et l’enrichissement se font via des appels GET manuels aux routes dédiées. Pas de gestion de la charge ni de retry en cas d’erreur Open Food Facts.

4. **Pas d’authentification**  
   Les routes d’administration (collecte, enrichissement, transfert SQLite) ne sont pas protégées. À réserver à un environnement de développement ou à sécuriser (auth, rôles) en production.

5. **Page d’accueil**  
   La page racine (`app/page.tsx`) est encore le template par défaut de Create Next App (liens Templates / Learn). Le point d’entrée utile pour l’utilisateur est `/dashboard`.

6. **Statistiques et schéma**  
   La route `/api/stats` interroge une colonne `eco_score` sur `enriched_value`. Si le schéma utilisé en production est bien normalisé (ecoscore via `ecoscore_id` + table `ecoscore`), cette requête devra être alignée (jointure avec `ecoscore` ou colonne dérivée).

7. **Robustesse des données OFF**  
   Les calculs de Nutri-Score et Eco-Score dépendent de la qualité et de la présence des champs Open Food Facts (nutriments, grades). Données manquantes ou incohérentes peuvent conduire à des scores par défaut (ex. « e ») ou à des fiches peu informatives.

---

## Ressources

- [Next.js](https://nextjs.org/docs)
- [Open Food Facts API](https://wiki.openfoodfacts.org/API)
- [MongoDB](https://www.mongodb.com/docs/)
- [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3)