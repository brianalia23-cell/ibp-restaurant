// src/components/SnapshotManager.tsx
"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  id: string;
  name: string;
  date: string;
  pnl: any;
};

export default function SnapshotManager({ current }: { current: any }) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [name, setName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Cargar snapshots existentes desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("snapshots");
      if (raw) setSnapshots(JSON.parse(raw));
    } catch {}
  }, []);

  // Guardar snapshots al cambiar
  useEffect(() => {
    try {
      localStorage.setItem("snapshots", JSON.stringify(snapshots));
    } catch {}
  }, [snapshots]);

  const saveSnapshot = () => {
    if (!name.trim()) return alert("Enter a name for the scenario");
    const id = Date.now().toString();
    const date = new Date().toLocaleString();
    const newSnap: Snapshot = { id, name, date, pnl: current };
    setSnapshots((prev) => [...prev, newSnap]);
    setName("");
    setToast(`✅ Saved snapshot "${name}"`);
    setTimeout(() => setToast(null), 2000);
  };

  const loadSnapshot = (snap: Snapshot) => {
    localStorage.setItem("snapshot:active", JSON.stringify(snap));
    window.dispatchEvent(new CustomEvent("snapshot:load", { detail: snap }));
    setToast(`📦 Loaded "${snap.name}"`);
    setTimeout(() => setToast(null), 2000);
  };

  const deleteSnapshot = (id: string) => {
    if (!confirm("Delete this snapshot?")) return;
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const compareToCurrent = (snap: Snapshot) => {
    const diffGross = (current.grossMargin ?? 0) - (snap.pnl.grossMargin ?? 0);
    const diffNet = (current.netProfit ?? 0) - (snap.pnl.netProfit ?? 0);
    const diffSales = (current.monthlySales ?? 0) - (snap.pnl.monthlySales ?? 0);
    alert(
      `📊 Comparison vs "${snap.name}"\n\n` +
      `Sales Δ: ${diffSales.toFixed(2)}\n` +
      `Gross Margin Δ: ${diffGross.toFixed(2)}\n` +
      `Net Profit Δ: ${diffNet.toFixed(2)}`
    );
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">💾 Scenario Snapshots</h2>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="Scenario name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="rounded-md bg-black px-3 py-2 text-sm text-white"
          onClick={saveSnapshot}
        >
          Save
        </button>
      </div>

      {snapshots.length === 0 ? (
        <div className="text-gray-500 text-sm">No saved snapshots yet</div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Date</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.date}</td>
                <td className="p-2 text-right space-x-2">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => loadSnapshot(s)}
                  >
                    Load
                  </button>
                  <button
                    className="text-green-600 hover:underline"
                    onClick={() => compareToCurrent(s)}
                  >
                    Compare
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => deleteSnapshot(s.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-black text-white px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
