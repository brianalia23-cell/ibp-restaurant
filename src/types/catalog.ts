export type UUID = string;

export interface Product {
  id: UUID;
  name: string;
  sku?: string;
  price?: number;
  categoryId?: UUID;
}

export interface Dish {
  id: UUID;
  name: string;
  productIds?: UUID[];
}

export interface Catalog {
  products: Product[];
  dishes: Dish[];
}

export interface RecipeIngredient {
  productId: UUID;
  qty: number;
  unit?: string;
}

export interface Recipe {
  id: UUID;
  dishId: UUID;
  ingredients: RecipeIngredient[];
}

export interface EnrichedDish extends Dish {
  ingredients: Array<
    RecipeIngredient & {
      product?: Product;
    }
  >;
}
