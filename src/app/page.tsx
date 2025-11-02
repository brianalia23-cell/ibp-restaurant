// src/app/page.tsx
import { syncCatalog } from "@/lib/syncCatalog";
import ChartsDashboard from "@/components/ChartsDashboard";

export default async function Page() {
  // Ejecutar sync sin bloquear el render (y sin romper si falla)
  try {
    syncCatalog();
  } catch (e) {
    console.error("syncCatalog error (ignored):", e);
  }

  const [pnlRes, pricingRes] = await Promise.all([
    fetch("http://localhost:3000/api/pnl", { cache: "no-store" }),
    fetch("http://localhost:3000/api/pricing", { cache: "no-store" }),
  ]);
  const pnl = await pnlRes.json();
  const pricing = await pricingRes.json();

  const { monthlySales, materialsCost, fixedTotal, grossMargin, netProfit } = pnl;
  const avgMarginPct = Math.round((pricing?.avgMarginPct ?? 0) * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">IBP Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Monthly Sales" value={`$${Number(monthlySales ?? 0).toFixed(2)}`} />
        <Kpi label="Materials Cost" value={`$${Number(materialsCost ?? 0).toFixed(2)}`} />
        <Kpi label="Fixed Costs" value={`$${Number(fixedTotal ?? 0).toFixed(2)}`} />
        <Kpi label="Avg SKU Margin" value={`${avgMarginPct}%`} />
        <Kpi label="Gross Margin" value={`$${Number(grossMargin ?? 0).toFixed(2)}`} />
        <Kpi label="Net Profit" value={`$${Number(netProfit ?? 0).toFixed(2)}`} />
      </div>

      <ChartsDashboard data={pnl} />

      {netProfit < 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 mt-4">
          ❌ Pérdida. Necesitás +${Math.abs(netProfit).toFixed(2)} de ventas para llegar al break-even.
        </div>
      )}
    </div>
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
