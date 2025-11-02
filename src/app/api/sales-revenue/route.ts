import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Demand = { product: string; quantity: number };
type Price = { product: string; price: number };

const dataDir = path.join(process.cwd(), "src/data");
const demandPath = path.join(dataDir, "demand.json");
const pricesSalesPath = path.join(dataDir, "prices_sales.json");
const pnlPath = path.join(dataDir, "pnl.json");

function readJSON<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); } catch { return fallback; }
}
function writeJSON(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export async function POST() {
  try {
    const demand = readJSON<Demand[]>(demandPath, []);
    const prices = readJSON<Price[]>(pricesSalesPath, []);
    const pnl = readJSON<any>(pnlPath, { monthlySales: 0, cogsPct: 0, deliveryPct: 0, fixed: [] });

    const revenueByProduct = demand.map((d) => {
      const p = prices.find((x) => x.product === d.product)?.price ?? 0;
      return { product: d.product, revenue: (d.quantity || 0) * p };
    });
    const totalRevenue = revenueByProduct.reduce((s, r) => s + r.revenue, 0);

    const updated = { ...pnl, monthlySales: parseFloat(totalRevenue.toFixed(2)) };
    writeJSON(pnlPath, updated);

    return NextResponse.json({ revenueByProduct, totalRevenue: updated.monthlySales });
  } catch (e) {
    console.error("❌ Error in /api/sales-revenue:", e);
    return NextResponse.json({ error: "Failed to compute sales revenue" }, { status: 500 });
  }
}
