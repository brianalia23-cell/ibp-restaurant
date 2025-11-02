"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await fetch("/api/purchase-orders-history");
        const orders = await res.json();
        const found = orders.find((o: any) => o.id === id);
        if (!found) throw new Error("Order not found");
        setOrder(found);
      } catch (err) {
        console.error("❌ Error loading order:", err);
        setError("Failed to load purchase order details.");
      }
    };
    loadOrder();
  }, [id]);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!order) return <div className="p-6 text-gray-600">Loading order details...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">🧾 Purchase Order {order.id}</h1>
        <p className="text-gray-600">Date: {new Date(order.date).toLocaleString()}</p>

        {/* 🧩 Botones de descarga */}
        <div className="flex gap-3 mt-4">
          <a
            href={`/api/purchase-order/${order.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            ⬇️ Download PDF
          </a>
          <a
            href={`/api/purchase-order/${order.id}?format=csv`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            ⬇️ Download CSV
          </a>
        </div>
      </header>

      {/* 🧾 Tabla de ítems */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Unit Cost ($)</th>
              <th className="p-3 text-right">Total ($)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i: any, idx: number) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
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

      {/* 🧮 Resumen */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <p>Total items: <strong>{order.totalItems}</strong></p>
        <p>Total order value: <strong>${order.totalOrderValue.toFixed(2)}</strong></p>
      </div>

      <button
        onClick={() => (window.location.href = "/purchase-orders/history")}
        className="mt-4 rounded-lg bg-gray-200 hover:bg-gray-300 px-4 py-2 text-sm"
      >
        ← Back to History
      </button>
    </div>
  );
}
