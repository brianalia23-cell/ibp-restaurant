// src/components/SnapshotBar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SnapshotData = {
  monthlySales: number;
  cogsPct: number;
  deliveryPct: number;
  fixed: { label: string; amount: number }[];
};

type SnapshotsMap = Record<string, SnapshotData>;
const STORAGE_KEY = "ibp:snapshots:v1";

function loadAll(): SnapshotsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveAll(map: SnapshotsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SnapshotBar({
  current,
  onLoadSnapshot,
}: {
  current: SnapshotData;
  onLoadSnapshot: (snap: SnapshotData) => void;
}) {
  const [name, setName] = useState("");
  const [snaps, setSnaps] = useState<SnapshotsMap>({});
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSnaps(loadAll());
  }, []);

  const names = useMemo(() => Object.keys(snaps).sort(), [snaps]);

  const handleSave = () => {
    if (!name.trim()) return;
    const next = { ...snaps, [name.trim()]: current };
    setSnaps(next);
    saveAll(next);
  };

  const handleLoad = (n: string) => {
    const snap = snaps[n];
    if (snap) onLoadSnapshot(snap);
  };

  const handleDelete = (n: string) => {
    const copy = { ...snaps };
    delete copy[n];
    setSnaps(copy);
    saveAll(copy);
  };

  const exportAll = () => {
    download("ibp-snapshots.json", JSON.stringify(snaps, null, 2));
  };

  const importAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const parsed = JSON.parse(txt) as SnapshotsMap;
      const merged = { ...snaps, ...parsed };
      setSnaps(merged);
      saveAll(merged);
      // reset
      if (fileRef.current) fileRef.current.value = "";
      alert("✅ Snapshots importados");
    } catch {
      alert("❌ Archivo inválido");
    }
  };

  const exportCurrent = () => {
    if (!name.trim()) {
      alert("Poné un nombre al snapshot para exportar el ‘actual’ como archivo.");
      return;
    }
    const single: SnapshotsMap = { [name.trim()]: current };
    download(`ibp-snapshot-${name.trim()}.json`, JSON.stringify(single, null, 2));
  };

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm flex flex-col gap-3 md:flex-row md:items-end">
      <div className="flex-1">
        <label className="text-sm text-gray-600">Snapshot name</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="E.g. Promo-week, High-delivery, Off-season"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} className="rounded-md bg-black px-3 py-2 text-white">
          Save snapshot
        </button>
        <button onClick={exportCurrent} className="rounded-md border px-3 py-2">
          Export current
        </button>
        <button onClick={exportAll} className="rounded-md border px-3 py-2">
          Export all
        </button>
        <label className="rounded-md border px-3 py-2 cursor-pointer">
          Import
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={importAll}
          />
        </label>
      </div>

      {names.length > 0 && (
        <div className="md:ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600">Saved:</span>
          <div className="flex flex-wrap gap-2">
            {names.map((n) => (
              <div key={n} className="flex items-center gap-1 rounded-md border px-2 py-1">
                <button
                  className="text-sm underline decoration-dotted underline-offset-2"
                  onClick={() => handleLoad(n)}
                  title="Load snapshot"
                >
                  {n}
                </button>
                <button
                  className="text-sm text-red-600"
                  onClick={() => handleDelete(n)}
                  title="Delete snapshot"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
