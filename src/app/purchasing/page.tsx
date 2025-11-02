"use client";

import { useEffect, useState } from "react";

export default function PurchasingPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/purchasing");
        const result = await res.json();

        // ✅ Validar estructura esperada
        if (!result || !Array.isArray(result.items)) {
          console.error("❌ Unexpected response:", result);
          setError(result.error || "Invalid response from server");
          return;
        }

        // Agregar campos de stock y compra sugerida
        const extended = result.items.map((i: any) => ({
          ...i,
          stock: 0,
          toBuy: i.required,
        }));

        setData(extended);
        setTotal(result.totalMaterialsCost || 0);
      } catch (err) {
        console.error("❌ Error loading purchasing data:", err);
        setError("Failed to load purchasing data");
      }
    };

    loadData();
  }, []);

  if (error) {
    return (
      <div className="p-6 text-red-600">
        ⚠️ Error: {error}
        <br />
        Check if <code>src/data/bom.json</code> and <code>src/data/demand.json</code> exist and contain valid data.
      </div>
    );
  }

  if (!data.length)
    return <div className="p-6 text-gray-600">Loading purchasing plan…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">🛒 Purchasing Plan</h1>

      <table className="w-full border-collapse rounded-lg shadow overflow-hidden">
        <thead className="bg-gray-100 border-b text-left">
          <tr>
            <th className="p-2">Item</th>
            <th className="p-2">Unit</th>
            <th className="p-2 text-right">Required</th>
            <th className="p-2 text-right">Stock</th>
            <th className="p-2 text-right">To Buy</th>
            <th className="p-2 text-right">Total Cost ($)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{row.item}</td>
              <td className="p-2">{row.unit}</td>
              <td className="p-2 text-right">{row.required}</td>
              <td className="p-2 text-right">{row.stock}</td>
              <td className="p-2 text-right text-green-700 font-medium">
                {row.toBuy}
              </td>
              <td className="p-2 text-right">${row.totalCost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right text-lg font-semibold text-gray-800">
        Total Material Cost: ${total.toFixed(2)}
      </div>
    </div>
  );
}
