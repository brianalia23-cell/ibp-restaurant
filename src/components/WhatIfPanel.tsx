// src/components/WhatIfPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

export type WhatIfState = {
  salesUpliftPct: number;       // +-% sobre ventas
  cogsPctOverride: number|null; // si es null, usa el del P&L
  deliveryPctOverride: number|null;
  materialsMultiplier: number;  // factor sobre materialsCost (ej 1.1 = +10%)
};

export type WhatIfInputs = {
  monthlySales: number;
  cogsPct: number;
  deliveryPct: number;
  materialsCost: number;
  fixedTotal: number;
};

export default function WhatIfPanel({
  base,
  onApply,
}: {
  base: WhatIfInputs;
  onApply: (applied: { monthlySales: number; cogsPct: number; deliveryPct: number; materialsCost: number }) => void;
}) {
  const [state, setState] = useState<WhatIfState>({
    salesUpliftPct: 0,
    cogsPctOverride: null,
    deliveryPctOverride: null,
    materialsMultiplier: 1,
  });

  // Cargar último escenario desde localStorage (si existe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("whatif:last");
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);

  // Guardar automáticamente el escenario actual
  useEffect(() => {
    try {
      localStorage.setItem("whatif:last", JSON.stringify(state));
    } catch {}
  }, [state]);

  const preview = useMemo(() => {
    const sales = base.monthlySales * (1 + (state.salesUpliftPct || 0) / 100);
    const cogsPct = state.cogsPctOverride ?? base.cogsPct;
    const deliveryPct = state.deliveryPctOverride ?? base.deliveryPct;
    const materials = base.materialsCost * (state.materialsMultiplier || 1);

    const cogs = sales * (cogsPct || 0);
    const delivery = sales * (deliveryPct || 0);
    const gross = sales - cogs - delivery - materials;
    const net = gross - base.fixedTotal;

    return {
      sales,
      cogsPct,
      deliveryPct,
      materials,
      gross,
      net,
    };
  }, [base, state]);

  const reset = () =>
    setState({
      salesUpliftPct: 0,
      cogsPctOverride: null,
      deliveryPctOverride: null,
      materialsMultiplier: 1,
    });

  const applyNow = () =>
    onApply({
      monthlySales: preview.sales,
      cogsPct: preview.cogsPct,
      deliveryPct: preview.deliveryPct,
      materialsCost: preview.materials,
    });

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">What-if (simulación)</h2>
        <div className="flex gap-2">
          <button onClick={reset} className="rounded-md border px-3 py-1 text-sm">Reset</button>
          <button onClick={applyNow} className="rounded-md bg-black px-3 py-1 text-sm text-white">Apply to P&L</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Ventas */}
        <Control
          label={`Sales uplift (%) — actual $${base.monthlySales.toLocaleString()}`}
          value={state.salesUpliftPct}
          min={-50}
          max={200}
          step={1}
          onChange={(v) => setState((s) => ({ ...s, salesUpliftPct: v }))}
          suffix="%"
        />

        {/* COGS % */}
        <PercentOverride
          label={`COGS % — actual ${(base.cogsPct * 100).toFixed(0)}%`}
          value={state.cogsPctOverride}
          onChange={(v) => setState((s) => ({ ...s, cogsPctOverride: v }))}
        />

        {/* Delivery % */}
        <PercentOverride
          label={`Delivery % — actual ${(base.deliveryPct * 100).toFixed(0)}%`}
          value={state.deliveryPctOverride}
          onChange={(v) => setState((s) => ({ ...s, deliveryPctOverride: v }))}
        />

        {/* Materiales */}
        <Control
          label={`Materials × — actual $${base.materialsCost.toFixed(2)}`}
          value={state.materialsMultiplier}
          min={0.5}
          max={2}
          step={0.01}
          onChange={(v) => setState((s) => ({ ...s, materialsMultiplier: v }))}
          suffix="×"
        />
      </div>

      {/* Comparación rápida */}
      <div className="grid gap-3 md:grid-cols-2">
        <Kpi title="Sales (preview)" value={`$${preview.sales.toFixed(2)}`} />
        <Kpi title="Materials (preview)" value={`$${preview.materials.toFixed(2)}`} />
        <Kpi title="Gross Margin (preview)" value={`$${preview.gross.toFixed(2)}`} />
        <Kpi title="Net Profit (preview)" value={`$${preview.net.toFixed(2)}`} />
      </div>
    </div>
  );
}

function Control({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="space-y-1 block">
      <div className="text-sm text-gray-600 flex justify-between">
        <span>{label}</span>
        <span className="font-medium">{value}{suffix ?? ""}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

function PercentOverride({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number|null;
  onChange: (v: number|null) => void;
}) {
  const showing = value ?? NaN; // NaN indica "usar valor actual del P&L"
  return (
    <label className="space-y-1 block">
      <div className="text-sm text-gray-600 flex items-center justify-between gap-2">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border px-2 py-1 text-xs"
            onClick={() => onChange(null)}
            title="Use P&L value"
          >
            Use P&L
          </button>
          <span className="font-medium">
            {Number.isNaN(showing) ? "—" : `${(showing * 100).toFixed(0)}%`}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Number.isNaN(showing) ? 0 : showing * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full"
        disabled={Number.isNaN(showing)}
      />
    </label>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
