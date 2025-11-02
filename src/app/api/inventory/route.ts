// src/app/api/inventory/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");

function readJSON<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const inventory = readJSON<any[]>(path.join(dataDir, "inventory.json"), []);
    const purchasing = readJSON<any>(path.join(dataDir, "purchasing.json"), {});
    const demand = readJSON<any[]>(path.join(dataDir, "demand.json"), []);

    const items = inventory.map((inv) => {
      const purchase = purchasing.items?.find((p: any) => p.item === inv.item);
      const required = purchase?.required ?? 0;

      const current = inv.stock ?? 0;
      const safetyStock = inv.safetyStock ?? 0;

      const deficit = Math.max(0, safetyStock + required - current);
      const alert =
        current < safetyStock
          ? "Low Stock"
          : current === 0
          ? "Out of Stock"
          : "OK";

      return {
        ...inv,
        required,
        alert,
        suggestedPurchase: deficit > 0 ? deficit : 0,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("❌ Error in /api/inventory:", err);
    return NextResponse.json({ error: "Failed to load inventory data" }, { status: 500 });
  }
}
