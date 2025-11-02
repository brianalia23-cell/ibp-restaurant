import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ===== Tipos =====
type Ingredient = { item: string; unit: string; quantity: number };
type ProductBOM = { product: string; ingredients: Ingredient[] };
type DemandItem = { product: string; quantity: number };
type PriceItem = { item: string; unit: string; cost: number };

// ===== Config =====
const dataDir = path.join(process.cwd(), "src/data");

// ===== Helpers =====
function readJSON<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function calcMaterials(bom: ProductBOM[], demand: DemandItem[], prices: PriceItem[]) {
  const requirements: Record<string, { unit: string; required: number; unitCost: number }> = {};

  for (const { product, quantity } of demand) {
    const recipe = bom.find((b) => b.product === product);
    if (!recipe) continue;

    for (const ing of recipe.ingredients) {
      const { item, unit, quantity: q } = ing;
      const price = prices.find((p) => p.item === item)?.cost ?? 0;

      if (!requirements[item]) {
        requirements[item] = { unit, required: 0, unitCost: price };
      }

      requirements[item].required += q * quantity;
      requirements[item].unitCost = price;
    }
  }

  const items = Object.entries(requirements).map(([item, { unit, required, unitCost }]) => ({
    item,
    unit,
    required: parseFloat(required.toFixed(2)),
    unitCost: parseFloat(unitCost.toFixed(4)),
    totalCost: parseFloat((required * unitCost).toFixed(2)),
  }));

  const totalMaterialsCost = parseFloat(
    items.reduce((sum, i) => sum + i.totalCost, 0).toFixed(2)
  );

  return { items, totalMaterialsCost };
}

// ===== Handlers =====
export async function GET() {
  try {
    const bom = readJSON<ProductBOM[]>(path.join(dataDir, "bom.json"), []);
    const demand = readJSON<DemandItem[]>(path.join(dataDir, "demand.json"), []);
    const prices = readJSON<PriceItem[]>(path.join(dataDir, "prices_purchase.json"), []);
    const pnl = readJSON<any>(path.join(dataDir, "pnl.json"), {
      monthlySales: 0,
      cogsPct: 0,
      deliveryPct: 0,
      fixed: [],
    });

    const { items, totalMaterialsCost } = calcMaterials(bom, demand, prices);

    const fixedTotal = Array.isArray(pnl.fixed)
      ? pnl.fixed.reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0)
      : 0;

    const grossMargin =
      pnl.monthlySales -
      pnl.monthlySales * (pnl.cogsPct || 0) -
      pnl.monthlySales * (pnl.deliveryPct || 0) -
      totalMaterialsCost;

    const netProfit = grossMargin - fixedTotal;

    const result = {
      ...pnl,
      materialsCost: totalMaterialsCost,
      fixedTotal,
      grossMargin: parseFloat(grossMargin.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
    };

    // ✅ Guardar sincronizado
    writeJSON(path.join(dataDir, "purchasing.json"), { totalMaterialsCost, items });
    writeJSON(path.join(dataDir, "pnl.json"), result);

    console.log(`💾 Updated pnl.json — Materials: $${totalMaterialsCost.toFixed(2)}`);

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ Error in /api/pnl:", err);
    return NextResponse.json({ error: "Failed to calculate P&L" }, { status: 500 });
  }
}

// ===== POST (para guardar cambios manualmente desde el frontend) =====
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const filePath = path.join(dataDir, "pnl.json");

    writeJSON(filePath, body);

    console.log("💾 Saved pnl.json via POST");
    return NextResponse.json({ message: "✅ P&L data saved successfully" });
  } catch (err) {
    console.error("❌ Error saving P&L data:", err);
    return NextResponse.json({ error: "Failed to save P&L data" }, { status: 500 });
  }
}
