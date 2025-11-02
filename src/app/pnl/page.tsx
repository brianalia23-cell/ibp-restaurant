// src/app/pnl/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WhatIfPanel from "@/components/WhatIfPanel";
import SnapshotBar, { SnapshotData } from "@/components/SnapshotBar";

type FixedCost = { label: string; amount: number };
type PnL = {
  monthlySales: number;
  cogsPct: number;
  deliveryPct: number;
  fixed: FixedCost[];
  materialsCost?: number;
  grossMargin?: number;
  fixedTotal?: number;
  netProfit?: number;
};

type HealthStatus = "healthy" | "lowMargin" | "loss" | "neutral";

export default function PnlPage() {
  const [data, setData] = useState<PnL | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const lastStatus = useRef<HealthStatus>("neutral");

  // Cargar P&L actual del backend
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/pnl", { cache: "no-store" });
      const json = (await res.json()) as PnL;
      setData({
        monthlySales: json.monthlySales ?? 0,
        cogsPct: json.cogsPct ?? 0,
        deliveryPct: json.deliveryPct ?? 0,
        fixed: Array.isArray(json.fixed) ? json.fixed : [],
        materialsCost: json.materialsCost ?? 0,
      });
    })();
  }, []);

  const derived = useMemo(() => {
    if (!data) return { fixedTotal: 0, grossMargin: 0, netProfit: 0, grossMarginPct: 0 };
    const fixedTotal = (data.fixed ?? []).reduce((s, f) => s + (Number(f.amount) || 0), 0);
    const materials = data.materialsCost ?? 0;
    const sales = Number(data.monthlySales) || 0;
    const cogs = sales * (data.cogsPct || 0);
    const delivery = sales * (data.deliveryPct || 0);
    const grossMargin = sales - cogs - delivery - materials;
    const netProfit = grossMargin - fixedTotal;
    const grossMarginPct = sales > 0 ? grossMargin / sales : 0;
    return { fixedTotal, grossMargin, netProfit, grossMarginPct };
  }, [data]);

  const health: HealthStatus = useMemo(() => {
    if (!data) return "neutral";
    if (derived.netProfit < 0) return "loss";
    if (derived.grossMarginPct < 0.2) return "lowMargin";
    if (data.monthlySales <= 0) return "neutral";
    return "healthy";
  }, [data, derived]);

  useEffect(() => {
    if (health !== lastStatus.current) {
      const msg =
        health === "loss"
          ? "🔴 Operando con pérdida"
          : health === "lowMargin"
          ? "🟠 Margen bruto por debajo del 20%"
          : health === "healthy"
          ? "🟢 Finanzas saludables"
          : "ℹ️ Ingresá ventas para evaluar";
      setToast(msg);
      lastStatus.current = health;
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [health]);

  const update = (patch: Partial<PnL>) => setData((prev) => (prev ? { ...prev, ...patch } : prev));
  const updateFixed = (i: number, patch: Partial<FixedCost>) =>
    setData((prev) => {
      if (!prev) return prev;
      const fixed = [...(prev.fixed ?? [])];
      fixed[i] = { ...fixed[i], ...patch };
      return { ...prev, fixed };
    });
  const addFixed = () =>
    setData((prev) => (prev ? { ...prev, fixed: [...(prev.fixed ?? []), { label: "New cost", amount: 0 }] } : prev));
  const removeFixed = (i: number) =>
    setData((prev) => {
      if (!prev) return prev;
      const fixed = [...(prev.fixed ?? [])];
      fixed.splice(i, 1);
      return { ...prev, fixed };
    });

  const save = async () => {
    if (!data) return;
    try {
      setSaving(true);
      const res = await fetch("/api/pnl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // guardamos solo lo que corresponde al P&L editable
        body: JSON.stringify({
          monthlySales: data.monthlySales,
          cogsPct: data.cogsPct,
          deliveryPct: data.deliveryPct,
          fixed: data.fixed ?? [],
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const refreshed = await fetch("/api/pnl", { cache: "no-store" });
      const json = await refreshed.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              monthlySales: json.monthlySales ?? prev.monthlySales,
              cogsPct: json.cogsPct ?? prev.cogsPct,
              deliveryPct: json.deliveryPct ?? prev.deliveryPct,
              fixed: Array.isArray(json.fixed) ? json.fixed : prev.fixed,
              materialsCost: json.materialsCost ?? prev.materialsCost ?? 0,
            }
          : prev
      );
      setToast("✅ Saved successfully!");
    } catch (err) {
      console.error("❌ Error saving:", err);
      setToast("❌ Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // ---- SNAPSHOTS ----
  const currentSnapshot: SnapshotData | null = data
    ? {
        monthlySales: data.monthlySales ?? 0,
        cogsPct: data.cogsPct ?? 0,
        deliveryPct: data.deliveryPct ?? 0,
        fixed: Array.isArray(data.fixed) ? data.fixed : [],
      }
    : null;

  const loadSnapshot = (snap: SnapshotData) => {
    // Cargamos snapshot en pantalla (no persiste hasta presionar Save)
    setData((prev) =>
      prev
        ? {
            ...prev,
            monthlySales: snap.monthlySales,
            cogsPct: snap.cogsPct,
            deliveryPct: snap.deliveryPct,
            fixed: Array.isArray(snap.fixed) ? snap.fixed : [],
          }
        : {
            monthlySales: snap.monthlySales,
            cogsPct: snap.cogsPct,
            deliveryPct: snap.deliveryPct,
            fixed: Array.isArray(snap.fixed) ? snap.fixed : [],
            materialsCost: 0,
          }
    );
    setToast("📦 Snapshot loaded (remember to Save to persist)");
  };

  if (!data) return <div className="p-6 text-gray-600">Loading P&L…</div>;

  const banner =
    health === "loss"
      ? { cls: "border-red-200 bg-red-50 text-red-700", text: "Pérdida neta. Revisá precios, costos o volumen." }
      : health === "lowMargin"
      ? { cls: "border-amber-200 bg-amber-50 text-amber-700", text: "Margen bruto < 20%. Atención al costo/venta." }
      : health === "healthy"
      ? { cls: "border-emerald-200 bg-emerald-50 text-emerald-700", text: "Finanzas saludables. Buen trabajo." }
      : { cls: "border-gray-200 bg-gray-50 text-gray-700", text: "Ingresá ventas para evaluar el estado." };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">P&amp;L — Snapshots + What-if + Alerts</h1>

      <div className={`rounded-lg border p-4 ${banner.cls}`}>{banner.text}</div>

      {/* Snapshots */}
      {currentSnapshot && (
        <SnapshotBar
          current={currentSnapshot}
          onLoadSnapshot={loadSnapshot}
        />
      )}

      {/* Inputs principales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Monthly Sales ($)" value={data.monthlySales} onChange={(v) => update({ monthlySales: v })} />
        <Field label="COGS %" value={(data.cogsPct ?? 0) * 100} onChange={(v) => update({ cogsPct: (v || 0) / 100 })} />
        <Field
          label="Delivery %"
          value={(data.deliveryPct ?? 0) * 100}
          onChange={(v) => update({ deliveryPct: (v || 0) / 100 })}
        />
      </div>

      {/* Fixed costs */}
      <div className="space-y-2">
        <div className="font-medium">Fixed costs</div>
        {(data.fixed ?? []).map((f, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input
              className="rounded-md border px-3 py-2"
              value={f.label}
              onChange={(e) => updateFixed(i, { label: e.target.value })}
            />
            <input
              type="number"
              className="col-span-2 rounded-md border px-3 py-2"
              value={Number.isFinite(f.amount) ? f.amount : 0}
              onChange={(e) => updateFixed(i, { amount: Number(e.target.value) || 0 })}
            />
            <button className="justify-self-start text-sm text-red-600 hover:underline" onClick={() => removeFixed(i)}>
              Remove
            </button>
          </div>
        ))}
        <button className="rounded-md border px-3 py-2" onClick={addFixed}>
          + Add cost
        </button>
      </div>

      {/* KPIs actuales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Kpi label="Monthly Sales" value={`$${(data.monthlySales ?? 0).toLocaleString()}`} />
        <Kpi label="Materials Cost" value={`$${(data.materialsCost ?? 0).toFixed(2)}`} />
        <Kpi label="Fixed Costs" value={`$${derived.fixedTotal.toFixed(2)}`} />
        <Kpi
          label="Gross Margin"
          value={`$${derived.grossMargin.toFixed(2)} (${Math.round((derived.grossMarginPct || 0) * 100)}%)`}
        />
        <Kpi label="Net Profit" value={`$${derived.netProfit.toFixed(2)}`} />
      </div>

      {/* What-if */}
      <WhatIfPanel
        base={{
          monthlySales: data.monthlySales ?? 0,
          cogsPct: data.cogsPct ?? 0,
          deliveryPct: data.deliveryPct ?? 0,
          materialsCost: data.materialsCost ?? 0,
          fixedTotal: derived.fixedTotal,
        }}
        onApply={async (applied) => {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  monthlySales: applied.monthlySales,
                  cogsPct: applied.cogsPct,
                  deliveryPct: applied.deliveryPct,
                  materialsCost: applied.materialsCost,
                }
              : prev
          );
          try {
            const res = await fetch("/api/pnl", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                monthlySales: applied.monthlySales,
                cogsPct: applied.cogsPct,
                deliveryPct: applied.deliveryPct,
                fixed: data?.fixed ?? [],
              }),
            });
            if (!res.ok) throw new Error("Save failed");
            const refreshed = await fetch("/api/pnl", { cache: "no-store" });
            const json = await refreshed.json();
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    monthlySales: json.monthlySales ?? applied.monthlySales,
                    cogsPct: json.cogsPct ?? applied.cogsPct,
                    deliveryPct: json.deliveryPct ?? applied.deliveryPct,
                    fixed: Array.isArray(json.fixed) ? json.fixed : prev.fixed,
                    materialsCost: json.materialsCost ?? applied.materialsCost,
                  }
                : prev
            );
            setToast("✅ What-if applied & saved");
          } catch (e) {
            console.error(e);
            setToast("❌ Error applying what-if");
          }
        }}
      />

      <button onClick={save} disabled={saving} className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60">
        {saving ? "Saving…" : "Save P&L"}
      </button>

      {toast && <div className="fixed bottom-4 right-4 rounded-lg bg-black text-white px-4 py-2 shadow-lg">{toast}</div>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="space-y-1">
      <div className="text-sm text-gray-600">{label}</div>
      <input
        type="number"
        className="w-full rounded-md border px-3 py-2"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
