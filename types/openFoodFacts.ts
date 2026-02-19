export type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  categories?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
  ingredients_text?: string;
  nutriments?: Record<string, number | string>;
  countries?: string;
  code?: string;
  image_url?: string;
};