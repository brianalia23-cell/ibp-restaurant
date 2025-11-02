// src/app/api/integrated/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const base = (file: string) => path.join(process.cwd(), "src/data", file);

export async function GET() {
  try {
    const demand = JSON.parse(fs.readFileSync(base("demand.json"), "utf8"));
    const bom = JSON.parse(fs.readFileSync(base("bom.json"), "utf8"));
    const prices = JSON.parse(fs.readFileSync(base("prices_sales.json"), "utf8"));
    const purchase = JSON.parse(fs.readFileSync(base("prices_purchase.json"), "utf8"));
    const pnl = JSON.parse(fs.readFileSync(base("pnl.json"), "utf8") || "{}");

    // 🔹 Calcular ingresos por producto (precio * demanda)
    const salesData = demand.map((d: any) => {
      const salePrice = prices.find((p: any) => p.product === d.product)?.price || 0;
      return { product: d.product, units: d.quantity, price: salePrice, revenue: d.quantity * salePrice };
    });

    const totalRevenue = salesData.reduce((sum: number, p: any) => sum + p.revenue, 0);

    // 🔹 Calcular costo de materiales por producto (usando BOM + precios de compra)
    const costData = bom.map((b: any) => {
      const totalCost = b.ingredients.reduce((sum: number, ing: any) => {
        const cost = purchase.find((p: any) => p.item === ing.item)?.cost || 0;
        return sum + cost * ing.quantity;
      }, 0);
      return { product: b.product, materialCost: totalCost };
    });

    const totalMaterialCost = costData.reduce((sum: number, c: any) => sum + c.materialCost, 0);

    // 🔹 Calcular gastos fijos desde P&L
    const fixed = pnl.fixed || [];
    const fixedTotal = fixed.reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);

    // 🔹 Margen bruto y neto
    const grossMargin = totalRevenue - totalMaterialCost;
    const netProfit = grossMargin - fixedTotal;

    const integrated = {
      summary: {
        totalRevenue,
        totalMaterialCost,
        fixedTotal,
        grossMargin,
        netProfit,
      },
      detail: {
        salesData,
        costData,
      },
    };

    return NextResponse.json(integrated);
  } catch (err) {
    console.error("❌ Error in integrated route:", err);
    return NextResponse.json({ error: "Integration failed" }, { status: 500 });
  }
}
