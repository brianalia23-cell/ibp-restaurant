"use client";

import { useState, useEffect } from "react";

export default function DemandPage() {
  const [demand, setDemand] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/demand");
      const data = await res.json();
      setDemand(data);
    };
    load();
  }, []);

  const updateQuantity = (index: number, value: number) => {
    const copy = [...demand];
    copy[index].quantity = value;
    setDemand(copy);
  };

  const saveChanges = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demand),
      });
      const result = await res.json();
      setMessage(result.message);
    } catch (err) {
      setMessage("❌ Error saving demand data");
    } finally {
      setSaving(false);
    }
  };

  if (!demand.length)
    return <div className="p-6 text-gray-600">Loading demand data…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">📈 Demand Forecast</h1>
      <table className="w-full border-collapse rounded-lg shadow overflow-hidden">
        <thead className="bg-gray-100 border-b text-left">
          <tr>
            <th className="p-2">Product</th>
            <th className="p-2 text-right">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {demand.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{row.product}</td>
              <td className="p-2 text-right">
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) =>
                    updateQuantity(i, parseFloat(e.target.value) || 0)
                  }
                  className="w-24 border rounded-md px-2 py-1 text-right"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={saveChanges}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition"
      >
        {saving ? "Saving…" : "💾 Save and Recalculate"}
      </button>

      {message && (
        <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded">
          {message}
        </div>
      )}
    </div>
  );
}
