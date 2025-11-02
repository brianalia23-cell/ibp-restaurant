"use client";

import { useEffect, useState } from "react";

export default function PurchaseOrdersPage() {
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await fetch("/api/purchase-order");
        if (!res.ok) throw new Error("Failed to load purchase order");
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("❌ Error loading purchase order:", err);
        setError("No purchase order found. Try generating one first.");
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, []);

  if (loading) return <div className="p-6 text-gray-600">Loading purchase order...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold mb-2">🧾 Purchase Orders</h1>
        <p className="text-gray-600">Overview of the latest generated purchase order.</p>
      </header>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Order Summary</h2>
        <p className="text-gray-700">
          <strong>Date:</strong> {new Date(order.date).toLocaleString()}
        </p>
        <p className="text-gray-700">
          <strong>Total Items:</strong> {order.totalItems}
        </p>
        <p className="text-gray-700">
          <strong>Total Value:</strong> ${order.totalOrderValue.toFixed(2)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Unit Cost</th>
              <th className="p-3 text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i: any, idx: number) => (
              <tr key={idx} className="border-t hover:bg-gray-50 transition">
                <td className="p-3 font-medium text-gray-800">{i.item}</td>
                <td className="p-3 text-gray-600">{i.unit}</td>
                <td className="p-3 text-right">{i.quantity}</td>
                <td className="p-3 text-right">${i.unitCost.toFixed(2)}</td>
                <td className="p-3 text-right font-semibold text-blue-700">
                  ${i.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
