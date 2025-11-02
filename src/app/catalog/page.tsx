"use client";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Ingredient = { item: string; quantity: number; unit: string };
type Recipe = { product: string; ingredients: Ingredient[] };

export default function CatalogPage() {
  const { data, error, mutate } = useSWR<Recipe[]>("/api/recipes", fetcher);
  const recipes: Recipe[] = Array.isArray(data) ? data : [];

  const [showNew, setShowNew] = useState(false);
  const [product, setProduct] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { item: "", quantity: 0, unit: "" },
  ]);

  const addIngredient = () =>
    setIngredients((prev) => [...prev, { item: "", quantity: 0, unit: "" }]);

  const handleChange = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      if (!next[index]) next[index] = { item: "", quantity: 0, unit: "" };
      if (field === "quantity") next[index][field] = Number(value);
      else next[index][field] = value;
      return next;
    });
  };

  const saveRecipe = async () => {
    try {
      const payload: Recipe = {
        product: (product ?? "").trim(),
        ingredients: (ingredients ?? []).map((i) => ({
          item: String(i?.item ?? "").trim(),
          quantity: Number.isFinite(Number(i?.quantity)) ? Number(i?.quantity) : 0,
          unit: String(i?.unit ?? "").trim(),
        })),
      };
      if (!payload.product) {
        alert("Nombre de producto requerido");
        return;
      }
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setProduct("");
      setIngredients([{ item: "", quantity: 0, unit: "" }]);
      setShowNew(false);
      await mutate();
    } catch {
      alert("Error guardando la receta");
    }
  };

  if (error) return <div className="p-6 text-red-600">Error cargando recetas.</div>;
  if (!data) return <div className="p-6 text-gray-600">Cargando recetas…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">📖 Catálogo &amp; Recetas</h1>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
        >
          ➕ Nueva receta
        </button>
      </header>

      <div className="overflow-x-auto rounded-lg border bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-left">Ingredientes</th>
            </tr>
          </thead>
          <tbody>
            {(recipes ?? []).map((r) => (
              <tr key={r?.product ?? crypto.randomUUID()} className="border-b">
                <td className="p-3 font-medium">{r?.product ?? "—"}</td>
                <td className="p-3">
                  {(r?.ingredients ?? [])
                    .map((i) => `${i?.item ?? "?"} (${Number(i?.quantity ?? 0)} ${i?.unit ?? ""})`)
                    .join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg space-y-4 w-full max-w-2xl">
            <h3 className="text-lg font-semibold">➕ Nueva receta</h3>
            <label className="block text-sm">
              Nombre del producto
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full rounded-md border px-3 py-2 mt-1"
              />
            </label>

            <div className="space-y-3">
              {(ingredients ?? []).map((ing, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={ing?.item ?? ""}
                    onChange={(e) => handleChange(idx, "item", e.target.value)}
                    placeholder="Ingrediente"
                    className="flex-1 rounded-md border px-2 py-1"
                  />
                  <input
                    type="number"
                    value={Number.isFinite(ing?.quantity) ? Number(ing?.quantity) : 0}
                    onChange={(e) => handleChange(idx, "quantity", e.target.value)}
                    placeholder="Cantidad"
                    className="w-24 rounded-md border px-2 py-1 text-right"
                  />
                  <input
                    value={ing?.unit ?? ""}
                    onChange={(e) => handleChange(idx, "unit", e.target.value)}
                    placeholder="Unidad"
                    className="w-24 rounded-md border px-2 py-1"
                  />
                </div>
              ))}
              <button
                onClick={addIngredient}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
              >
                ➕ Agregar ingrediente
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveRecipe}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
