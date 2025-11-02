// src/lib/syncCatalog.ts
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");
const salesPath = path.join(dataDir, "prices_sales.json");
const bomPath = path.join(dataDir, "bom.json");
const demandPath = path.join(dataDir, "demand.json");
const purchasingPath = path.join(dataDir, "purchasing.json");

// Tipos básicos
type Sale = { sku?: string; name?: string; product?: string };
type BomItem = { product: string; ingredients: any[] };
type DemandItem = { product: string; quantity: number };
type PurchasingItem = { item: string; unit: string; required: number; toBuy: number; cost: number };

function readJSON<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJSON(p: string, data: any) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

export function syncCatalog() {
  try {
    console.log("🔄 Running automatic catalog sync...");

    const sales = readJSON<Sale[]>(salesPath, []);
    const bom = readJSON<BomItem[]>(bomPath, []);
    const demandRaw = readJSON<any>(demandPath, []);
    const purchasingRaw = readJSON<any>(purchasingPath, []);

    // Normalización
    const demand: DemandItem[] = Array.isArray(demandRaw)
      ? demandRaw
      : Array.isArray(demandRaw.products)
      ? demandRaw.products.map((p: any) => ({
          product: p.name ?? p.product,
          quantity: Number(p.forecast ?? 0),
        }))
      : [];

    const purchasing: PurchasingItem[] = Array.isArray(purchasingRaw)
      ? purchasingRaw
      : Array.isArray(purchasingRaw.items)
      ? purchasingRaw.items
      : [];

    let changed = false;

    // 🔁 Sincronización
    for (const s of sales) {
      const name = s.name ?? s.product ?? "";
      if (!name) continue;

      // ✅ BOM
      if (!bom.find((b: BomItem) => b.product === name)) {
        bom.push({ product: name, ingredients: [] });
        changed = true;
        console.log(`➕ Added missing recipe for ${name}`);
      }

      // ✅ Demand
      if (!demand.find((d: DemandItem) => d.product === name)) {
        demand.push({ product: name, quantity: 0 });
        changed = true;
        console.log(`📈 Added ${name} to demand`);
      }

      // ✅ Purchasing
      if (!purchasing.find((p: PurchasingItem) => p.item === name)) {
        purchasing.push({
          item: name,
          unit: "unit",
          required: 0,
          toBuy: 0,
          cost: 0,
        });
        changed = true;
        console.log(`🛒 Added ${name} to purchasing`);
      }
    }

    if (changed) {
      writeJSON(bomPath, bom);
      writeJSON(demandPath, demand);
      writeJSON(purchasingPath, purchasing);
      console.log("✅ Catalog sync completed");
    } else {
      console.log("✅ Catalog already up to date");
    }
  } catch (err) {
    console.error("❌ syncCatalog failed (non-fatal):", err);
  }
}
