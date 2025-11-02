import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 📂 Paths base
const dataDir = path.join(process.cwd(), "src/data");
const salesPath = path.join(dataDir, "prices_sales.json");
const bomPath = path.join(dataDir, "bom.json");
const purchasePath = path.join(dataDir, "prices_purchase.json");
const recipeCostsPath = path.join(dataDir, "costs_recipes.json");

type SalesRow = {
  sku?: string;
  name?: string;
  product?: string;
  price?: number;
  unitPrice?: number;
};

function readJSON<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJSON(p: string, data: any) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

/** 🧾 Normaliza el contenido de prices_sales.json */
function loadSales(): { sku: string; name: string; unitPrice: number }[] {
  const raw: SalesRow[] = readJSON<SalesRow[]>(salesPath, []);
  return raw.map((r, i) => {
    const name = (r.name ?? r.product ?? `SKU-${i}`).toString();
    const sku = (r.sku ?? `SKU-${name.toUpperCase().replace(/\s+/g, "-")}`).toString();
    const unitPrice = Number(r.unitPrice ?? r.price ?? 0);
    return { sku, name, unitPrice };
  });
}

/** 💰 Calcula costo unitario combinando costs_recipes.json o BOM directo */
function computeUnitCost(name: string, bom: any[], purchases: any[]): number {
  // 1️⃣ Primero intenta usar el archivo de costos calculados
  if (fs.existsSync(recipeCostsPath)) {
    try {
      const precomputed = JSON.parse(fs.readFileSync(recipeCostsPath, "utf-8"));
      const found = precomputed.find((c: any) => c.product === name);
      if (found) return Number(found.totalCost ?? 0);
    } catch (e) {
      console.warn("⚠️ Error leyendo costs_recipes.json:", e);
    }
  }

  // 2️⃣ Si no hay costo guardado, lo calcula a partir del BOM
  const recipe = Array.isArray(bom) ? bom.find((b) => b.product === name) : null;
  if (!recipe) return 0;

  let total = 0;
  for (const ing of recipe.ingredients ?? []) {
    const price = purchases.find((p: any) => p.item === ing.item)?.cost ?? 0;
    total += (Number(ing.quantity) || 0) * (Number(price) || 0);
  }
  return Number(total.toFixed(4));
}

/** 🧩 GET — Devuelve precios con márgenes reales */
export async function GET() {
  try {
    const sales = loadSales();
    const bom = readJSON<any[]>(bomPath, []);
    const purchases = readJSON<any[]>(purchasePath, []);

    const items = sales.map((s) => {
      const unitCost = computeUnitCost(s.name, bom, purchases);
      const marginPct =
        s.unitPrice > 0 ? ((s.unitPrice - unitCost) / s.unitPrice) * 100 : 0;

      return {
        sku: s.sku,
        name: s.name,
        unitPrice: Number(s.unitPrice.toFixed(2)),
        unitCost: Number(unitCost.toFixed(2)),
        marginPct: Number(marginPct.toFixed(2)),
      };
    });

    const avgMarginPct =
      items.length === 0
        ? 0
        : items.reduce((acc, it) => acc + it.marginPct, 0) / items.length;

    return NextResponse.json({
      avgMarginPct: Number(avgMarginPct.toFixed(2)),
      items,
    });
  } catch (err) {
    console.error("❌ Error in /api/pricing GET:", err);
    return NextResponse.json(
      { error: "Failed to load pricing data" },
      { status: 500 }
    );
  }
}

/**
 * 🧾 POST — Guarda precios (single upsert o bulk import)
 *  - Single upsert: { sku, name, unitPrice }
 *  - Bulk: { action: "bulk", rows: [{sku,name,unitPrice}] }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = loadSales();
    const bySku = new Map(current.map((r) => [r.sku, r]));

    if (body?.action === "bulk") {
      const rows: SalesRow[] = Array.isArray(body.rows) ? body.rows : [];
      for (const r of rows) {
        const name = (r.name ?? r.product ?? "").toString().trim();
        const sku =
          (r.sku ?? (name ? `SKU-${name.toUpperCase().replace(/\s+/g, "-")}` : "")).toString();
        const unitPrice = Number(r.unitPrice ?? r.price ?? 0);
        if (!sku || !name) continue;
        bySku.set(sku, { sku, name, unitPrice });
      }
    } else {
      const sku = (body.sku ?? "").toString().trim();
      const name = (body.name ?? bySku.get(sku)?.name ?? "").toString().trim();
      const unitPrice = Number(body.unitPrice ?? 0);
      if (!sku) return NextResponse.json({ error: "Missing sku" }, { status: 400 });
      if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
      bySku.set(sku, { sku, name, unitPrice });
    }

    const toSave = Array.from(bySku.values()).map((r) => ({
      sku: r.sku,
      name: r.name,
      unitPrice: r.unitPrice,
    }));

    writeJSON(salesPath, toSave);

    return NextResponse.json({
      ok: true,
      count: toSave.length,
      message: "Pricing updated successfully",
    });
  } catch (e) {
    console.error("❌ Error in /api/pricing POST:", e);
    return NextResponse.json({ error: "Failed to save pricing" }, { status: 500 });
  }
}
