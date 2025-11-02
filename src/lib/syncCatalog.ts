// src/lib/syncCatalog.ts

/**
 * Tipos base: ajusta los campos a tu modelo real.
 */
export interface Product {
    id: string;
    name: string;
    sku?: string;
    price?: number;
    categoryId?: string;
    // agrega aquí cualquier otra propiedad que realmente uses
  }
  
  export interface Dish {
    id: string;
    name: string;
    productIds?: string[]; // si tu catálogo lista productos de un plato
  }
  
  export interface Catalog {
    products: Product[];
    dishes: Dish[];
  }
  
  export interface RecipeIngredient {
    productId: string;
    qty: number;
    unit?: string;
  }
  
  export interface Recipe {
    id: string;        // id de la receta (no necesariamente del plato)
    dishId: string;    // referencia al plato
    ingredients: RecipeIngredient[];
  }
  
  /**
   * Estructura enriquecida para trabajar en UI o persistencia.
   */
  export interface EnrichedDish extends Dish {
    ingredients: Array<
      RecipeIngredient & {
        product?: Product; // se enriquece con el producto indexado
      }
    >;
  }
  
  /**
   * Lector genérico con manejo de errores.
   */
  async function readJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GET ${url} failed: ${res.status} ${res.statusText} ${text}`);
    }
    return (await res.json()) as T;
  }
  
  /**
   * Trae el catálogo (ajusta la ruta si fuera /api/catalog).
   * En tus logs aparece GET /catalog 200.
   */
  export async function fetchCatalog(): Promise<Catalog> {
    const data = await readJson<Partial<Catalog>>("/catalog");
    return {
      products: Array.isArray(data.products) ? data.products as Product[] : [],
      dishes: Array.isArray(data.dishes) ? data.dishes as Dish[] : [],
    };
  }
  
  /**
   * Trae recetas. En tus logs aparece GET /api/recipes 200.
   */
  export async function fetchRecipes(): Promise<Recipe[]> {
    const data = await readJson<unknown>("/api/recipes");
    // asumimos que /api/recipes devuelve Recipe[] directamente
    return Array.isArray(data) ? (data as Recipe[]) : [];
  }
  
  /**
   * Indexa por id sin usar `any`.
   */
  export function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
    const acc: Record<string, T> = {};
    for (const item of items) {
      acc[item.id] = item;
    }
    return acc;
  }
  
  /**
   * Une catálogo + recetas y enriquece platos con los productos.
   * Evita `implicit any` tipando explícitamente d, ing, p, etc.
   */
  export function enrichDishes(
    dishes: Dish[],
    recipes: Recipe[],
    productsById: Record<string, Product>
  ): EnrichedDish[] {
    // acceso rápido receta por plato
    const recipeByDish: Record<string, Recipe> = {};
    for (const r of recipes) {
      recipeByDish[r.dishId] = r;
    }
  
    const result: EnrichedDish[] = dishes.map((d: Dish) => {
      const recipe: Recipe | undefined = recipeByDish[d.id];
      const ingredients: Array<RecipeIngredient & { product?: Product }> =
        (recipe?.ingredients ?? []).map((ing: RecipeIngredient) => ({
          ...ing,
          product: productsById[ing.productId],
        }));
  
      return {
        ...d,
        ingredients,
      };
    });
  
    return result;
  }
  
  /**
   * Sincroniza el catálogo completo y devuelve estructuras útiles para UI o persistencia.
   * (No persiste por sí mismo: inyectá tus funciones de guardado si querés escribir DB.)
   */
  export async function syncCatalog() {
    const [catalog, recipes] = await Promise.all([fetchCatalog(), fetchRecipes()]);
    const products: Product[] = catalog.products;
    const dishes: Dish[] = catalog.dishes;
  
    const productsById: Record<string, Product> = indexById<Product>(products);
    const enrichedDishes: EnrichedDish[] = enrichDishes(dishes, recipes, productsById);
  
    return {
      products,
      dishes: enrichedDishes,
      productsById,
      recipes,
    };
  }
  
  /**
   * Helpers opcionales de “persistencia” (inyectables) para mantener todo tipado.
   * Úsalos sólo si querés guardar en una DB/servicio.
   */
  
  export type SaveProductFn = (p: Product) => Promise<void>;
  export type SaveDishFn = (d: EnrichedDish) => Promise<void>;
  
  export async function upsertProducts(
    products: Product[],
    save: SaveProductFn
  ): Promise<void> {
    for (const p of products) {
      // evitar forEach(async)
      await save(p);
    }
  }
  
  export async function upsertDishes(
    dishes: EnrichedDish[],
    save: SaveDishFn
  ): Promise<void> {
    for (const d of dishes) {
      await save(d);
    }
  }
  
  /**
   * Ejemplo de orquestación completa con persistencia inyectada.
   * Llamalo desde un server action, route handler, job, etc.
   */
  export async function syncAndPersist(
    saveProduct: SaveProductFn,
    saveDish: SaveDishFn
  ) {
    const { products, dishes } = await syncCatalog();
    await upsertProducts(products, saveProduct);
    await upsertDishes(dishes, saveDish);
  }
  