"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PricingItem = {
  sku: string;
  name: string;
  unitPrice: number;
  unitCost: number;
  marginPct: number;
};

export default function PricingPage() {
  const { data, error, mutate } = useSWR<{ avgMarginPct: number; items: PricingItem[] }>(
    "/api/pricing",
    fetcher
  );

  // filtros / edición
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});

  // nuevo producto
  const [showNew, setShowNew] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // importar csv
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return data.items;
    return data.items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
    );
  }, [data, filter]);

  if (error) return <div className="p-6 text-red-600">Error loading pricing.</div>;
  if (!data) return <div className="p-6 text-gray-600">Loading pricing…</div>;

  const handlePriceChange = (sku: string, val: string) =>
    setEditedPrices((p) => ({ ...p, [sku]: val }));

  const savePrice = async (sku: string, unitPrice: number) => {
    try {
      setSaving(sku);
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, unitPrice }),
      });
      if (!res.ok) throw new Error("Save failed");
      await mutate();
    } catch (e) {
      console.error(e);
      alert("Error saving price");
    } finally {
      setSaving(null);
    }
  };

  const createProduct = async () => {
    try {
      const sku = newSku.trim() || `SKU-${newName.toUpperCase().replace(/\s+/g, "-")}`;
      const name = newName.trim();
      const priceNum = Number(newPrice || 0);
      if (!name) return alert("Nombre requerido");
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, name, unitPrice: priceNum }),
      });
      if (!res.ok) throw new Error("Save failed");
      setShowNew(false);
      setNewSku("");
      setNewName("");
      setNewPrice("");
      await mutate();
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el producto");
    }
  };

  const importCSV = async () => {
    // Formato esperado: sku,name,unitPrice  (con o sin encabezado)
    try {
      const lines = csvText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      let rows: { sku?: string; name?: string; unitPrice?: number }[] = [];
      for (const line of lines) {
        const parts = line.split(",").map((x) => x.trim());
        if (parts.length < 2) continue;
        // heurística de header
        if (/^sku$/i.test(parts[0]) || /^name$/i.test(parts[0])) continue;

        const [skuMaybe, nameMaybe, priceMaybe] = parts;
        const hasPrice = parts.length >= 3 && !isNaN(Number(priceMaybe));
        rows.push({
          sku: skuMaybe || undefined,
          name: nameMaybe || undefined,
          unitPrice: hasPrice ? Number(priceMaybe) : undefined,
        });
      }

      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk", rows }),
      });
      if (!res.ok) throw new Error("Bulk import failed");
      setShowImport(false);
      setCsvText("");
      await mutate();
    } catch (e) {
      console.error(e);
      alert("No se pudo importar el CSV");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">💵 Pricing</h1>
          <p className="text-gray-600">
            Costos por receta + precio de venta → márgenes automáticos.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Avg. SKU Margin</div>
          <div className="text-2xl font-semibold">{data.avgMarginPct.toFixed(1)}%</div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por SKU o nombre…"
          className="w-64 rounded-md border px-3 py-2"
        />
        <button
          onClick={() => setFilter("")}
          className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          Limpiar
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            ⬆️ Importar CSV
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            ➕ Nuevo producto
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-right">Costo Unit. ($)</th>
              <th className="p-3 text-right">Precio Unit. ($)</th>
              <th className="p-3 text-right">Margen (%)</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const priceStr = editedPrices[row.sku] ?? row.unitPrice.toString();
              const previewPrice = Number(priceStr) || 0;
              const previewMargin =
                previewPrice > 0
                  ? ((previewPrice - (row.unitCost || 0)) / previewPrice) * 100
                  : 0;

              const marginClass =
                previewMargin < 30
                  ? "text-red-600"
                  : previewMargin < 60
                  ? "text-yellow-600"
                  : "text-green-700";

              return (
                <tr key={row.sku} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{row.sku}</td>
                  <td className="p-3">{row.name}</td>
                  <td className="p-3 text-right">${(row.unitCost || 0).toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <input
                      className="w-28 rounded-md border px-2 py-1 text-right"
                      value={priceStr}
                      onChange={(e) => handlePriceChange(row.sku, e.target.value)}
                      inputMode="decimal"
                    />
                  </td>
                  <td className={`p-3 text-right font-semibold ${marginClass}`}>
                    {previewMargin.toFixed(1)}%
                  </td>
                  <td className="p-3 text-right">
                    <button
                      disabled={saving === row.sku}
                      onClick={() => savePrice(row.sku, Number(priceStr))}
                      className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving === row.sku ? "Guardando…" : "Guardar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal NUEVO PRODUCTO (simple) */}
      {showNew && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-semibold">➕ Nuevo producto</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <div className="text-gray-600 mb-1">SKU (opcional)</div>
                <input
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="SKU-CUSTOM"
                />
              </label>
              <label className="text-sm">
                <div className="text-gray-600 mb-1">Precio ($)</div>
                <input
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-right"
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </label>
              <label className="text-sm col-span-2">
                <div className="text-gray-600 mb-1">Nombre del producto</div>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Ej: Espresso"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createProduct}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal IMPORT CSV */}
      {showImport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-semibold">⬆️ Importar CSV</h3>
            <p className="text-sm text-gray-600">
              Formato: <code>sku,name,unitPrice</code> (con o sin encabezado).  
              Si no pasás <code>sku</code>, lo generamos con el nombre.
            </p>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full rounded-md border px-3 py-2 font-mono"
              placeholder={`sku,name,unitPrice
SKU-ESP,Espresso,2.0
,Americano,2.5
`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={importCSV}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
