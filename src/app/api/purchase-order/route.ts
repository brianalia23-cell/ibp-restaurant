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

function writeJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export async function POST() {
  try {
    const inventoryPath = path.join(dataDir, "inventory.json");
    const pricesPath = path.join(dataDir, "prices_purchase.json");
    const purchasingPath = path.join(dataDir, "purchasing.json");
    const historyPath = path.join(dataDir, "purchase_orders_history.json");

    const inventory = readJSON<any[]>(inventoryPath, []);
    const prices = readJSON<any[]>(pricesPath, []);
    const purchasing = readJSON<any>(purchasingPath, { items: [] });

    // ✅ Identificar ítems con compra sugerida
    const suggested = inventory
      .filter((i: any) => i.suggestedPurchase && i.suggestedPurchase > 0)
      .map((i: any) => {
        const price: number = prices.find((p: any) => p.item === i.item)?.cost ?? 0;
        const total = i.suggestedPurchase * price;

        return {
          item: i.item,
          unit: i.unit,
          quantity: i.suggestedPurchase,
          unitCost: price,
          totalCost: parseFloat(total.toFixed(2)),
        };
      });

    const itemsToOrder: any[] =
      suggested.length > 0
        ? suggested
        : (purchasing.items || []).map((p: any) => {
            const qty = p.required || p.toBuy || 0;
            const cost = p.unitCost || p.cost || 0;
            return {
              item: p.item,
              unit: p.unit,
              quantity: qty,
              unitCost: cost,
              totalCost: parseFloat((qty * cost).toFixed(2)),
            };
          });

    const totalOrderValue = itemsToOrder.reduce(
      (sum: number, i: any) => sum + i.totalCost,
      0
    );

    // ✅ Crear ID único
    const id = `PO-${Date.now()}`;
    const order = {
      id,
      date: new Date().toISOString(),
      totalItems: itemsToOrder.length,
      totalOrderValue: parseFloat(totalOrderValue.toFixed(2)),
      items: itemsToOrder,
    };

    // Guardar orden actual e historial
    writeJSON(path.join(dataDir, "purchase_order.json"), order);
    const history = readJSON<any[]>(historyPath, []);
    history.unshift(order);
    writeJSON(historyPath, history);

    // ✅ Actualizar inventario con las compras recibidas
    const updatedInventory = inventory.map((i: any) => {
      const ordered = itemsToOrder.find((o: any) => o.item === i.item);
      const newStock = ordered ? (i.stock || 0) + ordered.quantity : i.stock || 0;
      const newAlert =
        newStock <= 0
          ? "Out of Stock"
          : newStock < (i.safetyStock || 0)
          ? "Low Stock"
          : "OK";

      return {
        ...i,
        stock: parseFloat(newStock.toFixed(2)),
        suggestedPurchase: 0,
        alert: newAlert,
      };
    });

    writeJSON(inventoryPath, updatedInventory);

    console.log(`💾 Purchase order saved and inventory updated — Total: $${order.totalOrderValue}`);
    return NextResponse.json(order);
  } catch (err) {
    console.error("❌ Error in /api/purchase-order:", err);
    return NextResponse.json(
      { error: "Failed to generate purchase order" },
      { status: 500 }
    );
  }
}
