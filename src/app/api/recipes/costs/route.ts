import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");
const bomPath = path.join(dataDir, "bom.json");
const purchasesPath = path.join(dataDir, "prices_purchase.json");
const costsPath = path.join(dataDir, "costs_recipes.json");

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

export async function GET() {
  const bom = readJSON<any[]>(bomPath, []);
  const purchases = readJSON<any[]>(purchasesPath, []);

  const results = bom.map((recipe) => {
    const totalCost = (recipe.ingredients || []).reduce((sum: number, ing: any) => {
      const price = purchases.find((p) => p.item === ing.item)?.cost ?? 0;
      return sum + price * (ing.quantity || 0);
    }, 0);

    return {
      product: recipe.product,
      totalCost: Number(totalCost.toFixed(2)),
    };
  });

  // Guardar costos calculados
  writeJSON(costsPath, results);

  return NextResponse.json({
    ok: true,
    count: results.length,
    results,
  });
}
