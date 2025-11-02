export default function RecipesPage() {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">👩‍🍳 Recipes</h1>
        <p className="text-gray-600">
          Aquí administraremos las recetas (BOM) por SKU: ingredientes, unidades y cantidades.
          Hoy la fuente es <code>src/data/bom.json</code>. Vamos a migrarlo a una UI editable.
        </p>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">
            Próximo: CRUD de recetas + validaciones de unidades + costos por ingrediente.
          </p>
        </div>
      </div>
    );
  }
  