"use client";

import { useEffect, useState } from "react";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/inventory");
        const json = await res.json();
        if (!json.items) throw new Error("Invalid response from API");
        setItems(json.items);
      } catch (err) {
        console.error("❌ Error loading inventory:", err);
        setError("Failed to load inventory data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="p-6 text-gray-600">Loading inventory...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // Handler para generar la orden de compra
  const handleGeneratePO = async () => {
    try {
      const res = await fetch("/api/purchase-order", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate purchase order");
      const json = await res.json();
      alert(`✅ Purchase Order created! Total value: $${json.totalOrderValue}`);
    } catch (err) {
      console.error("❌ Error generating PO:", err);
      alert("Error generating Purchase Order");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold mb-2">📦 Inventory Management</h1>
        <p className="text-gray-600">
          Monitor your stock levels and suggested purchases automatically based on safety stock and demand.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-right">Safety Stock</th>
              <th className="p-3 text-right">Required</th>
              <th className="p-3 text-right">Suggested Purchase</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {items.map((i, idx) => (
              <tr
                key={idx}
                className={`border-t transition-colors ${
                  i.alert === "Low Stock"
                    ? "bg-yellow-50 hover:bg-yellow-100"
                    : i.alert === "Out of Stock"
                    ? "bg-red-50 hover:bg-red-100"
                    : "hover:bg-gray-50"
                }`}
              >
                <td className="p-3 font-medium text-gray-800">{i.item}</td>
                <td className="p-3 text-gray-600">{i.unit}</td>
                <td className="p-3 text-right">{i.stock}</td>
                <td className="p-3 text-right">{i.safetyStock}</td>
                <td className="p-3 text-right text-gray-700">{i.required}</td>
                <td className="p-3 text-right font-semibold text-blue-700">
                  {i.suggestedPurchase}
                </td>
                <td
                  className={`p-3 text-center font-medium ${
                    i.alert === "Low Stock"
                      ? "text-yellow-700"
                      : i.alert === "Out of Stock"
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  {i.alert}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Summary</h2>
        <p className="text-gray-700">
          Total items monitored: <strong>{items.length}</strong>
        </p>
        <p className="text-gray-700">
          Low stock alerts:{" "}
          <strong className="text-yellow-700">
            {items.filter((i) => i.alert === "Low Stock").length}
          </strong>{" "}
          | Out of stock:{" "}
          <strong className="text-red-700">
            {items.filter((i) => i.alert === "Out of Stock").length}
          </strong>
        </p>
      </div>

      {/* 🧾 Action Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleGeneratePO}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition"
        >
          🧾 Generate Purchase Order
        </button>
      </div>
    </div>
  );
}
