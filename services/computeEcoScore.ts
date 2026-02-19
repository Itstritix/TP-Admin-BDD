import { OpenFoodFactsProduct } from "@/types/openFoodFacts";
import { NutriscoreGrade } from "./computeCustomNutriscore";

export type EcoScoreGrade = "a" | "b" | "c" | "d" | "e";

const GRADES: EcoScoreGrade[] = ["a", "b", "c", "d", "e"];

/**
 * Récupère l'EcoScore et l'ajuste selon le Nutri-Score.
 * Règle : Si le Nutri-Score est mauvais (D ou E), l'Eco-Score descend d'un cran.
 */
export function computeEcoScore(
  payload: OpenFoodFactsProduct, 
  nutriscore: NutriscoreGrade
): EcoScoreGrade {
  // 1. Récupération de la base (API ou valeur par défaut)
  let grade = payload.ecoscore_grade?.trim().toLowerCase() as EcoScoreGrade;
  if (!GRADES.includes(grade)) {
    grade = "e";
  }

  // 2. Application de la logique métier liée au Nutri-Score
  // Si le produit est très transformé ou mauvais pour la santé (D ou E)
  if (nutriscore === "e" || nutriscore === "d") {
    const currentIndex = GRADES.indexOf(grade);
    // On descend d'un grade (ex: de 'a' vers 'b') si on n'est pas déjà au plus bas
    if (currentIndex < GRADES.length - 1) {
      grade = GRADES[currentIndex + 1];
    }
  }

  return grade;
}