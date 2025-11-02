import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Ingredient = { item: string; unit: string; quantity: number };
type ProductBOM = { product: string; ingredients: Ingredient[] };
type DemandItem = { product: string; quantity: number };
type PriceItem = { item: string; unit: string; cost: number };

export async function GET() {
  try {
    const basePath = path.join(process.cwd(), "src/data");

    const bomPath = path.join(basePath, "bom.json");
    const demandPath = path.join(basePath, "demand.json");
    const pricesPath = path.join(basePath, "prices_purchase.json");
    const pnlPath = path.join(basePath, "pnl.json");
    const purchasingPath = path.join(basePath, "purchasing.json");

    // ✅ Leer archivos base
    const bom: ProductBOM[] = JSON.parse(fs.readFileSync(bomPath, "utf8"));
    const demand: DemandItem[] = JSON.parse(fs.readFileSync(demandPath, "utf8"));
    const prices: PriceItem[] = JSON.parse(fs.readFileSync(pricesPath, "utf8"));

    if (!Array.isArray(bom) || !Array.isArray(demand) || !Array.isArray(prices)) {
      return NextResponse.json(
        { error: "Missing or invalid BOM, Demand or Prices data" },
        { status: 400 }
      );
    }

    // ✅ Calcular materiales requeridos
    const requirements: Record<
      string,
      { unit: string; required: number; cost: number }
    > = {};

    for (const { product, quantity } of demand) {
      const recipe = bom.find((b) => b.product === product);
      if (!recipe) continue;

      for (const ing of recipe.ingredients as Ingredient[]) {
        const { item, unit, quantity: q } = ing;
        const priceInfo = prices.find((p) => p.item === item);
        const cost = priceInfo ? priceInfo.cost : 0;

        if (!requirements[item]) {
          requirements[item] = { unit, required: 0, cost };
        }

        requirements[item].required += q * quantity;
      }
    }

    // ✅ Convertir resultados a lista
    const items = Object.entries(requirements).map(
      ([item, { unit, required, cost }]) => ({
        item,
        unit,
        required: parseFloat(required.toFixed(2)),
        unitCost: cost,
        totalCost: parseFloat((required * cost).toFixed(2)),
      })
    );

    // ✅ Total general
    const totalMaterialsCost = parseFloat(
      items.reduce((sum, i) => sum + i.totalCost, 0).toFixed(2)
    );

    // ✅ Actualizar pnl.json
    let pnl: any = {};
    if (fs.existsSync(pnlPath)) {
      pnl = JSON.parse(fs.readFileSync(pnlPath, "utf8"));
    }

    pnl.materialsCost = totalMaterialsCost;
    fs.writeFileSync(pnlPath, JSON.stringify(pnl, null, 2));

    // ✅ Guardar también detalle de compras
    fs.writeFileSync(
      purchasingPath,
      JSON.stringify({ totalMaterialsCost, items }, null, 2)
    );

    console.log(`💾 Saved purchasing.json — Total: $${totalMaterialsCost.toFixed(2)}`);

    return NextResponse.json({ totalMaterialsCost, items });
  } catch (error: any) {
    console.error("❌ Error in /api/purchasing:", error);
    return NextResponse.json(
      { error: "Server error while processing purchasing data" },
      { status: 500 }
    );
  }
}
