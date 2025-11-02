"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type POItem = {
  item: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

type PurchaseOrder = {
  id: string;
  date: string;
  totalItems: number;
  totalOrderValue: number;
  items: POItem[];
};

export default function PurchaseOrdersHistoryPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      // 🔥 cache: 'no-store' para evitar caché del fetch
      const res = await fetch("/api/purchase-orders-history", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error("Invalid history format");
      setOrders(json);
    } catch (e: any) {
      console.error("❌ Error loading history:", e);
      setErr("Failed to load purchase orders history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">🧾 Purchase Orders — History</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            ⟳ Refresh
          </button>
          <Link
            href="/inventory"
            className="rounded-lg bg-gray-200 hover:bg-gray-300 px-3 py-2 text-sm"
          >
            ← Back to Inventory
          </Link>
        </div>
      </div>

      {loading && <div className="text-gray-600">Loading…</div>}
      {err && <div className="text-red-600">{err}</div>}

      {!loading && !err && (
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 text-left">Order ID</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-right">Items</th>
                <th className="p-3 text-right">Total ($)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-600" colSpan={5}>
                    No purchase orders yet.
                  </td>
                </tr>
              )}

              {orders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    <Link
                      href={`/purchase-orders/${o.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {o.id}
                    </Link>
                  </td>
                  <td className="p-3">
                    {new Date(o.date).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">{o.totalItems}</td>
                  <td className="p-3 text-right">
                    ${o.totalOrderValue.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <a
                      href={`/api/purchase-order/${o.id}?format=csv`}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 mr-2"
                    >
                      CSV
                    </a>
                    <a
                      href={`/api/purchase-order/${o.id}?format=pdf`}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
