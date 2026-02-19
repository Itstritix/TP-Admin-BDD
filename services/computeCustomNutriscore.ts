import { OpenFoodFactsProduct } from "@/types/openFoodFacts";

export type NutriscoreGrade = "a" | "b" | "c" | "d" | "e";

/**
 * Récupère une valeur numérique depuis les nutriments (supporte number ou string).
 */
function getNum(nutriments: Record<string, number | string>, key: string): number {
  const v = nutriments[key];
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v) || 0;
}

/**
 * Calcule un Nutri-Score personnalisé (A à E) à partir des nutriments pour 100g.
 * Utilise les champs Open Food Facts : calcium_100g, carbohydrates_100g,
 * energy-kcal_100g, fat_100g, proteins_100g, fruits-vegetables-*-estimate, nova-group.
 * Complété si présents : sugars_100g, saturated-fat_100g, salt_100g, fiber_100g.
 */
export function computeCustomNutriscore(
  payload: OpenFoodFactsProduct
): NutriscoreGrade {
  const n = payload.nutriments ?? {};

  // --- Valeurs pour 100g (celles que tu as fournies) ---
  const energyKcal =
    getNum(n, "energy-kcal_100g") || getNum(n, "energy_100g") / 4.184;
  const carbohydrates = getNum(n, "carbohydrates_100g");
  const sugars = getNum(n, "sugars_100g");
  const fat = getNum(n, "fat_100g");
  const saturatedFat = getNum(n, "saturated-fat_100g");
  const salt = getNum(n, "salt_100g");
  const proteins = getNum(n, "proteins_100g");
  const fiber = getNum(n, "fiber_100g");
  const calcium = getNum(n, "calcium_100g"); // en g pour 100g
  const fruitsVegetablesLegumes = getNum(
    n,
    "fruits-vegetables-legumes-estimate-from-ingredients_100g"
  );
  const fruitsVegetablesNuts = getNum(
    n,
    "fruits-vegetables-nuts-estimate-from-ingredients_100g"
  );
  const novaGroup = getNum(n, "nova-group_100g") || getNum(n, "nova-group");

  // Si aucune donnée exploitable, fallback sur nutriscore_grade ou "e"
  const hasAny =
    energyKcal > 0 ||
    carbohydrates > 0 ||
    fat > 0 ||
    proteins > 0 ||
    calcium > 0 ||
    fruitsVegetablesLegumes > 0 ||
    fruitsVegetablesNuts > 0;
  if (!hasAny) {
    const existing = payload.nutriscore_grade?.toLowerCase();
    if (
      existing === "a" ||
      existing === "b" ||
      existing === "c" ||
      existing === "d" ||
      existing === "e"
    ) {
      return existing;
    }
    return "e";
  }

  // --- Score NÉGATIF (énergie, sucres/glucides, gras, sel) ---
  let neg = 0;

  if (energyKcal > 335) neg += 10;
  else if (energyKcal > 270) neg += 8;
  else if (energyKcal > 205) neg += 6;
  else if (energyKcal > 135) neg += 4;
  else if (energyKcal > 80) neg += 2;

  const sugarsOrCarbs = sugars > 0 ? sugars : carbohydrates;
  if (sugarsOrCarbs > 45) neg += 10;
  else if (sugarsOrCarbs > 36) neg += 8;
  else if (sugarsOrCarbs > 27) neg += 6;
  else if (sugarsOrCarbs > 13.5) neg += 4;
  else if (sugarsOrCarbs > 4.5) neg += 2;

  const fatToUse = saturatedFat > 0 ? saturatedFat : fat;
  if (fatToUse > 10) neg += 10;
  else if (fatToUse > 7) neg += 8;
  else if (fatToUse > 4) neg += 6;
  else if (fatToUse > 2) neg += 4;
  else if (fatToUse > 1) neg += 2;

  if (salt > 2.7) neg += 10;
  else if (salt > 2.25) neg += 8;
  else if (salt > 1.8) neg += 6;
  else if (salt > 0.9) neg += 4;
  else if (salt > 0.45) neg += 2;

  // --- Score POSITIF (protéines, fibres, fruits/légumes, calcium) ---
  let pos = 0;

  if (proteins >= 8) pos += 5;
  else if (proteins >= 6.4) pos += 4;
  else if (proteins >= 4.8) pos += 3;
  else if (proteins >= 3.2) pos += 2;
  else if (proteins >= 1.6) pos += 1;

  if (fiber >= 4.7) pos += 5;
  else if (fiber >= 3.5) pos += 4;
  else if (fiber >= 2.8) pos += 3;
  else if (fiber >= 1.9) pos += 2;
  else if (fiber >= 0.9) pos += 1;

  const fruitsPct = Math.max(
    fruitsVegetablesLegumes,
    fruitsVegetablesNuts
  );
  if (fruitsPct >= 80) pos += 5;
  else if (fruitsPct >= 60) pos += 4;
  else if (fruitsPct >= 40) pos += 3;
  else if (fruitsPct >= 20) pos += 2;
  else if (fruitsPct >= 10) pos += 1;

  // Calcium (0.25 g/100g = 250 mg) : bonus léger
  const calciumMg = calcium * 1000;
  if (calciumMg >= 320) pos += 2;
  else if (calciumMg >= 160) pos += 1;

  // --- Pénalité Nova (ultra-transformé) ---
  if (novaGroup >= 4) neg += 2;
  else if (novaGroup >= 3) neg += 1;

  const score = neg - pos;

  if (score <= -1) return "a";
  if (score <= 2) return "b";
  if (score <= 10) return "c";
  if (score <= 18) return "d";
  return "e";
}
