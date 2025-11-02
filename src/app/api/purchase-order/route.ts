import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");

function readJSON<T>(file: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

type InventoryRow = {
  item: string;
  unit?: string;
  suggestedPurchase?: number; // cantidad sugerida
};

type PriceRow = {
  item: string;
  cost?: number; // costo unitario
};

type PurchasingRow = {
  item: string;
  unit?: string;
  required?: number;
  toBuy?: number;
  unitCost?: number;
  cost?: number;
};

type ItemToOrder = {
  item: string;
  unit?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

type Order = {
  id: string;
  date: string;
  totalItems: number;
  totalOrderValue: number;
  items: ItemToOrder[];
};

export async function POST(_req: NextRequest) {
  try {
    const inventory = readJSON<InventoryRow[]>(
      path.join(dataDir, "inventory.json"),
      []
    );
    const prices = readJSON<PriceRow[]>(
      path.join(dataDir, "prices_purchase.json"),
      []
    );
    const purchasing = readJSON<{ items?: PurchasingRow[] }>(
      path.join(dataDir, "purchasing.json"),
      { items: [] }
    );
    const historyPath = path.join(dataDir, "purchase_orders_history.json");

    // ✅ Filtrar productos con compra sugerida > 0 y mapear a ítems de orden
    const suggested: ItemToOrder[] = (inventory ?? [])
      .filter((i) => (i?.suggestedPurchase ?? 0) > 0)
      .map((i) => {
        const unitCost =
          Number(
            prices.find((p) => p?.item === i?.item)?.cost
          ) || 0;
        const quantity = Number(i?.suggestedPurchase) || 0;
        const totalCost = Number((quantity * unitCost).toFixed(2));

        return {
          item: String(i?.item ?? ""),
          unit: i?.unit,
          quantity,
          unitCost,
          totalCost,
        };
      });

    // Si no hay sugerencias, usar los datos del purchasing.json
    const itemsToOrder: ItemToOrder[] =
      suggested.length > 0
        ? suggested
        : (purchasing?.items ?? []).map((p) => {
            const quantity = Number(p?.required ?? p?.toBuy ?? 0) || 0;
            const unitCost = Number(p?.unitCost ?? p?.cost ?? 0) || 0;
            const totalCost = Number((quantity * unitCost).toFixed(2));
            return {
              item: String(p?.item ?? ""),
              unit: p?.unit,
              quantity,
              unitCost,
              totalCost,
            };
          });

    // Total de la orden
    const totalOrderValue = Number(
      (itemsToOrder ?? []).reduce(
        (sum: number, i: ItemToOrder) =>
          sum +
          (Number.isFinite(i.totalCost)
            ? Number(i.totalCost)
            : (Number(i.quantity) || 0) * (Number(i.unitCost) || 0)),
        0
      ).toFixed(2)
    );

    // ✅ Crear ID único
    const id = `PO-${Date.now()}`;

    const order: Order = {
      id,
      date: new Date().toISOString(),
      totalItems: (itemsToOrder ?? []).length,
      totalOrderValue,
      items: itemsToOrder,
    };

    // Guardar como última orden
    fs.writeFileSync(
      path.join(dataDir, "purchase_order.json"),
      JSON.stringify(order, null, 2)
    );

    // Agregar al historial (al inicio)
    const history = readJSON<Order[]>(historyPath, []);
    history.unshift(order);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

    console.log(`💾 Purchase order saved — Total: $${order.totalOrderValue}`);
    return NextResponse.json(order);
  } catch (err) {
    console.error("❌ Error in /api/purchase-order:", err);
    return NextResponse.json(
      { error: "Failed to generate purchase order" },
      { status: 500 }
    );
  }
}
