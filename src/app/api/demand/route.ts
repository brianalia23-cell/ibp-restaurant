import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Utilidad para leer y escribir archivos JSON
function readJSON(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

function writeJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Recalcular purchasing y pnl al guardar demanda
async function recalcAll() {
  const base = path.join(process.cwd(), "src/data");
  const bom = readJSON(path.join(base, "bom.json"));
  const demand = readJSON(path.join(base, "demand.json"));
  const prices = readJSON(path.join(base, "prices_purchase.json"));
  const pnlPath = path.join(base, "pnl.json");

  // calcular materiales requeridos
  const requirements: Record<string, { unit: string; required: number; cost: number }> = {};
  demand.forEach(({ product, quantity }: any) => {
    const recipe = bom.find((b: any) => b.product === product);
    if (!recipe) return;
    recipe.ingredients.forEach(({ item, unit, quantity: q }: any) => {
      const priceInfo = prices.find((p: any) => p.item === item);
      const cost = priceInfo ? priceInfo.cost : 0;
      if (!requirements[item]) requirements[item] = { unit, required: 0, cost };
      requirements[item].required += q * quantity;
    });
  });

  const items = Object.entries(requirements).map(([item, { unit, required, cost }]) => ({
    item,
    unit,
    required,
    totalCost: required * cost,
  }));

  const totalMaterialsCost = items.reduce((sum, i) => sum + i.totalCost, 0);

  // actualizar purchasing.json
  writeJSON(path.join(base, "purchasing.json"), { totalMaterialsCost, items });

  // actualizar pnl.json
  const pnl = readJSON(pnlPath);
  pnl.materialsCost = totalMaterialsCost;
  writeJSON(pnlPath, pnl);

  console.log("♻️ Demand updated → recalculated purchasing & pnl");
}

export async function GET() {
  const demandPath = path.join(process.cwd(), "src/data/demand.json");
  const data = readJSON(demandPath);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const demandPath = path.join(process.cwd(), "src/data/demand.json");
  const body = await req.json();
  writeJSON(demandPath, body);
  await recalcAll();
  return NextResponse.json({ message: "Demand updated and system recalculated" });
}
